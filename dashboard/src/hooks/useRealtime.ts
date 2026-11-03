import { useEffect, useRef, useState } from 'react';

export interface RealtimeMessage {
  event:
    | 'CHANNEL_CREATE'
    | 'CHANNEL_UPDATE'
    | 'CHANNEL_DELETE'
    | 'ROLE_CREATE'
    | 'ROLE_UPDATE'
    | 'ROLE_DELETE'
    | 'MEMBER_JOIN'
    | 'MEMBER_LEAVE'
    | string;
  guildId: string;
  channel?: any;
  channelId?: string;
  roleId?: string;
  memberCount?: number;
  timestamp?: number;
}

export function useRealtime(
  guildId?: string,
  onEvent?: (msg: RealtimeMessage) => void
) {
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<any>(null);
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  useEffect(() => {
    let unmounted = false;

    function connect() {
      if (unmounted) return;
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws`;

      try {
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          if (unmounted) {
            ws.close();
            return;
          }
          setConnected(true);
          if (guildId) {
            ws.send(JSON.stringify({ type: 'subscribe', guildId }));
          }
        };

        ws.onmessage = (event) => {
          try {
            const data: RealtimeMessage = JSON.parse(event.data);
            if (data.event && onEventRef.current) {
              onEventRef.current(data);
            }
          } catch {}
        };

        ws.onclose = () => {
          if (unmounted) return;
          setConnected(false);
          wsRef.current = null;
          reconnectTimeoutRef.current = setTimeout(connect, 3000);
        };

        ws.onerror = () => {
          if (unmounted) return;
          if (ws.readyState === WebSocket.OPEN) {
            try {
              ws.close();
            } catch {}
          }
        };
      } catch (err) {
        if (!unmounted) {
          reconnectTimeoutRef.current = setTimeout(connect, 3000);
        }
      }
    }

    connect();

    return () => {
      unmounted = true;
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      const ws = wsRef.current;
      if (ws) {
        // Detach active callbacks to prevent state updates after unmount
        ws.onmessage = null;
        ws.onerror = null;

        if (ws.readyState === WebSocket.CONNECTING) {
          // If still connecting, defer close until open so the browser doesn't log
          // "WebSocket is closed before the connection is established"
          ws.onopen = () => {
            try {
              ws.close();
            } catch {}
          };
          ws.onclose = null;
        } else if (ws.readyState === WebSocket.OPEN) {
          if (guildId) {
            try {
              ws.send(JSON.stringify({ type: 'unsubscribe', guildId }));
            } catch {}
          }
          ws.close();
        }
        wsRef.current = null;
      }
    };
  }, [guildId]);

  return { connected };
}
