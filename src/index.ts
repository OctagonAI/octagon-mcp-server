#!/usr/bin/env node

import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createServer } from "./shared.js";

// Create MCP server using shared code
const server = createServer();

// Start the server with stdio transport
async function main() {
  try {
    const transport = new StdioServerTransport();
    await server.connect(transport);
  } catch (error) {
    process.exit(1);
  }
}

main(); 