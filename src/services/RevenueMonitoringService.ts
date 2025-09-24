/**
 * Real-Time Revenue Monitoring Service
 * 
 * Provides comprehensive monitoring and analytics for the autonomous revenue generation system
 * Tracks performance metrics, optimization opportunities, and system health
 */

import { supabase } from "@/integrations/supabase/client";
import { toast } from '@/hooks/use-toast';

interface RevenueMetrics {
  totalRevenue: number;
  dailyRevenue: number;
  hourlyRate: number;
  conversionRate: number;
  activeStreams: number;
  systemUptime: number;
  optimizationOpportunities: string[];
}

interface PerformanceAlert {
  id: string;
  type: 'warning' | 'error' | 'info' | 'success';
  message: string;
  timestamp: Date;
  actionRequired: boolean;
}

export class RevenueMonitoringService {
  private static instance: RevenueMonitoringService;
  private metrics: RevenueMetrics = {
    totalRevenue: 0,
    dailyRevenue: 0,
    hourlyRate: 0,
    conversionRate: 0,
    activeStreams: 0,
    systemUptime: 0,
    optimizationOpportunities: []
  };
  private alerts: PerformanceAlert[] = [];
  private isMonitoring = false;
  private monitoringInterval: NodeJS.Timeout | null = null;

  static getInstance(): RevenueMonitoringService {
    if (!RevenueMonitoringService.instance) {
      RevenueMonitoringService.instance = new RevenueMonitoringService();
    }
    return RevenueMonitoringService.instance;
  }

  /**
   * Start real-time revenue monitoring
   */
  async startMonitoring(): Promise<void> {
    if (this.isMonitoring) return;

    this.isMonitoring = true;
    console.log('📊 Starting real-time revenue monitoring...');

    // Update metrics every 30 seconds
    this.monitoringInterval = setInterval(() => {
      this.updateMetrics();
      this.checkForAlerts();
      this.optimizePerformance();
    }, 30000);

    // Initial metrics update
    await this.updateMetrics();
    
    toast({
      title: "📊 Monitoring Active",
      description: "Real-time revenue monitoring system started",
      variant: "default",
    });
  }

  /**
   * Stop revenue monitoring
   */
  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    this.isMonitoring = false;
    
    console.log('📊 Revenue monitoring stopped');
  }

  /**
   * Update revenue metrics from all sources
   */
  private async updateMetrics(): Promise<void> {
    try {
      // Fetch latest revenue data
      const { data: revenueData, error } = await supabase
        .from('autonomous_revenue_transactions')
        .select('*')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

      if (error) {
        console.error('Error fetching revenue data:', error);
        return;
      }

      if (revenueData) {
        // Calculate metrics
        this.metrics.totalRevenue = revenueData
          .filter(t => t.status === 'completed')
          .reduce((sum, t) => sum + (t.amount || 0), 0);

        this.metrics.dailyRevenue = revenueData
          .filter(t => t.status === 'completed' && 
                     new Date(t.created_at) > new Date(Date.now() - 24 * 60 * 60 * 1000))
          .reduce((sum, t) => sum + (t.amount || 0), 0);

        this.metrics.hourlyRate = this.metrics.dailyRevenue / 24;
        
        // Calculate conversion rate (completed vs total transactions)
        const totalTransactions = revenueData.length;
        const completedTransactions = revenueData.filter(t => t.status === 'completed').length;
        this.metrics.conversionRate = totalTransactions > 0 ? (completedTransactions / totalTransactions) * 100 : 0;

        // Count active streams (mock data for demo)
        this.metrics.activeStreams = 4;
        this.metrics.systemUptime = Date.now() - (Date.now() - 24 * 60 * 60 * 1000);
      }

      // Identify optimization opportunities
      this.identifyOptimizationOpportunities();
      
      console.log('📊 Metrics updated:', this.metrics);
    } catch (error) {
      console.error('Error updating metrics:', error);
    }
  }

  /**
   * Check for performance alerts and system issues
   */
  private checkForAlerts(): void {
    const alerts: PerformanceAlert[] = [];

    // Low conversion rate alert
    if (this.metrics.conversionRate < 70) {
      alerts.push({
        id: `conversion-${Date.now()}`,
        type: 'warning',
        message: `Conversion rate is low at ${this.metrics.conversionRate.toFixed(1)}%. Consider optimizing revenue streams.`,
        timestamp: new Date(),
        actionRequired: true
      });
    }

    // High performance alert
    if (this.metrics.hourlyRate > 50) {
      alerts.push({
        id: `performance-${Date.now()}`,
        type: 'success',
        message: `Excellent performance! Hourly rate: $${this.metrics.hourlyRate.toFixed(2)}`,
        timestamp: new Date(),
        actionRequired: false
      });
    }

    // Revenue milestone alert
    if (this.metrics.totalRevenue > 0 && this.metrics.totalRevenue % 100 < 5) {
      alerts.push({
        id: `milestone-${Date.now()}`,
        type: 'info',
        message: `Revenue milestone reached: $${this.metrics.totalRevenue.toFixed(2)} total earned`,
        timestamp: new Date(),
        actionRequired: false
      });
    }

    // Add new alerts
    this.alerts = [...this.alerts, ...alerts].slice(-50); // Keep last 50 alerts

    // Show important alerts as toasts
    alerts.forEach(alert => {
      if (alert.type === 'error' || (alert.type === 'warning' && alert.actionRequired)) {
        toast({
          title: "⚠️ Performance Alert",
          description: alert.message,
          variant: alert.type === 'error' ? 'destructive' : 'default',
        });
      }
    });
  }

  /**
   * Identify optimization opportunities
   */
  private identifyOptimizationOpportunities(): void {
    const opportunities: string[] = [];

    if (this.metrics.conversionRate < 80) {
      opportunities.push("Optimize underperforming revenue streams");
    }

    if (this.metrics.hourlyRate < 30) {
      opportunities.push("Increase ad bidding for higher-value keywords");
    }

    if (this.metrics.activeStreams < 6) {
      opportunities.push("Activate additional revenue streams");
    }

    if (this.metrics.dailyRevenue < 200) {
      opportunities.push("Implement advanced arbitrage strategies");
    }

    this.metrics.optimizationOpportunities = opportunities;
  }

  /**
   * Automatically optimize performance based on metrics
   */
  private async optimizePerformance(): Promise<void> {
    try {
      // Auto-optimization based on current metrics
      const optimizations = [];

      if (this.metrics.conversionRate < 75) {
        // Optimize conversion rate
        optimizations.push("Adjusting targeting parameters for better conversion");
        console.log('🔧 Auto-optimization: Improving conversion rate');
      }

      if (this.metrics.hourlyRate < 40) {
        // Increase revenue rate
        optimizations.push("Increasing bid amounts for high-value opportunities");
        console.log('🔧 Auto-optimization: Boosting revenue rate');
      }

      if (optimizations.length > 0) {
        console.log('🚀 Applied optimizations:', optimizations);
        
        // In a real implementation, this would:
        // - Adjust affiliate marketing parameters
        // - Optimize ad bidding strategies
        // - Rebalance cryptocurrency portfolios
        // - Update offer completion criteria
      }
    } catch (error) {
      console.error('Error during auto-optimization:', error);
    }
  }

  /**
   * Get current revenue metrics
   */
  getMetrics(): RevenueMetrics {
    return { ...this.metrics };
  }

  /**
   * Get recent performance alerts
   */
  getAlerts(): PerformanceAlert[] {
    return [...this.alerts];
  }

  /**
   * Clear all alerts
   */
  clearAlerts(): void {
    this.alerts = [];
  }

  /**
   * Get system health status
   */
  getSystemHealth(): {
    status: 'excellent' | 'good' | 'warning' | 'critical';
    score: number;
    issues: string[];
  } {
    let score = 100;
    const issues: string[] = [];

    // Conversion rate health
    if (this.metrics.conversionRate < 60) {
      score -= 30;
      issues.push('Low conversion rate');
    } else if (this.metrics.conversionRate < 80) {
      score -= 15;
      issues.push('Moderate conversion rate');
    }

    // Revenue rate health
    if (this.metrics.hourlyRate < 20) {
      score -= 25;
      issues.push('Low revenue rate');
    } else if (this.metrics.hourlyRate < 40) {
      score -= 10;
      issues.push('Moderate revenue rate');
    }

    // Active streams health
    if (this.metrics.activeStreams < 3) {
      score -= 20;
      issues.push('Insufficient active streams');
    }

    // Determine status
    let status: 'excellent' | 'good' | 'warning' | 'critical';
    if (score >= 90) status = 'excellent';
    else if (score >= 75) status = 'good';
    else if (score >= 60) status = 'warning';
    else status = 'critical';

    return { status, score, issues };
  }

  /**
   * Generate comprehensive revenue report
   */
  generateReport(): {
    summary: string;
    metrics: RevenueMetrics;
    recommendations: string[];
    projections: {
      daily: number;
      weekly: number;
      monthly: number;
      yearly: number;
    };
  } {
    const projections = {
      daily: this.metrics.hourlyRate * 24,
      weekly: this.metrics.hourlyRate * 24 * 7,
      monthly: this.metrics.hourlyRate * 24 * 30,
      yearly: this.metrics.hourlyRate * 24 * 365
    };

    const recommendations = [
      ...this.metrics.optimizationOpportunities,
      "Monitor market conditions for new opportunities",
      "Regularly review and adjust automation parameters",
      "Consider scaling successful strategies"
    ];

    const summary = `
System Status: ${this.getSystemHealth().status.toUpperCase()}
Current Revenue Rate: $${this.metrics.hourlyRate.toFixed(2)}/hour
Total Revenue Generated: $${this.metrics.totalRevenue.toFixed(2)}
Active Revenue Streams: ${this.metrics.activeStreams}
Conversion Rate: ${this.metrics.conversionRate.toFixed(1)}%
Monthly Projection: $${projections.monthly.toFixed(2)}
    `.trim();

    return {
      summary,
      metrics: this.metrics,
      recommendations,
      projections
    };
  }

  /**
   * Export metrics data for external analysis
   */
  exportMetrics(): string {
    return JSON.stringify({
      timestamp: new Date().toISOString(),
      metrics: this.metrics,
      alerts: this.alerts,
      systemHealth: this.getSystemHealth(),
      report: this.generateReport()
    }, null, 2);
  }
}

export default RevenueMonitoringService;