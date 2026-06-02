import assert from "node:assert/strict";
import test from "node:test";

import { parseDocsCatalog } from "../dist/docs/catalog.js";

test("docs corpus shape is split into searchable section pages", () => {
  const catalog = parseDocsCatalog(
    {
      url: "https://octagonai.co/docs/llms.txt",
      finalUrl: "https://octagonai.co/docs/llms.txt",
      fetchedAt: "2026-06-02T12:00:00.000Z",
      text: `Source URL: https://octagonai.co/docs/llms.txt
Title: Octagon AI

# Octagon AI

> Octagon provides specialized investment research Agents.

# How Octagon API Works

## API Architecture and Integration

The Octagon API is built to be compatible with the OpenAI API format.

## Core Concepts

1. **Agents**: Specialized AI models.
2. **Responses API**: Enhanced response format.

## API Documentation

- [Authentication Guide](https://docs.octagonagents.com/docs/guide/rest-api/authentication.html.md): This section walks through the authentication process.
`,
    },
    { source: "docs" },
  );

  const architecture = catalog.entries.find(
    entry => entry.title === "API Architecture and Integration",
  );
  const auth = catalog.entries.find(entry => entry.title === "Authentication Guide");

  assert.equal(architecture?.kind, "section");
  assert.match(architecture?.content ?? "", /OpenAI API format/);
  assert.equal(auth?.kind, "link");
  assert.match(auth?.summary ?? "", /authentication process/);
});
