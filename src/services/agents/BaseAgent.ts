export interface AgentConfig {
  id: string;
  type: string;
  name: string;
  priority: number;
  capabilities: string[];
  maxConcurrentTasks: number;
  performanceThreshold: number;
  riskTolerance: number;
}

export interface AgentTask {
  id: string;
  type: string;
  payload: Record<string, unknown>;
  priority: number;
  assignedAgent?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  result?: Record<string, unknown>;
  error?: string;
}

export interface AgentPerformance {
  agentId: string;
  tasksCompleted: number;
  tasksFailed: number;
  averageExecutionTime: number;
  successRate: number;
  revenueGenerated: number;
  lastActivity: Date;
  efficiency: number;
}

export abstract class BaseAgent {
  protected config: AgentConfig;
  protected performance: AgentPerformance;
  protected activeTasks: Set<string> = new Set();
  protected isActive: boolean = false;

  constructor(config: AgentConfig) {
    this.config = config;
    this.performance = {
      agentId: config.id,
      tasksCompleted: 0,
      tasksFailed: 0,
      averageExecutionTime: 0,
      successRate: 0,
      revenueGenerated: 0,
      lastActivity: new Date(),
      efficiency: 0,
    };
  }

  abstract executeTask(task: AgentTask): Promise<Record<string, unknown>>;
  abstract canHandleTask(task: AgentTask): boolean;
  abstract getSpecializedCapabilities(): string[];

  async start(): Promise<void> {
    this.isActive = true;
    console.log(`Agent ${this.config.name} (${this.config.id}) started`);
  }

  async stop(): Promise<void> {
    this.isActive = false;
    console.log(`Agent ${this.config.name} (${this.config.id}) stopped`);
  }

  isAvailable(): boolean {
    return this.isActive && this.activeTasks.size < this.config.maxConcurrentTasks;
  }

  assignTask(taskId: string): boolean {
    if (!this.isAvailable()) return false;
    this.activeTasks.add(taskId);
    return true;
  }

  completeTask(taskId: string, success: boolean, executionTime: number, revenue?: number): void {
    this.activeTasks.delete(taskId);
    this.performance.lastActivity = new Date();

    if (success) {
      this.performance.tasksCompleted++;
      if (revenue) this.performance.revenueGenerated += revenue;
    } else {
      this.performance.tasksFailed++;
    }

    // Update average execution time
    const totalTasks = this.performance.tasksCompleted + this.performance.tasksFailed;
    this.performance.averageExecutionTime =
      (this.performance.averageExecutionTime * (totalTasks - 1) + executionTime) / totalTasks;

    // Update success rate
    this.performance.successRate = this.performance.tasksCompleted / totalTasks;

    // Calculate efficiency (tasks per minute * success rate)
    this.performance.efficiency = (this.performance.tasksCompleted / Math.max(1, executionTime / 60000)) * this.performance.successRate;
  }

  getPerformance(): AgentPerformance {
    return { ...this.performance };
  }

  getConfig(): AgentConfig {
    return { ...this.config };
  }

  updateConfig(updates: Partial<AgentConfig>): void {
    this.config = { ...this.config, ...updates };
  }
}
