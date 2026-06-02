import assert from "node:assert/strict";
import test from "node:test";

import {
  assertAllowedDocsUrl,
  fetchDocsText,
} from "../dist/docs/fetcher.js";

const originalFetch = globalThis.fetch;

test.afterEach(() => {
  globalThis.fetch = originalFetch;
});

test("assertAllowedDocsUrl rejects unsupported hosts", () => {
  assert.throws(
    () => assertAllowedDocsUrl("https://example.com/docs/llms.txt"),
    /Unsupported docs URL host/,
  );
});

test("fetchDocsText returns text and cache headers", async () => {
  globalThis.fetch = async () =>
    new Response("# Docs", {
      status: 200,
      headers: {
        "content-type": "text/markdown",
        etag: '"abc"',
        "last-modified": "Tue, 02 Jun 2026 12:00:00 GMT",
      },
    });

  const result = await fetchDocsText("https://octagonai.co/docs/llms.txt");

  assert.equal(result.text, "# Docs");
  assert.equal(result.contentType, "text/markdown");
  assert.equal(result.etag, '"abc"');
  assert.equal(result.lastModified, "Tue, 02 Jun 2026 12:00:00 GMT");
});

test("fetchDocsText reports non-2xx responses", async () => {
  let calls = 0;
  globalThis.fetch = async () => {
    calls += 1;
    return new Response("missing", { status: 404 });
  };

  await assert.rejects(
    fetchDocsText("https://octagonai.co/docs/missing.md", {
      retryCount: 2,
      retryDelayMs: 0,
    }),
    /HTTP 404/,
  );
  assert.equal(calls, 1);
});

test("fetchDocsText retries transient fetch failures", async () => {
  let calls = 0;
  globalThis.fetch = async () => {
    calls += 1;
    if (calls === 1) {
      throw new TypeError("fetch failed");
    }

    return new Response("# Docs after retry", {
      status: 200,
      headers: { "content-type": "text/markdown" },
    });
  };

  const result = await fetchDocsText("https://octagonai.co/docs/llms.txt", {
    retryCount: 1,
    retryDelayMs: 0,
  });

  assert.equal(calls, 2);
  assert.equal(result.text, "# Docs after retry");
});

test("fetchDocsText retries temporary server errors", async () => {
  let calls = 0;
  globalThis.fetch = async () => {
    calls += 1;
    if (calls === 1) {
      return new Response("temporary", { status: 503 });
    }

    return new Response("# Docs after 503", {
      status: 200,
      headers: { "content-type": "text/markdown" },
    });
  };

  const result = await fetchDocsText("https://octagonai.co/docs/llms.txt", {
    retryCount: 1,
    retryDelayMs: 0,
  });

  assert.equal(calls, 2);
  assert.equal(result.text, "# Docs after 503");
});
