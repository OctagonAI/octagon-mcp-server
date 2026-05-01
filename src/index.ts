#!/usr/bin/env node

import createClient from "#client";
import { registerMcpTools } from "#tools";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { OCTAGON_MCP_DEBUG, debugLog } from "./debug.js";
import { VERSION } from "./version.js";

const PACKAGE_NAME = "octagon-mcp";

// Start the server with stdio transport
async function main() {
  let server: McpServer | null = null;
  let transport: StdioServerTransport | null = null;
  try {
    // Create MCP server
    server = new McpServer({
      name: PACKAGE_NAME,
      version: VERSION,
    });

    const octagonClient = createClient({
      defaultHeaders: {
        "User-Agent": `${PACKAGE_NAME}/${VERSION} (Node.js/${process.versions.node})`,
      },
    });

    debugLog("MCP server starting", {
      packageName: PACKAGE_NAME,
      version: VERSION,
      debugEnabled: OCTAGON_MCP_DEBUG,
    });

    registerMcpTools(server, octagonClient);

    transport = new StdioServerTransport();
    await server.connect(transport);
  } catch (error) {
    console.error("Error starting server:", error);
    await Promise.allSettled([transport?.close(), server?.close()]);

    process.exit(1);
  }
}

main();
