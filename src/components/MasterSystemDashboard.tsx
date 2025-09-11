import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { useGame } from '@/contexts/GameContext';
import { SystemMetrics, RealTimeUpdate } from '@/services/MasterOrchestrationSystem';
import { 
  Activity, 
  TrendingUp, 
  Shield, 
  Zap, 
  DollarSign, 
  AlertTriangle,
  CheckCircle,
  Play,
  Square,
  Sparkles,
  Target
} from 'lucide-react';

interface MasterSystemDashboardProps {
  className?: string;
}

export const MasterSystemDashboard: React.FC<MasterSystemDashboardProps> = ({ className = "" }) => {
  const {
    systemMetrics,
    isSystemRunning,
    recentUpdates,
    startMasterSystem,
    stopMasterSystem,
    manualGlitchTrigger,
    nftItems
  } = useGame();

  const handleSystemToggle = async () => {
    if (isSystemRunning) {
      await stopMasterSystem();
    } else {
      await startMasterSystem();
    }
  };

  const handleManualGlitch = async () => {
    const availableNFTs = nftItems.filter(nft => nft.owned);
    if (availableNFTs.length > 0) {
      const randomNFT = availableNFTs[Math.floor(Math.random() * availableNFTs.length)];
      await manualGlitchTrigger(randomNFT.id.toString());
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'compliant':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
    }
  };

  const getUpdateIcon = (type: string) => {
    switch (type) {
      case 'rebalancing':
        return <Target className="h-4 w-4 text-blue-500" />;
      case 'glitch':
        return <Sparkles className="h-4 w-4 text-purple-500" />;
      case 'quantum':
        return <Zap className="h-4 w-4 text-cyan-500" />;
      case 'revenue':
        return <DollarSign className="h-4 w-4 text-green-500" />;
      case 'alert':
        return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      default:
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* System Control Header */}
      <Card className="border-2 border-primary/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-6 w-6" />
                Master Orchestration System
              </CardTitle>
              <CardDescription>
                Automated leveraged rebalancing, NFT infinite glitch, and quantum acquisition systems
              </CardDescription>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant={isSystemRunning ? "default" : "secondary"}>
                {isSystemRunning ? "ACTIVE" : "STOPPED"}
              </Badge>
              <Button
                onClick={handleSystemToggle}
                variant={isSystemRunning ? "destructive" : "default"}
                size="sm"
              >
                {isSystemRunning ? (
                  <>
                    <Square className="h-4 w-4 mr-2" />
                    Stop System
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Start System
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* System Metrics Grid */}
      {systemMetrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Revenue */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(systemMetrics.totalRevenue)}
              </div>
              <p className="text-xs text-muted-foreground">
                Profit: {formatCurrency(systemMetrics.totalProfit)}
              </p>
            </CardContent>
          </Card>

          {/* Active Positions */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Positions</CardTitle>
              <Target className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{systemMetrics.activePositions}</div>
              <p className="text-xs text-muted-foreground">
                Glitches: {systemMetrics.glitchesActive}
              </p>
            </CardContent>
          </Card>

          {/* System Efficiency */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">System Efficiency</CardTitle>
              <TrendingUp className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {(systemMetrics.systemEfficiency * 100).toFixed(1)}%
              </div>
              <Progress value={systemMetrics.systemEfficiency * 100} className="mt-2" />
            </CardContent>
          </Card>

          {/* Risk & Compliance */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Risk & Compliance</CardTitle>
              <Shield className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 mb-2">
                {getStatusIcon(systemMetrics.complianceStatus)}
                <span className="text-sm font-medium capitalize">
                  {systemMetrics.complianceStatus}
                </span>
              </div>
              <div className="text-xs text-muted-foreground">
                Risk: {(systemMetrics.riskScore * 100).toFixed(1)}%
              </div>
              <Progress 
                value={systemMetrics.riskScore * 100} 
                className="mt-1"
                // @ts-ignore
                style={{ '--progress-foreground': systemMetrics.riskScore > 0.7 ? 'hsl(var(--destructive))' : 'hsl(var(--primary))' }}
              />
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Real-time Activity Feed */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Real-time Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {recentUpdates.length > 0 ? (
                recentUpdates.slice(-10).reverse().map((update, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                    {getUpdateIcon(update.type)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium capitalize">
                          {update.type.replace('_', ' ')}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatTime(update.timestamp)}
                        </span>
                      </div>
                      {update.data.message && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {update.data.message}
                        </p>
                      )}
                      {update.profit && update.profit > 0 && (
                        <div className="text-xs text-green-600 font-medium mt-1">
                          +{formatCurrency(update.profit)}
                        </div>
                      )}
                      {update.riskLevel && update.riskLevel > 0.5 && (
                        <Badge variant="destructive" className="text-xs mt-1">
                          High Risk: {(update.riskLevel * 100).toFixed(0)}%
                        </Badge>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No activity yet. Start the system to see real-time updates.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* System Controls */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              System Controls
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Manual Glitch Trigger */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium">NFT Infinite Glitch</h4>
              <p className="text-xs text-muted-foreground">
                Manually trigger the infinite glitch on your owned NFTs for exponential value multiplication.
              </p>
              <Button
                onClick={handleManualGlitch}
                disabled={!isSystemRunning || nftItems.filter(nft => nft.owned).length === 0}
                className="w-full"
                variant="outline"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Trigger Infinite Glitch
              </Button>
            </div>

            <Separator />

            {/* System Status */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium">System Status</h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex justify-between">
                  <span>Rebalancing:</span>
                  <Badge variant={isSystemRunning ? "default" : "secondary"} className="text-xs">
                    {isSystemRunning ? "Active" : "Inactive"}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span>Glitch Engine:</span>
                  <Badge variant={isSystemRunning ? "default" : "secondary"} className="text-xs">
                    {isSystemRunning ? "Active" : "Inactive"}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span>Quantum System:</span>
                  <Badge variant={isSystemRunning ? "default" : "secondary"} className="text-xs">
                    {isSystemRunning ? "Active" : "Inactive"}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span>Auto-Offramp:</span>
                  <Badge variant={isSystemRunning ? "default" : "secondary"} className="text-xs">
                    {isSystemRunning ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </div>
            </div>

            {systemMetrics && (
              <>
                <Separator />
                
                {/* Performance Metrics */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Performance Metrics</h4>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span>Quantum Tasks:</span>
                      <span>{systemMetrics.quantumTasksProcessed}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Efficiency:</span>
                      <span>{(systemMetrics.systemEfficiency * 100).toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Daily Profit:</span>
                      <span className="text-green-600">
                        {formatCurrency(systemMetrics.totalProfit)}
                      </span>
                    </div>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* System Architecture Info */}
      <Card>
        <CardHeader>
          <CardTitle>System Architecture</CardTitle>
          <CardDescription>
            Overview of the integrated autonomous systems
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center p-4 rounded-lg border">
              <Target className="h-8 w-8 mx-auto mb-2 text-blue-500" />
              <h4 className="font-medium">Leveraged Rebalancing</h4>
              <p className="text-xs text-muted-foreground mt-1">
                Fibonacci-based flash swap system with collateral protection
              </p>
            </div>
            <div className="text-center p-4 rounded-lg border">
              <Sparkles className="h-8 w-8 mx-auto mb-2 text-purple-500" />
              <h4 className="font-medium">Infinite Glitch</h4>
              <p className="text-xs text-muted-foreground mt-1">
                NFT value multiplication with real asset integration
              </p>
            </div>
            <div className="text-center p-4 rounded-lg border">
              <Zap className="h-8 w-8 mx-auto mb-2 text-cyan-500" />
              <h4 className="font-medium">Quantum Acquisition</h4>
              <p className="text-xs text-muted-foreground mt-1">
                Advanced AI-driven optimization with legal compliance
              </p>
            </div>
            <div className="text-center p-4 rounded-lg border">
              <DollarSign className="h-8 w-8 mx-auto mb-2 text-green-500" />
              <h4 className="font-medium">Auto-Offramp</h4>
              <p className="text-xs text-muted-foreground mt-1">
                Cross-chain offramp to USDC and stable currencies
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};