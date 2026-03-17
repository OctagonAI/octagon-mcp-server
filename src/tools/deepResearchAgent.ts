import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import OpenAI from "openai";
import { z } from "zod";

import { createResponse } from "#tools/shared";

const AGENT_NAME = "octagon-deep-research-agent";
const AGENT_DESCRIPTION =
  "A comprehensive agent that can utilize multiple sources for deep research analysis. Capabilities: Aggregate research across multiple data sources, synthesize information, and provide comprehensive investment research. Best for: Investment research questions requiring up-to-date aggregated information from the web.";

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
        console.error("Error calling Deep Research agent:", error);
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: "Error: Failed to process deep research query.",
            },
          ],
        };
      }
    },
  );
}
