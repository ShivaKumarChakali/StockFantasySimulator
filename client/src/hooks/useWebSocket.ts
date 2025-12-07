import { useEffect, useRef, useState } from "react";

interface WebSocketMessage {
  type: string;
  [key: string]: any;
}

interface UseWebSocketOptions {
  onPortfolioUpdate?: (data: any) => void;
  onContestUpdate?: (data: any) => void;
  onStockUpdate?: (symbol: string, price: number) => void;
  portfolioId?: string;
  contestId?: string;
  userId?: string;
}

export function useWebSocket(options: UseWebSocketOptions = {}) {
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const optionsRef = useRef(options);

  // Keep options ref up to date without causing re-renders
  // This runs on every render to sync the ref, but doesn't cause re-renders itself
  useEffect(() => {
    optionsRef.current = options;
  }); // Intentionally no deps - we want to update ref on every render

  // Extract stable values for dependency array
  const portfolioId = options.portfolioId;
  const contestId = options.contestId;
  const userId = options.userId;

  useEffect(() => {
    // Only connect if we have at least one subscription ID
    if (!portfolioId && !contestId && !userId) {
      // No need to connect WebSocket if nothing to subscribe to
      return () => {}; // Return empty cleanup function
    }
    
    // Determine WebSocket URL
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    
    // Get hostname and port more reliably
    const hostname = window.location.hostname || "localhost";
    let port: string | number = window.location.port;
    
    // If port is empty, undefined, or "undefined" (string), use default
    if (!port || port === "" || port === "undefined" || String(port) === "undefined") {
      port = protocol === "wss:" ? "443" : "8081";
    }
    
    // Ensure port is a string
    port = String(port);
    
    // Construct host with explicit port
    const host = `${hostname}:${port}`;
    const wsUrl = `${protocol}//${host}/ws`;
    
    console.log("[WebSocket] Connecting to:", wsUrl);

    const connect = () => {
      try {
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          setIsConnected(true);
          console.log("[WebSocket] Connected successfully");

          // Subscribe to updates using stable values from closure
          if (userId || portfolioId || contestId) {
            ws.send(
              JSON.stringify({
                type: "subscribe",
                userId,
                portfolioId,
                contestId,
              })
            );
          }
        };

        ws.onmessage = (event) => {
          try {
            const message: WebSocketMessage = JSON.parse(event.data);

            const currentOptions = optionsRef.current;
            switch (message.type) {
              case "connected":
                console.log("WebSocket connection confirmed");
                break;
              case "pong":
                // Keepalive response
                break;
              case "portfolio_update":
                if (message.portfolioId === currentOptions.portfolioId) {
                  currentOptions.onPortfolioUpdate?.(message.data);
                }
                break;
              case "contest_update":
                if (message.contestId === currentOptions.contestId) {
                  currentOptions.onContestUpdate?.(message.data);
                }
                break;
              case "stock_update":
                currentOptions.onStockUpdate?.(message.symbol, message.price);
                break;
            }
          } catch (error) {
            console.error("Error parsing WebSocket message:", error);
          }
        };

        ws.onerror = (error) => {
          console.error("WebSocket error:", error);
          setIsConnected(false);
        };

        ws.onclose = () => {
          setIsConnected(false);
          console.log("[WebSocket] Disconnected - will reconnect in 3s");

          // Reconnect after 3 seconds
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, 3000);
        };
      } catch (error) {
        console.error("Error connecting WebSocket:", error);
        setIsConnected(false);
      }
    };

    connect();

    // Keepalive ping every 30 seconds
    const pingInterval = setInterval(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: "ping" }));
      }
    }, 30000);

    return () => {
      console.log("[WebSocket] Cleaning up connection");
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      clearInterval(pingInterval);
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [portfolioId, contestId, userId]); // Only reconnect if these IDs change (using stable values)

  return { isConnected };
}

