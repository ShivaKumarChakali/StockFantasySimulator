/**
 * WebSocket Server for Real-time Updates
 * Broadcasts portfolio ROI updates and stock price changes
 */

import { WebSocketServer, WebSocket } from "ws";
import type { Server } from "http";

interface Client {
  ws: WebSocket;
  userId?: string;
  portfolioId?: string;
  contestId?: string;
}

class WebSocketManager {
  private wss: WebSocketServer | null = null;
  private clients: Set<Client> = new Set();

  initialize(server: Server) {
    this.wss = new WebSocketServer({ server, path: "/ws" });

    this.wss.on("connection", (ws: WebSocket, req) => {
      const client: Client = { ws };
      this.clients.add(client);

      console.log(`WebSocket client connected. Total clients: ${this.clients.size}`);

      ws.on("message", (message: string) => {
        try {
          const data = JSON.parse(message.toString());
          
          // Handle client subscriptions
          if (data.type === "subscribe") {
            if (data.userId) client.userId = data.userId;
            if (data.portfolioId) client.portfolioId = data.portfolioId;
            if (data.contestId) client.contestId = data.contestId;
          }

          // Handle ping/pong for keepalive
          if (data.type === "ping") {
            ws.send(JSON.stringify({ type: "pong" }));
          }
        } catch (error) {
          console.error("Error parsing WebSocket message:", error);
        }
      });

      ws.on("close", () => {
        this.clients.delete(client);
        console.log(`WebSocket client disconnected. Total clients: ${this.clients.size}`);
      });

      ws.on("error", (error) => {
        console.error("WebSocket error:", error);
        this.clients.delete(client);
      });

      // Send initial connection confirmation
      ws.send(JSON.stringify({ type: "connected" }));
    });

    console.log("WebSocket server initialized on /ws");
  }

  /**
   * Broadcast portfolio ROI update to relevant clients
   */
  broadcastPortfolioUpdate(portfolioId: string, data: any) {
    const message = JSON.stringify({
      type: "portfolio_update",
      portfolioId,
      data,
    });

    this.clients.forEach((client) => {
      if (client.ws.readyState === WebSocket.OPEN && client.portfolioId === portfolioId) {
        client.ws.send(message);
      }
    });
  }

  /**
   * Broadcast contest leaderboard update
   */
  broadcastContestUpdate(contestId: string, data: any) {
    const message = JSON.stringify({
      type: "contest_update",
      contestId,
      data,
    });

    this.clients.forEach((client) => {
      if (client.ws.readyState === WebSocket.OPEN && client.contestId === contestId) {
        client.ws.send(message);
      }
    });
  }

  /**
   * Broadcast stock price update
   */
  broadcastStockUpdate(symbol: string, price: number) {
    const message = JSON.stringify({
      type: "stock_update",
      symbol,
      price,
    });

    this.clients.forEach((client) => {
      if (client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(message);
      }
    });
  }

  /**
   * Get connected clients count
   */
  getClientCount(): number {
    return this.clients.size;
  }
}

export const wsManager = new WebSocketManager();

