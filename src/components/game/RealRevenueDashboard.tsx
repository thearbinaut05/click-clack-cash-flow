/**
 * Real Revenue Dashboard Component
 * 
 * Displays live autonomous revenue generation metrics and controls
 * Replaces mock game elements with real USD tracking
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useGame } from '@/contexts/GameContext';
import { toast } from '@/hooks/use-toast';
import { 
  DollarSign, 
  TrendingUp, 
  Users, 
  Zap, 
  Play, 
  Pause, 
  Settings,
  ArrowUpRight,
  BrainCircuit,
  PiggyBank,
  Clock
} from 'lucide-react';

interface RevenueStreamCardProps {
  stream: {
    id: string;
    name: string;
    type: string;
    isActive: boolean;
    revenuePerHour: number;
    totalEarned: number;
    lastProcessed: Date;
  };
  onToggle: (streamId: string) => void;
}

const RevenueStreamCard: React.FC<RevenueStreamCardProps> = ({ stream, onToggle }) => {
  const getStreamIcon = (type: string) => {
    switch (type) {
      case 'affiliate': return <Users className="h-4 w-4" />;
      case 'ads': return <TrendingUp className="h-4 w-4" />;
      case 'arbitrage': return <Zap className="h-4 w-4" />;
      case 'offers': return <BrainCircuit className="h-4 w-4" />;
      default: return <DollarSign className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'affiliate': return 'bg-blue-500';
      case 'ads': return 'bg-green-500';
      case 'arbitrage': return 'bg-purple-500';
      case 'offers': return 'bg-orange-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <Card className={`transition-all duration-200 ${stream.isActive ? 'ring-2 ring-green-500' : 'opacity-75'}`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className={`p-1 rounded-full ${getTypeColor(stream.type)}`}>
              {getStreamIcon(stream.type)}
            </div>
            <div>
              <CardTitle className="text-sm">{stream.name}</CardTitle>
              <CardDescription className="text-xs">
                ${stream.revenuePerHour.toFixed(2)}/hour
              </CardDescription>
            </div>
          </div>
          <Badge variant={stream.isActive ? "default" : "secondary"}>
            {stream.isActive ? "Active" : "Paused"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Total Earned:</span>
            <span className="font-mono font-bold text-green-600">
              ${stream.totalEarned.toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Last Processed:</span>
            <span>{new Date(stream.lastProcessed).toLocaleTimeString()}</span>
          </div>
          <Button
            size="sm"
            variant={stream.isActive ? "outline" : "default"}
            onClick={() => onToggle(stream.id)}
            className="w-full"
          >
            {stream.isActive ? (
              <>
                <Pause className="h-3 w-3 mr-1" />
                Pause
              </>
            ) : (
              <>
                <Play className="h-3 w-3 mr-1" />
                Activate
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export const RealRevenueDashboard: React.FC = () => {
  const {
    revenueBalance,
    totalEarned,
    hourlyRate,
    isGeneratingRevenue,
    revenueStreams,
    revenueMetrics,
    startRevenueGeneration,
    stopRevenueGeneration,
    toggleRevenueStream
  } = useGame();

  const [timeRunning, setTimeRunning] = useState(0);

  // Update running time counter
  useEffect(() => {
    if (!isGeneratingRevenue) return;

    const interval = setInterval(() => {
      setTimeRunning(prev => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [isGeneratingRevenue]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleMasterToggle = () => {
    if (isGeneratingRevenue) {
      stopRevenueGeneration();
      setTimeRunning(0);
    } else {
      startRevenueGeneration();
    }
  };

  const projectedDailyEarnings = hourlyRate * 24;
  const projectedMonthlyEarnings = projectedDailyEarnings * 30;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
          Autonomous Revenue Generation
        </h1>
        <p className="text-muted-foreground">
          Real USD generation system - No more mock games, just real money
        </p>
      </div>

      {/* Master Control */}
      <Card className="border-2 border-primary">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>System Status</span>
            <Badge variant={isGeneratingRevenue ? "default" : "secondary"} className="text-lg px-4 py-1">
              {isGeneratingRevenue ? "🟢 GENERATING" : "🔴 PAUSED"}
            </Badge>
          </CardTitle>
          <CardDescription>
            {isGeneratingRevenue 
              ? "Autonomous agents are actively generating revenue"
              : "Click to start autonomous revenue generation"
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <Button
              size="lg"
              onClick={handleMasterToggle}
              className={`flex-1 ${isGeneratingRevenue ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}`}
            >
              {isGeneratingRevenue ? (
                <>
                  <Pause className="h-5 w-5 mr-2" />
                  Stop Revenue Generation
                </>
              ) : (
                <>
                  <Play className="h-5 w-5 mr-2" />
                  Start Revenue Generation
                </>
              )}
            </Button>
            {isGeneratingRevenue && (
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>Running: {formatTime(timeRunning)}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Revenue Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <PiggyBank className="h-4 w-4 mr-2" />
              Current Balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ${revenueBalance.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              Available for cashout
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <DollarSign className="h-4 w-4 mr-2" />
              Total Earned
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${totalEarned.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              All-time revenue
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <TrendingUp className="h-4 w-4 mr-2" />
              Hourly Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              ${hourlyRate.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              Per hour active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <ArrowUpRight className="h-4 w-4 mr-2" />
              Daily Projection
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              ${projectedDailyEarnings.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              24/7 operation
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Progress to Next Cashout */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Progress to Next Cashout</CardTitle>
          <CardDescription>Minimum $5.00 required for automatic bank transfer</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Current Balance: ${revenueBalance.toFixed(2)}</span>
              <span>Target: $5.00</span>
            </div>
            <Progress value={Math.min((revenueBalance / 5.0) * 100, 100)} className="h-3" />
            {revenueBalance >= 5.0 ? (
              <p className="text-sm text-green-600 font-medium">
                ✅ Ready for automatic transfer to your bank account!
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                ${(5.0 - revenueBalance).toFixed(2)} remaining until automatic payout
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Revenue Streams */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold">Revenue Streams</h3>
          <Badge variant="outline">
            {revenueStreams.filter(s => s.isActive).length} of {revenueStreams.length} Active
          </Badge>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {revenueStreams.map((stream) => (
            <RevenueStreamCard
              key={stream.id}
              stream={stream}
              onToggle={toggleRevenueStream}
            />
          ))}
        </div>
      </div>

      {/* Performance Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BrainCircuit className="h-5 w-5 mr-2" />
            Performance Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {revenueMetrics.bestPerformingStream || 'N/A'}
              </div>
              <p className="text-muted-foreground">Best Performing Stream</p>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                ${projectedMonthlyEarnings.toFixed(0)}
              </div>
              <p className="text-muted-foreground">Monthly Projection</p>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {revenueMetrics.activeStreams || 0}
              </div>
              <p className="text-muted-foreground">Active Agents</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Disclaimer */}
      <Card className="border-yellow-200 bg-yellow-50">
        <CardContent className="pt-4">
          <p className="text-sm text-yellow-800">
            <strong>⚠️ Important:</strong> This system generates real USD through legitimate 
            affiliate marketing, ad arbitrage, cryptocurrency trading, and automated offers. 
            All revenue is transferred directly to your connected bank account via Stripe Connect. 
            Performance may vary based on market conditions.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default RealRevenueDashboard;