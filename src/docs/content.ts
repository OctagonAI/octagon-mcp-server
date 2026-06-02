import { DOCS_DEFAULT_MAX_CHARS } from "./config.js";
import { assertAllowedDocsUrl, fetchDocsText } from "./fetcher.js";
import {
  type DocsCatalogEntry,
  type DocsReadResult,
  type FetchedDocsText,
} from "./types.js";

function isHtml(contentType: string | undefined, text: string): boolean {
  return Boolean(
    contentType?.toLowerCase().includes("text/html") ||
      /^\s*<!doctype html/i.test(text) ||
      /^\s*<html[\s>]/i.test(text),
  );
}

function decodeHtmlEntities(value: string): string {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function htmlToMarkdown(html: string): string {
  return decodeHtmlEntities(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<h1[^>]*>([\s\S]*?)<\/h1>/gi, "\n# $1\n")
      .replace(/<h2[^>]*>([\s\S]*?)<\/h2>/gi, "\n## $1\n")
      .replace(/<h3[^>]*>([\s\S]*?)<\/h3>/gi, "\n### $1\n")
      .replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, "\n- $1")
      .replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, "\n$1\n")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<a[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi, "[$2]($1)")
      .replace(/<[^>]+>/g, "")
      .replace(/[ \t]+\n/g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim(),
  );
}

function truncateMarkdown(
  markdown: string,
  maxChars: number,
): { markdown: string; truncated: boolean } {
  if (markdown.length <= maxChars) {
    return { markdown, truncated: false };
  }

  return {
    markdown: `${markdown.slice(0, maxChars).trimEnd()}\n\n[Content truncated. Increase maxChars or read a narrower section to continue.]`,
    truncated: true,
  };
}

function candidateMarkdownUrls(url: string): string[] {
  const parsed = new URL(url);
  const withoutHash = new URL(parsed);
  withoutHash.hash = "";
  const canonical = withoutHash.toString();
  const candidates = [canonical];
  const modernDocsUrl = modernizeDocsUrl(withoutHash);

  if (modernDocsUrl && modernDocsUrl !== canonical) {
    candidates.unshift(modernDocsUrl);
  }

  if (
    canonical.endsWith(".md") ||
    canonical.endsWith(".txt") ||
    canonical.endsWith(".html.md")
  ) {
    return Array.from(new Set(candidates));
  }

  if (canonical.endsWith("/")) {
    candidates.push(`${canonical.slice(0, -1)}.md`);
    candidates.push(`${canonical}index.md`);
  } else {
    candidates.push(`${canonical}.md`);
    candidates.push(`${canonical}.html.md`);
  }

  return Array.from(new Set(candidates));
}

function modernizeDocsUrl(url: URL): string | undefined {
  let pathname = url.pathname;

  if (url.hostname === "docs.octagonagents.com") {
    pathname = pathname.replace(/^\/docs/, "");
  }

  pathname = pathname
    .replace(/\.html\.md$/, "")
    .replace(/\.html$/, "")
    .replace(/\.md$/, "");

  if (!pathname.startsWith("/docs/")) {
    pathname = `/docs${pathname.startsWith("/") ? "" : "/"}${pathname}`;
  }

  return `https://octagonai.co${pathname}${url.search}`;
}

function canonicalTargetValues(value: string): string[] {
  const normalized = value.trim().toLowerCase();
  let decoded = normalized;
  try {
    decoded = decodeURIComponent(normalized);
  } catch {
    // Keep the raw value when the user supplies malformed percent-encoding.
  }
  const values = new Set([normalized, decoded]);

  try {
    const parsed = new URL(decoded);
    const withoutHash = new URL(parsed);
    withoutHash.hash = "";
    const modern = modernizeDocsUrl(withoutHash);
    const paths = [
      `${parsed.pathname}${parsed.hash}`,
      parsed.pathname,
      parsed.pathname.replace(/^\/docs/, ""),
      parsed.pathname.replace(/\.html\.md$/, ""),
      parsed.pathname.replace(/\.html$/, ""),
      parsed.pathname.replace(/\.md$/, ""),
    ];

    if (modern) {
      values.add(modern.toLowerCase());
      const modernParsed = new URL(modern);
      paths.push(modernParsed.pathname);
    }

    for (const path of paths) {
      values.add(path.toLowerCase());
    }
  } catch {
    // Plain titles and ids are handled by the raw normalized values.
  }

  return Array.from(values).filter(Boolean);
}

export function contentMatchesTarget(
  entry: DocsCatalogEntry,
  target: string,
): boolean {
  const targets = canonicalTargetValues(target);
  const values = [
    entry.id,
    entry.title,
    `${entry.title} (${entry.section})`,
    `${entry.title} - ${entry.section}`,
    `${entry.title} — ${entry.section}`,
    entry.url,
    entry.path,
    entry.path.replace(/^\/docs/, ""),
    entry.path.replace(/\.html\.md$/, ""),
    entry.path.replace(/\.html$/, ""),
    entry.path.replace(/\.md$/, ""),
  ].map(value => value.toLowerCase());

  return values.some(value =>
    targets.some(targetValue => value === targetValue || value.includes(targetValue)),
  );
}

export function createDirectUrlEntry(target: string): DocsCatalogEntry | undefined {
  try {
    const url = assertAllowedDocsUrl(target).toString();
    return {
      id: `direct:${url}`,
      title: url,
      url,
      path: new URL(url).pathname,
      section: "Direct URL",
      source: "docs",
      kind: "link",
    };
  } catch {
    return undefined;
  }
}

export async function fetchEntryMarkdown(
  entry: DocsCatalogEntry,
): Promise<FetchedDocsText> {
  let lastError: unknown;

  for (const candidate of candidateMarkdownUrls(entry.url)) {
    try {
      return await fetchDocsText(candidate);
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error(`Unable to fetch docs page: ${entry.url}`);
}

export async function readEntry(
  entry: DocsCatalogEntry,
  {
    maxChars = DOCS_DEFAULT_MAX_CHARS,
    preferCachedContent = true,
  }: {
    maxChars?: number;
    preferCachedContent?: boolean;
  } = {},
): Promise<DocsReadResult> {
  if (preferCachedContent && entry.content) {
    const truncated = truncateMarkdown(entry.content, maxChars);
    return {
      entry,
      markdown: truncated.markdown,
      sourceUrl: entry.url,
      canonicalUrl: entry.url,
      fetchedAt: new Date().toISOString(),
      truncated: truncated.truncated,
    };
  }

  const fetched = await fetchEntryMarkdown(entry);
  const markdown = isHtml(fetched.contentType, fetched.text)
    ? htmlToMarkdown(fetched.text)
    : fetched.text.trim();
  const truncated = truncateMarkdown(markdown, maxChars);

  return {
    entry,
    markdown: truncated.markdown,
    sourceUrl: entry.url,
    canonicalUrl: fetched.finalUrl,
    fetchedAt: fetched.fetchedAt,
    truncated: truncated.truncated,
    etag: fetched.etag,
    lastModified: fetched.lastModified,
  };
}
