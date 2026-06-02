import assert from "node:assert/strict";
import test from "node:test";

import { parseDocsCatalog } from "../dist/docs/catalog.js";

const fetched = {
  url: "https://octagonai.co/docs/llms.txt",
  finalUrl: "https://octagonai.co/docs/llms.txt",
  fetchedAt: "2026-06-02T12:00:00.000Z",
  text: `# Octagon AI

## API Documentation

- [Authentication Guide](https://docs.octagonagents.com/docs/guide/rest-api/authentication.html.md): API key setup.
- [Responses API](/docs/guide/rest-api/responses.html.md): Structured responses.

## Claude Plugin

Install the plugin from Claude and connect the Octagon AI connector.
`,
};

test("parseDocsCatalog indexes headings and links", () => {
  const catalog = parseDocsCatalog(fetched, {
    source: "docs",
    cacheTtlMs: 60_000,
  });

  assert.equal(catalog.source, "docs");
  assert.equal(catalog.sourceUrl, "https://octagonai.co/docs/llms.txt");
  assert.ok(catalog.entries.some(entry => entry.title === "API Documentation"));
  assert.ok(catalog.entries.some(entry => entry.title === "Authentication Guide"));
  assert.ok(catalog.entries.some(entry => entry.title === "Responses API"));
  assert.ok(catalog.sections.includes("Octagon AI"));
});

test("parseDocsCatalog normalizes relative links against source URL", () => {
  const catalog = parseDocsCatalog(fetched, { source: "docs" });
  const responses = catalog.entries.find(entry => entry.title === "Responses API");

  assert.equal(
    responses?.url,
    "https://octagonai.co/docs/guide/rest-api/responses.html.md",
  );
});

test("parseDocsCatalog seeds primary guide pages for discoverability", () => {
  const catalog = parseDocsCatalog(fetched, { source: "docs" });

  assert.equal(
    catalog.entries.find(entry => entry.title === "Octagon Claude Plugin")?.url,
    "https://octagonai.co/docs/guide/claude-plugin",
  );
  assert.equal(
    catalog.entries.find(entry => entry.title === "Octagon MCP Server")?.url,
    "https://octagonai.co/docs/guide/mcp-server",
  );
  assert.equal(
    catalog.entries.find(entry => entry.title === "Octagon Agents Guide")?.url,
    "https://octagonai.co/docs/guide/agents/",
  );
});
