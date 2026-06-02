import assert from "node:assert/strict";
import test from "node:test";

import { searchDocsEntries } from "../dist/docs/search.js";

const entries = [
  {
    id: "docs:authentication-guide",
    title: "Authentication Guide",
    url: "https://octagonai.co/docs/guide/rest-api/authentication",
    path: "/docs/guide/rest-api/authentication",
    section: "REST API",
    source: "docs",
    kind: "link",
    summary: "API key setup and Authorization header examples.",
  },
  {
    id: "docs:claude-plugin",
    title: "Octagon Claude Plugin",
    url: "https://octagonai.co/docs/guide/claude-plugin",
    path: "/docs/guide/claude-plugin",
    section: "Plugin",
    source: "docs",
    kind: "section",
    content:
      "Install the plugin in Claude, then install and connect the Octagon AI connector.",
  },
  {
    id: "docs:complete-python-integration-example",
    title: "Complete Python integration example",
    url: "https://octagonai.co/docs/llms.txt#complete-python-integration-example",
    path: "/docs/llms.txt#complete-python-integration-example",
    section: "Integration Examples",
    source: "docs",
    kind: "section",
    content: "Complete Python integration example using the OpenAI client.",
  },
];

test("searchDocsEntries ranks title and content matches", () => {
  const results = searchDocsEntries(entries, {
    query: "Claude connector",
    limit: 5,
    includeSnippets: true,
  });

  assert.equal(results[0].entry.title, "Octagon Claude Plugin");
  assert.match(results[0].snippet ?? "", /connector/);
});

test("searchDocsEntries filters by section", () => {
  const results = searchDocsEntries(entries, {
    query: "API key",
    section: "REST",
    limit: 5,
    includeSnippets: false,
  });

  assert.equal(results.length, 1);
  assert.equal(results[0].entry.title, "Authentication Guide");
});

test("searchDocsEntries suppresses generic-only integration matches", () => {
  const results = searchDocsEntries(entries, {
    query: "Claude plugin MCP integration",
    limit: 5,
    includeSnippets: true,
  });

  assert.equal(results[0].entry.title, "Octagon Claude Plugin");
  assert.equal(
    results.some(
      result => result.entry.title === "Complete Python integration example",
    ),
    false,
  );
});
