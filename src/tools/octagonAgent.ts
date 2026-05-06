import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import OpenAI from "openai";
import { z } from "zod";

import {
  debugLog,
  summarizeDebugIdentifier,
  summarizeDebugPrompt,
} from "../debug.js";
import {
  clearOctagonConversation,
  getSessionState,
  normalizeToolContext,
  resolveSessionAnchor,
  storeOctagonConversation,
  type SessionExtra,
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
    .trim()
    .min(1)
    .optional()
    .describe(
      "Existing Octagon conversation ID to continue a prior octagon-agent thread. Omit on the first turn.",
    ),
  newConversation: z
    .boolean()
    .optional()
    .describe(
      "If true, start a fresh Octagon conversation for the active session. Top-layer agents should pass this on the first turn of a new user chat.",
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
  newConversation?: boolean;
};

const CONFLICTING_CONTINUATION_ERROR =
  "Error: octagon-agent request cannot include both conversation and newConversation. Use conversation to continue an existing thread, or newConversation to start a fresh one.";
const MISSING_SESSION_ERROR =
  "Error: octagon-agent requires session continuity. Provide MCP transport session identity, rely on the stdio session, or explicitly continue with conversation.";

export async function executeOctagonAgentTool(
  client: OpenAI,
  { prompt, conversation, newConversation }: Params,
  extra?: SessionExtra,
) {
  try {
    const sessionContext = normalizeToolContext(extra);
    const sessionAnchor = resolveSessionAnchor(sessionContext);
    const storedSessionState = getSessionState(sessionContext);
    const storedConversation = storedSessionState?.activeConversationId;
    const effectiveReset = Boolean(newConversation);
    const resetReason = newConversation ? "new_conversation_request" : null;
    const promptSummary = summarizeDebugPrompt(prompt);

    if (conversation && newConversation) {
      debugLog("octagon-agent conflicting continuation arguments", {
        ...promptSummary,
        transportKind: sessionContext.transportKind,
        sessionId: summarizeDebugIdentifier(sessionContext.sessionId),
        providedConversation: summarizeDebugIdentifier(conversation),
        newConversation: true,
      });
      return createTextErrorResult(CONFLICTING_CONTINUATION_ERROR);
    }

    if (!sessionAnchor && !conversation) {
      debugLog("octagon-agent missing required session continuity", {
        ...promptSummary,
        transportKind: sessionContext.transportKind,
        sessionId: summarizeDebugIdentifier(sessionContext.sessionId),
        anchorType: "none",
        providedConversation: null,
        storedConversation: null,
        resolvedConversation: null,
        hasConversation: false,
        newConversation: Boolean(newConversation),
        sessionResetApplied: false,
        resetReason,
        conversationSource: "new",
        sessionRequired: true,
        reuseBlockedReason:
          sessionContext.transportKind === "stdio"
            ? "missing_stdio_session"
            : "missing_required_session_anchor",
      });
      return createTextErrorResult(MISSING_SESSION_ERROR);
    }

    const resolvedConversation =
      conversation ??
      (effectiveReset ? undefined : storedConversation);
    const anchorType = conversation
      ? "provided_conversation"
      : sessionAnchor?.type ?? "none";
    const conversationSource = conversation
      ? "provided"
      : resolvedConversation && sessionAnchor?.type === "transport_session"
        ? "stored_transport_session"
        : resolvedConversation && sessionAnchor?.type === "stdio_session"
          ? "stored_stdio_session"
          : "new";
    const sessionSource = sessionAnchor?.type ?? "none";
    const sessionStateId = storedSessionState?.sessionId ?? sessionAnchor?.sessionId;

    debugLog("octagon-agent inbound MCP request", {
      ...promptSummary,
      transportKind: sessionContext.transportKind,
      sessionId: summarizeDebugIdentifier(sessionContext.sessionId),
      sessionSource,
      sessionStateId: summarizeDebugIdentifier(sessionStateId),
      anchorType,
      providedConversation: summarizeDebugIdentifier(conversation),
      storedConversation: summarizeDebugIdentifier(storedConversation),
      resolvedConversation: summarizeDebugIdentifier(resolvedConversation),
      hasConversation: Boolean(resolvedConversation),
      newConversation: Boolean(newConversation),
      sessionResetApplied: effectiveReset,
      resetReason,
      conversationSource,
      sessionRequired: !conversation,
      reuseBlockedReason:
        !sessionAnchor && !conversation
          ? sessionContext.transportKind === "stdio"
            ? "missing_stdio_session"
            : "missing_required_session_anchor"
          : null,
    });

    const result = await createOctagonAgentResponse(client, {
      prompt,
      conversation: resolvedConversation,
    });

    if (effectiveReset) {
      clearOctagonConversation(sessionContext, resetReason ?? "explicit_reset");
    }

    if (result.conversation) {
      storeOctagonConversation(sessionContext, {
        conversation: result.conversation,
        responseId: result.responseId,
      });
    }

    const toolResult = {
      content: [{ type: "text" as const, text: result.text }],
      structuredContent: result,
    };

    debugLog("octagon-agent outbound MCP tool result", {
      model: result.model,
      conversation: summarizeDebugIdentifier(result.conversation),
      responseId: summarizeDebugIdentifier(result.responseId),
      textLength: result.text.length,
      hasFollowUp: Boolean(result.followUp),
      metadataKeys: result.rawMetadata ? Object.keys(result.rawMetadata) : [],
    });

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
      callback: (args: Params, extra?: SessionExtra) => Promise<unknown>,
    ) => unknown;
  };

  toolServer.tool(
    AGENT_NAME,
    AGENT_DESCRIPTION,
    octagonAgentInputShape,
    async (
      { prompt, conversation, newConversation }: Params,
      extra?: SessionExtra,
    ) =>
      executeOctagonAgentTool(
        client,
        { prompt, conversation, newConversation },
        extra,
      ),
  );
}
