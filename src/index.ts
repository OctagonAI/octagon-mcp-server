#!/usr/bin/env node

import createClient from "#client";
import { registerMcpTools } from "#tools";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { VERSION } from "./version.js";

const PACKAGE_NAME = "octagon-mcp";

// Create MCP server
const server = new McpServer({
  name: PACKAGE_NAME,
  version: VERSION,
});

const octagonClient = createClient({
  defaultHeaders: {
    "User-Agent": `${PACKAGE_NAME}/${VERSION} (Node.js/${process.versions.node})`,
  },
});

registerMcpTools(server, octagonClient);

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
