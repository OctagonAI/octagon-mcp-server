import assert from "node:assert/strict";
import test from "node:test";

import { OctagonDocsService } from "../dist/docs/index.js";
import {
  executeDocsListTool,
  executeDocsReadTool,
  executeDocsRefreshTool,
  executeDocsSearchTool,
} from "../dist/docs/tools.js";

const originalFetch = globalThis.fetch;

const docsMarkdown = `# Octagon AI

## Octagon Claude Plugin

The Octagon Claude Plugin uses the Octagon AI connector for authentication.

## MCP Server

- [MCP Server Guide](https://octagonai.co/docs/guide/mcp-server): Model Context Protocol integration.
`;

const docsWithLegacyLinks = `# Octagon AI

## API Documentation

- [Available Agents](https://docs.octagonagents.com/docs/guide/agents.html.md): Agent capabilities and model selection.
`;

const docsWithGettingStarted = `# Octagon AI

# How Octagon API Works

## Getting Started with Code Examples

Use the OpenAI-compatible Octagon API with your Octagon API key.
`;

test.afterEach(() => {
  globalThis.fetch = originalFetch;
});

function createMockedService() {
  globalThis.fetch = async () =>
    new Response(docsMarkdown, {
      status: 200,
      headers: { "content-type": "text/markdown" },
    });

  return new OctagonDocsService({
    primaryIndexUrl: "https://octagonai.co/docs/llms.txt",
    cacheTtlMs: 60_000,
  });
}

test("docs list tool returns structured entries", async () => {
  const result = await executeDocsListTool(createMockedService(), { limit: 5 });

  assert.equal(result.structuredContent.count > 0, true);
  assert.match(result.content[0].text, /Octagon Claude Plugin/);
});

test("docs search tool returns snippets and source URLs", async () => {
  const result = await executeDocsSearchTool(createMockedService(), {
    query: "Claude connector",
    includeSnippets: true,
  });

  assert.equal(result.structuredContent.count >= 1, true);
  assert.equal(result.structuredContent.results[0].title, "Octagon Claude Plugin");
  assert.match(result.structuredContent.results[0].snippet, /connector/);
  assert.match(result.structuredContent.results[0].url, /claude-plugin/);
});

test("docs read tool reads cached corpus content", async () => {
  const result = await executeDocsReadTool(createMockedService(), {
    target: "Octagon Claude Plugin",
    maxChars: 2000,
  });

  assert.match(result.content[0].text, /Octagon AI connector/);
  assert.equal(result.structuredContent.truncated, false);
});

test("docs read tool accepts list display labels with section names", async () => {
  globalThis.fetch = async () =>
    new Response(docsWithGettingStarted, {
      status: 200,
      headers: { "content-type": "text/markdown" },
    });

  const service = new OctagonDocsService({
    primaryIndexUrl: "https://octagonai.co/docs/llms.txt",
  });
  const result = await executeDocsReadTool(service, {
    target: "Getting Started with Code Examples (How Octagon API Works)",
    maxChars: 2000,
  });

  assert.match(result.content[0].text, /OpenAI-compatible Octagon API/);
  assert.equal(
    result.structuredContent.entry.title,
    "Getting Started with Code Examples",
  );
});

test("docs service expires cached reads when catalog refreshes", async () => {
  let calls = 0;
  globalThis.fetch = async () => {
    calls += 1;
    const connectorText =
      calls === 1 ? "first connector text" : "second connector text";

    return new Response(
      `# Octagon AI

## Octagon Claude Plugin

The Octagon Claude Plugin uses ${connectorText}.
`,
      {
        status: 200,
        headers: { "content-type": "text/markdown" },
      },
    );
  };

  const service = new OctagonDocsService({
    primaryIndexUrl: "https://octagonai.co/docs/llms.txt",
    cacheTtlMs: -1,
  });

  const first = await service.read({
    target: "Octagon Claude Plugin",
    maxChars: 2000,
  });
  const second = await service.read({
    target: "Octagon Claude Plugin",
    maxChars: 2000,
  });

  assert.match(first.markdown, /first connector text/);
  assert.match(second.markdown, /second connector text/);
  assert.equal(calls, 2);
});

test("docs read tool handles malformed percent-encoded targets", async () => {
  const result = await executeDocsReadTool(createMockedService(), {
    target: "50%",
    maxChars: 2000,
  });

  assert.equal(result.isError, true);
  assert.match(result.content[0].text, /No Octagon docs page matched/);
});

test("docs read tool fetches direct docs URLs even when not cataloged", async () => {
  globalThis.fetch = async url => {
    if (String(url) === "https://octagonai.co/docs/llms.txt") {
      return new Response(docsMarkdown, {
        status: 200,
        headers: { "content-type": "text/markdown" },
      });
    }

    assert.equal(String(url), "https://octagonai.co/docs/guide/mcp-server");
    return new Response("# Octagon MCP Server\n\nDirect page content.", {
      status: 200,
      headers: { "content-type": "text/markdown" },
    });
  };

  const service = new OctagonDocsService({
    primaryIndexUrl: "https://octagonai.co/docs/llms.txt",
  });
  const result = await executeDocsReadTool(service, {
    target: "https://docs.octagonai.co/guide/mcp-server.html",
    maxChars: 2000,
  });

  assert.match(result.content[0].text, /Direct page content/);
  assert.equal(
    result.structuredContent.canonicalUrl,
    "https://octagonai.co/docs/guide/mcp-server",
  );
});

test("docs read tool modernizes legacy docs links before fetching", async () => {
  globalThis.fetch = async url => {
    if (String(url) === "https://octagonai.co/docs/llms.txt") {
      return new Response(docsWithLegacyLinks, {
        status: 200,
        headers: { "content-type": "text/markdown" },
      });
    }

    assert.equal(String(url), "https://octagonai.co/docs/guide/agents");
    return new Response("# Octagon Agents\n\nAvailable agent docs.", {
      status: 200,
      headers: { "content-type": "text/markdown" },
    });
  };

  const service = new OctagonDocsService({
    primaryIndexUrl: "https://octagonai.co/docs/llms.txt",
  });
  const result = await executeDocsReadTool(service, {
    target: "Available Agents",
    maxChars: 2000,
  });

  assert.match(result.content[0].text, /Available agent docs/);
});

test("docs refresh tool reports refreshed catalogs", async () => {
  const result = await executeDocsRefreshTool(createMockedService(), {});

  assert.match(result.content[0].text, /docs:/);
  assert.equal(result.structuredContent.catalogs[0].entries > 0, true);
});
