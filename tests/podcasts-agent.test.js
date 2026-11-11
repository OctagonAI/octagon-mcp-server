import assert from "node:assert/strict";
import test from "node:test";

import { executePodcastsTool, podcastsInputSchema } from "../dist/tools/podcastsAgent.js";

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
