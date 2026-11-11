import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import OpenAI from "openai";
import { z } from "zod";

import { type SessionExtra } from "../toolSessionState.js";
import {
  createMissingApiKeyResult,
  createStreamingTextResponse,
  createTextErrorResult,
} from "#tools/shared";

const AGENT_NAME = "octagon-podcasts-agent";
const AGENT_DESCRIPTION =
  "Answers questions from what investors, strategists, operators and guests said on finance and business podcasts (Bloomberg, All-In, Odd Lots, Invest Like the Best, Excess Returns and 70 more shows). Capabilities: synthesizes who thinks what and why, where views agree and disagree, filtered by time window, show, host, guest, company or ticker read from the question; every claim cites the episode (show, title, date, link, deep-linked to the chapter when available). Best for: market views and sentiment from spoken commentary, what a named person said recently, what the latest episodes of a show covered, and which companies podcasts discussed most. Earnings calls are not podcasts: use octagon-agent for those.";

const podcastsInputShape = {
  prompt: z
    .string()
    .describe(
      "Your question about podcast commentary; put the time window, show, host, guest, company or ticker in it",
    ),
};

export const podcastsInputSchema = z.object(podcastsInputShape).strict();

type Params = {
  prompt: string;
};

export async function executePodcastsTool(
  client: OpenAI,
  { prompt }: Params,
  extra?: SessionExtra,
) {
  try {
    const result = await createStreamingTextResponse(client, AGENT_NAME, prompt);
    return {
      content: [{ type: "text" as const, text: result }],
    };
  } catch (error) {
    console.error("Error calling Podcasts agent:", error);
    return createTextErrorResult(
      "Error: Failed to process podcasts query.",
    );
  }
}

export function registerTool(server: McpServer, client: OpenAI | null): void {
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
    podcastsInputShape,
    async (args, extra) =>
      client
        ? executePodcastsTool(client, args, extra)
        : Promise.resolve(createMissingApiKeyResult()),
  );
}
