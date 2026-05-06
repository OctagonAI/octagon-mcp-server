import assert from "node:assert/strict";
import test from "node:test";

import {
  deepResearchInputSchema,
  executeDeepResearchTool,
} from "../dist/tools/deepResearchAgent.js";
import {
  executeOctagonAgentTool,
  octagonAgentInputSchema,
} from "../dist/tools/octagonAgent.js";
import {
  getDefaultStdioSessionIdForTests,
  resetSessionStateForTests,
  terminateSession,
} from "../dist/toolSessionState.js";

test.beforeEach(() => {
  resetSessionStateForTests();
});

test("octagon-agent first turn returns structured conversation metadata", async () => {
  let capturedRequest;
  const client = {
    responses: {
      create: async request => {
        capturedRequest = request;
        return {
          id: "resp_123",
          conversation: "conv_123",
          output_text: "Which stock would you like the latest price for?",
          metadata: {
            follow_up_required: "true",
            follow_up_instructions:
              "Reply with just the missing detail and reuse the conversation value from this response.",
            follow_up_input_template: "<ticker or company name>",
            follow_up_example_request:
              '{"model":"octagon-agent","conversation":"conv_123","input":"<ticker or company name>"}',
            follow_up_missing_identifier: "company_or_ticker",
            follow_up_reason: "Missing target company.",
            follow_up_source: "synthesized",
          },
        };
      },
    },
  };

  const result = await executeOctagonAgentTool(
    client,
    {
      prompt: "what is the latest stock price?",
    },
    { sessionId: "chat-1" },
  );

  assert.deepEqual(capturedRequest, {
    model: "octagon-agent",
    input: "what is the latest stock price?",
    metadata: { tool: "mcp" },
  });
  assert.deepEqual(result.content, [
    {
      type: "text",
      text: "Which stock would you like the latest price for?",
    },
  ]);
  assert.equal(result.structuredContent?.conversation, "conv_123");
  assert.equal(result.structuredContent?.responseId, "resp_123");
  assert.deepEqual(result.structuredContent?.followUp, {
    required: true,
    instructions:
      "Reply with just the missing detail and reuse the conversation value from this response.",
    inputTemplate: "<ticker or company name>",
    exampleRequest:
      '{"model":"octagon-agent","conversation":"conv_123","input":"<ticker or company name>"}',
    missingIdentifier: "company_or_ticker",
    reason: "Missing target company.",
    source: "synthesized",
  });
});

test("octagon-agent forwards conversation on later turns", async () => {
  let capturedRequest;
  const client = {
    responses: {
      create: async request => {
        capturedRequest = request;
        return {
          id: "resp_456",
          conversation: "conv_existing",
          output_text: "Here is the follow-up answer.",
          metadata: { tool: "mcp" },
        };
      },
    },
  };

  const parsed = octagonAgentInputSchema.parse({
    prompt: "and what about Microsoft?",
    conversation: "conv_existing",
  });
  const result = await executeOctagonAgentTool(client, parsed, {
    sessionId: "chat-explicit",
  });

  assert.equal(capturedRequest.conversation, "conv_existing");
  assert.equal(result.structuredContent?.conversation, "conv_existing");
  assert.equal(result.content[0].text, "Here is the follow-up answer.");
});

test("octagon-agent rejects blank conversation ids at the schema boundary", async () => {
  assert.throws(
    () =>
      octagonAgentInputSchema.parse({
        prompt: "follow up",
        conversation: "   ",
      }),
    /at least 1 character/i,
  );
});

test("octagon-agent reuses stored conversation in the same transport session", async () => {
  const capturedRequests = [];
  const client = {
    responses: {
      create: async request => {
        capturedRequests.push(request);
        return {
          id: `resp_${capturedRequests.length}`,
          conversation: "conv_session_reused",
          output_text: "Session-aware answer",
          metadata: { tool: "mcp" },
        };
      },
    },
  };

  await executeOctagonAgentTool(
    client,
    { prompt: "first turn" },
    { sessionId: "chat-reuse" },
  );
  await executeOctagonAgentTool(
    client,
    { prompt: "second turn without explicit conversation" },
    { sessionId: "chat-reuse" },
  );

  assert.equal(capturedRequests[0].conversation, undefined);
  assert.equal(capturedRequests[1].conversation, "conv_session_reused");
});

test("octagon-agent reuses stored conversation in a transport-backed session", async () => {
  const capturedRequests = [];
  const client = {
    responses: {
      create: async request => {
        capturedRequests.push(request);
        return {
          id: `resp_transport_priority_${capturedRequests.length}`,
          conversation:
            capturedRequests.length === 1
              ? "conv_transport_session"
              : "conv_transport_followup",
          output_text: "Transport-priority answer",
          metadata: { tool: "mcp" },
        };
      },
    },
  };

  await executeOctagonAgentTool(
    client,
    { prompt: "first turn" },
    { sessionId: "transport-session-2", transportKind: "streamable_http" },
  );
  await executeOctagonAgentTool(
    client,
    { prompt: "follow up" },
    { sessionId: "transport-session-2", transportKind: "streamable_http" },
  );

  assert.equal(capturedRequests[0].conversation, undefined);
  assert.equal(capturedRequests[1].conversation, "conv_transport_session");
});

test("octagon-agent isolates stdio and transport sessions even with the same sessionId", async () => {
  const capturedRequests = [];
  const client = {
    responses: {
      create: async request => {
        capturedRequests.push(request);
        return {
          id: `resp_transport_isolation_${capturedRequests.length}`,
          conversation: `conv_transport_isolation_${capturedRequests.length}`,
          output_text: "Transport isolation answer",
          metadata: { tool: "mcp" },
        };
      },
    },
  };

  await executeOctagonAgentTool(
    client,
    { prompt: "stdio first turn" },
    { sessionId: "shared-session", transportKind: "stdio" },
  );
  await executeOctagonAgentTool(
    client,
    { prompt: "http first turn" },
    { sessionId: "shared-session", transportKind: "streamable_http" },
  );
  await executeOctagonAgentTool(
    client,
    { prompt: "stdio follow up" },
    { sessionId: "shared-session", transportKind: "stdio" },
  );
  await executeOctagonAgentTool(
    client,
    { prompt: "http follow up" },
    { sessionId: "shared-session", transportKind: "streamable_http" },
  );

  assert.equal(capturedRequests[0].conversation, undefined);
  assert.equal(capturedRequests[1].conversation, undefined);
  assert.equal(capturedRequests[2].conversation, "conv_transport_isolation_1");
  assert.equal(capturedRequests[3].conversation, "conv_transport_isolation_2");
});

test("octagon-agent automatically uses the default stdio session when no anchor is provided", async () => {
  const capturedRequests = [];
  const client = {
    responses: {
      create: async request => {
        capturedRequests.push(request);
        return {
          id: `resp_stdio_default_${capturedRequests.length}`,
          conversation: `conv_stdio_default_${capturedRequests.length}`,
          output_text: "Default stdio answer",
          metadata: { tool: "mcp" },
        };
      },
    },
  };

  await executeOctagonAgentTool(client, {
    prompt: "first turn without explicit anchor",
  });
  await executeOctagonAgentTool(client, {
    prompt: "second turn without explicit anchor",
  });

  assert.equal(capturedRequests[0].conversation, undefined);
  assert.equal(capturedRequests[1].conversation, "conv_stdio_default_1");
});

test("octagon-agent newConversation forces a fresh thread in the default stdio session", async () => {
  const capturedRequests = [];
  const client = {
    responses: {
      create: async request => {
        capturedRequests.push(request);
        return {
          id: `resp_new_conversation_${capturedRequests.length}`,
          conversation: `conv_new_conversation_${capturedRequests.length}`,
          output_text: "New conversation answer",
          metadata: { tool: "mcp" },
        };
      },
    },
  };

  await executeOctagonAgentTool(client, {
    prompt: "first chat turn",
  });
  await executeOctagonAgentTool(client, {
    prompt: "first turn of a new chat",
    newConversation: true,
  });
  await executeOctagonAgentTool(client, {
    prompt: "follow-up in the new chat",
  });

  assert.equal(capturedRequests[0].conversation, undefined);
  assert.equal(capturedRequests[1].conversation, undefined);
  assert.equal(capturedRequests[2].conversation, "conv_new_conversation_2");
});

test("octagon-agent rejects conversation with newConversation", async () => {
  let callCount = 0;
  const client = {
    responses: {
      create: async () => {
        callCount += 1;
        return {
          id: "resp_unexpected_conflict",
          conversation: "conv_unexpected_conflict",
          output_text: "Unexpected conflict answer",
          metadata: { tool: "mcp" },
        };
      },
    },
  };

  const result = await executeOctagonAgentTool(client, {
    prompt: "conflicting request",
    conversation: "conv_existing",
    newConversation: true,
  });

  assert.equal(callCount, 0);
  assert.equal(result.isError, true);
  assert.match(
    result.content[0].text,
    /cannot include both conversation and newConversation/i,
  );
});

test("octagon-agent newConversation drops stored conversation in a transport session", async () => {
  const capturedRequests = [];
  const client = {
    responses: {
      create: async request => {
        capturedRequests.push(request);
        return {
          id: `resp_reset_${capturedRequests.length}`,
          conversation: `conv_reset_${capturedRequests.length}`,
          output_text: "New-conversation-aware answer",
          metadata: { tool: "mcp" },
        };
      },
    },
  };

  await executeOctagonAgentTool(
    client,
    { prompt: "first turn" },
    { sessionId: "chat-reset" },
  );
  await executeOctagonAgentTool(
    client,
    { prompt: "new chat", newConversation: true },
    { sessionId: "chat-reset" },
  );

  assert.equal(capturedRequests[0].conversation, undefined);
  assert.equal(capturedRequests[1].conversation, undefined);
});

test("octagon-agent preserves the previous thread if newConversation request fails", async () => {
  const capturedRequests = [];
  let callCount = 0;
  const client = {
    responses: {
      create: async request => {
        callCount += 1;
        capturedRequests.push(request);

        if (callCount === 2) {
          throw new Error("transient octagon failure");
        }

        return {
          id: `resp_preserve_${callCount}`,
          conversation:
            callCount === 1 ? "conv_preserve_original" : "conv_preserve_original",
          output_text: "Preserve-thread answer",
          metadata: { tool: "mcp" },
        };
      },
    },
  };

  await executeOctagonAgentTool(
    client,
    { prompt: "first turn" },
    { sessionId: "chat-preserve-reset" },
  );

  const failedReset = await executeOctagonAgentTool(
    client,
    { prompt: "start fresh", newConversation: true },
    { sessionId: "chat-preserve-reset" },
  );

  await executeOctagonAgentTool(
    client,
    { prompt: "retry after failed reset" },
    { sessionId: "chat-preserve-reset" },
  );

  assert.equal(failedReset.isError, true);
  assert.equal(capturedRequests[0].conversation, undefined);
  assert.equal(capturedRequests[1].conversation, undefined);
  assert.equal(capturedRequests[2].conversation, "conv_preserve_original");
});

test("octagon-agent explicit conversation overrides the stored session conversation", async () => {
  const capturedRequests = [];
  const client = {
    responses: {
      create: async request => {
        capturedRequests.push(request);
        return {
          id: `resp_override_${capturedRequests.length}`,
          conversation:
            capturedRequests.length === 1 ? "conv_session_original" : "conv_branch",
          output_text: "Override-aware answer",
          metadata: { tool: "mcp" },
        };
      },
    },
  };

  await executeOctagonAgentTool(
    client,
    { prompt: "first turn" },
    { sessionId: "chat-override" },
  );
  await executeOctagonAgentTool(
    client,
    {
      prompt: "branch from another thread",
      conversation: "conv_explicit_branch",
    },
    { sessionId: "chat-override" },
  );
  await executeOctagonAgentTool(
    client,
    { prompt: "continue after override" },
    { sessionId: "chat-override" },
  );

  assert.equal(capturedRequests[0].conversation, undefined);
  assert.equal(capturedRequests[1].conversation, "conv_explicit_branch");
  assert.equal(capturedRequests[2].conversation, "conv_branch");
});

test("octagon-agent isolates conversation state across different sessions", async () => {
  const capturedRequests = [];
  const client = {
    responses: {
      create: async request => {
        capturedRequests.push(request);
        return {
          id: `resp_isolation_${capturedRequests.length}`,
          conversation: `conv_isolation_${capturedRequests.length}`,
          output_text: "Isolation answer",
          metadata: { tool: "mcp" },
        };
      },
    },
  };

  await executeOctagonAgentTool(
    client,
    { prompt: "session one first turn" },
    { sessionId: "chat-isolation-1" },
  );
  await executeOctagonAgentTool(
    client,
    { prompt: "session two first turn" },
    { sessionId: "chat-isolation-2" },
  );
  await executeOctagonAgentTool(
    client,
    { prompt: "session one follow-up" },
    { sessionId: "chat-isolation-1" },
  );

  assert.equal(capturedRequests[0].conversation, undefined);
  assert.equal(capturedRequests[1].conversation, undefined);
  assert.equal(capturedRequests[2].conversation, "conv_isolation_1");
});

test("octagon-agent session termination clears stored session state", async () => {
  const capturedRequests = [];
  const client = {
    responses: {
      create: async request => {
        capturedRequests.push(request);
        return {
          id: `resp_terminate_${capturedRequests.length}`,
          conversation: `conv_terminate_${capturedRequests.length}`,
          output_text: "Terminate-aware answer",
          metadata: { tool: "mcp" },
        };
      },
    },
  };

  await executeOctagonAgentTool(
    client,
    { prompt: "first turn" },
    { sessionId: "chat-terminate" },
  );
  terminateSession(
    { sessionId: "chat-terminate", transportKind: "stdio" },
    "test_cleanup",
  );
  await executeOctagonAgentTool(
    client,
    { prompt: "new session after termination" },
    { sessionId: "chat-terminate" },
  );

  assert.equal(capturedRequests[0].conversation, undefined);
  assert.equal(capturedRequests[1].conversation, undefined);
});

test("octagon-agent stdio default session can be explicitly terminated", async () => {
  const capturedRequests = [];
  const client = {
    responses: {
      create: async request => {
        capturedRequests.push(request);
        return {
          id: `resp_stdio_terminate_${capturedRequests.length}`,
          conversation: `conv_stdio_terminate_${capturedRequests.length}`,
          output_text: "Terminate stdio answer",
          metadata: { tool: "mcp" },
        };
      },
    },
  };

  await executeOctagonAgentTool(client, {
    prompt: "first turn",
  });
  terminateSession(
    {
      sessionId: getDefaultStdioSessionIdForTests(),
      transportKind: "stdio",
    },
    "test_stdio_cleanup",
  );
  await executeOctagonAgentTool(client, {
    prompt: "second turn after termination",
  });

  assert.equal(capturedRequests[0].conversation, undefined);
  assert.equal(capturedRequests[1].conversation, undefined);
});

test("non-octagon tools remain non-threaded", async () => {
  assert.throws(
    () =>
      deepResearchInputSchema.parse({
        prompt: "Research AI infrastructure demand",
        conversation: "conv_should_fail",
      }),
    /Unrecognized key/,
  );

  const client = {
    responses: {
      create: async () => ({
        [Symbol.asyncIterator]: async function* () {
          yield {
            type: "response.output_text.delta",
            delta: "Deep research answer",
          };
        },
      }),
    },
  };

  const result = await executeDeepResearchTool(
    client,
    {
      prompt: "Research AI infrastructure demand",
    },
    { sessionId: "chat-non-octagon" },
  );

  assert.deepEqual(result, {
    content: [{ type: "text", text: "Deep research answer" }],
  });
  assert.ok(!("structuredContent" in result));
});

test("non-octagon tools do not modify stored octagon conversation", async () => {
  const capturedRequests = [];
  const octagonClient = {
    responses: {
      create: async request => {
        capturedRequests.push(request);
        return {
          id: `resp_tool_change_${capturedRequests.length}`,
          conversation: "conv_tool_change",
          output_text: "Thread state answer",
          metadata: { tool: "mcp" },
        };
      },
    },
  };
  const nonOctagonClient = {
    responses: {
      create: async () => ({
        [Symbol.asyncIterator]: async function* () {
          yield {
            type: "response.output_text.delta",
            delta: "Deep research answer",
          };
        },
      }),
    },
  };

  await executeOctagonAgentTool(
    octagonClient,
    { prompt: "first octagon turn" },
    { sessionId: "chat-tool-change" },
  );
  await executeDeepResearchTool(
    nonOctagonClient,
    { prompt: "different tool call" },
    { sessionId: "chat-tool-change" },
  );
  await executeOctagonAgentTool(
    octagonClient,
    { prompt: "octagon again" },
    { sessionId: "chat-tool-change" },
  );

  assert.equal(capturedRequests[0].conversation, undefined);
  assert.equal(capturedRequests[1].conversation, "conv_tool_change");
});
