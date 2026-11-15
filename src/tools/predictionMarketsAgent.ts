import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import OpenAI, { APIError } from "openai";
import { z } from "zod";

import { type SessionExtra } from "../toolSessionState.js";
import {
  createMissingApiKeyResult,
  createStreamingTextResponse,
  createTextErrorResult,
} from "#tools/shared";

const AGENT_NAME = "octagon-prediction-markets-agent";
const AGENT_DESCRIPTION =
  "A specialized agent for researching prediction markets on Kalshi and Polymarket. Takes a market URL, a Kalshi event ticker, or a Polymarket event slug and returns a cited report: what's driving the price, the market-implied probability against Octagon's model probability, catalysts, resolution history, and the market's Trust Score. Can also find the markets that exist for a topic across both venues and screen them by where the model disagrees with the price. For a specific market, try cache: true first; it is instant and free.";

const predictionMarketsInputShape = {
  prompt: z
    .string()
    .describe(
      "A Kalshi market URL or event ticker, a Polymarket event URL or event slug, or a natural-language question about prediction markets (which markets exist or are open for a topic, where the model disagrees with the price).",
    ),
  cache: z
    .boolean()
    .optional()
    .describe(
      "Report mode for a single market. true: read the cached report only (never generates, free). false: force a fresh report (3 credits; Plus, Pro and Enterprise plans). Omitted: the cached report if one exists, otherwise generate one. Natural-language search questions work in every mode; with cache: true they return a structured JSON list of markets.",
    ),
};

export const predictionMarketsInputSchema = z
  .object(predictionMarketsInputShape)
  .strict();

type Params = {
  prompt: string;
  cache: boolean | undefined;
};

export async function executePredictionMarketsTool(
  client: OpenAI,
  { prompt, cache }: Params,
  extra?: SessionExtra,
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
    const result = await createStreamingTextResponse(client, model, prompt);
    return {
      content: [{ type: "text" as const, text: result }],
    };
  } catch (error) {
    console.error(`Error calling ${model}:`, error);

    // The Octagon API's error messages are written for the end user (a missing or
    // unresolved market reference, an ambiguous ticker, a closed market, a plan or
    // credit limit); forward them the way the history tool does.
    if (error instanceof APIError && error.code) {
      const err = error.error as { message?: string } | undefined;
      return createTextErrorResult(
        `Error [${error.code}]: ${err?.message ?? error.message}`,
      );
    }
    return createTextErrorResult(
      "Error: Failed to process prediction markets query.",
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
    predictionMarketsInputShape,
    async (args, extra) =>
      client
        ? executePredictionMarketsTool(client, args, extra)
        : Promise.resolve(createMissingApiKeyResult()),
  );
}
