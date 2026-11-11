import assert from "node:assert/strict";
import test from "node:test";

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

import { executePodcastsTool, podcastsInputSchema, registerTool } from "../dist/tools/podcastsAgent.js";

/** A one-chunk Responses stream carrying `text`. */
function streamOf(text) {
  return {
    [Symbol.asyncIterator]: async function* () {
      yield { type: "response.output_text.delta", delta: text };
    },
  };
}

/** An MCP client connected in memory to a server with only the podcasts tool registered. */
async function connectedClient(openaiClient) {
  const server = new McpServer({ name: "test", version: "0.0.0" });
  registerTool(server, openaiClient);
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  await server.connect(serverTransport);
  const client = new Client({ name: "test-client", version: "0.0.0" });
  await client.connect(clientTransport);
  return client;
}

test("podcasts tool calls octagon-podcasts-agent and returns the cited text", async () => {
  const capturedRequests = [];
  const client = {
    responses: {
      create: async request => {
        capturedRequests.push(request);
        return {
          [Symbol.asyncIterator]: async function* () {
            yield { type: "response.output_text.delta", delta: "Guests were bullish on NVDA [1].\n\n" };
            yield { type: "response.output_text.delta", delta: "Sources:\n1. Odd Lots | Chips | 2026-10-01: https://example.com/ep" };
          },
        };
      },
    },
  };

  const result = await executePodcastsTool(client, { prompt: "What are podcasts saying about NVDA?" });

  assert.equal(capturedRequests.length, 1);
  assert.equal(capturedRequests[0].model, "octagon-podcasts-agent");
  assert.equal(capturedRequests[0].input, "What are podcasts saying about NVDA?");
  assert.equal(capturedRequests[0].stream, true);
  assert.deepEqual(result, {
    content: [
      {
        type: "text",
        text: "Guests were bullish on NVDA [1].\n\nSources:\n1. Odd Lots | Chips | 2026-10-01: https://example.com/ep",
      },
    ],
  });
});

test("podcasts tool takes only a prompt", () => {
  assert.throws(
    () => podcastsInputSchema.parse({ prompt: "NVDA", conversation: "conv_x" }),
    /Unrecognized key/,
  );
});

test("podcasts tool returns an error result when the API call fails", async () => {
  const client = { responses: { create: async () => { throw new Error("boom"); } } };
  const result = await executePodcastsTool(client, { prompt: "NVDA" });
  assert.equal(result.isError, true);
  assert.match(result.content[0].text, /podcasts query/);
});

test("MCP call path rejects unknown arguments instead of stripping them", async () => {
  const capturedRequests = [];
  const client = await connectedClient({
    responses: { create: async request => (capturedRequests.push(request), streamOf("answer")) },
  });

  for (const extra of [{ conversation: "conv_x" }, { ticker: "NVDA" }]) {
    const result = await client.callTool({ name: "octagon-podcasts-agent", arguments: { prompt: "NVDA", ...extra } });
    assert.equal(result.isError, true);
    assert.match(result.content[0].text, /Unrecognized key/);
  }
  assert.equal(capturedRequests.length, 0);

  const ok = await client.callTool({ name: "octagon-podcasts-agent", arguments: { prompt: "NVDA" } });
  assert.deepEqual(ok.content, [{ type: "text", text: "answer" }]);
  assert.equal(capturedRequests.length, 1);
});

test("the MCP request's abort signal reaches the upstream API call", async () => {
  const capturedOptions = [];
  const controller = new AbortController();
  const client = {
    responses: { create: async (_request, options) => (capturedOptions.push(options), streamOf("answer")) },
  };

  await executePodcastsTool(client, { prompt: "NVDA" }, { signal: controller.signal });

  assert.equal(capturedOptions.length, 1);
  assert.equal(capturedOptions[0].signal, controller.signal);
});
