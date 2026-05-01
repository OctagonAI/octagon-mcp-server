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

test("octagon-agent reuses stored conversation in the same session", async () => {
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

test("octagon-agent reuses stored conversation with threadKey when sessionId is null", async () => {
  const capturedRequests = [];
  const client = {
    responses: {
      create: async request => {
        capturedRequests.push(request);
        return {
          id: `resp_thread_${capturedRequests.length}`,
          conversation: "conv_thread_key",
          output_text: "Thread-key answer",
          metadata: { tool: "mcp" },
        };
      },
    },
  };

  await executeOctagonAgentTool(client, {
    prompt: "first thread-key turn",
    threadKey: "visible-chat-1",
  });
  await executeOctagonAgentTool(client, {
    prompt: "follow-up without explicit conversation",
    threadKey: "visible-chat-1",
  });

  assert.equal(capturedRequests[0].conversation, undefined);
  assert.equal(capturedRequests[1].conversation, "conv_thread_key");
});

test("octagon-agent does not auto-reuse when sessionId and threadKey are missing", async () => {
  const capturedRequests = [];
  const client = {
    responses: {
      create: async request => {
        capturedRequests.push(request);
        return {
          id: `resp_no_anchor_${capturedRequests.length}`,
          conversation: `conv_no_anchor_${capturedRequests.length}`,
          output_text: "No-anchor answer",
          metadata: { tool: "mcp" },
        };
      },
    },
  };

  await executeOctagonAgentTool(client, {
    prompt: "first turn without safe anchor",
  });
  await executeOctagonAgentTool(client, {
    prompt: "second turn without safe anchor",
  });

  assert.equal(capturedRequests[0].conversation, undefined);
  assert.equal(capturedRequests[1].conversation, undefined);
});

test("octagon-agent resetConversation drops stored conversation", async () => {
  const capturedRequests = [];
  const client = {
    responses: {
      create: async request => {
        capturedRequests.push(request);
        return {
          id: `resp_reset_${capturedRequests.length}`,
          conversation: `conv_reset_${capturedRequests.length}`,
          output_text: "Reset-aware answer",
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
    { prompt: "new chat", resetConversation: true },
    { sessionId: "chat-reset" },
  );

  assert.equal(capturedRequests[0].conversation, undefined);
  assert.equal(capturedRequests[1].conversation, undefined);
});

test("octagon-agent resetConversation clears the active threadKey anchor", async () => {
  const capturedRequests = [];
  const client = {
    responses: {
      create: async request => {
        capturedRequests.push(request);
        return {
          id: `resp_thread_reset_${capturedRequests.length}`,
          conversation: `conv_thread_reset_${capturedRequests.length}`,
          output_text: "Thread-key reset answer",
          metadata: { tool: "mcp" },
        };
      },
    },
  };

  await executeOctagonAgentTool(client, {
    prompt: "first turn",
    threadKey: "visible-chat-reset",
  });
  await executeOctagonAgentTool(client, {
    prompt: "reset thread",
    threadKey: "visible-chat-reset",
    resetConversation: true,
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

test("switching to a non-octagon tool clears stored conversation", async () => {
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
  assert.equal(capturedRequests[1].conversation, undefined);
});
