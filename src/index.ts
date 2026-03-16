#!/usr/bin/env node

import createClient from "#client";
import { registerMcpTools } from "#tools";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { readFile } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

// Get package.json info
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const packageJsonPath = path.join(__dirname, "..", "package.json");
const packageJsonContent = await readFile(packageJsonPath, "utf8");
const packageInfo = JSON.parse(packageJsonContent) as {
  name: string;
  version: string;
};

// Create MCP server
const server = new McpServer({
  name: packageInfo.name,
  version: packageInfo.version,
});

const octagonClient = createClient({
  defaultHeaders: {
    "User-Agent": `${packageInfo.name}/${packageInfo.version} (Node.js/${process.versions.node})`,
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
