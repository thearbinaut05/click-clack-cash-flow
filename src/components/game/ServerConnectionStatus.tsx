import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, Activity, RefreshCw } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import SupabaseHealthService, { SupabaseHealth } from '@/services/SupabaseHealthService';

interface ServerConnection {
  isConnected: boolean;
  latency: number;
  lastSync: Date;
  activeConnections: number;
  status: 'connected' | 'connecting' | 'disconnected' | 'error';
  supabaseHealth?: SupabaseHealth;
}

export const ServerConnectionStatus: React.FC = () => {
  const [connection, setConnection] = useState<ServerConnection>({
    isConnected: false,
    latency: 0,
    lastSync: new Date(),
    activeConnections: 0,
    status: 'connecting'
  });

  const [healthService] = useState(() => SupabaseHealthService.getInstance());

  useEffect(() => {
    // Subscribe to Supabase health updates
    const unsubscribe = healthService.subscribe((health) => {
      setConnection(prev => ({
        ...prev,
        isConnected: health.isConnected,
        latency: health.latency,
        lastSync: health.lastCheck,
        status: health.isHealthy ? 'connected' : health.isConnected ? 'error' : 'disconnected',
        supabaseHealth: health,
        activeConnections: health.isConnected ? 1 : 0
      }));
    });

    // Cleanup subscription on unmount
    return unsubscribe;
  }, [healthService]);

  const handleForceCheck = async () => {
    setConnection(prev => ({ ...prev, status: 'connecting' }));
    await healthService.forceCheck();
  };

  const getStatusColor = () => {
    switch (connection.status) {
      case 'connected': return 'bg-green-500';
      case 'connecting': return 'bg-yellow-500';
      case 'disconnected': return 'bg-red-500';
      case 'error': return 'bg-red-600';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = () => {
    switch (connection.status) {
      case 'connected': return 'Supabase Connected';
      case 'connecting': return 'Connecting...';
      case 'disconnected': return 'Supabase Offline';
      case 'error': return 'Connection Error';
      default: return 'Unknown';
    }
  };

  return (
    <Card className="p-4 bg-card/50 backdrop-blur-sm border-primary/20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {connection.isConnected ? (
            <Wifi className="h-5 w-5 text-green-500" />
          ) : (
            <WifiOff className="h-5 w-5 text-red-500" />
          )}
          
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${getStatusColor()} animate-pulse`} />
            <span className="text-sm font-medium">{getStatusText()}</span>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          {connection.isConnected && (
            <>
              <div className="flex items-center gap-1">
                <Activity className="h-3 w-3" />
                <span>{connection.latency}ms</span>
              </div>
              
              <Badge variant="secondary" className="text-xs">
                {connection.activeConnections} active
              </Badge>
            </>
          )}
          
          {!connection.isConnected && (
            <Button
              onClick={handleForceCheck}
              variant="outline"
              size="sm"
              className="h-6 px-2 text-xs"
              disabled={connection.status === 'connecting'}
            >
              <RefreshCw className={`h-3 w-3 mr-1 ${connection.status === 'connecting' ? 'animate-spin' : ''}`} />
              Retry
            </Button>
          )}
          
          <span>
            Last sync: {connection.lastSync.toLocaleTimeString()}
          </span>
          
          {connection.supabaseHealth?.error && (
            <span className="text-red-400 text-xs truncate max-w-40" title={connection.supabaseHealth.error}>
              {connection.supabaseHealth.error}
            </span>
          )}
        </div>
      </div>
    </Card>
  );
};