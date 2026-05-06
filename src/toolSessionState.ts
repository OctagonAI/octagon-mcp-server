import { debugLog } from "./debug.js";
import { randomUUID } from "node:crypto";

export type ToolContext = {
  sessionId?: string;
  transportKind: "stdio" | "streamable_http" | "unknown";
  signal?: AbortSignal;
};

export type SessionExtra = {
  sessionId?: string;
  signal?: AbortSignal;
  transportKind?: "stdio" | "streamable_http" | "unknown";
};

export type SessionState = {
  sessionId: string;
  createdAt: string;
  lastSeenAt: string;
  activeConversationId?: string;
  lastResponseId?: string;
  activeTool?: string;
};

const sessionStateByAnchor = new Map<string, SessionState>();

export type SessionAnchor =
  | {
      key: string;
      sessionId: string;
      type: "transport_session";
    }
  | {
      key: string;
      sessionId: string;
      type: "stdio_session";
    };

const DEFAULT_STDIO_SESSION_ID = `stdio:${randomUUID()}`;

function asNonEmptyString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() !== "" ? value : undefined;
}

function nowIsoString(): string {
  return new Date().toISOString();
}

export function normalizeToolContext(extra?: SessionExtra): ToolContext {
  const normalizedTransportKind = extra?.transportKind ?? "stdio";
  const normalizedSessionId =
    asNonEmptyString(extra?.sessionId) ??
    (normalizedTransportKind === "stdio" ? DEFAULT_STDIO_SESSION_ID : undefined);

  return {
    sessionId: normalizedSessionId,
    transportKind: normalizedTransportKind,
    signal: extra?.signal,
  };
}

export function resolveSessionAnchor(
  context?: ToolContext,
): SessionAnchor | undefined {
  if (context?.transportKind !== "stdio" && context?.sessionId) {
    return {
      key: `session:${context.sessionId}`,
      sessionId: context.sessionId,
      type: "transport_session",
    };
  }

  if (context?.transportKind === "stdio" && context?.sessionId) {
    return {
      key: `session:${context.sessionId}`,
      sessionId: context.sessionId,
      type: "stdio_session",
    };
  }

  return undefined;
}

function upsertSessionState(
  context?: ToolContext,
  {
    activeTool,
    activeConversationId,
    lastResponseId,
  }: {
    activeTool?: string;
    activeConversationId?: string;
    lastResponseId?: string;
  } = {},
): SessionState | undefined {
  const anchor = resolveSessionAnchor(context);
  if (!anchor) {
    return undefined;
  }

  const existing = sessionStateByAnchor.get(anchor.key);
  const timestamp = nowIsoString();
  const nextState: SessionState = {
    sessionId: anchor.sessionId,
    createdAt: existing?.createdAt ?? timestamp,
    lastSeenAt: timestamp,
    activeConversationId:
      activeConversationId ?? existing?.activeConversationId,
    lastResponseId: lastResponseId ?? existing?.lastResponseId,
    activeTool: activeTool ?? existing?.activeTool,
  };

  sessionStateByAnchor.set(anchor.key, nextState);
  return nextState;
}

export function getSessionState(
  context?: ToolContext,
): SessionState | undefined {
  const anchor = resolveSessionAnchor(context);
  if (!anchor) {
    return;
  }

  const existing = sessionStateByAnchor.get(anchor.key);
  if (!existing) {
    return undefined;
  }

  const touchedState: SessionState = {
    ...existing,
    lastSeenAt: nowIsoString(),
  };
  sessionStateByAnchor.set(anchor.key, touchedState);
  return touchedState;
}

export function storeOctagonConversation(
  context: ToolContext | undefined,
  value: {
    conversation?: string;
    responseId?: string;
  },
): SessionState | undefined {
  return upsertSessionState(context, {
    activeTool: "octagon-agent",
    activeConversationId: value.conversation,
    lastResponseId: value.responseId,
  });
}

export function clearOctagonConversation(
  context?: ToolContext,
  reason?: string,
): void {
  const anchor = resolveSessionAnchor(context);
  if (!anchor) {
    return;
  }

  const existing = sessionStateByAnchor.get(anchor.key);
  if (!existing) {
    return;
  }

  const hadConversation = Boolean(
    existing.activeConversationId || existing.lastResponseId,
  );

  const nextState: SessionState = {
    ...existing,
    lastSeenAt: nowIsoString(),
    activeConversationId: undefined,
    lastResponseId: undefined,
  };
  sessionStateByAnchor.set(anchor.key, nextState);

  if (hadConversation) {
    debugLog("octagon-agent session conversation cleared", {
      sessionId: context?.sessionId ?? null,
      transportKind: context?.transportKind ?? "unknown",
      anchorType: anchor.type,
      anchorKey: anchor.key,
      reason: reason ?? "unspecified",
    });
  }
}

export function terminateSession(
  context?: ToolContext,
  reason?: string,
): void {
  const anchor = resolveSessionAnchor(context);
  if (!anchor) {
    return;
  }

  const existing = sessionStateByAnchor.get(anchor.key);
  if (!existing) {
    return;
  }

  sessionStateByAnchor.delete(anchor.key);
  debugLog("mcp session terminated", {
    sessionId: context?.sessionId ?? null,
    transportKind: context?.transportKind ?? "unknown",
    anchorType: anchor.type,
    anchorKey: anchor.key,
    activeTool: existing.activeTool ?? null,
    activeConversationId: existing.activeConversationId ?? null,
    reason: reason ?? "unspecified",
  });
}

export function resetSessionStateForTests(): void {
  sessionStateByAnchor.clear();
}

export function getDefaultStdioSessionIdForTests(): string {
  return DEFAULT_STDIO_SESSION_ID;
}
