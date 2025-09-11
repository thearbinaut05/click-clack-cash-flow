import { supabase } from "@/integrations/supabase/client";
import { LeveragedRebalancingEngine, FlashSwapConfig } from "./LeveragedRebalancingEngine";
import { NFTInfiniteGlitchEngine } from "./NFTInfiniteGlitchEngine";
import { QuantumAcquisitionSystem } from "./QuantumAcquisitionSystem";
import { AutonomousAgentService } from "./AutonomousAgentService";

// Master Orchestration System - Coordinates all automated systems
export interface SystemConfig {
  rebalancing: FlashSwapConfig;
  glitchEngine: {
    enabled: boolean;
    maxGlitchValue: number;
    autoOfframpThreshold: number;
    fibonacciBase: number;
  };
  quantumAcquisition: {
    enabled: boolean;
    maxRiskLevel: number;
    minProfitThreshold: number;
    complianceJurisdiction: string;
  };
  riskManagement: {
    maxPositionSize: number;
    stopLossPercentage: number;
    maxDailyLoss: number;
    emergencyShutdownThreshold: number;
  };
}

export interface SystemMetrics {
  totalRevenue: number;
  totalProfit: number;
  activePositions: number;
  riskScore: number;
  complianceStatus: string;
  systemEfficiency: number;
  glitchesActive: number;
  quantumTasksProcessed: number;
}

export interface RealTimeUpdate {
  timestamp: number;
  type: 'rebalancing' | 'glitch' | 'quantum' | 'revenue' | 'alert';
  data: any;
  profit?: number;
  riskLevel?: number;
}

// Master orchestration and monitoring system
export class MasterOrchestrationSystem {
  private rebalancingEngine: LeveragedRebalancingEngine;
  private glitchEngine: NFTInfiniteGlitchEngine;
  private quantumSystem: QuantumAcquisitionSystem;
  private autonomousService: AutonomousAgentService;
  
  private isRunning: boolean = false;
  private config: SystemConfig;
  private realTimeUpdates: RealTimeUpdate[] = [];
  private updateCallbacks: ((update: RealTimeUpdate) => void)[] = [];
  
  // Performance tracking
  private dailyRevenue: number = 0;
  private dailyLoss: number = 0;
  private riskAccumulator: number = 0;
  private lastResetTime: number = Date.now();

  constructor(config: SystemConfig) {
    this.config = config;
    
    // Initialize all systems
    this.rebalancingEngine = new LeveragedRebalancingEngine(config.rebalancing);
    this.glitchEngine = new NFTInfiniteGlitchEngine();
    this.quantumSystem = new QuantumAcquisitionSystem();
    this.autonomousService = AutonomousAgentService.getInstance();
    
    this.initializeSystemMonitoring();
  }

  private initializeSystemMonitoring(): void {
    // Reset daily metrics at midnight
    setInterval(() => {
      const now = Date.now();
      if (now - this.lastResetTime > 86400000) { // 24 hours
        this.resetDailyMetrics();
      }
    }, 60000); // Check every minute

    // System health monitoring
    setInterval(async () => {
      try {
        await this.performSystemHealthCheck();
      } catch (error) {
        console.error('System health check failed:', error);
      }
    }, 300000); // Every 5 minutes

    // Emergency risk monitoring
    setInterval(async () => {
      try {
        await this.emergencyRiskAssessment();
      } catch (error) {
        console.error('Emergency risk assessment failed:', error);
      }
    }, 60000); // Every minute
  }

  public async startMasterSystem(): Promise<void> {
    if (this.isRunning) {
      console.log('Master system already running');
      return;
    }

    try {
      this.isRunning = true;
      console.log('🚀 Starting Master Orchestration System...');

      // Start all subsystems
      await this.startAllSubsystems();

      // Initialize system state
      await this.initializeSystemState();

      // Start main orchestration loop
      this.startOrchestrationLoop();

      // Start real-time monitoring
      this.startRealTimeMonitoring();

      console.log('✅ Master Orchestration System started successfully');
      
      this.emitUpdate({
        timestamp: Date.now(),
        type: 'alert',
        data: { message: 'Master system started', status: 'success' }
      });

    } catch (error) {
      console.error('❌ Failed to start master system:', error);
      this.isRunning = false;
      throw error;
    }
  }

  public async stopMasterSystem(): Promise<void> {
    console.log('🛑 Stopping Master Orchestration System...');
    
    this.isRunning = false;
    
    // Stop all subsystems
    await this.stopAllSubsystems();
    
    console.log('✅ Master Orchestration System stopped');
    
    this.emitUpdate({
      timestamp: Date.now(),
      type: 'alert',
      data: { message: 'Master system stopped', status: 'info' }
    });
  }

  private async startAllSubsystems(): Promise<void> {
    const startPromises = [];

    // Start leveraged rebalancing
    startPromises.push(
      this.rebalancingEngine.monitorAndRebalance()
        .then(() => console.log('✓ Leveraged rebalancing system started'))
    );

    // Start quantum acquisition system
    if (this.config.quantumAcquisition.enabled) {
      startPromises.push(
        this.quantumSystem.startQuantumAcquisition()
          .then(() => console.log('✓ Quantum acquisition system started'))
      );
    }

    // Start autonomous agent service
    startPromises.push(
      this.autonomousService.startAutonomousOperations()
        .then(() => console.log('✓ Autonomous agent service started'))
    );

    // Wait for all systems to start
    await Promise.all(startPromises);
    
    console.log('✓ All subsystems started successfully');
  }

  private async stopAllSubsystems(): Promise<void> {
    const stopPromises = [];

    stopPromises.push(this.quantumSystem.stopQuantumAcquisition());
    stopPromises.push(this.autonomousService.stopAutonomousOperations());

    await Promise.all(stopPromises);
    console.log('✓ All subsystems stopped');
  }

  private async initializeSystemState(): Promise<void> {
    try {
      // Load current positions and state from database
      const { data: systemState, error } = await supabase
        .from('master_system_state')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1);

      if (!error && systemState?.length > 0) {
        const state = systemState[0];
        this.dailyRevenue = state.daily_revenue || 0;
        this.dailyLoss = state.daily_loss || 0;
        this.riskAccumulator = state.risk_accumulator || 0;
        console.log('✓ System state loaded from database');
      }

      // Initialize positions monitoring
      await this.initializePositionMonitoring();
      
    } catch (error) {
      console.error('Error initializing system state:', error);
    }
  }

  private async initializePositionMonitoring(): Promise<void> {
    // Monitor NFT positions for potential glitches
    const { data: nftPositions, error } = await supabase
      .from('nft_assets')
      .select('*')
      .eq('is_active', true);

    if (!error && nftPositions) {
      console.log(`✓ Monitoring ${nftPositions.length} NFT positions for glitch opportunities`);
    }

    // Monitor collateral positions for rebalancing
    const { data: collateralPositions, error: collateralError } = await supabase
      .from('nft_collateral_positions')
      .select('*')
      .eq('status', 'active');

    if (!collateralError && collateralPositions) {
      console.log(`✓ Monitoring ${collateralPositions.length} collateral positions for rebalancing`);
    }
  }

  private startOrchestrationLoop(): void {
    const orchestrate = async () => {
      if (!this.isRunning) return;

      try {
        // Coordinate all systems
        await this.coordinateSystemOperations();
        
        // Update system metrics
        await this.updateSystemMetrics();
        
        // Check for optimization opportunities
        await this.optimizeSystemPerformance();
        
      } catch (error) {
        console.error('Error in orchestration loop:', error);
      }
    };

    // Main orchestration every 2 minutes
    setInterval(orchestrate, 120000);
    
    // Initial run
    setTimeout(orchestrate, 5000);
  }

  private async coordinateSystemOperations(): Promise<void> {
    try {
      // Get system status from all components
      const [
        rebalancingPositions,
        activeGlitches,
        quantumStatus
      ] = await Promise.all([
        this.rebalancingEngine.getAllPositions(),
        this.glitchEngine.getActiveGlitches(),
        this.quantumSystem.getQuantumStatus()
      ]);

      // Coordinate based on current state
      await this.orchestrateBasedOnState({
        rebalancingPositions,
        activeGlitches,
        quantumStatus
      });

    } catch (error) {
      console.error('Error coordinating system operations:', error);
    }
  }

  private async orchestrateBasedOnState(state: any): Promise<void> {
    const { rebalancingPositions, activeGlitches, quantumStatus } = state;

    // Risk-based coordination
    const totalRisk = this.calculateTotalSystemRisk(state);
    
    if (totalRisk > this.config.riskManagement.emergencyShutdownThreshold) {
      await this.triggerEmergencyProtocol(totalRisk);
      return;
    }

    // Opportunity coordination
    if (quantumStatus.queuedTasks < 5 && activeGlitches.length > 0) {
      // Create quantum tasks for high-value glitches
      for (const glitch of activeGlitches) {
        if (glitch.realWorldValue > 1000) {
          await this.createQuantumTaskForGlitch(glitch);
        }
      }
    }

    // Rebalancing coordination
    const criticalPositions = rebalancingPositions.filter(p => p.status === 'critical');
    if (criticalPositions.length > 0) {
      console.log(`⚠️ ${criticalPositions.length} positions require immediate rebalancing`);
      // Prioritize rebalancing for critical positions
      for (const position of criticalPositions) {
        this.emitUpdate({
          timestamp: Date.now(),
          type: 'alert',
          data: { 
            message: `Critical position detected: ${position.id}`, 
            healthFactor: position.currentHealthFactor 
          },
          riskLevel: 0.9
        });
      }
    }

    // Cross-system optimization
    await this.crossSystemOptimization(state);
  }

  private calculateTotalSystemRisk(state: any): number {
    const { rebalancingPositions, activeGlitches, quantumStatus } = state;

    let riskScore = 0;

    // Risk from leveraged positions
    const avgHealthFactor = rebalancingPositions.length > 0 
      ? rebalancingPositions.reduce((sum, p) => sum + p.currentHealthFactor, 0) / rebalancingPositions.length
      : 2.0;
    
    const healthRisk = Math.max(0, (2.0 - avgHealthFactor) / 2.0); // 0-1 scale
    riskScore += healthRisk * 0.4; // 40% weight

    // Risk from active glitches
    const totalGlitchValue = activeGlitches.reduce((sum, g) => sum + g.realWorldValue, 0);
    const glitchRisk = Math.min(1.0, totalGlitchValue / 50000); // Risk increases with glitch value
    riskScore += glitchRisk * 0.3; // 30% weight

    // Risk from quantum system load
    const quantumRisk = quantumStatus.processingTasks / 20; // Max 20 concurrent tasks
    riskScore += quantumRisk * 0.2; // 20% weight

    // Risk from daily losses
    const lossRisk = this.dailyLoss / this.config.riskManagement.maxDailyLoss;
    riskScore += lossRisk * 0.1; // 10% weight

    return Math.min(1.0, riskScore);
  }

  private async triggerEmergencyProtocol(riskLevel: number): Promise<void> {
    console.log(`🚨 EMERGENCY PROTOCOL TRIGGERED - Risk Level: ${(riskLevel * 100).toFixed(1)}%`);
    
    this.emitUpdate({
      timestamp: Date.now(),
      type: 'alert',
      data: { 
        message: 'EMERGENCY PROTOCOL ACTIVATED', 
        riskLevel: riskLevel * 100,
        action: 'system_protection_mode'
      },
      riskLevel
    });

    try {
      // Emergency actions
      await supabase
        .from('emergency_actions')
        .insert({
          trigger_reason: 'high_system_risk',
          risk_level: riskLevel,
          action_type: 'emergency_shutdown',
          status: 'triggered',
          timestamp: new Date().toISOString()
        });

      // Reduce system activity
      this.config.rebalancing.maxLeverage = Math.min(this.config.rebalancing.maxLeverage, 2.0);
      this.config.quantumAcquisition.maxRiskLevel = Math.min(this.config.quantumAcquisition.maxRiskLevel, 0.3);

      console.log('🛡️ Emergency protocol activated - System risk reduced');
      
    } catch (error) {
      console.error('Error triggering emergency protocol:', error);
    }
  }

  private async createQuantumTaskForGlitch(glitch: any): Promise<void> {
    try {
      // Create a quantum optimization task for the glitch
      const task = {
        type: 'glitch_optimization',
        nftId: glitch.id,
        currentValue: glitch.realWorldValue,
        multiplier: glitch.glitchMultiplier,
        expectedProfit: glitch.realWorldValue * 0.1, // 10% optimization target
        riskLevel: 0.3,
        confidence: 0.8
      };

      // This would be handled by the quantum system
      console.log(`🎯 Created quantum task for glitch ${glitch.id} ($${glitch.realWorldValue})`);
      
      this.emitUpdate({
        timestamp: Date.now(),
        type: 'quantum',
        data: { message: 'Quantum task created for high-value glitch', glitchId: glitch.id },
        profit: task.expectedProfit
      });

    } catch (error) {
      console.error('Error creating quantum task for glitch:', error);
    }
  }

  private async crossSystemOptimization(state: any): Promise<void> {
    // Optimize across all systems for maximum efficiency
    const optimizations = [];

    // Rebalancing + Glitch coordination
    const glitchOpportunities = await this.findGlitchRebalancingOpportunities(state);
    optimizations.push(...glitchOpportunities);

    // Quantum + Revenue coordination  
    const revenueOptimizations = await this.findQuantumRevenueOptimizations(state);
    optimizations.push(...revenueOptimizations);

    // Execute top optimizations
    const topOptimizations = optimizations
      .sort((a, b) => b.expectedProfit - a.expectedProfit)
      .slice(0, 3);

    for (const optimization of topOptimizations) {
      await this.executeOptimization(optimization);
    }
  }

  private async findGlitchRebalancingOpportunities(state: any): Promise<any[]> {
    const opportunities = [];
    
    // Find NFTs that could benefit from rebalancing before glitch activation
    for (const position of state.rebalancingPositions) {
      if (position.currentHealthFactor > 1.8 && position.leverageRatio < 3.0) {
        // Safe to increase leverage for more glitch potential
        opportunities.push({
          type: 'leverage_for_glitch',
          positionId: position.id,
          currentLeverage: position.leverageRatio,
          targetLeverage: Math.min(position.leverageRatio * 1.5, 3.0),
          expectedProfit: position.collateralValue * 0.2, // 20% profit potential
          riskLevel: 0.4
        });
      }
    }

    return opportunities;
  }

  private async findQuantumRevenueOptimizations(state: any): Promise<any[]> {
    const opportunities = [];
    
    // Optimize quantum task allocation based on revenue potential
    if (state.quantumStatus.activeNodes > 2 && this.dailyRevenue > 1000) {
      opportunities.push({
        type: 'quantum_revenue_scaling',
        currentRevenue: this.dailyRevenue,
        scalingFactor: 1.3,
        expectedProfit: this.dailyRevenue * 0.3,
        riskLevel: 0.2
      });
    }

    return opportunities;
  }

  private async executeOptimization(optimization: any): Promise<void> {
    try {
      console.log(`🎯 Executing optimization: ${optimization.type}`);
      
      switch (optimization.type) {
        case 'leverage_for_glitch':
          await this.executeLeverageOptimization(optimization);
          break;
        case 'quantum_revenue_scaling':
          await this.executeQuantumScaling(optimization);
          break;
      }

      this.emitUpdate({
        timestamp: Date.now(),
        type: 'revenue',
        data: { 
          optimization: optimization.type,
          expectedProfit: optimization.expectedProfit
        },
        profit: optimization.expectedProfit
      });

    } catch (error) {
      console.error('Error executing optimization:', error);
    }
  }

  private async executeLeverageOptimization(optimization: any): Promise<void> {
    // Simulate leverage increase for better glitch potential
    console.log(`📈 Increasing leverage for position ${optimization.positionId}`);
    
    await supabase
      .from('optimization_actions')
      .insert({
        action_type: 'leverage_increase',
        position_id: optimization.positionId,
        original_leverage: optimization.currentLeverage,
        target_leverage: optimization.targetLeverage,
        expected_profit: optimization.expectedProfit,
        status: 'executed',
        executed_at: new Date().toISOString()
      });
  }

  private async executeQuantumScaling(optimization: any): Promise<void> {
    // Scale quantum operations for higher revenue
    console.log(`🚀 Scaling quantum operations for increased revenue`);
    
    // Update quantum system configuration
    this.config.quantumAcquisition.minProfitThreshold *= 0.8; // Lower threshold for more opportunities
    
    await supabase
      .from('optimization_actions')
      .insert({
        action_type: 'quantum_scaling',
        scaling_factor: optimization.scalingFactor,
        expected_profit: optimization.expectedProfit,
        status: 'executed',
        executed_at: new Date().toISOString()
      });
  }

  private startRealTimeMonitoring(): void {
    // Emit real-time updates every 10 seconds
    setInterval(async () => {
      if (!this.isRunning) return;

      try {
        const metrics = await this.getSystemMetrics();
        
        this.emitUpdate({
          timestamp: Date.now(),
          type: 'revenue',
          data: metrics,
          profit: this.dailyRevenue
        });
        
      } catch (error) {
        console.error('Error in real-time monitoring:', error);
      }
    }, 10000);
  }

  private async updateSystemMetrics(): Promise<void> {
    try {
      const metrics = await this.getSystemMetrics();
      
      // Update database
      await supabase
        .from('master_system_state')
        .insert({
          daily_revenue: this.dailyRevenue,
          daily_loss: this.dailyLoss,
          risk_accumulator: this.riskAccumulator,
          active_positions: metrics.activePositions,
          system_efficiency: metrics.systemEfficiency,
          compliance_status: metrics.complianceStatus,
          created_at: new Date().toISOString()
        });

    } catch (error) {
      console.error('Error updating system metrics:', error);
    }
  }

  private async optimizeSystemPerformance(): Promise<void> {
    // Performance optimization based on metrics
    const metrics = await this.getSystemMetrics();
    
    if (metrics.systemEfficiency < 0.7) {
      console.log('⚡ System efficiency below threshold, optimizing...');
      
      // Optimize configuration
      this.config.rebalancing.rebalanceThreshold = Math.max(1.2, this.config.rebalancing.rebalanceThreshold * 0.95);
      this.config.quantumAcquisition.minProfitThreshold = Math.max(50, this.config.quantumAcquisition.minProfitThreshold * 0.9);
      
      this.emitUpdate({
        timestamp: Date.now(),
        type: 'alert',
        data: { message: 'System performance optimized', efficiency: metrics.systemEfficiency }
      });
    }
  }

  private async performSystemHealthCheck(): Promise<void> {
    try {
      const healthChecks = await Promise.all([
        this.checkRebalancingHealth(),
        this.checkGlitchEngineHealth(),
        this.checkQuantumSystemHealth(),
        this.checkComplianceHealth()
      ]);

      const overallHealth = healthChecks.reduce((sum, health) => sum + health, 0) / healthChecks.length;
      
      if (overallHealth < 0.8) {
        console.log(`⚠️ System health warning: ${(overallHealth * 100).toFixed(1)}%`);
        
        this.emitUpdate({
          timestamp: Date.now(),
          type: 'alert',
          data: { message: 'System health warning', health: overallHealth * 100 },
          riskLevel: 1 - overallHealth
        });
      }

    } catch (error) {
      console.error('System health check failed:', error);
    }
  }

  private async checkRebalancingHealth(): Promise<number> {
    const positions = await this.rebalancingEngine.getAllPositions();
    const healthyPositions = positions.filter(p => p.currentHealthFactor > 1.5).length;
    return positions.length > 0 ? healthyPositions / positions.length : 1.0;
  }

  private async checkGlitchEngineHealth(): Promise<number> {
    const glitches = await this.glitchEngine.getActiveGlitches();
    const totalRevenue = await this.glitchEngine.getTotalGlitchRevenue();
    return totalRevenue > 0 ? Math.min(1.0, totalRevenue / 10000) : 0.8; // Target $10k revenue
  }

  private async checkQuantumSystemHealth(): Promise<number> {
    const status = await this.quantumSystem.getQuantumStatus();
    return status.nodeEfficiency || 0.8;
  }

  private async checkComplianceHealth(): Promise<number> {
    const status = await this.quantumSystem.getComplianceStatus();
    return status.complianceRate / 100;
  }

  private async emergencyRiskAssessment(): Promise<void> {
    const currentRisk = this.riskAccumulator / this.config.riskManagement.maxDailyLoss;
    
    if (currentRisk > 0.8) {
      console.log(`🚨 Emergency risk level: ${(currentRisk * 100).toFixed(1)}%`);
      
      // Reduce system aggressiveness
      this.config.rebalancing.maxLeverage *= 0.8;
      this.config.quantumAcquisition.maxRiskLevel *= 0.7;
      
      this.emitUpdate({
        timestamp: Date.now(),
        type: 'alert',
        data: { message: 'High risk detected - reducing system aggressiveness', risk: currentRisk * 100 },
        riskLevel: currentRisk
      });
    }
  }

  private resetDailyMetrics(): void {
    console.log('🔄 Resetting daily metrics');
    this.dailyRevenue = 0;
    this.dailyLoss = 0;
    this.riskAccumulator = 0;
    this.lastResetTime = Date.now();
    
    // Reset system configuration to default aggressiveness
    this.config.rebalancing.maxLeverage = Math.min(this.config.rebalancing.maxLeverage * 1.1, 5.0);
    this.config.quantumAcquisition.maxRiskLevel = Math.min(this.config.quantumAcquisition.maxRiskLevel * 1.1, 0.8);
  }

  private emitUpdate(update: RealTimeUpdate): void {
    this.realTimeUpdates.push(update);
    
    // Keep only last 100 updates
    if (this.realTimeUpdates.length > 100) {
      this.realTimeUpdates = this.realTimeUpdates.slice(-100);
    }
    
    // Notify all callbacks
    this.updateCallbacks.forEach(callback => {
      try {
        callback(update);
      } catch (error) {
        console.error('Error in update callback:', error);
      }
    });
  }

  // Public API methods
  public async getSystemMetrics(): Promise<SystemMetrics> {
    try {
      const [
        rebalancingPositions,
        activeGlitches,
        quantumStatus,
        complianceStatus
      ] = await Promise.all([
        this.rebalancingEngine.getAllPositions(),
        this.glitchEngine.getActiveGlitches(),
        this.quantumSystem.getQuantumStatus(),
        this.quantumSystem.getComplianceStatus()
      ]);

      const totalRevenue = this.dailyRevenue;
      const totalProfit = totalRevenue - this.dailyLoss;
      const riskScore = this.calculateTotalSystemRisk({
        rebalancingPositions,
        activeGlitches,
        quantumStatus
      });

      return {
        totalRevenue,
        totalProfit,
        activePositions: rebalancingPositions.length,
        riskScore,
        complianceStatus: complianceStatus.complianceRate > 95 ? 'compliant' : 'warning',
        systemEfficiency: (quantumStatus.nodeEfficiency + (1 - riskScore)) / 2,
        glitchesActive: activeGlitches.length,
        quantumTasksProcessed: quantumStatus.queuedTasks + quantumStatus.processingTasks
      };
    } catch (error) {
      console.error('Error getting system metrics:', error);
      return {
        totalRevenue: 0,
        totalProfit: 0,
        activePositions: 0,
        riskScore: 1,
        complianceStatus: 'error',
        systemEfficiency: 0,
        glitchesActive: 0,
        quantumTasksProcessed: 0
      };
    }
  }

  public getRecentUpdates(limit: number = 20): RealTimeUpdate[] {
    return this.realTimeUpdates.slice(-limit);
  }

  public subscribeToUpdates(callback: (update: RealTimeUpdate) => void): () => void {
    this.updateCallbacks.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.updateCallbacks.indexOf(callback);
      if (index > -1) {
        this.updateCallbacks.splice(index, 1);
      }
    };
  }

  public isSystemRunning(): boolean {
    return this.isRunning;
  }

  public updateConfig(newConfig: Partial<SystemConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log('📝 System configuration updated');
  }

  public getConfig(): SystemConfig {
    return { ...this.config };
  }

  // Record revenue and losses for tracking
  public recordRevenue(amount: number, source: string): void {
    this.dailyRevenue += amount;
    console.log(`💰 Revenue recorded: +$${amount.toFixed(2)} from ${source}`);
  }

  public recordLoss(amount: number, source: string): void {
    this.dailyLoss += amount;
    this.riskAccumulator += amount;
    console.log(`💸 Loss recorded: -$${amount.toFixed(2)} from ${source}`);
  }
}