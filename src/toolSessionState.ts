import { debugLog } from "./debug.js";

export type ToolContext = {
  sessionId?: string;
  threadKey?: string;
};

type OctagonSessionState = {
  conversation?: string;
  responseId?: string;
};

const octagonConversationBySession = new Map<string, OctagonSessionState>();

export type ThreadAnchor =
  | {
      key: string;
      type: "session";
    }
  | {
      key: string;
      type: "thread_key";
    };

export function resolveThreadAnchor(
  context?: ToolContext,
): ThreadAnchor | undefined {
  if (context?.sessionId) {
    return {
      key: `session:${context.sessionId}`,
      type: "session",
    };
  }

  if (context?.threadKey) {
    return {
      key: `thread:${context.threadKey}`,
      type: "thread_key",
    };
  }

  return undefined;
}

export function getStoredOctagonConversation(
  context?: ToolContext,
): OctagonSessionState | undefined {
  const anchor = resolveThreadAnchor(context);
  if (!anchor) {
    return undefined;
  }

  return octagonConversationBySession.get(anchor.key);
}

export function storeOctagonConversation(
  context: ToolContext | undefined,
  value: OctagonSessionState,
): void {
  const anchor = resolveThreadAnchor(context);
  if (!anchor) {
    return;
  }

  octagonConversationBySession.set(anchor.key, value);
}

export function clearOctagonConversation(
  context?: ToolContext,
  reason?: string,
): void {
  const anchor = resolveThreadAnchor(context);
  if (!anchor) {
    return;
  }

  const hadConversation = octagonConversationBySession.delete(anchor.key);

  if (hadConversation) {
    debugLog("octagon-agent session conversation cleared", {
      sessionId: context?.sessionId ?? null,
      threadKey: context?.threadKey ?? null,
      anchorType: anchor.type,
      anchorKey: anchor.key,
      reason: reason ?? "unspecified",
    });
  }
}

export function clearOctagonConversationForToolChange(
  context: ToolContext | undefined,
  toolName: string,
): void {
  if (toolName === "octagon-agent") {
    return;
  }

  clearOctagonConversation(context, `tool_changed:${toolName}`);
}
