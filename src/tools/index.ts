import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import OpenAI from "openai";

import { registerTool as registerDeepResearchTool } from "#tools/deepResearchAgent";
import { registerTool as registerOctagonAgentTool } from "#tools/octagonAgent";
import { registerTool as registerPodcastsTool } from "#tools/podcastsAgent";
import { registerTool as registerPredictionMarketsTool } from "#tools/predictionMarketsAgent";
import { registerTool as registerPredictionMarketsHistoryTool } from "#tools/predictionMarketsHistory";

export function registerMcpTools(server: McpServer, client: OpenAI | null): void {
  registerDeepResearchTool(server, client);
  registerOctagonAgentTool(server, client);
  registerPodcastsTool(server, client);
  registerPredictionMarketsTool(server, client);
  registerPredictionMarketsHistoryTool(server, client);
}
