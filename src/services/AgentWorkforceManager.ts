import { BaseAgent, AgentTask, AgentPerformance } from './agents/BaseAgent';
import { RevenueAgent } from './agents/RevenueAgent';
import { MarketAgent } from './agents/MarketAgent';
import { supabase } from '@/integrations/supabase/client';

export interface WorkforceConfig {
  maxAgents: number;
  agentTypes: string[];
  taskQueueSize: number;
  performanceThreshold: number;
  autoScaling: boolean;
  loadBalancingStrategy: 'round-robin' | 'performance-based' | 'task-affinity';
}

export interface WorkforceMetrics {
  totalAgents: number;
  activeAgents: number;
  idleAgents: number;
  totalTasksProcessed: number;
  averageTaskCompletionTime: number;
  overallEfficiency: number;
  agentTypeDistribution: Record<string, number>;
  queueLength: number;
  systemLoad: number;
}

export class AgentWorkforceManager {
  private static instance: AgentWorkforceManager;
  private agents: Map<string, BaseAgent> = new Map();
  private taskQueue: AgentTask[] = [];
  private processingTasks: Map<string, AgentTask> = new Map();
  private config: WorkforceConfig;
  private isRunning: boolean = false;
  private metrics: WorkforceMetrics;
  private performanceHistory: AgentPerformance[] = [];

  private constructor(config: WorkforceConfig) {
    this.config = config;
    this.metrics = {
      totalAgents: 0,
      activeAgents: 0,
      idleAgents: 0,
      totalTasksProcessed: 0,
      averageTaskCompletionTime: 0,
      overallEfficiency: 0,
      agentTypeDistribution: {},
      queueLength: 0,
      systemLoad: 0
    };
  }

  static getInstance(config?: WorkforceConfig): AgentWorkforceManager {
    if (!AgentWorkforceManager.instance) {
      const defaultConfig: WorkforceConfig = {
        maxAgents: 20,
        agentTypes: ['revenue', 'market', 'optimization', 'risk'],
        taskQueueSize: 1000,
        performanceThreshold: 0.7,
        autoScaling: true,
        loadBalancingStrategy: 'performance-based'
      };

      AgentWorkforceManager.instance = new AgentWorkforceManager(config || defaultConfig);
    }
    return AgentWorkforceManager.instance;
  }

  async initializeWorkforce(): Promise<void> {
    console.log('Initializing agent workforce...');

    // Create initial set of agents
    await this.spawnInitialAgents();

    // Load existing agents from database if any
    await this.loadExistingAgents();

    // Start workforce monitoring
    this.startWorkforceMonitoring();

    console.log(`Workforce initialized with ${this.agents.size} agents`);
  }

  async startWorkforce(): Promise<void> {
    if (this.isRunning) return;

    this.isRunning = true;
    console.log('Starting agent workforce...');

    // Start all agents
    for (const agent of this.agents.values()) {
      await agent.start();
    }

    // Start task processing
    this.startTaskProcessing();

    // Start auto-scaling if enabled
    if (this.config.autoScaling) {
      this.startAutoScaling();
    }
  }

  async stopWorkforce(): Promise<void> {
    if (!this.isRunning) return;

    this.isRunning = false;
    console.log('Stopping agent workforce...');

    // Stop all agents
    for (const agent of this.agents.values()) {
      await agent.stop();
    }

    // Clear queues
    this.taskQueue = [];
    this.processingTasks.clear();
  }

  async submitTask(task: AgentTask): Promise<string> {
    if (this.taskQueue.length >= this.config.taskQueueSize) {
      throw new Error('Task queue is full');
    }

    // Add task to queue
    this.taskQueue.push(task);
    this.updateMetrics();

    console.log(`Task ${task.id} submitted to workforce`);

    return task.id;
  }

  async getTaskStatus(taskId: string): Promise<AgentTask | null> {
    // Check processing tasks
    if (this.processingTasks.has(taskId)) {
      return this.processingTasks.get(taskId)!;
    }

    // Check queue
    const queuedTask = this.taskQueue.find(t => t.id === taskId);
    if (queuedTask) {
      return queuedTask;
    }

    return null;
  }

  getWorkforceMetrics(): WorkforceMetrics {
    return { ...this.metrics };
  }

  getAgentPerformance(agentId: string): AgentPerformance | null {
    const agent = this.agents.get(agentId);
    return agent ? agent.getPerformance() : null;
  }

  getAllAgentPerformance(): AgentPerformance[] {
    return Array.from(this.agents.values()).map(agent => agent.getPerformance());
  }

  async scaleWorkforce(targetSize: number): Promise<void> {
    const currentSize = this.agents.size;

    if (targetSize > currentSize) {
      // Scale up
      const agentsToAdd = targetSize - currentSize;
      await this.spawnAgents(agentsToAdd);
    } else if (targetSize < currentSize) {
      // Scale down
      const agentsToRemove = currentSize - targetSize;
      await this.retireAgents(agentsToRemove);
    }

    console.log(`Workforce scaled from ${currentSize} to ${this.agents.size} agents`);
  }

  private async spawnInitialAgents(): Promise<void> {
    const agentsPerType = Math.floor(this.config.maxAgents / this.config.agentTypes.length);

    for (const agentType of this.config.agentTypes) {
      for (let i = 0; i < agentsPerType; i++) {
        await this.spawnAgent(agentType);
      }
    }
  }

  private async spawnAgent(agentType: string): Promise<BaseAgent> {
    const agentId = `${agentType}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    let agent: BaseAgent;

    switch (agentType) {
      case 'revenue':
        agent = new RevenueAgent({
          id: agentId,
          type: 'revenue',
          name: `Revenue Agent ${this.agents.size + 1}`,
          priority: 5,
          capabilities: ['revenue-generation', 'optimization'],
          maxConcurrentTasks: 3,
          performanceThreshold: this.config.performanceThreshold,
          riskTolerance: 0.3
        });
        break;

      case 'market':
        agent = new MarketAgent({
          id: agentId,
          type: 'market',
          name: `Market Agent ${this.agents.size + 1}`,
          priority: 4,
          capabilities: ['market-analysis', 'trend-detection'],
          maxConcurrentTasks: 2,
          performanceThreshold: this.config.performanceThreshold,
          riskTolerance: 0.2
        });
        break;

      default:
        throw new Error(`Unknown agent type: ${agentType}`);
    }

    this.agents.set(agentId, agent);
    this.metrics.agentTypeDistribution[agentType] = (this.metrics.agentTypeDistribution[agentType] || 0) + 1;
    this.metrics.totalAgents++;

    console.log(`Spawned ${agentType} agent: ${agentId}`);

    return agent;
  }

  private async spawnAgents(count: number): Promise<void> {
    const agentsPerType = Math.floor(count / this.config.agentTypes.length);
    let remaining = count % this.config.agentTypes.length;

    for (const agentType of this.config.agentTypes) {
      const agentsForType = agentsPerType + (remaining > 0 ? 1 : 0);
      remaining--;

      for (let i = 0; i < agentsForType; i++) {
        await this.spawnAgent(agentType);
      }
    }
  }

  private async retireAgents(count: number): Promise<void> {
    const agentsToRetire = Array.from(this.agents.keys()).slice(-count);

    for (const agentId of agentsToRetire) {
      const agent = this.agents.get(agentId);
      if (agent) {
        await agent.stop();
        this.agents.delete(agentId);

        const agentType = agent.getConfig().type;
        this.metrics.agentTypeDistribution[agentType]--;
        this.metrics.totalAgents--;

        console.log(`Retired agent: ${agentId}`);
      }
    }
  }

  private async loadExistingAgents(): Promise<void> {
    try {
      // Load agents from database if they exist
      const { data: agentData } = await supabase
        .from('agent_swarms')
        .select('*')
        .eq('status', 'active');

      if (agentData && agentData.length > 0) {
        for (const agentRecord of agentData) {
          // Recreate agent from stored configuration
          const agent = await this.spawnAgent(agentRecord.swarm_type || 'revenue');
          // Restore agent state if needed
        }
      }
    } catch (error) {
      console.log('No existing agents found, starting fresh');
    }
  }

  private startWorkforceMonitoring(): void {
    setInterval(() => {
      this.updateMetrics();
      this.checkAgentHealth();
      this.optimizeWorkforce();
    }, 30000); // Every 30 seconds
  }

  private startTaskProcessing(): void {
    setInterval(async () => {
      if (!this.isRunning) return;

      // Process queued tasks
      while (this.taskQueue.length > 0 && this.hasAvailableAgents()) {
        const task = this.taskQueue.shift()!;
        await this.assignTaskToAgent(task);
      }
    }, 1000); // Every second
  }

  private startAutoScaling(): void {
    setInterval(async () => {
      if (!this.isRunning) return;

      const currentLoad = this.metrics.systemLoad;
      const queueLength = this.metrics.queueLength;

      // Scale up if high load or long queue
      if (currentLoad > 0.8 || queueLength > this.config.taskQueueSize * 0.7) {
        const targetSize = Math.min(this.config.maxAgents, this.agents.size + 2);
        await this.scaleWorkforce(targetSize);
      }
      // Scale down if low load
      else if (currentLoad < 0.3 && queueLength < this.config.taskQueueSize * 0.2) {
        const targetSize = Math.max(5, this.agents.size - 1);
        await this.scaleWorkforce(targetSize);
      }
    }, 60000); // Every minute
  }

  private async assignTaskToAgent(task: AgentTask): Promise<void> {
    const availableAgent = this.findBestAgentForTask(task);

    if (!availableAgent) {
      // No available agent, put task back in queue
      this.taskQueue.unshift(task);
      return;
    }

    // Assign task to agent
    this.processingTasks.set(task.id, task);
    availableAgent.assignTask(task.id);

    // Execute task asynchronously
    this.executeTaskAsync(availableAgent, task);
  }

  private findBestAgentForTask(task: AgentTask): BaseAgent | null {
    const capableAgents = Array.from(this.agents.values())
      .filter(agent => agent.canHandleTask(task) && agent.isAvailable());

    if (capableAgents.length === 0) return null;

    switch (this.config.loadBalancingStrategy) {
      case 'round-robin':
        return capableAgents[0]; // Simple round-robin

      case 'performance-based':
        // Choose agent with best performance
        return capableAgents.sort((a, b) =>
          b.getPerformance().efficiency - a.getPerformance().efficiency
        )[0];

      case 'task-affinity':
        // Choose agent with most experience in this task type
        return capableAgents.sort((a, b) =>
          b.getPerformance().tasksCompleted - a.getPerformance().tasksCompleted
        )[0];

      default:
        return capableAgents[0];
    }
  }

  private async executeTaskAsync(agent: BaseAgent, task: AgentTask): Promise<void> {
    try {
      const startTime = Date.now();
      const result = await agent.executeTask(task);
      const executionTime = Date.now() - startTime;

      // Update task status
      task.status = 'completed';
      task.result = result;
      task.completedAt = new Date();

      // Update agent performance
      agent.completeTask(task.id, true, executionTime, this.extractRevenueFromResult(result));

      console.log(`Task ${task.id} completed by ${agent.getConfig().name} in ${executionTime}ms`);

    } catch (error) {
      // Update task status on failure
      task.status = 'failed';
      task.error = error instanceof Error ? error.message : 'Unknown error';
      task.completedAt = new Date();

      // Update agent performance
      agent.completeTask(task.id, false, 0, 0);

      console.error(`Task ${task.id} failed:`, error);
    } finally {
      // Remove from processing tasks
      this.processingTasks.delete(task.id);
      this.metrics.totalTasksProcessed++;
    }
  }

  private hasAvailableAgents(): boolean {
    return Array.from(this.agents.values()).some(agent => agent.isAvailable());
  }

  private updateMetrics(): void {
    const activeAgents = Array.from(this.agents.values()).filter(agent => !agent.isAvailable()).length;
    const idleAgents = this.agents.size - activeAgents;

    this.metrics.activeAgents = activeAgents;
    this.metrics.idleAgents = idleAgents;
    this.metrics.queueLength = this.taskQueue.length;
    this.metrics.systemLoad = activeAgents / this.agents.size;

    // Update efficiency metrics
    const allPerformances = this.getAllAgentPerformance();
    if (allPerformances.length > 0) {
      this.metrics.overallEfficiency = allPerformances.reduce((sum, p) => sum + p.efficiency, 0) / allPerformances.length;
      this.metrics.averageTaskCompletionTime = allPerformances.reduce((sum, p) => sum + p.averageExecutionTime, 0) / allPerformances.length;
    }
  }

  private checkAgentHealth(): void {
    for (const [agentId, agent] of this.agents) {
      const performance = agent.getPerformance();

      // Check if agent is underperforming
      if (performance.successRate < this.config.performanceThreshold) {
        console.warn(`Agent ${agentId} is underperforming (success rate: ${performance.successRate})`);

        // Consider retiring underperforming agent
        if (performance.tasksCompleted > 10 && performance.successRate < 0.5) {
          this.retireAgents(1);
          this.spawnAgent(agent.getConfig().type);
        }
      }
    }
  }

  private optimizeWorkforce(): void {
    // Analyze task patterns and adjust agent distribution
    const taskTypeDistribution = this.analyzeTaskPatterns();

    // Adjust agent types based on demand
    for (const [taskType, demand] of Object.entries(taskTypeDistribution)) {
      const currentAgents = this.metrics.agentTypeDistribution[taskType] || 0;
      const optimalAgents = Math.max(1, Math.floor(demand * this.agents.size));

      if (Math.abs(currentAgents - optimalAgents) > 1) {
        console.log(`Optimizing ${taskType} agents: ${currentAgents} -> ${optimalAgents}`);
        // Implement agent type rebalancing
      }
    }
  }

  private analyzeTaskPatterns(): Record<string, number> {
    const recentTasks = Array.from(this.processingTasks.values())
      .concat(this.taskQueue.slice(0, 50));

    const distribution: Record<string, number> = {};

    for (const task of recentTasks) {
      distribution[task.type] = (distribution[task.type] || 0) + 1;
    }

    // Normalize to get proportions
    const total = Object.values(distribution).reduce((sum, count) => sum + count, 0);
    for (const type in distribution) {
      distribution[type] /= total;
    }

    return distribution;
  }

  private extractRevenueFromResult(result: Record<string, unknown>): number {
    // Extract revenue value from task result
    if (result && typeof result === 'object') {
      return result.revenue || result.earnings || result.value || 0;
    }
    return 0;
  }

  async saveWorkforceState(): Promise<void> {
    try {
      // Save workforce configuration and agent states to existing table
      const agentStates = Array.from(this.agents.entries()).map(([id, agent]) => ({
        name: agent.getConfig().name,
        swarm_type: agent.getConfig().type,
        status: 'active',
        config: JSON.parse(JSON.stringify(agent.getConfig())),
        performance_metrics: JSON.parse(JSON.stringify(agent.getPerformance()))
      }));

      for (const agentState of agentStates) {
        await supabase
          .from('agent_swarms')
          .upsert(agentState);
      }

      console.log('Workforce state saved');
    } catch (error) {
      console.error('Failed to save workforce state:', error);
    }
  }

  async loadWorkforceState(): Promise<void> {
    try {
      const { data: agentStates } = await supabase
        .from('agent_swarms')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (agentStates && agentStates.length > 0) {
        // Recreate agents from saved state
        for (const agentData of agentStates) {
          const agent = await this.spawnAgent(agentData.swarm_type || 'revenue');
          // Update agent configuration if available
          if (agentData.config) {
            try {
              agent.updateConfig(agentData.config as Record<string, unknown>);
            } catch (error) {
              console.warn('Failed to update agent config:', error);
            }
          }
        }

        console.log('Workforce state loaded');
      }
    } catch (error) {
      console.log('No previous workforce state found, starting fresh');
    }
  }

  // Real-time server connection methods
  async connectToServer(): Promise<void> {
    console.log('Connecting workforce to server...');
    await this.saveWorkforceState();
  }

  async syncWithServer(): Promise<void> {
    console.log('Syncing workforce with server...');
    await this.loadWorkforceState();
    await this.saveWorkforceState();
  }

  isServerConnected(): boolean {
    return this.isRunning;
  }
}