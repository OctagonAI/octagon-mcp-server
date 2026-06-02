import {
  DOCS_DEFAULT_CACHE_TTL_MS,
  DOCS_DEFAULT_MAX_CHARS,
  DOCS_MAX_LIMIT,
  DOCS_PRIMARY_INDEX_URL,
  DOCS_SITE_INDEX_URL,
} from "./config.js";
import { parseDocsCatalog } from "./catalog.js";
import {
  contentMatchesTarget,
  createDirectUrlEntry,
  readEntry,
} from "./content.js";
import { fetchDocsText } from "./fetcher.js";
import { searchDocsEntries } from "./search.js";
import {
  type DocsCatalog,
  type DocsCatalogEntry,
  type DocsReadResult,
  type DocsSearchResult,
  type DocsSource,
  type DocsStatus,
} from "./types.js";

type DocsServiceOptions = {
  cacheTtlMs?: number;
  primaryIndexUrl?: string;
  siteIndexUrl?: string;
};

type CatalogCacheEntry = {
  catalog: DocsCatalog;
  expiresAtMs: number;
};

function clampLimit(value: number | undefined, defaultValue: number): number {
  const requested = value ?? defaultValue;
  if (!Number.isFinite(requested)) {
    return defaultValue;
  }

  return Math.max(1, Math.min(DOCS_MAX_LIMIT, Math.floor(requested)));
}

function sourceUrlFor(source: DocsSource, options: Required<DocsServiceOptions>) {
  return source === "docs" ? options.primaryIndexUrl : options.siteIndexUrl;
}

export class OctagonDocsService {
  private readonly options: Required<DocsServiceOptions>;
  private readonly catalogs = new Map<DocsSource, CatalogCacheEntry>();
  private readonly readCache = new Map<string, DocsReadResult>();

  constructor(options: DocsServiceOptions = {}) {
    this.options = {
      cacheTtlMs: options.cacheTtlMs ?? DOCS_DEFAULT_CACHE_TTL_MS,
      primaryIndexUrl: options.primaryIndexUrl ?? DOCS_PRIMARY_INDEX_URL,
      siteIndexUrl: options.siteIndexUrl ?? DOCS_SITE_INDEX_URL,
    };
  }

  async refresh({
    includeSite = false,
  }: { includeSite?: boolean } = {}): Promise<DocsCatalog[]> {
    this.readCache.clear();
    const sources: DocsSource[] = includeSite ? ["docs", "site"] : ["docs"];
    const catalogs: DocsCatalog[] = [];

    for (const source of sources) {
      const catalog = await this.fetchCatalog(source);
      catalogs.push(catalog);
    }

    return catalogs;
  }

  async getCatalog({
    includeSite = false,
  }: { includeSite?: boolean } = {}): Promise<DocsCatalog[]> {
    const sources: DocsSource[] = includeSite ? ["docs", "site"] : ["docs"];
    const catalogs: DocsCatalog[] = [];

    for (const source of sources) {
      catalogs.push(await this.getCatalogForSource(source));
    }

    return catalogs;
  }

  async list({
    section,
    source = "docs",
    limit,
  }: {
    section?: string;
    source?: DocsSource | "all";
    limit?: number;
  } = {}): Promise<DocsCatalogEntry[]> {
    const entries = await this.getEntries(source === "all");
    const normalizedSection = section?.trim().toLowerCase();

    return entries
      .filter(entry =>
        source === "all" ? true : entry.source === source,
      )
      .filter(entry =>
        normalizedSection
          ? entry.section.toLowerCase().includes(normalizedSection)
          : true,
      )
      .slice(0, clampLimit(limit, 25));
  }

  async search({
    query,
    section,
    source = "docs",
    limit,
    includeSnippets = true,
  }: {
    query: string;
    section?: string;
    source?: DocsSource | "all";
    limit?: number;
    includeSnippets?: boolean;
  }): Promise<DocsSearchResult[]> {
    const entries = (await this.getEntries(source === "all")).filter(entry =>
      source === "all" ? true : entry.source === source,
    );

    return searchDocsEntries(entries, {
      query,
      section,
      limit: clampLimit(limit, 10),
      includeSnippets,
    });
  }

  async read({
    target,
    maxChars,
    source = "docs",
    preferCachedContent = true,
  }: {
    target: string;
    maxChars?: number;
    source?: DocsSource | "all";
    preferCachedContent?: boolean;
  }): Promise<DocsReadResult> {
    const catalogs = await this.getCatalog({ includeSite: source === "all" });

    const normalizedMaxChars = Math.max(
      1_000,
      Math.min(50_000, Math.floor(maxChars ?? DOCS_DEFAULT_MAX_CHARS)),
    );
    const cacheKey = `${source}:${target}:${normalizedMaxChars}:${preferCachedContent}`;
    const cached = this.readCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const entries = catalogs.flatMap(catalog => catalog.entries).filter(entry =>
      source === "all" ? true : entry.source === source,
    );
    const matchingEntries = entries.filter(candidate =>
      contentMatchesTarget(candidate, target),
    );
    const titleMatch = entries.find(candidate =>
      candidate.title.toLowerCase().includes(target.trim().toLowerCase()),
    );
    const directUrlEntry = createDirectUrlEntry(target);
    const entry =
      matchingEntries.sort((a, b) => {
        const contentScore = Number(Boolean(b.content)) - Number(Boolean(a.content));
        if (contentScore !== 0) {
          return contentScore;
        }

        const titleScore =
          Number(b.title.toLowerCase() === target.trim().toLowerCase()) -
          Number(a.title.toLowerCase() === target.trim().toLowerCase());
        if (titleScore !== 0) {
          return titleScore;
        }

        return a.title.localeCompare(b.title);
      })[0] ??
      titleMatch ??
      directUrlEntry;

    if (!entry) {
      throw new Error(`No Octagon docs page matched "${target}".`);
    }

    const result = await readEntry(entry, {
      maxChars: normalizedMaxChars,
      preferCachedContent,
    });
    this.readCache.set(cacheKey, result);
    return result;
  }

  status(): DocsStatus {
    return {
      primaryIndexUrl: this.options.primaryIndexUrl,
      siteIndexUrl: this.options.siteIndexUrl,
      cacheTtlMs: this.options.cacheTtlMs,
      catalogs: Array.from(this.catalogs.values()).map(({ catalog }) => ({
        source: catalog.source,
        sourceUrl: catalog.sourceUrl,
        fetchedAt: catalog.fetchedAt,
        expiresAt: catalog.expiresAt,
        entries: catalog.entries.length,
        sections: catalog.sections,
        etag: catalog.etag,
        lastModified: catalog.lastModified,
      })),
      cachedPages: this.readCache.size,
    };
  }

  private async getEntries(includeSite: boolean): Promise<DocsCatalogEntry[]> {
    const catalogs = await this.getCatalog({ includeSite });
    return catalogs.flatMap(catalog => catalog.entries);
  }

  private async getCatalogForSource(source: DocsSource): Promise<DocsCatalog> {
    const cached = this.catalogs.get(source);
    if (cached && cached.expiresAtMs > Date.now()) {
      return cached.catalog;
    }

    return this.fetchCatalog(source);
  }

  private async fetchCatalog(source: DocsSource): Promise<DocsCatalog> {
    const fetched = await fetchDocsText(sourceUrlFor(source, this.options));
    const catalog = parseDocsCatalog(fetched, {
      source,
      cacheTtlMs: this.options.cacheTtlMs,
    });

    this.catalogs.set(source, {
      catalog,
      expiresAtMs: Date.now() + this.options.cacheTtlMs,
    });
    this.readCache.clear();

    return catalog;
  }
}

export const defaultDocsService = new OctagonDocsService();
