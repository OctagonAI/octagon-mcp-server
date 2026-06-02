import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

import { registerDocsResources } from "./resources.js";
import { defaultDocsService } from "./service.js";
import { registerDocsTools } from "./tools.js";

export function registerDocs(server: McpServer): void {
  registerDocsResources(server, defaultDocsService);
  registerDocsTools(server, defaultDocsService);
}

export { OctagonDocsService, defaultDocsService } from "./service.js";
