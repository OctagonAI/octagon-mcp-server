import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import OpenAI from "openai";
import { z } from "zod";

import {
  clearOctagonConversationForToolChange,
  normalizeToolContext,
  type SessionExtra,
} from "../toolSessionState.js";
import { createStreamingTextResponse, createTextErrorResult } from "#tools/shared";

const AGENT_NAME = "octagon-deep-research-agent";
const AGENT_DESCRIPTION =
  "A comprehensive agent that can utilize multiple sources for deep research analysis. Capabilities: Aggregate research across multiple data sources, synthesize information, and provide comprehensive investment research. Best for: Investment research questions requiring up-to-date aggregated information from the web.";

const deepResearchInputShape = {
  prompt: z
    .string()
    .describe("Your natural language query or request for the agent"),
};

export const deepResearchInputSchema = z.object(deepResearchInputShape).strict();

type Params = {
  prompt: string;
};

export async function executeDeepResearchTool(
  client: OpenAI,
  { prompt }: Params,
  extra?: SessionExtra,
) {
  try {
    clearOctagonConversationForToolChange(normalizeToolContext(extra), AGENT_NAME);
    const result = await createStreamingTextResponse(client, AGENT_NAME, prompt);
    return {
      content: [{ type: "text" as const, text: result }],
    };
  } catch (error) {
    console.error("Error calling Deep Research agent:", error);
    return createTextErrorResult(
      "Error: Failed to process deep research query.",
    );
  }
}

export function registerTool(server: McpServer, client: OpenAI): void {
  const toolServer = server as unknown as {
    tool: (
      name: string,
      description: string,
      inputSchema: Record<string, z.ZodTypeAny>,
      callback: (args: Params, extra?: SessionExtra) => Promise<unknown>,
    ) => unknown;
  };

  toolServer.tool(
    AGENT_NAME,
    AGENT_DESCRIPTION,
    deepResearchInputShape,
    async (args, extra) => executeDeepResearchTool(client, args, extra),
  );
}
