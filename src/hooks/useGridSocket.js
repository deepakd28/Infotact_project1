import { useEffect, useState } from 'react';

export function useGridSocket(url) {
  const [isConnected, setIsConnected] = useState(false);
  const [latestData, setLatestData] = useState(null);

  useEffect(() => {
    if (!url) return;

    const socket = new WebSocket(url);

    socket.onopen = () => setIsConnected(true);
    socket.onclose = () => setIsConnected(false);
    socket.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data);
        setLatestData(parsed);
      } catch (err) {
        console.error("Error processing grid telemetry stream packet", err);
      }
    };

    return () => socket.close();
  }, [url]);

  return { isConnected, latestData };
}