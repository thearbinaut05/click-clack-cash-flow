import { supabase } from "@/integrations/supabase/client";
import { AgentWorkforceManager } from "./AgentWorkforceManager";

export class AutonomousAgentService {
  private static instance: AutonomousAgentService;
  private isRunning = false;
  private intervalId: NodeJS.Timeout | null = null;
  private workforceManager: AgentWorkforceManager;

  constructor() {
    this.workforceManager = AgentWorkforceManager.getInstance();
  }

  static getInstance(): AutonomousAgentService {
    if (!AutonomousAgentService.instance) {
      AutonomousAgentService.instance = new AutonomousAgentService();
    }
    return AutonomousAgentService.instance;
  }
  // ...existing code...
  async initializeSwarms() {
    try {
      const { data, error } = await supabase.functions.invoke('autonomous-agent-swarm', {
        body: { action: 'initialize_swarms' }
      });
      if (error) throw error;
      console.log('Swarms initialized:', data);
      // Initialize agent workforce manager
      await this.workforceManager.initializeWorkforce();
      return data;
    } catch (error) {
      console.error('Error initializing swarms:', error);
      throw error;
    }
  }

  // ...existing code...

  // ...existing code...

  async startAutonomousOperations() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    console.log('Starting autonomous operations...');

    // Initialize swarms if not already done
    await this.initializeSwarms();

    // Start the main optimization loop
    this.intervalId = setInterval(async () => {
      try {
        // Execute market data scraping
        await this.scrapeMarketData();
        
        // Optimize revenue streams
        await this.optimizeRevenueStreams();
        
        // Execute pending agent tasks
        await this.executeAgentTasks();
        
        // Process Stripe payments and transfers
        await this.processFinancialOperations();
        
      } catch (error) {
        console.error('Error in autonomous operations cycle:', error);
      }
    }, 300000); // Run every 5 minutes

    // Also run market scraping more frequently
    setInterval(async () => {
      try {
        await this.scrapeMarketData();
      } catch (error) {
        console.error('Error in market scraping:', error);
      }
    }, 3600000); // Run every hour
  }

  async stopAutonomousOperations() {
    this.isRunning = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    console.log('Autonomous operations stopped');
  }

  private async scrapeMarketData() {
    try {
      const { data, error } = await supabase.functions.invoke('autonomous-agent-swarm', {
        body: { action: 'scrape_market_data' }
      });

      if (error) throw error;
      console.log('Market data scraped:', data?.scraped_offers?.length || 0, 'offers');
      return data;
    } catch (error) {
      console.error('Error scraping market data:', error);
      throw error;
    }
  }

  private async optimizeRevenueStreams() {
    try {
      const { data, error } = await supabase.functions.invoke('autonomous-agent-swarm', {
        body: { action: 'optimize_revenue_streams' }
      });

      if (error) throw error;
      console.log('Revenue streams optimized:', data?.optimizations?.length || 0, 'optimizations applied');
      return data;
    } catch (error) {
      console.error('Error optimizing revenue streams:', error);
      throw error;
    }
  }

  private async executeAgentTasks() {
    try {
      const { data, error } = await supabase.functions.invoke('autonomous-agent-swarm', {
        body: { action: 'execute_agent_tasks' }
      });

      if (error) throw error;
      console.log('Agent tasks executed:', data?.task_results?.length || 0, 'tasks processed');
      return data;
    } catch (error) {
      console.error('Error executing agent tasks:', error);
      throw error;
    }
  }

  private async processFinancialOperations() {
    try {
      // Audit revenue against Stripe
      const { data: auditData, error: auditError } = await supabase.functions.invoke('stripe-payment-processor', {
        body: { action: 'audit_revenue' }
      });

      if (auditError) throw auditError;
      
      // Get Stripe balance
      const { data: balanceData, error: balanceError } = await supabase.functions.invoke('stripe-payment-processor', {
        body: { action: 'get_balance' }
      });

      if (balanceError) throw balanceError;

      console.log('Financial operations processed - Balance:', balanceData?.available?.[0]?.amount || 0);
      
      // Auto-transfer if balance is above threshold
      if (balanceData?.available?.[0]?.amount > 10000) { // $100 threshold
        await this.executeAutoTransfer(balanceData.available[0].amount);
      }

      return { audit: auditData, balance: balanceData };
    } catch (error) {
      console.error('Error processing financial operations:', error);
      throw error;
    }
  }

  private async executeAutoTransfer(amount: number) {
    try {
      // In production, this would transfer to your bank account
      const transferAmount = Math.floor(amount * 0.8); // Transfer 80% of available balance
      
      const { data, error } = await supabase.functions.invoke('stripe-payment-processor', {
        body: {
          action: 'create_transfer',
          amount: transferAmount,
          currency: 'usd',
          destination: 'acct_1RPfy4BRrjIUJ5cS', // Your Stripe account
          metadata: {
            auto_transfer: true,
            timestamp: new Date().toISOString(),
          }
        }
      });

      if (error) throw error;
      console.log('Auto-transfer executed:', transferAmount / 100, 'USD');
      return data;
    } catch (error) {
      console.error('Error executing auto-transfer:', error);
      throw error;
    }
  }

  async getPerformanceMetrics() {
    try {
      // Get swarm performance data
      const { data: swarms } = await supabase
        .from('agent_swarms')
        .select('*');

      // Get recent optimizations
      const { data: optimizations } = await supabase
        .from('revenue_optimization_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      // Get market offers
      const { data: offers } = await supabase
        .from('market_offers')
        .select('*')
        .order('performance_score', { ascending: false })
        .limit(20);

      // Get revenue metrics
      const { data: revenue } = await supabase
        .from('autonomous_revenue_transactions')
        .select('amount, created_at')
        .order('created_at', { ascending: false })
        .limit(100);

      const totalRevenue = revenue?.reduce((sum, t) => sum + t.amount, 0) || 0;
      const avgOptimizationImprovement = optimizations?.reduce((sum, o) => sum + (o.expected_improvement || 0), 0) / (optimizations?.length || 1);

      return {
        swarms: swarms?.length || 0,
        activeOffers: offers?.length || 0,
        totalRevenue,
        avgOptimizationImprovement,
        recentOptimizations: optimizations?.length || 0,
        isRunning: this.isRunning,
      };
    } catch (error) {
      console.error('Error getting performance metrics:', error);
      return null;
    }
  }

  async createCustomTask(taskType: string, payload: Record<string, unknown>, priority: number = 5) {
    try {
      const { data, error } = await supabase
        .from('agent_tasks')
        .insert({
          task_type: taskType,
          payload: payload as Record<string, unknown>,
          priority,
        })
        .select()
        .single();

      if (error) throw error;
      console.log('Custom task created:', data);
      return data;
    } catch (error) {
      console.error('Error creating custom task:', error);
      throw error;
    }
  }
}