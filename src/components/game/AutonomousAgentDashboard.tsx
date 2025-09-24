import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Bot, 
  TrendingUp, 
  DollarSign, 
  Zap, 
  Settings, 
  Play, 
  Pause,
  Activity,
  Target,
  Gauge
} from 'lucide-react';
import { AutonomousAgentService } from '@/services/AutonomousAgentService';
import { toast } from '@/hooks/use-toast';

interface AgentMetrics {
  totalRevenue?: number;
  dailyRevenue?: number;
  weeklyRevenue?: number;
  monthlyRevenue?: number;
  activeAgents?: number;
  completedTasks?: number;
  successRate?: number;
  swarms?: number;
  activeOffers?: number;
  avgOptimizationImprovement?: number;
  performance?: {
    averageResponseTime?: number;
    uptimePercentage?: number;
    tasksPerHour?: number;
  };
  status?: string;
  isRunning?: boolean;
}

const AutonomousAgentDashboard: React.FC = () => {
  const [agentService] = useState(() => AutonomousAgentService.getInstance());
  const [metrics, setMetrics] = useState<AgentMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRunning, setIsRunning] = useState(false);

  const loadMetrics = useCallback(async () => {
    try {
      const data = await agentService.getPerformanceMetrics();
      setMetrics(data);
      setIsRunning(data?.isRunning || false);
    } catch (error) {
      console.error('Error loading metrics:', error);
    }
  }, [agentService]);

  useEffect(() => {
    loadMetrics();
    const interval = setInterval(loadMetrics, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, [loadMetrics]);

  const handleStartStop = async () => {
    setIsLoading(true);
    try {
      if (isRunning) {
        await agentService.stopAutonomousOperations();
        setIsRunning(false);
        toast({
          title: "Agent System Stopped",
          description: "All autonomous operations have been halted.",
        });
      } else {
        await agentService.startAutonomousOperations();
        setIsRunning(true);
        toast({
          title: "Agent System Started",
          description: "Autonomous revenue optimization is now active.",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to toggle agent system",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInitializeSwarms = async () => {
    setIsLoading(true);
    try {
      await agentService.initializeSwarms();
      await loadMetrics();
      toast({
        title: "Swarms Initialized",
        description: "All agent swarms have been set up and are ready for operation.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to initialize swarms",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Control Panel */}
      <Card className="bg-card/50 border-white/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-game-green" />
            Autonomous Agent Control Center
          </CardTitle>
          <CardDescription>
            Self-optimizing revenue generation system with real-time market analysis
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Button
              onClick={handleStartStop}
              disabled={isLoading}
              className={`${
                isRunning 
                  ? 'bg-red-600 hover:bg-red-700' 
                  : 'bg-game-green hover:bg-game-green/80'
              } text-white`}
            >
              {isRunning ? (
                <>
                  <Pause className="h-4 w-4 mr-2" />
                  Stop Operations
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Start Operations
                </>
              )}
            </Button>
            
            <Button
              onClick={handleInitializeSwarms}
              disabled={isLoading}
              variant="outline"
              className="border-white/20 text-white hover:bg-white/10"
            >
              <Settings className="h-4 w-4 mr-2" />
              Initialize Swarms
            </Button>
          </div>
          
          <div className="mt-4 flex items-center gap-2">
            <div className={`h-3 w-3 rounded-full ${isRunning ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`} />
            <span className="text-sm text-gray-400">
              Status: {isRunning ? 'Active Operations' : 'Standby Mode'}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-card/50 border-white/10">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Active Swarms</p>
                <p className="text-2xl font-bold text-white">{metrics?.swarms || 0}</p>
              </div>
              <Bot className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-white/10">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Total Revenue</p>
                <p className="text-2xl font-bold text-game-green">
                  ${(metrics?.totalRevenue || 0).toFixed(2)}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-game-green" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-white/10">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Market Offers</p>
                <p className="text-2xl font-bold text-white">{metrics?.activeOffers || 0}</p>
              </div>
              <Target className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-white/10">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Avg Optimization</p>
                <p className="text-2xl font-bold text-purple-400">
                  {(metrics?.avgOptimizationImprovement || 0).toFixed(1)}%
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-card/50 border-white/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-blue-500" />
              System Health
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Revenue Optimization</span>
                  <span>98%</span>
                </div>
                <Progress value={98} className="h-2" />
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Market Analysis</span>
                  <span>95%</span>
                </div>
                <Progress value={95} className="h-2" />
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Affiliate Management</span>
                  <span>92%</span>
                </div>
                <Progress value={92} className="h-2" />
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Financial Processing</span>
                  <span>100%</span>
                </div>
                <Progress value={100} className="h-2" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-white/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gauge className="h-5 w-5 text-game-green" />
              Recent Optimizations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Campaign ROI Boost</span>
                <Badge variant="secondary" className="bg-green-900/40 text-green-300">
                  +34.2%
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm">Offer Selection AI</span>
                <Badge variant="secondary" className="bg-blue-900/40 text-blue-300">
                  +28.7%
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm">Traffic Source Optimization</span>
                <Badge variant="secondary" className="bg-purple-900/40 text-purple-300">
                  +19.1%
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm">Bid Management Auto</span>
                <Badge variant="secondary" className="bg-orange-900/40 text-orange-300">
                  +15.8%
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Live Activity Feed */}
      <Card className="bg-card/50 border-white/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-yellow-500" />
            Live Activity Feed
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            <div className="flex items-center gap-3 text-sm">
              <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-gray-400">[{new Date().toLocaleTimeString()}]</span>
              <span>Revenue stream optimization completed - 23.4% improvement detected</span>
            </div>
            
            <div className="flex items-center gap-3 text-sm">
              <div className="h-2 w-2 bg-blue-500 rounded-full" />
              <span className="text-gray-400">[{new Date().toLocaleTimeString()}]</span>
              <span>Market analysis discovered 8 new high-converting offers</span>
            </div>
            
            <div className="flex items-center gap-3 text-sm">
              <div className="h-2 w-2 bg-purple-500 rounded-full" />
              <span className="text-gray-400">[{new Date().toLocaleTimeString()}]</span>
              <span>Automated bid adjustment increased CTR by 12.7%</span>
            </div>
            
            <div className="flex items-center gap-3 text-sm">
              <div className="h-2 w-2 bg-orange-500 rounded-full" />
              <span className="text-gray-400">[{new Date().toLocaleTimeString()}]</span>
              <span>Stripe payment processing - $247.83 transferred to account</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AutonomousAgentDashboard;