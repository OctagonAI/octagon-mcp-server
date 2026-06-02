import {
  McpServer,
  ResourceTemplate,
} from "@modelcontextprotocol/sdk/server/mcp.js";

import {
  defaultDocsService,
  type OctagonDocsService,
} from "./service.js";

function jsonText(value: unknown): string {
  return JSON.stringify(value, null, 2);
}

export function encodeDocsResourceTarget(target: string): string {
  return encodeURIComponent(target);
}

export function registerDocsResources(
  server: McpServer,
  service: OctagonDocsService = defaultDocsService,
): void {
  server.registerResource(
    "octagon-docs-catalog",
    "octagon-docs://catalog",
    {
      title: "Octagon Docs Catalog",
      description:
        "Live catalog of Octagon documentation entries from the docs LLM corpus.",
      mimeType: "application/json",
    },
    async uri => {
      const catalogs = await service.getCatalog();
      return {
        contents: [
          {
            uri: uri.toString(),
            mimeType: "application/json",
            text: jsonText(catalogs),
          },
        ],
      };
    },
  );

  server.registerResource(
    "octagon-docs-status",
    "octagon-docs://status",
    {
      title: "Octagon Docs Status",
      description:
        "In-memory Octagon docs cache state, source endpoints, and refresh metadata.",
      mimeType: "application/json",
    },
    uri => ({
      contents: [
        {
          uri: uri.toString(),
          mimeType: "application/json",
          text: jsonText(service.status()),
        },
      ],
    }),
  );

  server.registerResource(
    "octagon-docs-page",
    new ResourceTemplate("octagon-docs://page/{target}", {
      list: async () => {
        const entries = await service.list({ limit: 100 });
        return {
          resources: entries.map(entry => ({
            uri: `octagon-docs://page/${encodeDocsResourceTarget(entry.id)}`,
            name: entry.id,
            title: entry.title,
            description: entry.summary,
            mimeType: "text/markdown",
          })),
        };
      },
      complete: {
        target: async value => {
          const entries = await service.list({ limit: 100 });
          const normalized = value.toLowerCase();
          return entries
            .filter(
              entry =>
                entry.id.toLowerCase().includes(normalized) ||
                entry.title.toLowerCase().includes(normalized),
            )
            .slice(0, 20)
            .map(entry => entry.id);
        },
      },
    }),
    {
      title: "Octagon Docs Page",
      description:
        "A single Octagon documentation page or section as Markdown.",
      mimeType: "text/markdown",
    },
    async (uri, variables) => {
      const targetValue = Array.isArray(variables.target)
        ? variables.target[0]
        : variables.target;
      const target = decodeURIComponent(String(targetValue ?? ""));
      const result = await service.read({ target });

      return {
        contents: [
          {
            uri: uri.toString(),
            mimeType: "text/markdown",
            text: result.markdown,
          },
        ],
      };
    },
  );
}
