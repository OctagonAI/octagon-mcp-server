#!/usr/bin/env node

import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import express from "express";
import cors from "cors";
import { createServer } from "./shared.js";

// Load environment variables from shared
import { OCTAGON_API_KEY } from "./shared.js";

const PORT = process.env.PORT || 3000;

// Create MCP server using shared code
const server = createServer();

// Setup Express server with SSE transport
function startServer() {
  const app = express();
  app.use(express.json());
  app.use(cors());
  
  let transport: SSEServerTransport | null = null;

  // SSE endpoint
  app.get("/sse", (req: express.Request, res: express.Response) => {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    
    transport = new SSEServerTransport("/messages", res);
    server.connect(transport);
    
    // Handle client disconnect
    req.on("close", () => {
      console.log("Client disconnected");
      if (transport) {
        // Properly handle disconnection - McpServer doesn't have disconnect method
        transport = null;
      }
    });
  });

  // Message endpoint for client-to-server communication
  app.post("/messages", (req: express.Request, res: express.Response) => {
    if (transport) {
      transport.handlePostMessage(req, res);
    } else {
      res.status(400).json({ error: "No active SSE connection" });
    }
  });

  // Start the Express server
  app.listen(PORT, () => {
    console.log(`Octagon MCP Server listening on port ${PORT}`);
    console.log(`Connect to SSE endpoint at http://localhost:${PORT}/sse`);
    console.log(`Send messages to http://localhost:${PORT}/messages`);
  });
}

// Start the server
startServer();
