import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

import { createTextErrorResult } from "#tools/shared";
import { DOCS_DEFAULT_MAX_CHARS } from "./config.js";
import {
  defaultDocsService,
  type OctagonDocsService,
} from "./service.js";

const sourceSchema = z.enum(["docs", "site", "all"]).optional();

export const docsListInputShape = {
  section: z.string().trim().min(1).optional(),
  source: sourceSchema.describe(
    "Docs source to list. Use docs for API/docs corpus, site for broader site index, or all.",
  ),
  limit: z.number().int().min(1).max(100).optional(),
};

export const docsSearchInputShape = {
  query: z.string().trim().min(1).describe("Search query for Octagon docs"),
  section: z.string().trim().min(1).optional(),
  source: sourceSchema,
  limit: z.number().int().min(1).max(100).optional(),
  includeSnippets: z.boolean().optional(),
};

export const docsReadInputShape = {
  target: z
    .string()
    .trim()
    .min(1)
    .describe("Docs title, URL, path, or catalog id to read"),
  source: sourceSchema,
  maxChars: z.number().int().min(1000).max(50000).optional(),
  preferCachedContent: z.boolean().optional(),
};

export const docsRefreshInputShape = {
  includeSite: z
    .boolean()
    .optional()
    .describe("Also refresh the broader octagonai.co site index"),
};

type DocsListParams = z.infer<z.ZodObject<typeof docsListInputShape>>;
type DocsSearchParams = z.infer<z.ZodObject<typeof docsSearchInputShape>>;
type DocsReadParams = z.infer<z.ZodObject<typeof docsReadInputShape>>;
type DocsRefreshParams = z.infer<z.ZodObject<typeof docsRefreshInputShape>>;

function summarizeEntries(
  entries: Array<{ title: string; section: string; url: string; summary?: string }>,
): string {
  if (entries.length === 0) {
    return "No Octagon docs entries matched.";
  }

  return entries
    .map(
      (entry, index) =>
        `${index + 1}. ${entry.title} (${entry.section})\n${entry.url}${
          entry.summary ? `\n${entry.summary}` : ""
        }`,
    )
    .join("\n\n");
}

export async function executeDocsListTool(
  service: OctagonDocsService,
  params: DocsListParams,
) {
  try {
    const entries = await service.list(params);
    return {
      content: [{ type: "text" as const, text: summarizeEntries(entries) }],
      structuredContent: {
        entries,
        count: entries.length,
      },
    };
  } catch (error) {
    console.error("Error listing Octagon docs:", error);
    return createTextErrorResult("Error: Failed to list Octagon docs.");
  }
}

export async function executeDocsSearchTool(
  service: OctagonDocsService,
  params: DocsSearchParams,
) {
  try {
    const results = await service.search({
      ...params,
      includeSnippets: params.includeSnippets ?? true,
    });
    const entries = results.map(result => ({
      ...result.entry,
      score: result.score,
      snippet: result.snippet,
    }));

    return {
      content: [{ type: "text" as const, text: summarizeEntries(entries) }],
      structuredContent: {
        query: params.query,
        results: entries,
        count: entries.length,
      },
    };
  } catch (error) {
    console.error("Error searching Octagon docs:", error);
    return createTextErrorResult("Error: Failed to search Octagon docs.");
  }
}

export async function executeDocsReadTool(
  service: OctagonDocsService,
  params: DocsReadParams,
) {
  try {
    const result = await service.read({
      target: params.target,
      source: params.source,
      maxChars: params.maxChars ?? DOCS_DEFAULT_MAX_CHARS,
      preferCachedContent: params.preferCachedContent ?? true,
    });

    return {
      content: [{ type: "text" as const, text: result.markdown }],
      structuredContent: result,
    };
  } catch (error) {
    console.error("Error reading Octagon docs:", error);
    return createTextErrorResult(
      error instanceof Error
        ? `Error: ${error.message}`
        : "Error: Failed to read Octagon docs.",
    );
  }
}

export async function executeDocsRefreshTool(
  service: OctagonDocsService,
  params: DocsRefreshParams,
) {
  try {
    const catalogs = await service.refresh({
      includeSite: params.includeSite ?? false,
    });
    const text = catalogs
      .map(
        catalog =>
          `${catalog.source}: ${catalog.entries.length} entries from ${catalog.sourceUrl}`,
      )
      .join("\n");

    return {
      content: [{ type: "text" as const, text }],
      structuredContent: {
        catalogs: catalogs.map(catalog => ({
          source: catalog.source,
          sourceUrl: catalog.sourceUrl,
          fetchedAt: catalog.fetchedAt,
          expiresAt: catalog.expiresAt,
          entries: catalog.entries.length,
          sections: catalog.sections,
        })),
      },
    };
  } catch (error) {
    console.error("Error refreshing Octagon docs:", error);
    return createTextErrorResult("Error: Failed to refresh Octagon docs.");
  }
}

export function registerDocsTools(
  server: McpServer,
  service: OctagonDocsService = defaultDocsService,
): void {
  const toolServer = server as unknown as {
    tool: (
      name: string,
      description: string,
      inputSchema: Record<string, z.ZodTypeAny>,
      callback: (args: Record<string, unknown>) => Promise<unknown>,
    ) => unknown;
  };

  toolServer.tool(
    "octagon-docs-list",
    "List live Octagon documentation sections and pages from the docs LLM corpus.",
    docsListInputShape,
    async params => executeDocsListTool(service, params as DocsListParams),
  );

  toolServer.tool(
    "octagon-docs-search",
    "Search live Octagon API, agent, MCP, and plugin documentation with source URLs.",
    docsSearchInputShape,
    async params => executeDocsSearchTool(service, params as DocsSearchParams),
  );

  toolServer.tool(
    "octagon-docs-read",
    "Read a live Octagon docs page or section by title, path, URL, or catalog id.",
    docsReadInputShape,
    async params => executeDocsReadTool(service, params as DocsReadParams),
  );

  toolServer.tool(
    "octagon-docs-refresh",
    "Refresh the in-memory Octagon docs catalog from live LLM-friendly docs endpoints.",
    docsRefreshInputShape,
    async params => executeDocsRefreshTool(service, params as DocsRefreshParams),
  );
}
