import OpenAI from "openai";

import { debugLog } from "../debug.js";

type ResponseOutputTextLike = {
  type?: string;
  text?: string;
};

type ResponseOutputMessageLike = {
  type?: string;
  content?: unknown[];
};

type OctagonResponseLike = {
  id?: unknown;
  conversation?: unknown;
  output_text?: unknown;
  output?: unknown[];
  metadata?: unknown;
};

export type OctagonFollowUp = {
  required: boolean;
  instructions?: string;
  inputTemplate?: string;
  exampleRequest?: string;
  missingIdentifier?: string;
  reason?: string;
  source?: string;
};

export type OctagonAgentResponse = {
  model: "octagon-agent";
  text: string;
  conversation?: string;
  responseId?: string;
  followUp?: OctagonFollowUp;
  rawMetadata?: Record<string, string>;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function asNonEmptyString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() !== "" ? value : undefined;
}

function normalizeMetadata(
  value: unknown,
): Record<string, string> | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  const metadata: Record<string, string> = {};
  for (const [key, entry] of Object.entries(value)) {
    if (typeof entry === "string") {
      metadata[key] = entry;
      continue;
    }

    if (entry === null) {
      metadata[key] = "null";
      continue;
    }

    if (typeof entry === "boolean") {
      metadata[key] = entry ? "true" : "false";
      continue;
    }

    if (typeof entry === "number") {
      metadata[key] = String(entry);
      continue;
    }

    try {
      metadata[key] = JSON.stringify(entry);
    } catch {
      metadata[key] = String(entry);
    }
  }

  return Object.keys(metadata).length > 0 ? metadata : undefined;
}

function extractTextFromOutput(output: unknown): string {
  if (!Array.isArray(output)) {
    return "";
  }

  const parts: string[] = [];
  for (const item of output) {
    if (!isRecord(item)) {
      continue;
    }

    if (item.type !== "message") {
      continue;
    }

    const message = item as ResponseOutputMessageLike;
    if (!Array.isArray(message.content)) {
      continue;
    }

    for (const part of message.content) {
      if (!isRecord(part)) {
        continue;
      }

      const outputText = part as ResponseOutputTextLike;
      if (outputText.type === "output_text" && typeof outputText.text === "string") {
        parts.push(outputText.text);
      }
    }
  }

  return parts.join("");
}

function extractResponseText(response: OctagonResponseLike): string {
  const outputText = asNonEmptyString(response.output_text);
  if (outputText) {
    return outputText;
  }

  return extractTextFromOutput(response.output);
}

function extractFollowUp(
  metadata: Record<string, string> | undefined,
): OctagonFollowUp | undefined {
  if (!metadata || metadata.follow_up_required !== "true") {
    return undefined;
  }

  return {
    required: true,
    instructions: metadata.follow_up_instructions,
    inputTemplate: metadata.follow_up_input_template,
    exampleRequest: metadata.follow_up_example_request,
    missingIdentifier: metadata.follow_up_missing_identifier,
    reason: metadata.follow_up_reason,
    source: metadata.follow_up_source,
  };
}

export async function processStreamingResponse(
  stream: AsyncIterable<unknown>,
): Promise<string> {
  let fullResponse = "";

  try {
    for await (const chunk of stream) {
      if (!isRecord(chunk) || chunk.type !== "response.output_text.delta") {
        continue;
      }

      if (typeof chunk.delta === "string") {
        fullResponse += chunk.delta;
      } else if (
        isRecord(chunk.text) &&
        typeof chunk.text.delta === "string"
      ) {
        fullResponse += chunk.text.delta;
      }
    }

    return fullResponse;
  } catch (error) {
    console.error("Error processing streaming response:", error);
    throw error;
  }
}

export async function createStreamingTextResponse(
  client: OpenAI,
  model: string,
  prompt: string,
): Promise<string> {
  const response = await client.responses.create({
    model,
    input: prompt,
    stream: true,
    metadata: { tool: "mcp" },
  });

  return await processStreamingResponse(response);
}

export async function createOctagonAgentResponse(
  client: OpenAI,
  {
    prompt,
    conversation,
  }: {
    prompt: string;
    conversation?: string;
  },
): Promise<OctagonAgentResponse> {
  const response = (await (
    client.responses.create as unknown as (params: unknown) => Promise<unknown>
  ).call(client.responses, {
    model: "octagon-agent",
    input: prompt,
    metadata: { tool: "mcp" },
    ...(conversation ? { conversation } : {}),
  })) as OctagonResponseLike;

  debugLog("octagon-agent raw Octagon response", response);

  const rawMetadata = normalizeMetadata(response.metadata);
  const text = extractResponseText(response);

  const parsedResponse: OctagonAgentResponse = {
    model: "octagon-agent",
    text,
    conversation: asNonEmptyString(response.conversation),
    responseId: asNonEmptyString(response.id),
    followUp: extractFollowUp(rawMetadata),
    rawMetadata,
  };

  debugLog("octagon-agent parsed MCP response payload", parsedResponse);

  return parsedResponse;
}

export function createTextErrorResult(message: string) {
  return {
    isError: true as const,
    content: [{ type: "text" as const, text: message }],
  };
}
