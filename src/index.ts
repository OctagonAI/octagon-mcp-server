#!/usr/bin/env node

import createClient from "#client";
import { registerMcpTools } from "#tools";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import OpenAI from "openai";
import { OCTAGON_MCP_DEBUG, debugLog } from "./debug.js";
import { registerDocs } from "./docs/index.js";
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

    let octagonClient: OpenAI | null = null;
    try {
      octagonClient = createClient({
        defaultHeaders: {
          "User-Agent": `${PACKAGE_NAME}/${VERSION} (Node.js/${process.versions.node})`,
        },
      });
    } catch (error) {
      console.error(
        "Warning: OCTAGON_API_KEY is not set. Octagon API-backed tools will return a configuration error, but documentation tools remain available.",
      );
      debugLog("Octagon API client unavailable", {
        reason: error instanceof Error ? error.message : String(error),
      });
    }

    debugLog("MCP server starting", {
      packageName: PACKAGE_NAME,
      version: VERSION,
      debugEnabled: OCTAGON_MCP_DEBUG,
      transportKind: "stdio",
    });

    registerDocs(server);
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
