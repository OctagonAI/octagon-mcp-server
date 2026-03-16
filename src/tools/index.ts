import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import OpenAI from "openai";

import { registerTool as registerDeepResearchTool } from "#tools/deepResearchAgent";
import { registerTool as registerStockDataTool } from "#tools/octagonAgent";

export function registerMcpTools(server: McpServer, client: OpenAI): void {
  registerDeepResearchTool(server, client);
  registerStockDataTool(server, client);
}
