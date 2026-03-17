import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import OpenAI from "openai";
import { z } from "zod";

import { createResponse } from "#tools/shared";

const AGENT_NAME = "octagon-agent";
const AGENT_DESCRIPTION =
  "Orchestrates all agents for comprehensive market intelligence analysis. Capabilities: Combines insights from SEC filings, earnings calls, financial metrics, stock data, institutional holdings, private company research, funding analysis, M&A transactions, investor intelligence, and debt analysis to provide holistic market intelligence. Best for: Complex research requiring multiple data sources and comprehensive analysis across public and private markets.";

const INPUT_SCHEMA = {
  prompt: z
    .string()
    .describe("Your natural language query or request for the agent"),
};

type Params = {
  prompt: string;
};

export function registerTool(server: McpServer, client: OpenAI): void {
  (server as any).tool(
    AGENT_NAME,
    AGENT_DESCRIPTION,
    INPUT_SCHEMA,
    async ({ prompt }: Params) => {
      try {
        const result = await createResponse(client, AGENT_NAME, prompt);
        return {
          content: [{ type: "text", text: result }],
        };
      } catch (error) {
        console.error("Error calling Octagon agent:", error);
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: "Error: Failed to process Octagon agent query.",
            },
          ],
        };
      }
    },
  );
}
