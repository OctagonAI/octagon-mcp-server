import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import OpenAI from "openai";
import { z } from "zod";

import { createResponse } from "#tools/shared";

const AGENT_NAME = "octagon-prediction-markets-agent";
const AGENT_DESCRIPTION =
  "A specialized agent for creating research reports on Kalshi events. See what's driving prices, compare market vs model probabilities, and find potential mispricings.";

const INPUT_SCHEMA = {
  prompt: z
    .string()
    .describe("Your natural language query or request for the agent"),
  cache: z.boolean().optional().describe("Whether to cache the response"),
};

type Params = {
  prompt: string;
  cache: boolean | undefined;
};

export function registerTool(server: McpServer, client: OpenAI): void {
  (server as any).tool(
    AGENT_NAME,
    AGENT_DESCRIPTION,
    INPUT_SCHEMA,
    async ({ prompt, cache }: Params) => {
      // Resolve the model variant based on the cache flag
      let model;
      if (cache === undefined) {
        model = AGENT_NAME;
      } else if (cache !== undefined && cache === false) {
        model = `${AGENT_NAME}:refresh`;
      } else {
        model = `${AGENT_NAME}:cache`;
      }

      try {
        const result = await createResponse(client, model, prompt);
        return {
          content: [{ type: "text", text: result }],
        };
      } catch (error) {
        console.error(`Error calling ${model}:`, error);
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: "Error: Failed to process prediction markets query.",
            },
          ],
        };
      }
    },
  );
}
