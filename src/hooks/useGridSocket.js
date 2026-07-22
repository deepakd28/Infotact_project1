import { useEffect, useState } from 'react';

function parsePayload(rawData) {
  if (!rawData) return null;

  if (typeof rawData === 'object') return rawData;

  if (typeof rawData !== 'string') return null;

  try {
    return JSON.parse(rawData);
  } catch {
    return rawData;
  }
}

export function useGridSocket(url) {
  const [isConnected, setIsConnected] = useState(false);
  const [latestData, setLatestData] = useState(null);
  const [socketError, setSocketError] = useState(null);

  useEffect(() => {
    if (!url) return;

    const socket = new WebSocket(url);

    socket.onopen = () => {
      setIsConnected(true);
      setSocketError(null);
    };
    socket.onclose = () => setIsConnected(false);
    socket.onerror = () => {
      setIsConnected(false);
      setSocketError('Unable to reach the telemetry WebSocket endpoint.');
    };
    socket.onmessage = (event) => {
      try {
        const parsed = parsePayload(event.data);
        if (parsed != null) {
          setLatestData(parsed);
        }
      } catch (err) {
        console.error('Error processing grid telemetry stream packet', err);
      }
    };

    return () => socket.close();
  }, [url]);

  return { isConnected, latestData, socketError };
}