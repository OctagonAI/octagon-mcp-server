import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import OpenAI, { APIError } from "openai";
import { z } from "zod";

import { clearOctagonConversationForToolChange } from "../toolSessionState.js";

const TOOL_NAME = "prediction_markets_history";
const TOOL_DESCRIPTION = `Fetch historical data for a prediction market event by ticker.
Supports pagination (limit, cursor) and time window (captured_from, captured_to) and optionally include analysis columns.

Note: For a typical Kalshi Market URL, the event ticker is the final segment in the URL.
For example, for the URL https://kalshi.com/markets/kxbtcy/btc-price-range-eoy/kxbtcy-27jan0100, the event ticker is kxbtcy-27jan0100.`;

const predictionMarketsHistoryInputShape = {
  event_ticker: z
    .string()
    .describe(
      "The event ticker symbol for the prediction market (e.g. KXBTCY-27JAN0100). Case-insensitive.",
    ),
  limit: z
    .number()
    .optional()
    .describe("Maximum number of history records to return (pagination)"),
  cursor: z
    .string()
    .optional()
    .describe("Pagination cursor from a previous response"),
  captured_from: z
    .string()
    .optional()
    .describe("Start of the historical window (inclusive)"),
  captured_to: z
    .string()
    .optional()
    .describe("End of the historical window (inclusive)"),
  include_analysis: z
    .boolean()
    .optional()
    .describe("If true, include heavy analysis columns in the response"),
};

export const predictionMarketsHistoryInputSchema = z
  .object(predictionMarketsHistoryInputShape)
  .strict();

type PredictionMarketsHistoryClient = OpenAI & {
  get: (
    path: string,
    options: { query: Record<string, string | number> },
  ) => Promise<unknown>;
};

type Params = {
  event_ticker: string;
  limit: number | undefined;
  cursor: string | undefined;
  captured_from: string | undefined;
  captured_to: string | undefined;
  include_analysis: boolean | undefined;
};

type ToolExtra = {
  sessionId?: string;
};

export async function executePredictionMarketsHistoryTool(
  client: PredictionMarketsHistoryClient,
  params: Params,
  extra?: ToolExtra,
) {
  try {
    clearOctagonConversationForToolChange(extra, TOOL_NAME);
    const eventTicker = encodeURIComponent(params.event_ticker.trim());

    const query: Record<string, string | number> = {};
    if (params.limit != null) query.limit = params.limit;
    if (params.cursor != null) query.cursor = params.cursor;
    if (params.captured_from != null) {
      query.captured_from = params.captured_from;
    }
    if (params.captured_to != null) query.captured_to = params.captured_to;
    if (params.include_analysis === true) query.include = "analysis";

    const data = await client.get(
      `/prediction-markets/events/${eventTicker}/history`,
      { query },
    );

    return {
      content: [
        {
          type: "text" as const,
          text: typeof data === "string" ? data : JSON.stringify(data),
        },
      ],
    };
  } catch (error) {
    console.error(`Error calling ${TOOL_NAME}:`, error);

    let errorMessage = (error as Error).message ?? String(error);
    let errorCode = "unknown";

    if (error instanceof APIError) {
      const err = error.error as { message?: string } | undefined;
      errorMessage = err?.message ?? errorMessage;
      errorCode = error.code ?? errorCode;
    }

    return {
      isError: true as const,
      content: [
        {
          type: "text" as const,
          text:
            errorCode !== "unknown"
              ? `Error [${errorCode}]: ${errorMessage}`
              : `Error: Failed to fetch prediction markets history for ${params.event_ticker}.`,
        },
      ],
    };
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
    TOOL_NAME,
    TOOL_DESCRIPTION,
    predictionMarketsHistoryInputShape,
    async (params, extra) =>
      executePredictionMarketsHistoryTool(
        client as PredictionMarketsHistoryClient,
        params,
        extra,
      ),
  );
}
