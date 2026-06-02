export type DocsSource = "docs" | "site";

export type DocsCatalogEntryKind = "section" | "link";

export type DocsCatalogEntry = {
  id: string;
  title: string;
  url: string;
  path: string;
  section: string;
  source: DocsSource;
  kind: DocsCatalogEntryKind;
  summary?: string;
  content?: string;
};

export type DocsCatalog = {
  sourceUrl: string;
  source: DocsSource;
  fetchedAt: string;
  expiresAt: string;
  entries: DocsCatalogEntry[];
  sections: string[];
  rawMarkdown: string;
  etag?: string;
  lastModified?: string;
};

export type FetchedDocsText = {
  url: string;
  finalUrl: string;
  text: string;
  contentType?: string;
  etag?: string;
  lastModified?: string;
  fetchedAt: string;
};

export type DocsReadResult = {
  entry: DocsCatalogEntry;
  markdown: string;
  sourceUrl: string;
  canonicalUrl: string;
  fetchedAt: string;
  truncated: boolean;
  etag?: string;
  lastModified?: string;
};

export type DocsSearchResult = {
  entry: DocsCatalogEntry;
  score: number;
  snippet?: string;
};

export type DocsStatus = {
  primaryIndexUrl: string;
  siteIndexUrl: string;
  cacheTtlMs: number;
  catalogs: Array<{
    source: DocsSource;
    sourceUrl: string;
    fetchedAt: string;
    expiresAt: string;
    entries: number;
    sections: string[];
    etag?: string;
    lastModified?: string;
  }>;
  cachedPages: number;
};
