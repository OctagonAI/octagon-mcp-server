import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import OpenAI from "openai";
import { z } from "zod";

import { debugLog } from "../debug.js";
import {
  clearOctagonConversation,
  getStoredOctagonConversation,
  resolveThreadAnchor,
  storeOctagonConversation,
  type ToolContext,
} from "../toolSessionState.js";
import { createOctagonAgentResponse, createTextErrorResult } from "#tools/shared";

const AGENT_NAME = "octagon-agent";
const AGENT_DESCRIPTION =
  "Orchestrates all agents for comprehensive market intelligence analysis. Capabilities: Combines insights from SEC filings, earnings calls, financial metrics, stock data, institutional holdings, private company research, funding analysis, M&A transactions, investor intelligence, and debt analysis to provide holistic market intelligence. Best for: Complex research requiring multiple data sources and comprehensive analysis across public and private markets.";

const octagonAgentInputShape = {
  prompt: z
    .string()
    .describe("Your natural language query or request for the agent"),
  conversation: z
    .string()
    .optional()
    .describe(
      "Existing Octagon conversation ID to continue a prior octagon-agent thread. Omit on the first turn.",
    ),
  threadKey: z
    .string()
    .optional()
    .describe(
      "Logical visible chat/thread identifier to reuse octagon-agent conversation when MCP transport does not provide a session id.",
    ),
  resetConversation: z
    .boolean()
    .optional()
    .describe(
      "If true, drop any stored octagon-agent thread for the active session/thread anchor before processing the request.",
    ),
};

export const octagonAgentInputSchema = z.object(octagonAgentInputShape).strict();

export const octagonAgentOutputSchema = z.object({
  model: z.literal(AGENT_NAME),
  text: z.string(),
  conversation: z.string().optional(),
  responseId: z.string().optional(),
  followUp: z
    .object({
      required: z.boolean(),
      instructions: z.string().optional(),
      inputTemplate: z.string().optional(),
      exampleRequest: z.string().optional(),
      missingIdentifier: z.string().optional(),
      reason: z.string().optional(),
      source: z.string().optional(),
    })
    .optional(),
  rawMetadata: z.record(z.string()).optional(),
});

type Params = {
  prompt: string;
  conversation?: string;
  threadKey?: string;
  resetConversation?: boolean;
};

export async function executeOctagonAgentTool(
  client: OpenAI,
  { prompt, conversation, threadKey, resetConversation }: Params,
  extra?: ToolContext,
) {
  try {
    const threadContext = {
      sessionId: extra?.sessionId,
      threadKey,
    };
    const threadAnchor = resolveThreadAnchor(threadContext);
    const storedThreadState = getStoredOctagonConversation(threadContext);
    const storedConversation = storedThreadState?.conversation;

    if (resetConversation) {
      clearOctagonConversation(threadContext, "explicit_reset");
    }

    const resolvedConversation =
      conversation ??
      (resetConversation ? undefined : storedConversation);
    const anchorType = conversation
      ? "provided_conversation"
      : threadAnchor?.type ?? "none";
    const conversationSource = conversation
      ? "provided"
      : resolvedConversation && threadAnchor?.type === "session"
        ? "stored_session"
        : resolvedConversation && threadAnchor?.type === "thread_key"
          ? "stored_thread_key"
          : "new";

    debugLog("octagon-agent inbound MCP request", {
      prompt,
      promptLength: prompt.length,
      sessionId: extra?.sessionId ?? null,
      threadKey: threadKey ?? null,
      anchorType,
      providedConversation: conversation ?? null,
      storedConversation: storedConversation ?? null,
      resolvedConversation: resolvedConversation ?? null,
      hasConversation: Boolean(resolvedConversation),
      resetConversation: Boolean(resetConversation),
      conversationSource,
    });

    const result = await createOctagonAgentResponse(client, {
      prompt,
      conversation: resolvedConversation,
    });

    if (result.conversation) {
      storeOctagonConversation(threadContext, {
        conversation: result.conversation,
        responseId: result.responseId,
      });
    }

    const toolResult = {
      content: [{ type: "text" as const, text: result.text }],
      structuredContent: result,
    };

    debugLog("octagon-agent outbound MCP tool result", toolResult);

    return toolResult;
  } catch (error) {
    console.error("Error calling Octagon agent:", error);
    return createTextErrorResult(
      "Error: Failed to process Octagon agent query.",
    );
  }
}

export function registerTool(server: McpServer, client: OpenAI): void {
  const toolServer = server as unknown as {
    tool: (
      name: string,
      description: string,
      inputSchema: Record<string, z.ZodTypeAny>,
      callback: (args: Params, extra?: ToolContext) => Promise<unknown>,
    ) => unknown;
  };

  toolServer.tool(
    AGENT_NAME,
    AGENT_DESCRIPTION,
    octagonAgentInputShape,
    async (
      { prompt, conversation, threadKey, resetConversation }: Params,
      extra?: ToolContext,
    ) =>
      executeOctagonAgentTool(
        client,
        { prompt, conversation, threadKey, resetConversation },
        extra,
      ),
  );
}
