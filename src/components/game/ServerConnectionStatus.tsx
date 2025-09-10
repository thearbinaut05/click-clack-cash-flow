import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, Activity } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface ServerConnection {
  isConnected: boolean;
  latency: number;
  lastSync: Date;
  activeConnections: number;
  status: 'connected' | 'connecting' | 'disconnected' | 'error';
}

export const ServerConnectionStatus: React.FC = () => {
  const [connection, setConnection] = useState<ServerConnection>({
    isConnected: false,
    latency: 0,
    lastSync: new Date(),
    activeConnections: 0,
    status: 'connecting'
  });

  useEffect(() => {
    // Simulate real-time server connection monitoring
    const checkConnection = async () => {
      try {
        const start = Date.now();
        
        // Ping server endpoint
        const response = await fetch('/api/health', {
          method: 'HEAD',
          cache: 'no-cache'
        });
        
        const latency = Date.now() - start;
        
        setConnection(prev => ({
          ...prev,
          isConnected: response.ok,
          latency,
          lastSync: new Date(),
          status: response.ok ? 'connected' : 'error',
          activeConnections: prev.activeConnections + (response.ok ? 1 : 0)
        }));
      } catch (error) {
        setConnection(prev => ({
          ...prev,
          isConnected: false,
          status: 'disconnected',
          lastSync: new Date()
        }));
      }
    };

    // Initial check
    checkConnection();

    // Check every 5 seconds
    const interval = setInterval(checkConnection, 5000);

    // Cleanup
    return () => clearInterval(interval);
  }, []);

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
      case 'connected': return 'Connected';
      case 'connecting': return 'Connecting...';
      case 'disconnected': return 'Disconnected';
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
          
          <span>
            Last sync: {connection.lastSync.toLocaleTimeString()}
          </span>
        </div>
      </div>
    </Card>
  );
};