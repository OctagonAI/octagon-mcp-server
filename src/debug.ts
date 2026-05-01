const DEFAULT_DEBUG_ENABLED = true;

function parseBooleanFlag(
  value: string | undefined,
  defaultValue: boolean,
): boolean {
  if (value === undefined) {
    return defaultValue;
  }

  const normalized = value.trim().toLowerCase();
  if (normalized === "") {
    return defaultValue;
  }

  if (["1", "true", "yes", "on"].includes(normalized)) {
    return true;
  }

  if (["0", "false", "no", "off"].includes(normalized)) {
    return false;
  }

  return defaultValue;
}

export const OCTAGON_MCP_DEBUG = parseBooleanFlag(
  process.env.OCTAGON_MCP_DEBUG,
  DEFAULT_DEBUG_ENABLED,
);

function safeSerialize(payload: unknown): string {
  if (typeof payload === "string") {
    return payload;
  }

  try {
    return JSON.stringify(payload, null, 2);
  } catch (error) {
    return `<<unserializable payload: ${String(error)}>>`;
  }
}

export function debugLog(label: string, payload?: unknown): void {
  if (!OCTAGON_MCP_DEBUG) {
    return;
  }

  if (payload === undefined) {
    console.error(`[octagon-mcp][debug] ${label}`);
    return;
  }

  console.error(
    `[octagon-mcp][debug] ${label}\n${safeSerialize(payload)}`,
  );
}
