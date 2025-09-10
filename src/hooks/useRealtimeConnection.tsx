import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';

interface RealtimeConnectionState {
  isConnected: boolean;
  isReconnecting: boolean;
  lastHeartbeat: Date | null;
  subscriptions: string[];
  error: string | null;
}

export const useRealtimeConnection = () => {
  const [state, setState] = useState<RealtimeConnectionState>({
    isConnected: false,
    isReconnecting: false,
    lastHeartbeat: null,
    subscriptions: [],
    error: null
  });

  const [channels] = useState<Map<string, RealtimeChannel>>(new Map());

  const subscribe = useCallback((channelName: string, config: any) => {
    if (channels.has(channelName)) {
      return channels.get(channelName);
    }

    const channel = supabase.channel(channelName, config);
    
    channel
      .on('presence', { event: 'sync' }, () => {
        setState(prev => ({
          ...prev,
          lastHeartbeat: new Date(),
          isConnected: true,
          error: null
        }));
      })
      .on('postgres_changes', { event: '*', schema: 'public' }, (payload) => {
        console.log('Database change:', payload);
        setState(prev => ({
          ...prev,
          lastHeartbeat: new Date()
        }));
      })
      .subscribe((status) => {
        setState(prev => ({
          ...prev,
          isConnected: status === 'SUBSCRIBED',
          isReconnecting: status === 'CHANNEL_ERROR',
          subscriptions: prev.subscriptions.includes(channelName) 
            ? prev.subscriptions 
            : [...prev.subscriptions, channelName],
          error: status === 'CHANNEL_ERROR' ? 'Connection error' : null
        }));
      });

    channels.set(channelName, channel);
    return channel;
  }, [channels]);

  const unsubscribe = useCallback((channelName: string) => {
    const channel = channels.get(channelName);
    if (channel) {
      supabase.removeChannel(channel);
      channels.delete(channelName);
      
      setState(prev => ({
        ...prev,
        subscriptions: prev.subscriptions.filter(sub => sub !== channelName)
      }));
    }
  }, [channels]);

  const reconnect = useCallback(() => {
    setState(prev => ({ ...prev, isReconnecting: true }));
    
    // Force reconnection by resubscribing to all channels
    const currentSubscriptions = [...state.subscriptions];
    
    channels.forEach((channel, name) => {
      supabase.removeChannel(channel);
      channels.delete(name);
    });

    currentSubscriptions.forEach(name => {
      setTimeout(() => subscribe(name, {}), 1000);
    });
  }, [state.subscriptions, subscribe]);

  useEffect(() => {
    // Monitor connection health
    const healthCheck = setInterval(() => {
      if (state.lastHeartbeat) {
        const timeSinceLastHeartbeat = Date.now() - state.lastHeartbeat.getTime();
        
        // If no heartbeat for 30 seconds, attempt reconnection
        if (timeSinceLastHeartbeat > 30000 && !state.isReconnecting) {
          reconnect();
        }
      }
    }, 10000);

    return () => clearInterval(healthCheck);
  }, [state.lastHeartbeat, state.isReconnecting, reconnect]);

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      channels.forEach(channel => {
        supabase.removeChannel(channel);
      });
      channels.clear();
    };
  }, [channels]);

  return {
    ...state,
    subscribe,
    unsubscribe,
    reconnect
  };
};