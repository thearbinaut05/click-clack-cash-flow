import { useState, useEffect, useCallback } from 'react';
// Realtime connections are disabled in local mode
// import { supabase } from '@/integrations/supabase/client';
// import { RealtimeChannel } from '@supabase/supabase-js';

interface RealtimeConnectionState {
  isConnected: boolean;
  isReconnecting: boolean;
  lastHeartbeat: Date | null;
  subscriptions: string[];
  error: string | null;
}

interface ChannelConfig {
  config?: Record<string, unknown>;
  broadcast?: Record<string, unknown>;
  presence?: Record<string, unknown>;
  postgres_changes?: Array<Record<string, unknown>>;
}

export const useRealtimeConnection = () => {
  const [state, setState] = useState<RealtimeConnectionState>({
    isConnected: true, // Always connected in local mode
    isReconnecting: false,
    lastHeartbeat: new Date(),
    subscriptions: [],
    error: null
  });

  // Mock subscribe that doesn't use real Supabase channels
  const subscribe = useCallback((channelName: string, config: ChannelConfig) => {
    console.log('Mock realtime subscription:', channelName);
    
    setState(prev => ({
      ...prev,
      isConnected: true,
      subscriptions: prev.subscriptions.includes(channelName) 
        ? prev.subscriptions 
        : [...prev.subscriptions, channelName]
    }));
    
    return null; // Return null instead of channel
  }, []);

  const unsubscribe = useCallback((channelName: string) => {
    console.log('Mock realtime unsubscribe:', channelName);
    
    setState(prev => ({
      ...prev,
      subscriptions: prev.subscriptions.filter(sub => sub !== channelName)
    }));
  }, []);

  const reconnect = useCallback(() => {
    console.log('Mock realtime reconnect');
    setState(prev => ({ ...prev, isReconnecting: false, isConnected: true }));
  }, []);

  useEffect(() => {
    // Update heartbeat periodically
    const heartbeatInterval = setInterval(() => {
      setState(prev => ({
        ...prev,
        lastHeartbeat: new Date()
      }));
    }, 5000);

    return () => clearInterval(heartbeatInterval);
  }, []);

  return {
    ...state,
    subscribe,
    unsubscribe,
    reconnect
  };
};