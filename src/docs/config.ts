export const DOCS_PRIMARY_INDEX_URL = "https://octagonai.co/docs/llms.txt";
export const DOCS_SITE_INDEX_URL = "https://octagonai.co/llms.txt";

export const DOCS_ALLOWED_HOSTS = new Set([
  "octagonai.co",
  "www.octagonai.co",
  "docs.octagonai.co",
  "docs.octagonagents.com",
]);

export const DOCS_DEFAULT_TIMEOUT_MS = 10_000;
export const DOCS_DEFAULT_RETRY_COUNT = 2;
export const DOCS_DEFAULT_RETRY_DELAY_MS = 250;
export const DOCS_DEFAULT_CACHE_TTL_MS = 15 * 60 * 1000;
export const DOCS_DEFAULT_MAX_CHARS = 12_000;
export const DOCS_MAX_LIMIT = 100;
export const DOCS_USER_AGENT = "octagon-mcp/docs";
