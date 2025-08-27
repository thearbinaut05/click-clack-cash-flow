import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AutopilotConfig {
  enabled: boolean;
  minBalance: number;
  cashoutPercentage: number;
  email: string;
  payoutMethod: string;
  frequency: number; // minutes between checks
  maxDailyCashouts: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Autopilot cashout function started');
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { action, config } = await req.json();

    switch (action) {
      case 'start_autopilot':
        return await startAutopilot(supabase, config);
      
      case 'stop_autopilot':
        return await stopAutopilot(supabase);
        
      case 'get_status':
        return await getAutopilotStatus(supabase);
        
      case 'process_autopilot':
        return await processAutopilot(supabase);
        
      default:
        throw new Error(`Unknown action: ${action}`);
    }
  } catch (error) {
    console.error('Autopilot error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});

async function startAutopilot(supabase: any, config: AutopilotConfig) {
  console.log('Starting autopilot with config:', config);
  
  // Validate config
  if (!config.email || !config.payoutMethod) {
    throw new Error('Email and payout method are required');
  }

  if (config.minBalance < 5) {
    throw new Error('Minimum balance must be at least $5');
  }

  // Store autopilot configuration
  const { error: configError } = await supabase
    .from('autopilot_config')
    .upsert({
      id: 1,
      enabled: true,
      min_balance: config.minBalance,
      cashout_percentage: config.cashoutPercentage,
      email: config.email,
      payout_method: config.payoutMethod,
      frequency_minutes: config.frequency,
      max_daily_cashouts: config.maxDailyCashouts,
      last_check: new Date().toISOString(),
      daily_cashout_count: 0,
      updated_at: new Date().toISOString()
    });

  if (configError) throw configError;

  // Start background autopilot process
  EdgeRuntime.waitUntil(runAutopilotLoop(supabase));

  return new Response(JSON.stringify({
    success: true,
    message: 'Autopilot started successfully',
    config
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    status: 200,
  });
}

async function stopAutopilot(supabase: any) {
  console.log('Stopping autopilot');
  
  const { error } = await supabase
    .from('autopilot_config')
    .update({ 
      enabled: false,
      updated_at: new Date().toISOString()
    })
    .eq('id', 1);

  if (error) throw error;

  return new Response(JSON.stringify({
    success: true,
    message: 'Autopilot stopped successfully'
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    status: 200,
  });
}

async function getAutopilotStatus(supabase: any) {
  const { data: config, error } = await supabase
    .from('autopilot_config')
    .select('*')
    .eq('id', 1)
    .single();

  if (error && error.code !== 'PGRST116') throw error;

  const { data: recentCashouts, error: cashoutsError } = await supabase
    .from('autonomous_revenue_transfers')
    .select('*')
    .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
    .eq('metadata->autopilot', true)
    .order('created_at', { ascending: false });

  if (cashoutsError) throw cashoutsError;

  return new Response(JSON.stringify({
    success: true,
    config: config || { enabled: false },
    recent_cashouts: recentCashouts || [],
    daily_cashout_count: recentCashouts?.length || 0
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    status: 200,
  });
}

async function processAutopilot(supabase: any) {
  console.log('Processing autopilot cashout check');
  
  // Get autopilot configuration
  const { data: config, error: configError } = await supabase
    .from('autopilot_config')
    .select('*')
    .eq('id', 1)
    .single();

  if (configError || !config?.enabled) {
    console.log('Autopilot not enabled or config not found');
    return new Response(JSON.stringify({
      success: true,
      message: 'Autopilot not enabled'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  }

  // Check daily cashout limit
  const today = new Date().toDateString();
  const lastCheckDate = new Date(config.last_check).toDateString();
  
  if (today !== lastCheckDate) {
    // Reset daily counter
    await supabase
      .from('autopilot_config')
      .update({ 
        daily_cashout_count: 0,
        last_check: new Date().toISOString()
      })
      .eq('id', 1);
    config.daily_cashout_count = 0;
  }

  if (config.daily_cashout_count >= config.max_daily_cashouts) {
    console.log('Daily cashout limit reached');
    return new Response(JSON.stringify({
      success: true,
      message: 'Daily cashout limit reached'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  }

  // Get current application balance
  const { data: balanceData, error: balanceError } = await supabase
    .from('application_balance')
    .select('balance_amount')
    .eq('id', 1)
    .single();

  if (balanceError || !balanceData) {
    throw new Error('Could not retrieve application balance');
  }

  const currentBalance = balanceData.balance_amount;
  console.log(`Current balance: $${currentBalance}, Min required: $${config.min_balance}`);

  if (currentBalance >= config.min_balance) {
    // Calculate cashout amount
    const cashoutAmount = Math.floor(currentBalance * (config.cashout_percentage / 100) * 100) / 100;
    const coins = Math.floor(cashoutAmount * 100); // Convert to coins

    console.log(`Initiating autopilot cashout: $${cashoutAmount} (${coins} coins)`);

    try {
      // Call the cashout function
      const cashoutResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/cashout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
        },
        body: JSON.stringify({
          userId: 'autopilot-system',
          coins: coins,
          payoutType: config.payout_method,
          email: config.email,
          metadata: {
            autopilot: true,
            autopilot_config_id: config.id,
            original_balance: currentBalance,
            cashout_percentage: config.cashout_percentage
          }
        })
      });

      const cashoutResult = await cashoutResponse.json();

      if (cashoutResult.success) {
        // Update autopilot stats
        await supabase
          .from('autopilot_config')
          .update({ 
            daily_cashout_count: config.daily_cashout_count + 1,
            last_cashout_at: new Date().toISOString(),
            total_cashouts: (config.total_cashouts || 0) + 1,
            total_amount_cashed_out: (config.total_amount_cashed_out || 0) + cashoutAmount,
            last_check: new Date().toISOString()
          })
          .eq('id', 1);

        console.log(`Autopilot cashout successful: $${cashoutAmount}`);
        
        return new Response(JSON.stringify({
          success: true,
          message: `Autopilot cashout completed: $${cashoutAmount}`,
          cashout_amount: cashoutAmount,
          remaining_balance: currentBalance - cashoutAmount,
          transaction_details: cashoutResult.details
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        });
      } else {
        throw new Error(`Cashout failed: ${cashoutResult.error}`);
      }
    } catch (error) {
      console.error('Cashout error:', error);
      
      // Log the failed attempt
      await supabase
        .from('autopilot_logs')
        .insert({
          action: 'cashout_failed',
          error_message: error.message,
          balance_at_time: currentBalance,
          attempted_amount: cashoutAmount
        });

      throw error;
    }
  } else {
    console.log(`Balance ($${currentBalance}) below minimum ($${config.min_balance})`);
    
    return new Response(JSON.stringify({
      success: true,
      message: `Balance below minimum threshold`,
      current_balance: currentBalance,
      min_balance: config.min_balance
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  }
}

async function runAutopilotLoop(supabase: any) {
  console.log('Starting autopilot background loop');
  
  while (true) {
    try {
      // Check if autopilot is still enabled
      const { data: config } = await supabase
        .from('autopilot_config')
        .select('enabled, frequency_minutes')
        .eq('id', 1)
        .single();

      if (!config?.enabled) {
        console.log('Autopilot disabled, stopping loop');
        break;
      }

      // Process autopilot check
      await processAutopilot(supabase);

      // Wait for the configured frequency
      const waitTime = (config.frequency_minutes || 30) * 60 * 1000; // Convert to milliseconds
      console.log(`Waiting ${config.frequency_minutes || 30} minutes before next check`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
      
    } catch (error) {
      console.error('Autopilot loop error:', error);
      
      // Log error and wait before retrying
      await supabase
        .from('autopilot_logs')
        .insert({
          action: 'loop_error',
          error_message: error.message
        });
      
      // Wait 5 minutes before retrying on error
      await new Promise(resolve => setTimeout(resolve, 5 * 60 * 1000));
    }
  }
  
  console.log('Autopilot loop ended');
}

// Handle shutdown gracefully
addEventListener('beforeunload', (ev) => {
  console.log('Autopilot function shutdown due to:', ev.detail?.reason);
});