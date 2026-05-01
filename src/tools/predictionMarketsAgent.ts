import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import OpenAI from "openai";
import { z } from "zod";

import { clearOctagonConversationForToolChange } from "../toolSessionState.js";
import { createStreamingTextResponse, createTextErrorResult } from "#tools/shared";

const AGENT_NAME = "octagon-prediction-markets-agent";
const AGENT_DESCRIPTION =
  "A specialized agent for creating research reports on Kalshi events. See what's driving prices, compare market vs model probabilities, and find potential mispricings.";

const predictionMarketsInputShape = {
  prompt: z
    .string()
    .describe("Your natural language query or request for the agent"),
  cache: z.boolean().optional().describe("Whether to cache the response"),
};

export const predictionMarketsInputSchema = z
  .object(predictionMarketsInputShape)
  .strict();

type Params = {
  prompt: string;
  cache: boolean | undefined;
};

type ToolExtra = {
  sessionId?: string;
};

export async function executePredictionMarketsTool(
  client: OpenAI,
  { prompt, cache }: Params,
  extra?: ToolExtra,
) {
  let model;
  if (cache === undefined) {
    model = AGENT_NAME;
  } else if (cache === false) {
    model = `${AGENT_NAME}:refresh`;
  } else {
    model = `${AGENT_NAME}:cache`;
  }

  try {
    clearOctagonConversationForToolChange(extra, AGENT_NAME);
    const result = await createStreamingTextResponse(client, model, prompt);
    return {
      content: [{ type: "text" as const, text: result }],
    };
  } catch (error) {
    console.error(`Error calling ${model}:`, error);
    return createTextErrorResult(
      "Error: Failed to process prediction markets query.",
    );
  }
}

export function registerTool(server: McpServer, client: OpenAI): void {
  const toolServer = server as unknown as {
    tool: (
      name: string,
      description: string,
      inputSchema: Record<string, z.ZodTypeAny>,
      callback: (args: Params, extra?: ToolExtra) => Promise<unknown>,
    ) => unknown;
  };

  toolServer.tool(
    AGENT_NAME,
    AGENT_DESCRIPTION,
    predictionMarketsInputShape,
    async (args, extra) => executePredictionMarketsTool(client, args, extra),
  );
}
