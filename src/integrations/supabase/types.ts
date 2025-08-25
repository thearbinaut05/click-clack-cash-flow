export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      agent_swarms: {
        Row: {
          config: Json | null
          created_at: string | null
          hourly_cost: number | null
          id: string
          name: string
          performance_metrics: Json | null
          revenue_generated: number | null
          roi_percentage: number | null
          status: string | null
          swarm_type: string
          total_cost: number | null
          updated_at: string | null
          vm_instance_id: string | null
          vm_instance_type: string | null
          vm_provider: string | null
          vm_region: string | null
        }
        Insert: {
          config?: Json | null
          created_at?: string | null
          hourly_cost?: number | null
          id?: string
          name: string
          performance_metrics?: Json | null
          revenue_generated?: number | null
          roi_percentage?: number | null
          status?: string | null
          swarm_type: string
          total_cost?: number | null
          updated_at?: string | null
          vm_instance_id?: string | null
          vm_instance_type?: string | null
          vm_provider?: string | null
          vm_region?: string | null
        }
        Update: {
          config?: Json | null
          created_at?: string | null
          hourly_cost?: number | null
          id?: string
          name?: string
          performance_metrics?: Json | null
          revenue_generated?: number | null
          roi_percentage?: number | null
          status?: string | null
          swarm_type?: string
          total_cost?: number | null
          updated_at?: string | null
          vm_instance_id?: string | null
          vm_instance_type?: string | null
          vm_provider?: string | null
          vm_region?: string | null
        }
        Relationships: []
      }
      agent_tasks: {
        Row: {
          completed_at: string | null
          created_at: string | null
          id: string
          payload: Json | null
          priority: number | null
          result: Json | null
          started_at: string | null
          status: string | null
          swarm_id: string | null
          task_type: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          id?: string
          payload?: Json | null
          priority?: number | null
          result?: Json | null
          started_at?: string | null
          status?: string | null
          swarm_id?: string | null
          task_type: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          id?: string
          payload?: Json | null
          priority?: number | null
          result?: Json | null
          started_at?: string | null
          status?: string | null
          swarm_id?: string | null
          task_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_tasks_swarm_id_fkey"
            columns: ["swarm_id"]
            isOneToOne: false
            referencedRelation: "agent_swarms"
            referencedColumns: ["id"]
          },
        ]
      }
      application_balance: {
        Row: {
          balance_amount: number
          failed_transaction_amount: number | null
          id: number
          last_updated_at: string | null
          pending_transfers: number
        }
        Insert: {
          balance_amount?: number
          failed_transaction_amount?: number | null
          id?: never
          last_updated_at?: string | null
          pending_transfers?: number
        }
        Update: {
          balance_amount?: number
          failed_transaction_amount?: number | null
          id?: never
          last_updated_at?: string | null
          pending_transfers?: number
        }
        Relationships: []
      }
      audit_trail: {
        Row: {
          action: string
          id: string
          ip_address: unknown | null
          new_values: Json | null
          old_values: Json | null
          record_id: string
          table_name: string
          timestamp: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          id?: string
          ip_address?: unknown | null
          new_values?: Json | null
          old_values?: Json | null
          record_id: string
          table_name: string
          timestamp?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          id?: string
          ip_address?: unknown | null
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string
          table_name?: string
          timestamp?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      automated_transfer_logs: {
        Row: {
          created_at: string
          error_message: string | null
          execution_time: string
          id: string
          job_name: string
          response: Json | null
          status: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          execution_time?: string
          id?: string
          job_name: string
          response?: Json | null
          status: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          execution_time?: string
          id?: string
          job_name?: string
          response?: Json | null
          status?: string
        }
        Relationships: []
      }
      autonomous_agents: {
        Row: {
          agent_name: string
          agent_type: string
          config: Json
          created_at: string | null
          daily_budget: number | null
          id: string
          last_activity: string | null
          roi: number | null
          status: string | null
          total_earned: number | null
          total_spent: number | null
          updated_at: string | null
          user_id: string | null
          vm_instance_id: string | null
        }
        Insert: {
          agent_name: string
          agent_type: string
          config?: Json
          created_at?: string | null
          daily_budget?: number | null
          id?: string
          last_activity?: string | null
          roi?: number | null
          status?: string | null
          total_earned?: number | null
          total_spent?: number | null
          updated_at?: string | null
          user_id?: string | null
          vm_instance_id?: string | null
        }
        Update: {
          agent_name?: string
          agent_type?: string
          config?: Json
          created_at?: string | null
          daily_budget?: number | null
          id?: string
          last_activity?: string | null
          roi?: number | null
          status?: string | null
          total_earned?: number | null
          total_spent?: number | null
          updated_at?: string | null
          user_id?: string | null
          vm_instance_id?: string | null
        }
        Relationships: []
      }
      autonomous_optimization_history: {
        Row: {
          created_at: string | null
          id: string
          new_value: Json
          optimization_type: string
          previous_value: Json
          stream_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          new_value: Json
          optimization_type: string
          previous_value: Json
          stream_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          new_value?: Json
          optimization_type?: string
          previous_value?: Json
          stream_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "autonomous_optimization_history_stream_id_fkey"
            columns: ["stream_id"]
            isOneToOne: false
            referencedRelation: "autonomous_revenue_streams"
            referencedColumns: ["id"]
          },
        ]
      }
      autonomous_revenue_alerts: {
        Row: {
          alert_type: string
          created_at: string
          details: Json
          id: string
          message: string
          resolution_notes: string | null
          resolved_at: string | null
          severity: string
          status: string
        }
        Insert: {
          alert_type: string
          created_at?: string
          details: Json
          id?: string
          message: string
          resolution_notes?: string | null
          resolved_at?: string | null
          severity: string
          status?: string
        }
        Update: {
          alert_type?: string
          created_at?: string
          details?: Json
          id?: string
          message?: string
          resolution_notes?: string | null
          resolved_at?: string | null
          severity?: string
          status?: string
        }
        Relationships: []
      }
      autonomous_revenue_metrics: {
        Row: {
          average_transfer_amount: number | null
          created_at: string
          failed_transfers: number
          id: string
          metric_date: string
          optimization_impact: Json | null
          revenue_by_category: Json
          revenue_by_source: Json
          successful_transfers: number
          total_revenue: number
          updated_at: string
        }
        Insert: {
          average_transfer_amount?: number | null
          created_at?: string
          failed_transfers?: number
          id?: string
          metric_date: string
          optimization_impact?: Json | null
          revenue_by_category?: Json
          revenue_by_source?: Json
          successful_transfers?: number
          total_revenue?: number
          updated_at?: string
        }
        Update: {
          average_transfer_amount?: number | null
          created_at?: string
          failed_transfers?: number
          id?: string
          metric_date?: string
          optimization_impact?: Json | null
          revenue_by_category?: Json
          revenue_by_source?: Json
          successful_transfers?: number
          total_revenue?: number
          updated_at?: string
        }
        Relationships: []
      }
      autonomous_revenue_optimization: {
        Row: {
          applied_at: string | null
          created_at: string
          id: string
          metadata: Json
          new_config: Json
          optimization_type: string
          performance_metrics: Json
          previous_config: Json
          processing_time_ms: number | null
          reverted_at: string | null
          status: string
          success_rate: number | null
        }
        Insert: {
          applied_at?: string | null
          created_at?: string
          id?: string
          metadata?: Json
          new_config: Json
          optimization_type: string
          performance_metrics: Json
          previous_config: Json
          processing_time_ms?: number | null
          reverted_at?: string | null
          status?: string
          success_rate?: number | null
        }
        Update: {
          applied_at?: string | null
          created_at?: string
          id?: string
          metadata?: Json
          new_config?: Json
          optimization_type?: string
          performance_metrics?: Json
          previous_config?: Json
          processing_time_ms?: number | null
          reverted_at?: string | null
          status?: string
          success_rate?: number | null
        }
        Relationships: []
      }
      autonomous_revenue_sources: {
        Row: {
          config: Json
          created_at: string
          daily_limit: number | null
          daily_used: number
          id: string
          metrics: Json
          priority: number
          source_name: string
          source_type: string
          status: string
          updated_at: string
        }
        Insert: {
          config?: Json
          created_at?: string
          daily_limit?: number | null
          daily_used?: number
          id?: string
          metrics?: Json
          priority?: number
          source_name: string
          source_type: string
          status?: string
          updated_at?: string
        }
        Update: {
          config?: Json
          created_at?: string
          daily_limit?: number | null
          daily_used?: number
          id?: string
          metrics?: Json
          priority?: number
          source_name?: string
          source_type?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      autonomous_revenue_streams: {
        Row: {
          billing_frequency: string | null
          contract_required: boolean | null
          created_at: string | null
          id: string
          metrics: Json | null
          name: string
          revenue_recognition_method: string | null
          settings: Json | null
          status: string
          strategy: string
          type: string
          updated_at: string | null
        }
        Insert: {
          billing_frequency?: string | null
          contract_required?: boolean | null
          created_at?: string | null
          id?: string
          metrics?: Json | null
          name: string
          revenue_recognition_method?: string | null
          settings?: Json | null
          status?: string
          strategy: string
          type?: string
          updated_at?: string | null
        }
        Update: {
          billing_frequency?: string | null
          contract_required?: boolean | null
          created_at?: string | null
          id?: string
          metrics?: Json | null
          name?: string
          revenue_recognition_method?: string | null
          settings?: Json | null
          status?: string
          strategy?: string
          type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      autonomous_revenue_stripe_config: {
        Row: {
          auto_transfer: boolean | null
          bank_account_id: string
          created_at: string | null
          id: string
          last_transfer_at: string | null
          stripe_account_id: string
          stripe_api_key: string
          transfer_frequency: string | null
          transfer_threshold: number | null
          updated_at: string | null
        }
        Insert: {
          auto_transfer?: boolean | null
          bank_account_id: string
          created_at?: string | null
          id?: string
          last_transfer_at?: string | null
          stripe_account_id: string
          stripe_api_key: string
          transfer_frequency?: string | null
          transfer_threshold?: number | null
          updated_at?: string | null
        }
        Update: {
          auto_transfer?: boolean | null
          bank_account_id?: string
          created_at?: string | null
          id?: string
          last_transfer_at?: string | null
          stripe_account_id?: string
          stripe_api_key?: string
          transfer_frequency?: string | null
          transfer_threshold?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      autonomous_revenue_stripe_integration: {
        Row: {
          account_id: string | null
          api_key: string | null
          auto_transfer: boolean | null
          created_at: string | null
          id: string
          last_transfer_at: string | null
          metadata: Json | null
          minimum_transfer_amount: number | null
          status: string | null
          transfer_frequency: string | null
          updated_at: string | null
          webhook_secret: string | null
        }
        Insert: {
          account_id?: string | null
          api_key?: string | null
          auto_transfer?: boolean | null
          created_at?: string | null
          id?: string
          last_transfer_at?: string | null
          metadata?: Json | null
          minimum_transfer_amount?: number | null
          status?: string | null
          transfer_frequency?: string | null
          updated_at?: string | null
          webhook_secret?: string | null
        }
        Update: {
          account_id?: string | null
          api_key?: string | null
          auto_transfer?: boolean | null
          created_at?: string | null
          id?: string
          last_transfer_at?: string | null
          metadata?: Json | null
          minimum_transfer_amount?: number | null
          status?: string | null
          transfer_frequency?: string | null
          updated_at?: string | null
          webhook_secret?: string | null
        }
        Relationships: []
      }
      autonomous_revenue_task_queue: {
        Row: {
          completed_at: string | null
          created_at: string
          error_message: string | null
          id: string
          max_retries: number
          payload: Json
          priority: number
          result: Json | null
          retry_count: number
          started_at: string | null
          status: string
          task_type: string
          worker_id: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          max_retries?: number
          payload: Json
          priority?: number
          result?: Json | null
          retry_count?: number
          started_at?: string | null
          status?: string
          task_type: string
          worker_id?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          max_retries?: number
          payload?: Json
          priority?: number
          result?: Json | null
          retry_count?: number
          started_at?: string | null
          status?: string
          task_type?: string
          worker_id?: string | null
        }
        Relationships: []
      }
      autonomous_revenue_transactions: {
        Row: {
          amount: number
          contract_liability: number | null
          created_at: string | null
          currency: string | null
          id: string
          metadata: Json | null
          performance_obligation_satisfied: boolean | null
          revenue_recognition_date: string | null
          status: string
          stream_id: string
          stripe_charge_id: string | null
          stripe_customer_id: string | null
          stripe_payment_intent_id: string | null
          transaction_price_allocated: number | null
        }
        Insert: {
          amount: number
          contract_liability?: number | null
          created_at?: string | null
          currency?: string | null
          id?: string
          metadata?: Json | null
          performance_obligation_satisfied?: boolean | null
          revenue_recognition_date?: string | null
          status?: string
          stream_id: string
          stripe_charge_id?: string | null
          stripe_customer_id?: string | null
          stripe_payment_intent_id?: string | null
          transaction_price_allocated?: number | null
        }
        Update: {
          amount?: number
          contract_liability?: number | null
          created_at?: string | null
          currency?: string | null
          id?: string
          metadata?: Json | null
          performance_obligation_satisfied?: boolean | null
          revenue_recognition_date?: string | null
          status?: string
          stream_id?: string
          stripe_charge_id?: string | null
          stripe_customer_id?: string | null
          stripe_payment_intent_id?: string | null
          transaction_price_allocated?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "autonomous_revenue_transactions_stream_id_fkey"
            columns: ["stream_id"]
            isOneToOne: false
            referencedRelation: "autonomous_revenue_streams"
            referencedColumns: ["id"]
          },
        ]
      }
      autonomous_revenue_transfer_logs: {
        Row: {
          amount: number
          created_at: string
          destination_account: string
          id: string
          metadata: Json
          source_account: string
          status: string
        }
        Insert: {
          amount: number
          created_at?: string
          destination_account: string
          id?: string
          metadata?: Json
          source_account: string
          status: string
        }
        Update: {
          amount?: number
          created_at?: string
          destination_account?: string
          id?: string
          metadata?: Json
          source_account?: string
          status?: string
        }
        Relationships: []
      }
      autonomous_revenue_transfers: {
        Row: {
          amount: number
          completed_at: string | null
          created_at: string | null
          currency: string | null
          error_message: string | null
          id: string
          metadata: Json
          processing_time_ms: number | null
          provider: string | null
          provider_transfer_id: string | null
          retry_count: number | null
          source_streams: Json | null
          status: string
          stripe_destination_id: string | null
          stripe_payout_id: string | null
          stripe_transfer_id: string | null
          success_rate: number | null
          transaction_id: string | null
          transfer_group: string | null
        }
        Insert: {
          amount: number
          completed_at?: string | null
          created_at?: string | null
          currency?: string | null
          error_message?: string | null
          id?: string
          metadata?: Json
          processing_time_ms?: number | null
          provider?: string | null
          provider_transfer_id?: string | null
          retry_count?: number | null
          source_streams?: Json | null
          status?: string
          stripe_destination_id?: string | null
          stripe_payout_id?: string | null
          stripe_transfer_id?: string | null
          success_rate?: number | null
          transaction_id?: string | null
          transfer_group?: string | null
        }
        Update: {
          amount?: number
          completed_at?: string | null
          created_at?: string | null
          currency?: string | null
          error_message?: string | null
          id?: string
          metadata?: Json
          processing_time_ms?: number | null
          provider?: string | null
          provider_transfer_id?: string | null
          retry_count?: number | null
          source_streams?: Json | null
          status?: string
          stripe_destination_id?: string | null
          stripe_payout_id?: string | null
          stripe_transfer_id?: string | null
          success_rate?: number | null
          transaction_id?: string | null
          transfer_group?: string | null
        }
        Relationships: []
      }
      autonomous_revenue_worker_pool: {
        Row: {
          config: Json
          created_at: string
          current_workers: number
          id: string
          max_workers: number
          status: string
          updated_at: string
          worker_type: string
        }
        Insert: {
          config?: Json
          created_at?: string
          current_workers?: number
          id?: string
          max_workers?: number
          status?: string
          updated_at?: string
          worker_type: string
        }
        Update: {
          config?: Json
          created_at?: string
          current_workers?: number
          id?: string
          max_workers?: number
          status?: string
          updated_at?: string
          worker_type?: string
        }
        Relationships: []
      }
      autonomous_revenue_workers: {
        Row: {
          config: Json
          created_at: string
          id: string
          last_heartbeat: string
          metadata: Json
          metrics: Json
          status: string
          updated_at: string
          worker_type: string
        }
        Insert: {
          config?: Json
          created_at?: string
          id?: string
          last_heartbeat?: string
          metadata?: Json
          metrics?: Json
          status?: string
          updated_at?: string
          worker_type: string
        }
        Update: {
          config?: Json
          created_at?: string
          id?: string
          last_heartbeat?: string
          metadata?: Json
          metrics?: Json
          status?: string
          updated_at?: string
          worker_type?: string
        }
        Relationships: []
      }
      balance_transfers: {
        Row: {
          amount: number
          created_at: string
          currency: string
          destination_id: string | null
          destination_type: string
          id: number
          metadata: Json | null
          settlement_date: string | null
          source_balance_id: number | null
          status: string
          transaction_id: number | null
          transfer_date: string
          transfer_number: string
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          destination_id?: string | null
          destination_type: string
          id?: never
          metadata?: Json | null
          settlement_date?: string | null
          source_balance_id?: number | null
          status: string
          transaction_id?: number | null
          transfer_date?: string
          transfer_number: string
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          destination_id?: string | null
          destination_type?: string
          id?: never
          metadata?: Json | null
          settlement_date?: string | null
          source_balance_id?: number | null
          status?: string
          transaction_id?: number | null
          transfer_date?: string
          transfer_number?: string
          updated_at?: string
        }
        Relationships: []
      }
      bank_transfers: {
        Row: {
          actual_arrival: string | null
          amount: number
          bank_account_id: string
          created_at: string | null
          currency: string
          estimated_arrival: string | null
          failure_reason: string | null
          fees: number | null
          id: string
          metadata: Json | null
          net_amount: number | null
          reference_number: string
          status: string
          stripe_transfer_id: string | null
          transfer_type: string
          treasury_account_id: string | null
          updated_at: string | null
        }
        Insert: {
          actual_arrival?: string | null
          amount: number
          bank_account_id: string
          created_at?: string | null
          currency?: string
          estimated_arrival?: string | null
          failure_reason?: string | null
          fees?: number | null
          id?: string
          metadata?: Json | null
          net_amount?: number | null
          reference_number: string
          status?: string
          stripe_transfer_id?: string | null
          transfer_type: string
          treasury_account_id?: string | null
          updated_at?: string | null
        }
        Update: {
          actual_arrival?: string | null
          amount?: number
          bank_account_id?: string
          created_at?: string | null
          currency?: string
          estimated_arrival?: string | null
          failure_reason?: string | null
          fees?: number | null
          id?: string
          metadata?: Json | null
          net_amount?: number | null
          reference_number?: string
          status?: string
          stripe_transfer_id?: string | null
          transfer_type?: string
          treasury_account_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bank_transfers_treasury_account_id_fkey"
            columns: ["treasury_account_id"]
            isOneToOne: false
            referencedRelation: "treasury_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      campaigns: {
        Row: {
          agent_id: string | null
          bid_amount: number | null
          campaign_name: string
          campaign_type: string
          clicks: number | null
          conversions: number | null
          created_at: string | null
          daily_budget: number | null
          id: string
          impressions: number | null
          revenue: number | null
          spend: number | null
          status: string | null
          target_keywords: Json | null
          updated_at: string | null
        }
        Insert: {
          agent_id?: string | null
          bid_amount?: number | null
          campaign_name: string
          campaign_type: string
          clicks?: number | null
          conversions?: number | null
          created_at?: string | null
          daily_budget?: number | null
          id?: string
          impressions?: number | null
          revenue?: number | null
          spend?: number | null
          status?: string | null
          target_keywords?: Json | null
          updated_at?: string | null
        }
        Update: {
          agent_id?: string | null
          bid_amount?: number | null
          campaign_name?: string
          campaign_type?: string
          clicks?: number | null
          conversions?: number | null
          created_at?: string | null
          daily_budget?: number | null
          id?: string
          impressions?: number | null
          revenue?: number | null
          spend?: number | null
          status?: string | null
          target_keywords?: Json | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "campaigns_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "autonomous_agents"
            referencedColumns: ["id"]
          },
        ]
      }
      cash_out_requests: {
        Row: {
          amount: number
          created_at: string | null
          id: string
          payment_details: Json
          payment_method: string
          processed_at: string | null
          status: string | null
          transaction_id: string | null
          user_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          id?: string
          payment_details: Json
          payment_method: string
          processed_at?: string | null
          status?: string | null
          transaction_id?: string | null
          user_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          id?: string
          payment_details?: Json
          payment_method?: string
          processed_at?: string | null
          status?: string | null
          transaction_id?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      chart_of_accounts: {
        Row: {
          account_code: string
          account_name: string
          account_type: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          normal_balance: string
          parent_account_id: string | null
          updated_at: string
        }
        Insert: {
          account_code: string
          account_name: string
          account_type: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          normal_balance: string
          parent_account_id?: string | null
          updated_at?: string
        }
        Update: {
          account_code?: string
          account_name?: string
          account_type?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          normal_balance?: string
          parent_account_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "chart_of_accounts_parent_account_id_fkey"
            columns: ["parent_account_id"]
            isOneToOne: false
            referencedRelation: "chart_of_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      cli_integrations: {
        Row: {
          config: Json | null
          created_at: string | null
          github_repo_url: string | null
          id: string
          integration_type: string
          last_sync: string | null
          replit_project_id: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          config?: Json | null
          created_at?: string | null
          github_repo_url?: string | null
          id?: string
          integration_type: string
          last_sync?: string | null
          replit_project_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          config?: Json | null
          created_at?: string | null
          github_repo_url?: string | null
          id?: string
          integration_type?: string
          last_sync?: string | null
          replit_project_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      compliance_checks: {
        Row: {
          check_date: string
          check_result: Json
          check_type: string
          checked_by: string | null
          compliance_score: number | null
          entity_id: string
          entity_type: string
          id: string
          notes: string | null
          passed: boolean
        }
        Insert: {
          check_date?: string
          check_result: Json
          check_type: string
          checked_by?: string | null
          compliance_score?: number | null
          entity_id: string
          entity_type: string
          id?: string
          notes?: string | null
          passed: boolean
        }
        Update: {
          check_date?: string
          check_result?: Json
          check_type?: string
          checked_by?: string | null
          compliance_score?: number | null
          entity_id?: string
          entity_type?: string
          id?: string
          notes?: string | null
          passed?: boolean
        }
        Relationships: []
      }
      compliance_logs: {
        Row: {
          check_type: string
          details: Json | null
          id: string
          order_id: string | null
          performed_at: string | null
          score: number | null
          status: string
        }
        Insert: {
          check_type: string
          details?: Json | null
          id?: string
          order_id?: string | null
          performed_at?: string | null
          score?: number | null
          status: string
        }
        Update: {
          check_type?: string
          details?: Json | null
          id?: string
          order_id?: string | null
          performed_at?: string | null
          score?: number | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "compliance_logs_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      consolidated_amounts: {
        Row: {
          created_at: string | null
          id: number
          status: string | null
          total_usd: number
          transfer_date: string | null
        }
        Insert: {
          created_at?: string | null
          id?: never
          status?: string | null
          total_usd: number
          transfer_date?: string | null
        }
        Update: {
          created_at?: string | null
          id?: never
          status?: string | null
          total_usd?: number
          transfer_date?: string | null
        }
        Relationships: []
      }
      consolidated_balances: {
        Row: {
          amount: number
          balance_type: string
          currency: string | null
          id: string
          last_updated: string | null
          user_id: string | null
        }
        Insert: {
          amount?: number
          balance_type: string
          currency?: string | null
          id?: string
          last_updated?: string | null
          user_id?: string | null
        }
        Update: {
          amount?: number
          balance_type?: string
          currency?: string | null
          id?: string
          last_updated?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      cron_execution_logs: {
        Row: {
          created_at: string | null
          execution_time: string | null
          function_name: string
          id: number
          result: Json | null
          success: boolean
        }
        Insert: {
          created_at?: string | null
          execution_time?: string | null
          function_name: string
          id?: never
          result?: Json | null
          success?: boolean
        }
        Update: {
          created_at?: string | null
          execution_time?: string | null
          function_name?: string
          id?: never
          result?: Json | null
          success?: boolean
        }
        Relationships: []
      }
      crypto_transactions: {
        Row: {
          consolidated_at: string | null
          id: number
          transaction_amount: number
          transaction_status: string | null
          user_id: string | null
        }
        Insert: {
          consolidated_at?: string | null
          id?: number
          transaction_amount: number
          transaction_status?: string | null
          user_id?: string | null
        }
        Update: {
          consolidated_at?: string | null
          id?: number
          transaction_amount?: number
          transaction_status?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      customer_contracts: {
        Row: {
          contract_number: string
          contract_type: string
          created_at: string
          end_date: string | null
          id: number
          start_date: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          contract_number: string
          contract_type: string
          created_at?: string
          end_date?: string | null
          id?: never
          start_date: string
          status: string
          updated_at?: string
          user_id: string
        }
        Update: {
          contract_number?: string
          contract_type?: string
          created_at?: string
          end_date?: string | null
          id?: never
          start_date?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      earnings: {
        Row: {
          agent_id: string | null
          amount: number
          campaign_id: string | null
          created_at: string | null
          description: string | null
          id: string
          metadata: Json | null
          source: string
          user_id: string | null
        }
        Insert: {
          agent_id?: string | null
          amount: number
          campaign_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
          source: string
          user_id?: string | null
        }
        Update: {
          agent_id?: string | null
          amount?: number
          campaign_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
          source?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "earnings_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "autonomous_agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "earnings_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      exchange_rates: {
        Row: {
          id: number
          rates: Json
          updated_at: string | null
        }
        Insert: {
          id?: number
          rates: Json
          updated_at?: string | null
        }
        Update: {
          id?: number
          rates?: Json
          updated_at?: string | null
        }
        Relationships: []
      }
      external_payment_transactions: {
        Row: {
          consolidated_at: string | null
          id: number
          transaction_amount: number
          transaction_status: string | null
        }
        Insert: {
          consolidated_at?: string | null
          id?: number
          transaction_amount: number
          transaction_status?: string | null
        }
        Update: {
          consolidated_at?: string | null
          id?: number
          transaction_amount?: number
          transaction_status?: string | null
        }
        Relationships: []
      }
      financial_balances: {
        Row: {
          amount: number
          currency: string | null
          id: number
          user_id: string | null
        }
        Insert: {
          amount: number
          currency?: string | null
          id?: never
          user_id?: string | null
        }
        Update: {
          amount?: number
          currency?: string | null
          id?: never
          user_id?: string | null
        }
        Relationships: []
      }
      financial_statements: {
        Row: {
          created_at: string
          id: string
          net_income: number
          period_end: string
          period_start: string
          statement_data: Json
          statement_type: string
          total_expenses: number
          total_revenue: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          net_income?: number
          period_end: string
          period_start: string
          statement_data?: Json
          statement_type: string
          total_expenses?: number
          total_revenue?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          net_income?: number
          period_end?: string
          period_start?: string
          statement_data?: Json
          statement_type?: string
          total_expenses?: number
          total_revenue?: number
          updated_at?: string
        }
        Relationships: []
      }
      financial_transactions: {
        Row: {
          created_at: string
          currency: string
          description: string
          id: number
          metadata: Json | null
          payment_processor: string | null
          payment_processor_id: string | null
          status: string
          total_amount: number
          transaction_date: string
          transaction_number: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          currency?: string
          description: string
          id?: never
          metadata?: Json | null
          payment_processor?: string | null
          payment_processor_id?: string | null
          status: string
          total_amount: number
          transaction_date?: string
          transaction_number: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          currency?: string
          description?: string
          id?: never
          metadata?: Json | null
          payment_processor?: string | null
          payment_processor_id?: string | null
          status?: string
          total_amount?: number
          transaction_date?: string
          transaction_number?: string
          updated_at?: string
        }
        Relationships: []
      }
      fund_transfers: {
        Row: {
          amount: number
          created_at: string | null
          destination: string
          error_message: string | null
          id: number
          status: string | null
          transaction_id: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          destination: string
          error_message?: string | null
          id?: never
          status?: string | null
          transaction_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          destination?: string
          error_message?: string | null
          id?: never
          status?: string | null
          transaction_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      github_repos: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          metrics: Json
          repo_name: string
          status: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          metrics?: Json
          repo_name: string
          status: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          metrics?: Json
          repo_name?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      github_repository_earnings: {
        Row: {
          created_at: string | null
          earnings_rate: number | null
          id: string
          last_transfer_at: string | null
          metadata: Json | null
          pending_balance: number | null
          repo_id: string | null
          repo_name: string
          status: string | null
          total_earnings: number | null
          transferred_balance: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          earnings_rate?: number | null
          id?: string
          last_transfer_at?: string | null
          metadata?: Json | null
          pending_balance?: number | null
          repo_id?: string | null
          repo_name: string
          status?: string | null
          total_earnings?: number | null
          transferred_balance?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          earnings_rate?: number | null
          id?: string
          last_transfer_at?: string | null
          metadata?: Json | null
          pending_balance?: number | null
          repo_id?: string | null
          repo_name?: string
          status?: string | null
          total_earnings?: number | null
          transferred_balance?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "github_repository_earnings_repo_id_fkey"
            columns: ["repo_id"]
            isOneToOne: false
            referencedRelation: "github_repos"
            referencedColumns: ["id"]
          },
        ]
      }
      journal_entries: {
        Row: {
          account_id: string
          created_at: string
          credit_amount: number | null
          debit_amount: number | null
          description: string | null
          id: string
          transaction_id: string
        }
        Insert: {
          account_id: string
          created_at?: string
          credit_amount?: number | null
          debit_amount?: number | null
          description?: string | null
          id?: string
          transaction_id: string
        }
        Update: {
          account_id?: string
          created_at?: string
          credit_amount?: number | null
          debit_amount?: number | null
          description?: string | null
          id?: string
          transaction_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "journal_entries_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "chart_of_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      kong_integrations: {
        Row: {
          api_endpoint: string
          created_at: string | null
          id: string
          kong_service_id: string | null
          metrics: Json | null
          revenue_rate: number | null
          service_name: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          api_endpoint: string
          created_at?: string | null
          id?: string
          kong_service_id?: string | null
          metrics?: Json | null
          revenue_rate?: number | null
          service_name: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          api_endpoint?: string
          created_at?: string | null
          id?: string
          kong_service_id?: string | null
          metrics?: Json | null
          revenue_rate?: number | null
          service_name?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      leads: {
        Row: {
          channel: string
          company: string | null
          created_at: string | null
          email: string
          id: string
          interest_level: number | null
          name: string
          notes: string | null
          potential_revenue: number | null
          status: string
          stream_id: string | null
          updated_at: string | null
        }
        Insert: {
          channel: string
          company?: string | null
          created_at?: string | null
          email: string
          id?: string
          interest_level?: number | null
          name: string
          notes?: string | null
          potential_revenue?: number | null
          status: string
          stream_id?: string | null
          updated_at?: string | null
        }
        Update: {
          channel?: string
          company?: string | null
          created_at?: string | null
          email?: string
          id?: string
          interest_level?: number | null
          name?: string
          notes?: string | null
          potential_revenue?: number | null
          status?: string
          stream_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_stream_id_fkey"
            columns: ["stream_id"]
            isOneToOne: false
            referencedRelation: "revenue_analytics"
            referencedColumns: ["stream_id"]
          },
          {
            foreignKeyName: "leads_stream_id_fkey"
            columns: ["stream_id"]
            isOneToOne: false
            referencedRelation: "revenue_streams"
            referencedColumns: ["id"]
          },
        ]
      }
      market_offers: {
        Row: {
          category: string | null
          conversion_rate: number | null
          geographic_restrictions: Json | null
          id: string
          is_active: boolean | null
          name: string
          offer_id: string
          payout_rate: number | null
          performance_score: number | null
          scraped_at: string | null
          source: string
          traffic_requirements: Json | null
        }
        Insert: {
          category?: string | null
          conversion_rate?: number | null
          geographic_restrictions?: Json | null
          id?: string
          is_active?: boolean | null
          name: string
          offer_id: string
          payout_rate?: number | null
          performance_score?: number | null
          scraped_at?: string | null
          source: string
          traffic_requirements?: Json | null
        }
        Update: {
          category?: string | null
          conversion_rate?: number | null
          geographic_restrictions?: Json | null
          id?: string
          is_active?: boolean | null
          name?: string
          offer_id?: string
          payout_rate?: number | null
          performance_score?: number | null
          scraped_at?: string | null
          source?: string
          traffic_requirements?: Json | null
        }
        Relationships: []
      }
      modern_treasury_accounts: {
        Row: {
          account_id: string
          account_name: string
          account_number: string | null
          account_type: string
          balance: number | null
          bank_name: string | null
          created_at: string | null
          currency: string | null
          id: string
          metadata: Json | null
          routing_number: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          account_id: string
          account_name: string
          account_number?: string | null
          account_type: string
          balance?: number | null
          bank_name?: string | null
          created_at?: string | null
          currency?: string | null
          id?: string
          metadata?: Json | null
          routing_number?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          account_id?: string
          account_name?: string
          account_number?: string | null
          account_type?: string
          balance?: number | null
          bank_name?: string | null
          created_at?: string | null
          currency?: string | null
          id?: string
          metadata?: Json | null
          routing_number?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      modern_treasury_transfers: {
        Row: {
          amount: number
          completed_at: string | null
          created_at: string | null
          currency: string | null
          description: string | null
          direction: string | null
          error_message: string | null
          failed_at: string | null
          from_account_id: string | null
          id: string
          metadata: Json | null
          reference: string | null
          status: string | null
          to_account_id: string | null
          treasury_transfer_id: string | null
        }
        Insert: {
          amount: number
          completed_at?: string | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          direction?: string | null
          error_message?: string | null
          failed_at?: string | null
          from_account_id?: string | null
          id?: string
          metadata?: Json | null
          reference?: string | null
          status?: string | null
          to_account_id?: string | null
          treasury_transfer_id?: string | null
        }
        Update: {
          amount?: number
          completed_at?: string | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          direction?: string | null
          error_message?: string | null
          failed_at?: string | null
          from_account_id?: string | null
          id?: string
          metadata?: Json | null
          reference?: string | null
          status?: string | null
          to_account_id?: string | null
          treasury_transfer_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "modern_treasury_transfers_from_account_id_fkey"
            columns: ["from_account_id"]
            isOneToOne: false
            referencedRelation: "modern_treasury_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      open_banking_connections: {
        Row: {
          accounts_count: number | null
          api_version: string | null
          bank_name: string
          connection_status: string | null
          created_at: string | null
          id: string
          last_sync_at: string | null
          metadata: Json | null
          revenue_generated: number | null
          updated_at: string | null
        }
        Insert: {
          accounts_count?: number | null
          api_version?: string | null
          bank_name: string
          connection_status?: string | null
          created_at?: string | null
          id?: string
          last_sync_at?: string | null
          metadata?: Json | null
          revenue_generated?: number | null
          updated_at?: string | null
        }
        Update: {
          accounts_count?: number | null
          api_version?: string | null
          bank_name?: string
          connection_status?: string | null
          created_at?: string | null
          id?: string
          last_sync_at?: string | null
          metadata?: Json | null
          revenue_generated?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      optimization_history: {
        Row: {
          created_at: string | null
          id: string
          new_value: Json | null
          optimization_type: string
          performance_impact: number | null
          previous_value: Json | null
          stream_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          new_value?: Json | null
          optimization_type: string
          performance_impact?: number | null
          previous_value?: Json | null
          stream_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          new_value?: Json | null
          optimization_type?: string
          performance_impact?: number | null
          previous_value?: Json | null
          stream_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "optimization_history_stream_id_fkey"
            columns: ["stream_id"]
            isOneToOne: false
            referencedRelation: "revenue_analytics"
            referencedColumns: ["stream_id"]
          },
          {
            foreignKeyName: "optimization_history_stream_id_fkey"
            columns: ["stream_id"]
            isOneToOne: false
            referencedRelation: "revenue_streams"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          completed_at: string | null
          confirmed_at: string | null
          created_at: string | null
          crypto_amount: number
          crypto_tx_hash: string | null
          crypto_type: string
          customer_email: string | null
          customer_phone: string | null
          error_message: string | null
          exchange_rate: number
          expires_at: string | null
          failed_at: string | null
          id: string
          new_column_name: string | null
          payment_method: string
          payment_tx_hash: string | null
          service_fee: number
          status: string
          updated_at: string | null
          usd_amount: number
          verified_amount: number | null
          wallet_address: string
        }
        Insert: {
          completed_at?: string | null
          confirmed_at?: string | null
          created_at?: string | null
          crypto_amount: number
          crypto_tx_hash?: string | null
          crypto_type: string
          customer_email?: string | null
          customer_phone?: string | null
          error_message?: string | null
          exchange_rate: number
          expires_at?: string | null
          failed_at?: string | null
          id: string
          new_column_name?: string | null
          payment_method: string
          payment_tx_hash?: string | null
          service_fee: number
          status?: string
          updated_at?: string | null
          usd_amount: number
          verified_amount?: number | null
          wallet_address: string
        }
        Update: {
          completed_at?: string | null
          confirmed_at?: string | null
          created_at?: string | null
          crypto_amount?: number
          crypto_tx_hash?: string | null
          crypto_type?: string
          customer_email?: string | null
          customer_phone?: string | null
          error_message?: string | null
          exchange_rate?: number
          expires_at?: string | null
          failed_at?: string | null
          id?: string
          new_column_name?: string | null
          payment_method?: string
          payment_tx_hash?: string | null
          service_fee?: number
          status?: string
          updated_at?: string | null
          usd_amount?: number
          verified_amount?: number | null
          wallet_address?: string
        }
        Relationships: []
      }
      payment_addresses: {
        Row: {
          created_at: string | null
          crypto_type: string
          deposit_address: string
          expected_amount: number
          id: string
          order_id: string | null
        }
        Insert: {
          created_at?: string | null
          crypto_type: string
          deposit_address: string
          expected_amount: number
          id?: string
          order_id?: string | null
        }
        Update: {
          created_at?: string | null
          crypto_type?: string
          deposit_address?: string
          expected_amount?: number
          id?: string
          order_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_addresses_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_automation_jobs: {
        Row: {
          completed_at: string | null
          created_at: string | null
          error_message: string | null
          id: string
          job_type: string
          payload: Json | null
          result: Json | null
          status: string | null
          target_replit: string | null
          target_repo: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          job_type: string
          payload?: Json | null
          result?: Json | null
          status?: string | null
          target_replit?: string | null
          target_repo?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          job_type?: string
          payload?: Json | null
          result?: Json | null
          status?: string | null
          target_replit?: string | null
          target_repo?: string | null
        }
        Relationships: []
      }
      payouts: {
        Row: {
          consolidated_at: string | null
          id: number
          payout_amount: number
          status: string | null
        }
        Insert: {
          consolidated_at?: string | null
          id?: number
          payout_amount: number
          status?: string | null
        }
        Update: {
          consolidated_at?: string | null
          id?: number
          payout_amount?: number
          status?: string | null
        }
        Relationships: []
      }
      performance_obligations: {
        Row: {
          contract_id: number
          created_at: string
          description: string
          end_date: string | null
          id: number
          obligation_type: string
          quantity: number
          start_date: string
          status: string
          total_price: number
          unit_of_measure: string
          unit_price: number
          updated_at: string
        }
        Insert: {
          contract_id: number
          created_at?: string
          description: string
          end_date?: string | null
          id?: never
          obligation_type: string
          quantity: number
          start_date: string
          status: string
          total_price: number
          unit_of_measure: string
          unit_price: number
          updated_at?: string
        }
        Update: {
          contract_id?: number
          created_at?: string
          description?: string
          end_date?: string | null
          id?: never
          obligation_type?: string
          quantity?: number
          start_date?: string
          status?: string
          total_price?: number
          unit_of_measure?: string
          unit_price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "performance_obligations_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "customer_contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          agent_tier: string | null
          avatar_url: string | null
          created_at: string | null
          first_name: string | null
          id: string
          last_name: string | null
          metadata: Json | null
          total_earnings: number | null
          updated_at: string | null
          username: string | null
          wallet_balance: number | null
        }
        Insert: {
          agent_tier?: string | null
          avatar_url?: string | null
          created_at?: string | null
          first_name?: string | null
          id: string
          last_name?: string | null
          metadata?: Json | null
          total_earnings?: number | null
          updated_at?: string | null
          username?: string | null
          wallet_balance?: number | null
        }
        Update: {
          agent_tier?: string | null
          avatar_url?: string | null
          created_at?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          metadata?: Json | null
          total_earnings?: number | null
          updated_at?: string | null
          username?: string | null
          wallet_balance?: number | null
        }
        Relationships: []
      }
      profit_optimization_logs: {
        Row: {
          created_at: string | null
          github_repo: string | null
          id: string
          implementation_details: Json | null
          improvement_percentage: number | null
          optimization_type: string
          optimized_revenue: number | null
          source_revenue: number | null
          strategy_used: string | null
        }
        Insert: {
          created_at?: string | null
          github_repo?: string | null
          id?: string
          implementation_details?: Json | null
          improvement_percentage?: number | null
          optimization_type: string
          optimized_revenue?: number | null
          source_revenue?: number | null
          strategy_used?: string | null
        }
        Update: {
          created_at?: string | null
          github_repo?: string | null
          id?: string
          implementation_details?: Json | null
          improvement_percentage?: number | null
          optimization_type?: string
          optimized_revenue?: number | null
          source_revenue?: number | null
          strategy_used?: string | null
        }
        Relationships: []
      }
      repository_revenue: {
        Row: {
          api_calls_count: number | null
          created_at: string | null
          id: string
          kong_service_id: string | null
          last_revenue_at: string | null
          repo_id: string | null
          revenue_generated: number | null
          updated_at: string | null
        }
        Insert: {
          api_calls_count?: number | null
          created_at?: string | null
          id?: string
          kong_service_id?: string | null
          last_revenue_at?: string | null
          repo_id?: string | null
          revenue_generated?: number | null
          updated_at?: string | null
        }
        Update: {
          api_calls_count?: number | null
          created_at?: string | null
          id?: string
          kong_service_id?: string | null
          last_revenue_at?: string | null
          repo_id?: string | null
          revenue_generated?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "repository_revenue_kong_service_id_fkey"
            columns: ["kong_service_id"]
            isOneToOne: false
            referencedRelation: "kong_integrations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "repository_revenue_repo_id_fkey"
            columns: ["repo_id"]
            isOneToOne: false
            referencedRelation: "github_repos"
            referencedColumns: ["id"]
          },
        ]
      }
      revenue: {
        Row: {
          amount: number
          created_at: string | null
          currency: string
          id: number
          payment_status: string
          user_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          currency: string
          id?: never
          payment_status: string
          user_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          currency?: string
          id?: never
          payment_status?: string
          user_id?: string | null
        }
        Relationships: []
      }
      revenue_allocations: {
        Row: {
          allocation_amount: number
          allocation_date: string
          allocation_metadata: Json | null
          allocation_method: string
          contract_id: string | null
          created_at: string | null
          id: string
          obligation_id: string | null
        }
        Insert: {
          allocation_amount: number
          allocation_date: string
          allocation_metadata?: Json | null
          allocation_method: string
          contract_id?: string | null
          created_at?: string | null
          id?: string
          obligation_id?: string | null
        }
        Update: {
          allocation_amount?: number
          allocation_date?: string
          allocation_metadata?: Json | null
          allocation_method?: string
          contract_id?: string | null
          created_at?: string | null
          id?: string
          obligation_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "revenue_allocations_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "revenue_contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      revenue_consolidation: {
        Row: {
          created_at: string | null
          credibility_score: number | null
          id: string
          last_consolidated_at: string | null
          pending_transfers: number | null
          total_usd_available: number
          trust_rating: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          credibility_score?: number | null
          id?: string
          last_consolidated_at?: string | null
          pending_transfers?: number | null
          total_usd_available?: number
          trust_rating?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          credibility_score?: number | null
          id?: string
          last_consolidated_at?: string | null
          pending_transfers?: number | null
          total_usd_available?: number
          trust_rating?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      revenue_consolidations: {
        Row: {
          completed_at: string | null
          consolidation_date: string
          consolidation_details: Json | null
          created_at: string | null
          id: string
          sources_consolidated: Json
          status: string
          total_amount: number
          treasury_account_id: string | null
        }
        Insert: {
          completed_at?: string | null
          consolidation_date?: string
          consolidation_details?: Json | null
          created_at?: string | null
          id?: string
          sources_consolidated?: Json
          status?: string
          total_amount?: number
          treasury_account_id?: string | null
        }
        Update: {
          completed_at?: string | null
          consolidation_date?: string
          consolidation_details?: Json | null
          created_at?: string | null
          id?: string
          sources_consolidated?: Json
          status?: string
          total_amount?: number
          treasury_account_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "revenue_consolidations_treasury_account_id_fkey"
            columns: ["treasury_account_id"]
            isOneToOne: false
            referencedRelation: "treasury_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      revenue_contracts: {
        Row: {
          contract_date: string
          contract_metadata: Json | null
          contract_number: string
          created_at: string | null
          currency: string | null
          customer_id: string | null
          end_date: string | null
          id: string
          payment_terms: Json | null
          start_date: string
          status: string | null
          total_contract_value: number
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          contract_date: string
          contract_metadata?: Json | null
          contract_number: string
          created_at?: string | null
          currency?: string | null
          customer_id?: string | null
          end_date?: string | null
          id?: string
          payment_terms?: Json | null
          start_date: string
          status?: string | null
          total_contract_value: number
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          contract_date?: string
          contract_metadata?: Json | null
          contract_number?: string
          created_at?: string | null
          currency?: string | null
          customer_id?: string | null
          end_date?: string | null
          id?: string
          payment_terms?: Json | null
          start_date?: string
          status?: string | null
          total_contract_value?: number
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      revenue_dashboard_cache: {
        Row: {
          active_sources: number | null
          active_workers: number | null
          avg_daily_revenue: number | null
          current_balance: number | null
          id: number
          last_updated_at: string | null
          pending_transfer_count: number | null
          pending_transfers: number | null
          today_revenue: number | null
          today_transfers: number | null
        }
        Insert: {
          active_sources?: number | null
          active_workers?: number | null
          avg_daily_revenue?: number | null
          current_balance?: number | null
          id?: number
          last_updated_at?: string | null
          pending_transfer_count?: number | null
          pending_transfers?: number | null
          today_revenue?: number | null
          today_transfers?: number | null
        }
        Update: {
          active_sources?: number | null
          active_workers?: number | null
          avg_daily_revenue?: number | null
          current_balance?: number | null
          id?: number
          last_updated_at?: string | null
          pending_transfer_count?: number | null
          pending_transfers?: number | null
          today_revenue?: number | null
          today_transfers?: number | null
        }
        Relationships: []
      }
      revenue_dashboard_metrics: {
        Row: {
          active_revenue_streams: number
          created_at: string
          failed_transfer_amount: number
          failed_transfers_24h: number
          github_repos_connected: number | null
          id: string
          last_stripe_sync: string | null
          metric_date: string
          pending_transfer_amount: number
          stripe_verification_status: string | null
          successful_transfers_24h: number
          total_revenue_generated: number
          total_revenue_transferred: number
          updated_at: string
          vm_swarms_active: number | null
        }
        Insert: {
          active_revenue_streams?: number
          created_at?: string
          failed_transfer_amount?: number
          failed_transfers_24h?: number
          github_repos_connected?: number | null
          id?: string
          last_stripe_sync?: string | null
          metric_date?: string
          pending_transfer_amount?: number
          stripe_verification_status?: string | null
          successful_transfers_24h?: number
          total_revenue_generated?: number
          total_revenue_transferred?: number
          updated_at?: string
          vm_swarms_active?: number | null
        }
        Update: {
          active_revenue_streams?: number
          created_at?: string
          failed_transfer_amount?: number
          failed_transfers_24h?: number
          github_repos_connected?: number | null
          id?: string
          last_stripe_sync?: string | null
          metric_date?: string
          pending_transfer_amount?: number
          stripe_verification_status?: string | null
          successful_transfers_24h?: number
          total_revenue_generated?: number
          total_revenue_transferred?: number
          updated_at?: string
          vm_swarms_active?: number | null
        }
        Relationships: []
      }
      revenue_optimization_engine: {
        Row: {
          active: boolean | null
          created_at: string | null
          current_allocation: number | null
          id: string
          last_execution: string | null
          maximum_risk_exposure: number
          minimum_profit_margin: number
          next_execution: string | null
          parameters: Json
          performance_score: number | null
          strategy_name: string
          strategy_type: string
          target_market: string
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          current_allocation?: number | null
          id?: string
          last_execution?: string | null
          maximum_risk_exposure: number
          minimum_profit_margin: number
          next_execution?: string | null
          parameters: Json
          performance_score?: number | null
          strategy_name: string
          strategy_type: string
          target_market: string
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          current_allocation?: number | null
          id?: string
          last_execution?: string | null
          maximum_risk_exposure?: number
          minimum_profit_margin?: number
          next_execution?: string | null
          parameters?: Json
          performance_score?: number | null
          strategy_name?: string
          strategy_type?: string
          target_market?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      revenue_optimization_logs: {
        Row: {
          actual_improvement: number | null
          agent_id: string | null
          created_at: string | null
          expected_improvement: number | null
          id: string
          new_config: Json | null
          optimization_type: string
          previous_config: Json | null
        }
        Insert: {
          actual_improvement?: number | null
          agent_id?: string | null
          created_at?: string | null
          expected_improvement?: number | null
          id?: string
          new_config?: Json | null
          optimization_type: string
          previous_config?: Json | null
        }
        Update: {
          actual_improvement?: number | null
          agent_id?: string | null
          created_at?: string | null
          expected_improvement?: number | null
          id?: string
          new_config?: Json | null
          optimization_type?: string
          previous_config?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "revenue_optimization_logs_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "autonomous_agents"
            referencedColumns: ["id"]
          },
        ]
      }
      revenue_optimization_strategies: {
        Row: {
          active: boolean | null
          created_at: string | null
          expected_roi: number | null
          id: string
          implementation_difficulty: string | null
          parameters: Json | null
          profitability_score: number | null
          required_capital: number | null
          risk_level: string | null
          strategy_name: string
          strategy_type: string
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          expected_roi?: number | null
          id?: string
          implementation_difficulty?: string | null
          parameters?: Json | null
          profitability_score?: number | null
          required_capital?: number | null
          risk_level?: string | null
          strategy_name: string
          strategy_type: string
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          expected_roi?: number | null
          id?: string
          implementation_difficulty?: string | null
          parameters?: Json | null
          profitability_score?: number | null
          required_capital?: number | null
          risk_level?: string | null
          strategy_name?: string
          strategy_type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      revenue_processing_status: {
        Row: {
          batch_id: string
          completed_at: string | null
          completed_transfers: number | null
          error_details: Json | null
          failed_transfers: number | null
          id: string
          metadata: Json | null
          processed_amount: number | null
          started_at: string | null
          status: string | null
          total_amount: number
          transfer_count: number | null
        }
        Insert: {
          batch_id: string
          completed_at?: string | null
          completed_transfers?: number | null
          error_details?: Json | null
          failed_transfers?: number | null
          id?: string
          metadata?: Json | null
          processed_amount?: number | null
          started_at?: string | null
          status?: string | null
          total_amount: number
          transfer_count?: number | null
        }
        Update: {
          batch_id?: string
          completed_at?: string | null
          completed_transfers?: number | null
          error_details?: Json | null
          failed_transfers?: number | null
          id?: string
          metadata?: Json | null
          processed_amount?: number | null
          started_at?: string | null
          status?: string | null
          total_amount?: number
          transfer_count?: number | null
        }
        Relationships: []
      }
      revenue_recognition_events: {
        Row: {
          created_at: string
          currency: string
          deferred_amount: number
          id: number
          obligation_id: number | null
          recognition_basis: string
          recognition_date: string
          recognition_method: string
          recognized_amount: number
          transaction_id: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          currency?: string
          deferred_amount?: number
          id?: never
          obligation_id?: number | null
          recognition_basis: string
          recognition_date?: string
          recognition_method: string
          recognized_amount: number
          transaction_id?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          currency?: string
          deferred_amount?: number
          id?: never
          obligation_id?: number | null
          recognition_basis?: string
          recognition_date?: string
          recognition_method?: string
          recognized_amount?: number
          transaction_id?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      revenue_schedules: {
        Row: {
          contract_id: string
          created_at: string
          id: string
          monthly_amount: number
          recognition_end_date: string
          recognition_method: string
          recognition_start_date: string
          recognized_to_date: number | null
          remaining_amount: number
          status: string
          stripe_subscription_id: string | null
          total_contract_value: number
          transaction_id: string | null
          updated_at: string
        }
        Insert: {
          contract_id: string
          created_at?: string
          id?: string
          monthly_amount: number
          recognition_end_date: string
          recognition_method?: string
          recognition_start_date: string
          recognized_to_date?: number | null
          remaining_amount: number
          status?: string
          stripe_subscription_id?: string | null
          total_contract_value: number
          transaction_id?: string | null
          updated_at?: string
        }
        Update: {
          contract_id?: string
          created_at?: string
          id?: string
          monthly_amount?: number
          recognition_end_date?: string
          recognition_method?: string
          recognition_start_date?: string
          recognized_to_date?: number | null
          remaining_amount?: number
          status?: string
          stripe_subscription_id?: string | null
          total_contract_value?: number
          transaction_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      revenue_streams: {
        Row: {
          config: Json
          created_at: string | null
          id: string
          metrics: Json
          name: string
          status: string
          type: string
          updated_at: string | null
        }
        Insert: {
          config: Json
          created_at?: string | null
          id?: string
          metrics?: Json
          name: string
          status: string
          type: string
          updated_at?: string | null
        }
        Update: {
          config?: Json
          created_at?: string | null
          id?: string
          metrics?: Json
          name?: string
          status?: string
          type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      revenue_transactions: {
        Row: {
          amount: number
          created_at: string | null
          currency: string
          id: string
          metadata: Json | null
          status: string
          stream_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          currency?: string
          id?: string
          metadata?: Json | null
          status: string
          stream_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          currency?: string
          id?: string
          metadata?: Json | null
          status?: string
          stream_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "revenue_transactions_stream_id_fkey"
            columns: ["stream_id"]
            isOneToOne: false
            referencedRelation: "revenue_analytics"
            referencedColumns: ["stream_id"]
          },
          {
            foreignKeyName: "revenue_transactions_stream_id_fkey"
            columns: ["stream_id"]
            isOneToOne: false
            referencedRelation: "revenue_streams"
            referencedColumns: ["id"]
          },
        ]
      }
      revenue_transfers: {
        Row: {
          amount: number
          completed_at: string | null
          created_at: string | null
          description: string | null
          id: string
          metadata: Json | null
          source: string
          source_user_id: string | null
          status: string
          stripe_transfer_id: string | null
        }
        Insert: {
          amount: number
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
          source: string
          source_user_id?: string | null
          status?: string
          stripe_transfer_id?: string | null
        }
        Update: {
          amount?: number
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
          source?: string
          source_user_id?: string | null
          status?: string
          stripe_transfer_id?: string | null
        }
        Relationships: []
      }
      secure_transactions: {
        Row: {
          amount: number | null
          completed_at: string | null
          created_at: string | null
          currency: string | null
          github_verification_id: string | null
          id: string
          metadata: Json | null
          status: string | null
          stripe_payment_intent_id: string | null
          supabase_verification_id: string | null
          transaction_group_id: string
          transaction_type: string
          verification_status: Json | null
          verified_at: string | null
        }
        Insert: {
          amount?: number | null
          completed_at?: string | null
          created_at?: string | null
          currency?: string | null
          github_verification_id?: string | null
          id?: string
          metadata?: Json | null
          status?: string | null
          stripe_payment_intent_id?: string | null
          supabase_verification_id?: string | null
          transaction_group_id: string
          transaction_type: string
          verification_status?: Json | null
          verified_at?: string | null
        }
        Update: {
          amount?: number | null
          completed_at?: string | null
          created_at?: string | null
          currency?: string | null
          github_verification_id?: string | null
          id?: string
          metadata?: Json | null
          status?: string | null
          stripe_payment_intent_id?: string | null
          supabase_verification_id?: string | null
          transaction_group_id?: string
          transaction_type?: string
          verification_status?: Json | null
          verified_at?: string | null
        }
        Relationships: []
      }
      storage_balance: {
        Row: {
          balance_amount: number
          id: number
          last_updated_at: string | null
          pending_transfers: number | null
          stripe_balance: number | null
        }
        Insert: {
          balance_amount?: number
          id?: number
          last_updated_at?: string | null
          pending_transfers?: number | null
          stripe_balance?: number | null
        }
        Update: {
          balance_amount?: number
          id?: number
          last_updated_at?: string | null
          pending_transfers?: number | null
          stripe_balance?: number | null
        }
        Relationships: []
      }
      storage_balance_movements: {
        Row: {
          amount: number
          created_at: string | null
          description: string | null
          destination_location: string
          id: number
          metadata: Json | null
          movement_date: string | null
          movement_type: string
          reference_id: string | null
          source_location: string
          updated_at: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          description?: string | null
          destination_location: string
          id?: number
          metadata?: Json | null
          movement_date?: string | null
          movement_type: string
          reference_id?: string | null
          source_location: string
          updated_at?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          description?: string | null
          destination_location?: string
          id?: number
          metadata?: Json | null
          movement_date?: string | null
          movement_type?: string
          reference_id?: string | null
          source_location?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      storage_balance_transactions: {
        Row: {
          amount: number
          balance_after: number | null
          balance_before: number | null
          created_at: string | null
          description: string | null
          destination: string | null
          id: number
          metadata: Json | null
          reference_id: string | null
          source: string | null
          transaction_date: string | null
          transaction_type: string
          updated_at: string | null
        }
        Insert: {
          amount: number
          balance_after?: number | null
          balance_before?: number | null
          created_at?: string | null
          description?: string | null
          destination?: string | null
          id?: number
          metadata?: Json | null
          reference_id?: string | null
          source?: string | null
          transaction_date?: string | null
          transaction_type: string
          updated_at?: string | null
        }
        Update: {
          amount?: number
          balance_after?: number | null
          balance_before?: number | null
          created_at?: string | null
          description?: string | null
          destination?: string | null
          id?: number
          metadata?: Json | null
          reference_id?: string | null
          source?: string | null
          transaction_date?: string | null
          transaction_type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      storage_credits: {
        Row: {
          credit_balance: number
          id: number
          last_consolidated_at: string | null
        }
        Insert: {
          credit_balance?: number
          id?: number
          last_consolidated_at?: string | null
        }
        Update: {
          credit_balance?: number
          id?: number
          last_consolidated_at?: string | null
        }
        Relationships: []
      }
      storage_overage_fees: {
        Row: {
          consolidated_at: string | null
          id: number
          overage_amount: number
          status: string | null
        }
        Insert: {
          consolidated_at?: string | null
          id?: number
          overage_amount: number
          status?: string | null
        }
        Update: {
          consolidated_at?: string | null
          id?: number
          overage_amount?: number
          status?: string | null
        }
        Relationships: []
      }
      storage_pricing_tiers: {
        Row: {
          created_at: string
          currency: string
          id: number
          is_active: boolean
          max_bytes: number | null
          min_bytes: number
          price_per_gb: number
          stream_id: string
          tier_name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          currency?: string
          id?: never
          is_active?: boolean
          max_bytes?: number | null
          min_bytes: number
          price_per_gb: number
          stream_id: string
          tier_name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          currency?: string
          id?: never
          is_active?: boolean
          max_bytes?: number | null
          min_bytes?: number
          price_per_gb?: number
          stream_id?: string
          tier_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      storage_refunds: {
        Row: {
          consolidated_at: string | null
          id: number
          refund_amount: number
          refund_status: string | null
        }
        Insert: {
          consolidated_at?: string | null
          id?: number
          refund_amount: number
          refund_status?: string | null
        }
        Update: {
          consolidated_at?: string | null
          id?: number
          refund_amount?: number
          refund_status?: string | null
        }
        Relationships: []
      }
      storage_usage: {
        Row: {
          bytes_used: number
          id: string
          recorded_at: string
          user_id: string
        }
        Insert: {
          bytes_used: number
          id?: string
          recorded_at?: string
          user_id: string
        }
        Update: {
          bytes_used?: number
          id?: string
          recorded_at?: string
          user_id?: string
        }
        Relationships: []
      }
      storage_usage_billing: {
        Row: {
          billing_status: string | null
          consolidated_at: string | null
          id: number
          total_cost: number
        }
        Insert: {
          billing_status?: string | null
          consolidated_at?: string | null
          id?: number
          total_cost: number
        }
        Update: {
          billing_status?: string | null
          consolidated_at?: string | null
          id?: number
          total_cost?: number
        }
        Relationships: []
      }
      stripe_config: {
        Row: {
          created_at: string | null
          id: string
          is_secret: boolean | null
          key: string
          updated_at: string | null
          value: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_secret?: boolean | null
          key: string
          updated_at?: string | null
          value: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_secret?: boolean | null
          key?: string
          updated_at?: string | null
          value?: string
        }
        Relationships: []
      }
      stripe_configuration: {
        Row: {
          account_id: string | null
          api_key: string
          created_at: string | null
          id: string
          is_live: boolean | null
          updated_at: string | null
          webhook_secret: string | null
        }
        Insert: {
          account_id?: string | null
          api_key: string
          created_at?: string | null
          id?: string
          is_live?: boolean | null
          updated_at?: string | null
          webhook_secret?: string | null
        }
        Update: {
          account_id?: string | null
          api_key?: string
          created_at?: string | null
          id?: string
          is_live?: boolean | null
          updated_at?: string | null
          webhook_secret?: string | null
        }
        Relationships: []
      }
      stripe_customers: {
        Row: {
          created_at: string | null
          email: string
          id: string
          metadata: Json | null
          name: string | null
          stripe_customer_id: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          metadata?: Json | null
          name?: string | null
          stripe_customer_id: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          metadata?: Json | null
          name?: string | null
          stripe_customer_id?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      stripe_dashboard_metrics: {
        Row: {
          available_balance: number | null
          created_at: string | null
          id: string
          last_webhook_at: string | null
          metric_date: string | null
          metrics_data: Json | null
          pending_balance: number | null
          total_balance: number | null
          total_transfers: number | null
          transfer_count: number | null
          updated_at: string | null
          webhook_events_count: number | null
        }
        Insert: {
          available_balance?: number | null
          created_at?: string | null
          id?: string
          last_webhook_at?: string | null
          metric_date?: string | null
          metrics_data?: Json | null
          pending_balance?: number | null
          total_balance?: number | null
          total_transfers?: number | null
          transfer_count?: number | null
          updated_at?: string | null
          webhook_events_count?: number | null
        }
        Update: {
          available_balance?: number | null
          created_at?: string | null
          id?: string
          last_webhook_at?: string | null
          metric_date?: string | null
          metrics_data?: Json | null
          pending_balance?: number | null
          total_balance?: number | null
          total_transfers?: number | null
          transfer_count?: number | null
          updated_at?: string | null
          webhook_events_count?: number | null
        }
        Relationships: []
      }
      stripe_destinations: {
        Row: {
          account_id: string
          account_type: string | null
          capabilities: Json | null
          created_at: string | null
          currency: string
          id: string
          is_active: boolean | null
          updated_at: string | null
        }
        Insert: {
          account_id: string
          account_type?: string | null
          capabilities?: Json | null
          created_at?: string | null
          currency: string
          id?: string
          is_active?: boolean | null
          updated_at?: string | null
        }
        Update: {
          account_id?: string
          account_type?: string | null
          capabilities?: Json | null
          created_at?: string | null
          currency?: string
          id?: string
          is_active?: boolean | null
          updated_at?: string | null
        }
        Relationships: []
      }
      stripe_integration: {
        Row: {
          created_at: string
          default_payment_method_id: string | null
          id: number
          is_active: boolean
          last_webhook_received_at: string | null
          stripe_account_id: string
          stripe_customer_id: string | null
          subscription_id: string | null
          subscription_status: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          default_payment_method_id?: string | null
          id?: never
          is_active?: boolean
          last_webhook_received_at?: string | null
          stripe_account_id: string
          stripe_customer_id?: string | null
          subscription_id?: string | null
          subscription_status?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          default_payment_method_id?: string | null
          id?: never
          is_active?: boolean
          last_webhook_received_at?: string | null
          stripe_account_id?: string
          stripe_customer_id?: string | null
          subscription_id?: string | null
          subscription_status?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      stripe_payments: {
        Row: {
          amount: number
          created_at: string | null
          currency: string | null
          description: string | null
          id: string
          metadata: Json | null
          payment_method_id: string | null
          receipt_email: string | null
          status: string
          stripe_customer_id: string | null
          stripe_payment_intent_id: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          currency?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
          payment_method_id?: string | null
          receipt_email?: string | null
          status: string
          stripe_customer_id?: string | null
          stripe_payment_intent_id: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          currency?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
          payment_method_id?: string | null
          receipt_email?: string | null
          status?: string
          stripe_customer_id?: string | null
          stripe_payment_intent_id?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      stripe_payouts: {
        Row: {
          amount: number
          arrival_date: string | null
          created_at: string | null
          currency: string
          description: string | null
          id: number
          metadata: Json | null
          payout_id: string
          status: string
          transfer_type: string | null
        }
        Insert: {
          amount: number
          arrival_date?: string | null
          created_at?: string | null
          currency: string
          description?: string | null
          id?: never
          metadata?: Json | null
          payout_id: string
          status: string
          transfer_type?: string | null
        }
        Update: {
          amount?: number
          arrival_date?: string | null
          created_at?: string | null
          currency?: string
          description?: string | null
          id?: never
          metadata?: Json | null
          payout_id?: string
          status?: string
          transfer_type?: string | null
        }
        Relationships: []
      }
      stripe_reconciliation: {
        Row: {
          amount_internal: number | null
          amount_stripe: number
          created_at: string
          id: string
          internal_transaction_id: string | null
          reconciled_at: string | null
          reconciled_by: string | null
          reconciliation_status: string
          stripe_object_id: string
          stripe_object_type: string
          variance: number | null
        }
        Insert: {
          amount_internal?: number | null
          amount_stripe: number
          created_at?: string
          id?: string
          internal_transaction_id?: string | null
          reconciled_at?: string | null
          reconciled_by?: string | null
          reconciliation_status?: string
          stripe_object_id: string
          stripe_object_type: string
          variance?: number | null
        }
        Update: {
          amount_internal?: number | null
          amount_stripe?: number
          created_at?: string
          id?: string
          internal_transaction_id?: string | null
          reconciled_at?: string | null
          reconciled_by?: string | null
          reconciliation_status?: string
          stripe_object_id?: string
          stripe_object_type?: string
          variance?: number | null
        }
        Relationships: []
      }
      stripe_subscriptions: {
        Row: {
          cancel_at_period_end: boolean | null
          canceled_at: string | null
          created_at: string | null
          current_period_end: string | null
          current_period_start: string | null
          id: string
          metadata: Json | null
          plan_amount: number | null
          plan_currency: string | null
          plan_id: string | null
          plan_interval: string | null
          plan_name: string | null
          quantity: number | null
          status: string
          stripe_customer_id: string
          stripe_subscription_id: string
          trial_end: string | null
          trial_start: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          cancel_at_period_end?: boolean | null
          canceled_at?: string | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          metadata?: Json | null
          plan_amount?: number | null
          plan_currency?: string | null
          plan_id?: string | null
          plan_interval?: string | null
          plan_name?: string | null
          quantity?: number | null
          status: string
          stripe_customer_id: string
          stripe_subscription_id: string
          trial_end?: string | null
          trial_start?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          cancel_at_period_end?: boolean | null
          canceled_at?: string | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          metadata?: Json | null
          plan_amount?: number | null
          plan_currency?: string | null
          plan_id?: string | null
          plan_interval?: string | null
          plan_name?: string | null
          quantity?: number | null
          status?: string
          stripe_customer_id?: string
          stripe_subscription_id?: string
          trial_end?: string | null
          trial_start?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      stripe_transfers: {
        Row: {
          amount: number
          created_at: string | null
          currency: string
          error_message: string | null
          event_id: string
          id: number
          payment_id: string
          payout_id: string | null
          processed_at: string
          retry_count: number | null
          status: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          currency: string
          error_message?: string | null
          event_id: string
          id?: never
          payment_id: string
          payout_id?: string | null
          processed_at: string
          retry_count?: number | null
          status: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          currency?: string
          error_message?: string | null
          event_id?: string
          id?: never
          payment_id?: string
          payout_id?: string | null
          processed_at?: string
          retry_count?: number | null
          status?: string
        }
        Relationships: []
      }
      stripe_webhook_events: {
        Row: {
          created_at: string | null
          event_data: Json
          event_id: string
          event_type: string
          id: string
          processed: boolean | null
          processed_at: string | null
          processing_error: string | null
        }
        Insert: {
          created_at?: string | null
          event_data: Json
          event_id: string
          event_type: string
          id?: string
          processed?: boolean | null
          processed_at?: string | null
          processing_error?: string | null
        }
        Update: {
          created_at?: string | null
          event_data?: Json
          event_id?: string
          event_type?: string
          id?: string
          processed?: boolean | null
          processed_at?: string | null
          processing_error?: string | null
        }
        Relationships: []
      }
      stripe_webhooks: {
        Row: {
          created_at: string | null
          data: Json
          event_type: string
          id: string
          processed: boolean | null
          processed_at: string | null
          stripe_event_id: string
        }
        Insert: {
          created_at?: string | null
          data: Json
          event_type: string
          id?: string
          processed?: boolean | null
          processed_at?: string | null
          stripe_event_id: string
        }
        Update: {
          created_at?: string | null
          data?: Json
          event_type?: string
          id?: string
          processed?: boolean | null
          processed_at?: string | null
          stripe_event_id?: string
        }
        Relationships: []
      }
      sync_logs: {
        Row: {
          created_at: string
          database_status: boolean
          id: string
          replit_status: boolean
          stripe_status: boolean
          sync_timestamp: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          database_status?: boolean
          id?: string
          replit_status?: boolean
          stripe_status?: boolean
          sync_timestamp?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          database_status?: boolean
          id?: string
          replit_status?: boolean
          stripe_status?: boolean
          sync_timestamp?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      transaction_audit_log: {
        Row: {
          amount: number
          audit_details: Json
          audited_at: string | null
          compliance_status: string
          created_at: string
          id: string
          status: string
          stripe_transaction_id: string | null
          transaction_id: string
          transaction_type: string
          user_email: string | null
        }
        Insert: {
          amount: number
          audit_details?: Json
          audited_at?: string | null
          compliance_status?: string
          created_at?: string
          id?: string
          status: string
          stripe_transaction_id?: string | null
          transaction_id: string
          transaction_type: string
          user_email?: string | null
        }
        Update: {
          amount?: number
          audit_details?: Json
          audited_at?: string | null
          compliance_status?: string
          created_at?: string
          id?: string
          status?: string
          stripe_transaction_id?: string | null
          transaction_id?: string
          transaction_type?: string
          user_email?: string | null
        }
        Relationships: []
      }
      transaction_logs: {
        Row: {
          amount: number
          block_number: number | null
          confirmed_at: string | null
          created_at: string | null
          currency: string
          gas_price: number | null
          gas_used: number | null
          id: string
          order_id: string | null
          status: string
          tx_hash: string
          tx_type: string
        }
        Insert: {
          amount: number
          block_number?: number | null
          confirmed_at?: string | null
          created_at?: string | null
          currency: string
          gas_price?: number | null
          gas_used?: number | null
          id?: string
          order_id?: string | null
          status?: string
          tx_hash: string
          tx_type: string
        }
        Update: {
          amount?: number
          block_number?: number | null
          confirmed_at?: string | null
          created_at?: string | null
          currency?: string
          gas_price?: number | null
          gas_used?: number | null
          id?: string
          order_id?: string | null
          status?: string
          tx_hash?: string
          tx_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "transaction_logs_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          amount: number
          description: string | null
          id: number
          status: string
          transaction_date: string | null
          user_id: string | null
        }
        Insert: {
          amount: number
          description?: string | null
          id?: never
          status: string
          transaction_date?: string | null
          user_id?: string | null
        }
        Update: {
          amount?: number
          description?: string | null
          id?: never
          status?: string
          transaction_date?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      transfer_attempts: {
        Row: {
          amount: number
          corrected_at: string | null
          corrected_transfer_id: string | null
          correction_error: string | null
          created_at: string | null
          currency: string
          description: string | null
          destination: string | null
          error_code: string | null
          error_message: string | null
          id: string
          metadata: Json | null
          retry_count: number | null
          status: string | null
          stripe_transfer_id: string | null
        }
        Insert: {
          amount: number
          corrected_at?: string | null
          corrected_transfer_id?: string | null
          correction_error?: string | null
          created_at?: string | null
          currency?: string
          description?: string | null
          destination?: string | null
          error_code?: string | null
          error_message?: string | null
          id?: string
          metadata?: Json | null
          retry_count?: number | null
          status?: string | null
          stripe_transfer_id?: string | null
        }
        Update: {
          amount?: number
          corrected_at?: string | null
          corrected_transfer_id?: string | null
          correction_error?: string | null
          created_at?: string | null
          currency?: string
          description?: string | null
          destination?: string | null
          error_code?: string | null
          error_message?: string | null
          id?: string
          metadata?: Json | null
          retry_count?: number | null
          status?: string | null
          stripe_transfer_id?: string | null
        }
        Relationships: []
      }
      transfer_destinations: {
        Row: {
          account_details: Json
          created_at: string | null
          id: string
          is_active: boolean | null
          is_verified: boolean | null
          platform: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          account_details: Json
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          is_verified?: boolean | null
          platform: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          account_details?: Json
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          is_verified?: boolean | null
          platform?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      transfer_verification_codes: {
        Row: {
          amount: number
          code: string
          created_at: string
          expires_at: string
          id: number
          status: string
          used_at: string | null
        }
        Insert: {
          amount: number
          code: string
          created_at?: string
          expires_at: string
          id?: never
          status?: string
          used_at?: string | null
        }
        Update: {
          amount?: number
          code?: string
          created_at?: string
          expires_at?: string
          id?: never
          status?: string
          used_at?: string | null
        }
        Relationships: []
      }
      transfers: {
        Row: {
          consolidated_at: string | null
          id: number
          status: string | null
          transfer_amount: number
        }
        Insert: {
          consolidated_at?: string | null
          id?: number
          status?: string | null
          transfer_amount: number
        }
        Update: {
          consolidated_at?: string | null
          id?: number
          status?: string | null
          transfer_amount?: number
        }
        Relationships: []
      }
      treasury_accounts: {
        Row: {
          account_name: string
          account_type: string
          available_balance: number
          bank_account_id: string | null
          created_at: string | null
          currency: string
          current_balance: number
          id: string
          is_active: boolean
          metadata: Json | null
          pending_balance: number
          stripe_account_id: string | null
          updated_at: string | null
        }
        Insert: {
          account_name: string
          account_type: string
          available_balance?: number
          bank_account_id?: string | null
          created_at?: string | null
          currency?: string
          current_balance?: number
          id?: string
          is_active?: boolean
          metadata?: Json | null
          pending_balance?: number
          stripe_account_id?: string | null
          updated_at?: string | null
        }
        Update: {
          account_name?: string
          account_type?: string
          available_balance?: number
          bank_account_id?: string | null
          created_at?: string | null
          currency?: string
          current_balance?: number
          id?: string
          is_active?: boolean
          metadata?: Json | null
          pending_balance?: number
          stripe_account_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      treasury_movements: {
        Row: {
          amount: number
          created_at: string | null
          currency: string
          description: string | null
          destination_id: string | null
          destination_type: string | null
          id: string
          metadata: Json | null
          movement_type: string
          processed_at: string | null
          reference_number: string
          source_id: string | null
          source_type: string
          status: string
          treasury_account_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          currency?: string
          description?: string | null
          destination_id?: string | null
          destination_type?: string | null
          id?: string
          metadata?: Json | null
          movement_type: string
          processed_at?: string | null
          reference_number: string
          source_id?: string | null
          source_type: string
          status?: string
          treasury_account_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          currency?: string
          description?: string | null
          destination_id?: string | null
          destination_type?: string | null
          id?: string
          metadata?: Json | null
          movement_type?: string
          processed_at?: string | null
          reference_number?: string
          source_id?: string | null
          source_type?: string
          status?: string
          treasury_account_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "treasury_movements_treasury_account_id_fkey"
            columns: ["treasury_account_id"]
            isOneToOne: false
            referencedRelation: "treasury_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      treasury_operations: {
        Row: {
          amount: number
          created_at: string | null
          currency: string
          description: string | null
          from_address: string | null
          id: string
          operation_type: string
          performed_by: string | null
          to_address: string | null
          tx_hash: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          currency: string
          description?: string | null
          from_address?: string | null
          id?: string
          operation_type: string
          performed_by?: string | null
          to_address?: string | null
          tx_hash?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          currency?: string
          description?: string | null
          from_address?: string | null
          id?: string
          operation_type?: string
          performed_by?: string | null
          to_address?: string | null
          tx_hash?: string | null
        }
        Relationships: []
      }
      treasury_transactions: {
        Row: {
          account_id: string
          amount: number
          current_balance: number
          description: string | null
          id: number
          timestamp: string | null
          transaction_type: string | null
        }
        Insert: {
          account_id: string
          amount: number
          current_balance: number
          description?: string | null
          id?: never
          timestamp?: string | null
          transaction_type?: string | null
        }
        Update: {
          account_id?: string
          amount?: number
          current_balance?: number
          description?: string | null
          id?: never
          timestamp?: string | null
          transaction_type?: string | null
        }
        Relationships: []
      }
      treasury_transfers: {
        Row: {
          amount: number
          created_at: string
          currency: string
          destination_account: string
          financial_account_id: string
          id: string
          metadata: Json | null
          status: string
          transfer_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency: string
          destination_account: string
          financial_account_id: string
          id?: string
          metadata?: Json | null
          status: string
          transfer_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          destination_account?: string
          financial_account_id?: string
          id?: string
          metadata?: Json | null
          status?: string
          transfer_id?: string
        }
        Relationships: []
      }
      unified_stripe_transactions: {
        Row: {
          amount: number
          created_at: string | null
          currency: string | null
          id: string
          metadata: Json | null
          net_amount: number | null
          processed_at: string | null
          reconciled: boolean | null
          reconciled_at: string | null
          source_id: string | null
          source_table: string | null
          status: string
          stripe_charge_id: string | null
          stripe_customer_id: string | null
          stripe_fee: number | null
          stripe_payment_intent_id: string | null
          transaction_type: string
          user_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          currency?: string | null
          id?: string
          metadata?: Json | null
          net_amount?: number | null
          processed_at?: string | null
          reconciled?: boolean | null
          reconciled_at?: string | null
          source_id?: string | null
          source_table?: string | null
          status?: string
          stripe_charge_id?: string | null
          stripe_customer_id?: string | null
          stripe_fee?: number | null
          stripe_payment_intent_id?: string | null
          transaction_type?: string
          user_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          currency?: string | null
          id?: string
          metadata?: Json | null
          net_amount?: number | null
          processed_at?: string | null
          reconciled?: boolean | null
          reconciled_at?: string | null
          source_id?: string | null
          source_table?: string | null
          status?: string
          stripe_charge_id?: string | null
          stripe_customer_id?: string | null
          stripe_fee?: number | null
          stripe_payment_intent_id?: string | null
          transaction_type?: string
          user_id?: string | null
        }
        Relationships: []
      }
      usd_transactions: {
        Row: {
          amount: number
          created_at: string | null
          currency: string | null
          direction: string
          external_account_id: string | null
          external_id: string
          id: number
          metadata: Json | null
          status: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          currency?: string | null
          direction: string
          external_account_id?: string | null
          external_id: string
          id?: never
          metadata?: Json | null
          status: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          currency?: string | null
          direction?: string
          external_account_id?: string | null
          external_id?: string
          id?: never
          metadata?: Json | null
          status?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_sessions: {
        Row: {
          created_at: string | null
          expires_at: string | null
          id: string
          ip_address: unknown | null
          last_activity: string | null
          session_token: string
          user_agent: string | null
          wallet_address: string | null
        }
        Insert: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          ip_address?: unknown | null
          last_activity?: string | null
          session_token: string
          user_agent?: string | null
          wallet_address?: string | null
        }
        Update: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          ip_address?: unknown | null
          last_activity?: string | null
          session_token?: string
          user_agent?: string | null
          wallet_address?: string | null
        }
        Relationships: []
      }
      vm_instances: {
        Row: {
          assigned_agent_id: string | null
          cost_per_hour: number | null
          cpu_usage: number | null
          created_at: string | null
          id: string
          instance_id: string
          instance_type: string
          memory_usage: number | null
          provider: string
          region: string
          started_at: string | null
          status: string | null
          stopped_at: string | null
          total_cost: number | null
        }
        Insert: {
          assigned_agent_id?: string | null
          cost_per_hour?: number | null
          cpu_usage?: number | null
          created_at?: string | null
          id?: string
          instance_id: string
          instance_type: string
          memory_usage?: number | null
          provider: string
          region: string
          started_at?: string | null
          status?: string | null
          stopped_at?: string | null
          total_cost?: number | null
        }
        Update: {
          assigned_agent_id?: string | null
          cost_per_hour?: number | null
          cpu_usage?: number | null
          created_at?: string | null
          id?: string
          instance_id?: string
          instance_type?: string
          memory_usage?: number | null
          provider?: string
          region?: string
          started_at?: string | null
          status?: string | null
          stopped_at?: string | null
          total_cost?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "vm_instances_assigned_agent_id_fkey"
            columns: ["assigned_agent_id"]
            isOneToOne: false
            referencedRelation: "autonomous_agents"
            referencedColumns: ["id"]
          },
        ]
      }
      vm_management: {
        Row: {
          cpu_utilization: number | null
          created_at: string | null
          hourly_cost: number
          id: string
          instance_id: string
          instance_type: string
          launch_time: string | null
          memory_utilization: number | null
          network_in: number | null
          network_out: number | null
          private_ip: string | null
          provider: string
          public_ip: string | null
          region: string
          status: string
          swarm_id: string | null
          termination_time: string | null
          total_cost: number | null
          updated_at: string | null
        }
        Insert: {
          cpu_utilization?: number | null
          created_at?: string | null
          hourly_cost: number
          id?: string
          instance_id: string
          instance_type: string
          launch_time?: string | null
          memory_utilization?: number | null
          network_in?: number | null
          network_out?: number | null
          private_ip?: string | null
          provider?: string
          public_ip?: string | null
          region: string
          status: string
          swarm_id?: string | null
          termination_time?: string | null
          total_cost?: number | null
          updated_at?: string | null
        }
        Update: {
          cpu_utilization?: number | null
          created_at?: string | null
          hourly_cost?: number
          id?: string
          instance_id?: string
          instance_type?: string
          launch_time?: string | null
          memory_utilization?: number | null
          network_in?: number | null
          network_out?: number | null
          private_ip?: string | null
          provider?: string
          public_ip?: string | null
          region?: string
          status?: string
          swarm_id?: string | null
          termination_time?: string | null
          total_cost?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vm_management_swarm_id_fkey"
            columns: ["swarm_id"]
            isOneToOne: false
            referencedRelation: "agent_swarms"
            referencedColumns: ["id"]
          },
        ]
      }
      vm_swarm_deployments: {
        Row: {
          cost_per_hour: number | null
          created_at: string | null
          deployment_config: Json | null
          id: string
          performance_metrics: Json | null
          status: string | null
          swarm_name: string
          total_cost: number | null
          updated_at: string | null
          user_id: string | null
          vm_count: number
          vm_instance_type: string
          vm_provider: string
        }
        Insert: {
          cost_per_hour?: number | null
          created_at?: string | null
          deployment_config?: Json | null
          id?: string
          performance_metrics?: Json | null
          status?: string | null
          swarm_name: string
          total_cost?: number | null
          updated_at?: string | null
          user_id?: string | null
          vm_count?: number
          vm_instance_type?: string
          vm_provider?: string
        }
        Update: {
          cost_per_hour?: number | null
          created_at?: string | null
          deployment_config?: Json | null
          id?: string
          performance_metrics?: Json | null
          status?: string | null
          swarm_name?: string
          total_cost?: number | null
          updated_at?: string | null
          user_id?: string | null
          vm_count?: number
          vm_instance_type?: string
          vm_provider?: string
        }
        Relationships: []
      }
      webhook_logs: {
        Row: {
          created_at: string | null
          id: string
          order_id: string | null
          payload: Json
          processed: boolean | null
          processed_at: string | null
          response_body: string | null
          response_status: number | null
          webhook_type: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          order_id?: string | null
          payload: Json
          processed?: boolean | null
          processed_at?: string | null
          response_body?: string | null
          response_status?: number | null
          webhook_type: string
        }
        Update: {
          created_at?: string | null
          id?: string
          order_id?: string | null
          payload?: Json
          processed?: boolean | null
          processed_at?: string | null
          response_body?: string | null
          response_status?: number | null
          webhook_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "webhook_logs_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      workflow_runs: {
        Row: {
          completed_at: string | null
          error_message: string | null
          execution_time_ms: number | null
          failed_fixes: number | null
          id: string
          metadata: Json | null
          started_at: string | null
          success_rate: number | null
          successful_fixes: number | null
          total_amount_recovered: number | null
          total_processed: number | null
          workflow_type: string
        }
        Insert: {
          completed_at?: string | null
          error_message?: string | null
          execution_time_ms?: number | null
          failed_fixes?: number | null
          id?: string
          metadata?: Json | null
          started_at?: string | null
          success_rate?: number | null
          successful_fixes?: number | null
          total_amount_recovered?: number | null
          total_processed?: number | null
          workflow_type: string
        }
        Update: {
          completed_at?: string | null
          error_message?: string | null
          execution_time_ms?: number | null
          failed_fixes?: number | null
          id?: string
          metadata?: Json | null
          started_at?: string | null
          success_rate?: number | null
          successful_fixes?: number | null
          total_amount_recovered?: number | null
          total_processed?: number | null
          workflow_type?: string
        }
        Relationships: []
      }
    }
    Views: {
      autonomous_revenue_dashboard: {
        Row: {
          active_sources: number | null
          active_workers: number | null
          dashboard_updated_at: string | null
          failed_tasks_24h: number | null
          pending_tasks: number | null
          processing_tasks: number | null
          revenue_24h: number | null
          revenue_7d: number | null
          success_rate_24h: number | null
          tasks_per_hour_per_worker: number | null
          total_revenue: number | null
        }
        Relationships: []
      }
      balance_movements: {
        Row: {
          amount: number | null
          created_at: string | null
          description: string | null
          destination: string | null
          direction: string | null
          metadata: Json | null
          source: string | null
          status: string | null
          transaction_date: string | null
          transaction_number: string | null
        }
        Relationships: []
      }
      order_analytics: {
        Row: {
          avg_order_size: number | null
          crypto_type: string | null
          date: string | null
          order_count: number | null
          status: string | null
          total_crypto: number | null
          total_fees: number | null
          total_usd: number | null
        }
        Relationships: []
      }
      recent_storage_transactions: {
        Row: {
          amount: number | null
          balance_after: number | null
          balance_before: number | null
          description: string | null
          destination: string | null
          id: number | null
          source: string | null
          transaction_date: string | null
          transaction_type: string | null
        }
        Relationships: []
      }
      revenue_analytics: {
        Row: {
          average_transaction: number | null
          daily_revenue: number | null
          days_active: number | null
          first_transaction: string | null
          last_transaction: string | null
          stream_id: string | null
          stream_name: string | null
          stream_type: string | null
          total_revenue: number | null
          transaction_count: number | null
        }
        Relationships: []
      }
      revenue_dashboard_summary: {
        Row: {
          active_streams: number | null
          completed_transfer_amount: number | null
          completed_transfers: number | null
          pending_transfer_amount: number | null
          pending_transfers: number | null
          revenue_24h: number | null
          total_revenue_generated: number | null
          total_revenue_transferred: number | null
          total_transactions: number | null
          transactions_24h: number | null
        }
        Relationships: []
      }
      storage_balance_by_location: {
        Row: {
          current_balance: number | null
          location: string | null
          total_deposits: number | null
          total_withdrawals: number | null
        }
        Relationships: []
      }
      storage_balance_info: {
        Row: {
          available_balance: number | null
          last_updated_at: string | null
          pending_transfers: number | null
          stripe_balance: number | null
          total_balance: number | null
        }
        Insert: {
          available_balance?: never
          last_updated_at?: string | null
          pending_transfers?: number | null
          stripe_balance?: number | null
          total_balance?: number | null
        }
        Update: {
          available_balance?: never
          last_updated_at?: string | null
          pending_transfers?: number | null
          stripe_balance?: number | null
          total_balance?: number | null
        }
        Relationships: []
      }
      storage_balance_summary: {
        Row: {
          balance_location: string | null
          last_transfer_date: string | null
          percentage_of_total: number | null
          total_amount: number | null
          transfer_count: number | null
        }
        Relationships: []
      }
      treasury_balance_history: {
        Row: {
          currency: string | null
          hour: string | null
          net_change: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      activate_storage_monetization: {
        Args:
          | Record<PropertyKey, never>
          | { initial_balance: number }
          | { initial_balance?: number }
        Returns: Json
      }
      add_funds_to_balance: {
        Args: { amount: number }
        Returns: Json
      }
      adjust_source_pricing: {
        Args: { p_adjustment_factor: number; p_source_name: string }
        Returns: boolean
      }
      allocate_agent_budget: {
        Args: { agent_id: string }
        Returns: Json
      }
      allocate_transaction_price: {
        Args: { p_allocation_method?: string; p_contract_id: string }
        Returns: Json
      }
      begin_transaction: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      calculate_daily_revenue_metrics: {
        Args: { p_date?: string }
        Returns: Json
      }
      calculate_storage_revenue: {
        Args: { p_date?: string; p_user_id: string }
        Returns: {
          bytes_used: number
          calculated_revenue: number
          currency: string
          gb_used: number
          price_per_gb: number
          tier_name: string
          user_id: string
        }[]
      }
      calculate_transfer_amount: {
        Args: { p_source_streams: Json }
        Returns: number
      }
      check_balance: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      check_edge_function_status: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      check_storage_balance_location: {
        Args: Record<PropertyKey, never>
        Returns: {
          amount: number
          last_transfer_date: string
          location: string
          transfer_reference: string
        }[]
      }
      check_stripe_integration_status: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      check_verification_code_status: {
        Args: { code: string }
        Returns: Json
      }
      claim_revenue_task: {
        Args: { p_worker_id: string; p_worker_type: string }
        Returns: Json
      }
      claim_revenue_tasks: {
        Args: {
          p_batch_size?: number
          p_worker_id: string
          p_worker_type: string
        }
        Returns: {
          completed_at: string | null
          created_at: string
          error_message: string | null
          id: string
          max_retries: number
          payload: Json
          priority: number
          result: Json | null
          retry_count: number
          started_at: string | null
          status: string
          task_type: string
          worker_id: string | null
        }[]
      }
      commit_transaction: {
        Args: { session_id: string }
        Returns: undefined
      }
      complete_revenue_recognition_and_transfer: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      complete_revenue_task: {
        Args: {
          p_error_message?: string
          p_result?: Json
          p_success: boolean
          p_task_id: string
          p_worker_id: string
        }
        Returns: Json
      }
      confirm_autonomous_revenue_transfer: {
        Args: { p_stripe_transfer_id: string; p_transfer_id: string }
        Returns: {
          amount: number
          error_message: string
          status: string
        }[]
      }
      consolidate_all_revenue: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      consolidate_all_revenues: {
        Args: Record<PropertyKey, never>
        Returns: {
          sources_processed: string[]
          total_consolidated_amount: number
        }[]
      }
      consolidate_all_revenues_with_storage: {
        Args: Record<PropertyKey, never>
        Returns: {
          sources_processed: string[]
          total_consolidated_amount: number
        }[]
      }
      consolidate_and_send_to_stripe: {
        Args:
          | {
              p_master_user_id: string
              p_period_end?: string
              p_period_start?: string
            }
          | { p_period_end?: string; p_period_start?: string }
        Returns: Json
      }
      consolidate_failed_transactions: {
        Args: Record<PropertyKey, never>
        Returns: {
          failed_sources: string[]
          total_failed_amount: number
        }[]
      }
      consolidate_usd_balances: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      create_revenue_recognition_entries: {
        Args: {
          p_amount: number
          p_cash_account_id?: string
          p_description?: string
          p_reference?: string
          p_revenue_account_id?: string
          p_transaction_id: string
        }
        Returns: string
      }
      create_revenue_transfer: {
        Args: { p_source_streams: Json }
        Returns: string
      }
      create_revenue_transfer_job: {
        Args: { p_frequency?: string }
        Returns: Json
      }
      create_secure_transfer: {
        Args: { p_amount: number; p_currency?: string; p_destination: string }
        Returns: string
      }
      create_storage_billing_cron: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      create_transfer_batch: {
        Args: { p_batch_size?: number; p_max_amount?: number }
        Returns: string
      }
      daily_revenue_consolidation: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      daily_volume: {
        Args: { date_param?: string }
        Returns: {
          completed_orders: number
          completed_volume_usd: number
          total_fees: number
          total_orders: number
          total_volume_usd: number
        }[]
      }
      decrement_worker_count: {
        Args: { p_worker_type: string }
        Returns: boolean
      }
      execute_resend_transfers: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      execute_verified_stripe_transfer: {
        Args: {
          amount: number
          force_recognition?: boolean
          verification_code: string
        }
        Returns: Json
      }
      expire_old_orders: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      generate_autonomous_revenue: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      generate_balance_sheet_export: {
        Args: { p_end_date?: string; p_start_date?: string }
        Returns: {
          account_code: string
          account_name: string
          balance_after: number
          credit_amount: number
          debit_amount: number
          description: string
          reference: string
          transaction_date: string
        }[]
      }
      generate_new_campaigns: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      generate_revenue_for_active_streams: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      generate_revenue_for_stream: {
        Args: { p_stream_id: string }
        Returns: number
      }
      generate_revenue_report: {
        Args:
          | { p_end_date: string; p_report_type?: string; p_start_date: string }
          | { p_end_date: string; p_start_date: string }
        Returns: Json
      }
      generate_revenue_tasks: {
        Args: { p_batch_size?: number }
        Returns: Json
      }
      generate_test_revenue: {
        Args: { p_amount: number; p_count?: number; p_user_id: string }
        Returns: Json
      }
      generate_transfer_verification_code: {
        Args: { transfer_amount: number }
        Returns: string
      }
      get_autonomous_revenue_stats: {
        Args: Record<PropertyKey, never> | { p_time_period?: string }
        Returns: {
          active_streams: number
          avg_transaction_amount: number
          inactive_streams: number
          top_strategy: string
          top_strategy_revenue: number
          total_revenue: number
          total_transactions: number
        }[]
      }
      get_available_balance: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      get_balance_summary: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_balance_tracking: {
        Args: { end_date?: string; start_date?: string }
        Returns: {
          current_application_balance: number
          current_stripe_balance: number
          movements: Json
        }[]
      }
      get_failed_transfers_for_fix: {
        Args: Record<PropertyKey, never>
        Returns: {
          amount: number
          created_at: string
          currency: string
          description: string
          destination: string
          error_code: string
          error_message: string
          metadata: Json
          retry_count: number
          stripe_transfer_id: string
          transfer_id: string
        }[]
      }
      get_revenue_by_day: {
        Args: { end_date: string; start_date: string }
        Returns: {
          amount: number
          date: string
        }[]
      }
      get_revenue_stats: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_revenue_summary_by_strategy: {
        Args: { p_end_date?: string; p_start_date?: string }
        Returns: {
          avg_amount: number
          pending_transfer_amount: number
          pending_transfer_count: number
          strategy: string
          total_amount: number
          transaction_count: number
          transferred_amount: number
          transferred_count: number
        }[]
      }
      get_storage_usage_and_balance: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_total_revenue: {
        Args: { end_date: string; start_date: string }
        Returns: {
          total_revenue: number
        }[]
      }
      get_transfer_stats: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_treasury_summary: {
        Args: Record<PropertyKey, never>
        Returns: {
          available_balance: number
          pending_balance: number
          profit_optimization_score: number
          total_balance: number
          total_transfers_today: number
        }[]
      }
      get_valid_stripe_transfer_status: {
        Args: Record<PropertyKey, never>
        Returns: {
          status_value: string
        }[]
      }
      increment_worker_count: {
        Args: { p_worker_type: string }
        Returns: boolean
      }
      initialize_autonomous_revenue_system: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      initiate_balance_transfer: {
        Args: { transfer_amount: number }
        Returns: Json
      }
      initiate_bank_transfer: {
        Args: {
          p_amount: number
          p_bank_account_id: string
          p_transfer_type?: string
        }
        Returns: string
      }
      inspect_stripe_transfers_table: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      launch_new_agents: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      log_revenue_transfer: {
        Args: {
          p_amount: number
          p_description?: string
          p_metadata?: Json
          p_source: string
          p_source_user_id: string
        }
        Returns: string
      }
      log_transaction: {
        Args: {
          p_amount: number
          p_description: string
          p_status: string
          p_user_id: string
        }
        Returns: undefined
      }
      mark_transfer_corrected: {
        Args: {
          corrected_destination: string
          new_stripe_id: string
          original_id: string
        }
        Returns: boolean
      }
      monetize_application_balance: {
        Args: Record<PropertyKey, never>
        Returns: {
          new_stripe_balance: number
          user_id: string
        }[]
      }
      monitor_revenue_system: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      optimize_autonomous_revenue_streams: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      optimize_campaign_bidding: {
        Args: { campaign_id: string; max_adjustment_percent?: number }
        Returns: Json
      }
      optimize_campaign_revenue: {
        Args: {
          p_campaign_id: string
          p_lookback_days?: number
          p_optimization_target?: string
        }
        Returns: Json
      }
      optimize_campaigns: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      optimize_revenue_system: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      optimize_revenue_transfers: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      optimize_underperforming_streams: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      parallel_revenue_processor: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      process_application_balance_transfer: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      process_autonomous_revenue_transfers: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      process_cash_out_request: {
        Args: { request_id: string }
        Returns: Json
      }
      process_failed_transfers_and_payouts: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      process_revenue_recognition_and_transfer: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      process_revenue_transfer_with_recognition: {
        Args: {
          p_batch_size?: number
          p_end_date?: string
          p_start_date?: string
        }
        Returns: Json
      }
      process_storage_billing: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      reconcile_balance_transfers: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      reconcile_transaction: {
        Args: { p_external_id: string; p_status?: string }
        Returns: boolean
      }
      record_and_send_to_stripe: {
        Args: {
          p_amount: number
          p_currency?: string
          p_description: string
          p_metadata?: Json
          p_user_id: string
        }
        Returns: Json
      }
      record_storage_balance_movement: {
        Args: {
          p_amount: number
          p_description?: string
          p_destination_location: string
          p_metadata?: Json
          p_movement_type: string
          p_reference_id?: string
          p_source_location: string
        }
        Returns: string
      }
      record_storage_transaction: {
        Args: {
          p_amount: number
          p_description?: string
          p_destination?: string
          p_metadata?: Json
          p_reference_id?: string
          p_source?: string
          p_transaction_type: string
        }
        Returns: number
      }
      request_stripe_instant_transfer: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      request_stripe_transfer_verification: {
        Args: { amount: number }
        Returns: Json
      }
      resend_failed_transfers: {
        Args: Record<PropertyKey, never>
        Returns: {
          amount: number
          id: number
          payment_id: string
          processed_at: string
          retry_count: number
          status: string
        }[]
      }
      reset_storage_balance: {
        Args: { transferred_amount: number }
        Returns: undefined
      }
      rollback_transaction: {
        Args: { session_id: string }
        Returns: undefined
      }
      run_autonomous_monetization_engine: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      run_autonomous_revenue_scheduler: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      scale_revenue_workers: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      scale_vm_resources: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      schedule_balance_transfer_reconciliation: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      scheduled_revenue_transfer: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      setup_autonomous_revenue_stripe: {
        Args: {
          p_auto_transfer?: boolean
          p_bank_account_id: string
          p_stripe_account_id: string
          p_stripe_api_key: string
          p_transfer_frequency?: string
          p_transfer_threshold?: number
        }
        Returns: string
      }
      setup_revenue_transfer_schedule: {
        Args: { p_frequency?: string }
        Returns: string
      }
      setup_stripe_integration: {
        Args:
          | {
              p_account_id: string
              p_api_key: string
              p_auto_transfer?: boolean
              p_minimum_transfer_amount?: number
              p_transfer_frequency?: string
              p_webhook_secret?: string
            }
          | {
              p_auto_transfer?: boolean
              p_minimum_transfer_amount?: number
              p_transfer_frequency?: string
            }
        Returns: Json
      }
      simulate_autonomous_revenue: {
        Args: { p_days?: number; p_intensity?: string }
        Returns: {
          agent_id: string
          agent_name: string
          campaign_id: string
          campaign_name: string
          day_number: number
          profit: number
          revenue: number
          roi: number
          spend: number
        }[]
      }
      start_autonomous_revenue_stream: {
        Args: { p_name: string; p_settings?: Json; p_strategy: string }
        Returns: string
      }
      start_immediate_revenue_process: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      stop_autonomous_revenue_stream: {
        Args: { p_stream_id: string }
        Returns: boolean
      }
      sync_stripe_revenue: {
        Args: {
          p_amount: number
          p_currency?: string
          p_customer_id?: string
          p_stripe_payment_intent_id: string
        }
        Returns: string
      }
      track_optimization: {
        Args: {
          p_new_value: Json
          p_optimization_type: string
          p_previous_value: Json
          p_stream_id: string
        }
        Returns: string
      }
      track_storage_balance: {
        Args: Record<PropertyKey, never>
        Returns: {
          amount: number
          balance_location: string
          description: string
          status: string
          transfer_date: string
          transfer_number: string
        }[]
      }
      transfer_autonomous_revenue_to_stripe: {
        Args: { p_stripe_account_id: string }
        Returns: {
          error_message: string
          status: string
          total_transferred: number
          transaction_count: number
        }[]
      }
      transfer_revenue: {
        Args: {
          p_amount: number
          p_description?: string
          p_destination_user_id: string
          p_source_user_id: string
        }
        Returns: string
      }
      transfer_revenue_to_stripe: {
        Args: Record<PropertyKey, never> | { p_amount?: number }
        Returns: Json
      }
      transfer_specific_amount: {
        Args: { amount: number }
        Returns: Json
      }
      transfer_to_stripe: {
        Args:
          | {
              p_amount: number
              p_currency?: string
              p_destination_account?: string
            }
          | { transfer_amount: number }
        Returns: boolean
      }
      trigger_immediate_revenue_consolidation: {
        Args: { p_days_back?: number }
        Returns: Json
      }
      trigger_revenue_transfer: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      trigger_stripe_instant_transfer: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      trigger_stripe_transfer: {
        Args: Record<PropertyKey, never>
        Returns: {
          balance_id: number
          error_message: string
          transfer_amount: number
          transfer_status: string
        }[]
      }
      update_application_balance: {
        Args: Record<PropertyKey, never> | { new_balance: number }
        Returns: Json
      }
      update_application_balance_after_transfer: {
        Args: { transfer_amount: number }
        Returns: Json
      }
      update_dashboard_cache: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      update_pending_transfers: {
        Args: { amount_to_add: number }
        Returns: Json
      }
      update_revenue_stream_metrics: {
        Args: { p_amount: number; p_stream_id: string }
        Returns: undefined
      }
      update_revenue_transfer_schedule: {
        Args: { p_frequency?: string }
        Returns: Json
      }
      update_stripe_credentials: {
        Args: {
          p_account_id: string
          p_api_key: string
          p_auto_transfer?: boolean
          p_minimum_transfer_amount?: number
          p_transfer_frequency?: string
          p_webhook_secret: string
        }
        Returns: Json
      }
      update_user_wallet: {
        Args: { p_amount: number; p_user_id: string }
        Returns: Json
      }
      update_wallet_balance: {
        Args: { amount: number; wallet_id: string }
        Returns: number
      }
      update_wallet_balance_v2: {
        Args: { amount: number; wallet_id: string }
        Returns: number
      }
      upsert_stripe_destination: {
        Args: {
          p_account_id: string
          p_account_type?: string
          p_currency?: string
          p_is_active?: boolean
        }
        Returns: {
          destination_account_id: string
          destination_created_at: string
          destination_id: string
          destination_is_active: boolean
          destination_updated_at: string
        }[]
      }
      user_has_financial_access: {
        Args: { user_id: string }
        Returns: boolean
      }
      verify_transfer: {
        Args: { p_transfer_id: string }
        Returns: {
          amount: number
          destination: string
          error_message: string
          transfer_status: string
        }[]
      }
      withdraw_funds_to_bank: {
        Args: { p_amount: number; p_description?: string }
        Returns: Json
      }
      your_function: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
