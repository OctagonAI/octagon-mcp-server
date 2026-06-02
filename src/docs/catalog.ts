import {
  DOCS_DEFAULT_CACHE_TTL_MS,
  DOCS_PRIMARY_INDEX_URL,
} from "./config.js";
import {
  type DocsCatalog,
  type DocsCatalogEntry,
  type DocsSource,
  type FetchedDocsText,
} from "./types.js";

type Heading = {
  level: number;
  title: string;
  lineIndex: number;
};

const PRIMARY_DOCS_ENTRIES = [
  {
    title: "Octagon Claude Plugin",
    url: "https://octagonai.co/docs/guide/claude-plugin",
    section: "Guides",
    summary:
      "Claude plugin setup, connector authentication, hosted Octagon tools, routing, and MCP integration guidance.",
  },
  {
    title: "Octagon Agents Guide",
    url: "https://octagonai.co/docs/guide/agents/",
    section: "Guides",
    summary:
      "Overview of Octagon public market, private market, deep research, and prediction markets agents.",
  },
  {
    title: "Octagon MCP Server",
    url: "https://octagonai.co/docs/guide/mcp-server",
    section: "Guides",
    summary:
      "MCP server installation, available tools, Claude Desktop and Cursor setup, and integration behavior.",
  },
];

function slugify(value: string): string {
  const slug = value
    .toLowerCase()
    .replace(/[`*_~()[\]{}.:,/?#!$&'"|]+/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug || "section";
}

function cleanFetchedMarkdown(markdown: string): string {
  return markdown
    .replace(/^Source URL:[^\n]*\nTitle:[^\n]*\n\n/, "")
    .replace(/\r\n/g, "\n")
    .trim();
}

function normalizeDocsUrl(link: string, sourceUrl: string): string {
  try {
    return new URL(link, sourceUrl).toString();
  } catch {
    return new URL(link, DOCS_PRIMARY_INDEX_URL).toString();
  }
}

function pathFromUrl(url: string): string {
  try {
    const parsed = new URL(url);
    return `${parsed.pathname}${parsed.hash}`;
  } catch {
    return url;
  }
}

function uniqueId(base: string, seen: Map<string, number>): string {
  const priorCount = seen.get(base) ?? 0;
  seen.set(base, priorCount + 1);
  return priorCount === 0 ? base : `${base}-${priorCount + 1}`;
}

function extractHeadings(lines: string[]): Heading[] {
  const headings: Heading[] = [];
  lines.forEach((line, lineIndex) => {
    const match = /^(#{1,3})\s+(.+?)\s*$/.exec(line);
    if (!match) {
      return;
    }

    headings.push({
      level: match[1].length,
      title: match[2].trim(),
      lineIndex,
    });
  });

  return headings;
}

function sectionForHeading(headings: Heading[], headingIndex: number): string {
  const heading = headings[headingIndex];
  if (heading.level === 1) {
    return heading.title;
  }

  for (let i = headingIndex - 1; i >= 0; i -= 1) {
    if (headings[i].level < heading.level) {
      return headings[i].title;
    }
  }

  return heading.title;
}

function headingEntries(
  markdown: string,
  sourceUrl: string,
  source: DocsSource,
  seenIds: Map<string, number>,
): DocsCatalogEntry[] {
  const lines = markdown.split("\n");
  const headings = extractHeadings(lines);
  const entries: DocsCatalogEntry[] = [];

  headings.forEach((heading, index) => {
    const nextHeading = headings[index + 1];
    const endLine = nextHeading?.lineIndex ?? lines.length;
    const content = lines.slice(heading.lineIndex, endLine).join("\n").trim();

    if (content.length === 0) {
      return;
    }

    const slug = slugify(heading.title);
    const url = `${sourceUrl}#${slug}`;
    const id = uniqueId(`${source}:${slug}`, seenIds);

    entries.push({
      id,
      title: heading.title,
      url,
      path: pathFromUrl(url),
      section: sectionForHeading(headings, index),
      source,
      kind: "section",
      summary: content
        .split("\n")
        .slice(1)
        .find(line => line.trim().length > 0)
        ?.replace(/^[-*>#\s]+/, "")
        .slice(0, 280),
      content,
    });
  });

  return entries;
}

function linkEntries(
  markdown: string,
  sourceUrl: string,
  source: DocsSource,
  seenIds: Map<string, number>,
): DocsCatalogEntry[] {
  const lines = markdown.split("\n");
  const entries: DocsCatalogEntry[] = [];
  let currentSection = "Docs";

  for (const line of lines) {
    const headingMatch = /^(#{1,3})\s+(.+?)\s*$/.exec(line);
    if (headingMatch) {
      currentSection = headingMatch[2].trim();
    }

    const linkPattern = /\[([^\]]+)\]\(([^)]+)\)(?::\s*(.*))?/g;
    let match: RegExpExecArray | null;
    while ((match = linkPattern.exec(line)) !== null) {
      const title = match[1].trim();
      const url = normalizeDocsUrl(match[2].trim(), sourceUrl);
      const id = uniqueId(`${source}:${slugify(title)}`, seenIds);
      const summary = match[3]?.trim();

      entries.push({
        id,
        title,
        url,
        path: pathFromUrl(url),
        section: currentSection,
        source,
        kind: "link",
        summary: summary && summary.length > 0 ? summary : undefined,
      });
    }
  }

  return entries;
}

function dedupeEntries(entries: DocsCatalogEntry[]): DocsCatalogEntry[] {
  const seen = new Set<string>();
  const deduped: DocsCatalogEntry[] = [];

  for (const entry of entries) {
    const key = `${entry.kind}:${entry.url}:${entry.title}`.toLowerCase();
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    deduped.push(entry);
  }

  return deduped;
}

function primaryDocsEntries(
  source: DocsSource,
  seenIds: Map<string, number>,
): DocsCatalogEntry[] {
  if (source !== "docs") {
    return [];
  }

  return PRIMARY_DOCS_ENTRIES.map(entry => ({
    id: uniqueId(`${source}:${slugify(entry.title)}`, seenIds),
    title: entry.title,
    url: entry.url,
    path: pathFromUrl(entry.url),
    section: entry.section,
    source,
    kind: "link",
    summary: entry.summary,
  }));
}

export function parseDocsCatalog(
  fetched: FetchedDocsText,
  {
    source,
    cacheTtlMs = DOCS_DEFAULT_CACHE_TTL_MS,
  }: {
    source: DocsSource;
    cacheTtlMs?: number;
  },
): DocsCatalog {
  const rawMarkdown = cleanFetchedMarkdown(fetched.text);
  const seenIds = new Map<string, number>();
  const entries = dedupeEntries([
    ...primaryDocsEntries(source, seenIds),
    ...headingEntries(rawMarkdown, fetched.finalUrl, source, seenIds),
    ...linkEntries(rawMarkdown, fetched.finalUrl, source, seenIds),
  ]);
  const sections = Array.from(new Set(entries.map(entry => entry.section))).sort(
    (a, b) => a.localeCompare(b),
  );
  const fetchedAtMs = Date.parse(fetched.fetchedAt);

  return {
    sourceUrl: fetched.finalUrl,
    source,
    fetchedAt: fetched.fetchedAt,
    expiresAt: new Date(fetchedAtMs + cacheTtlMs).toISOString(),
    entries,
    sections,
    rawMarkdown,
    etag: fetched.etag,
    lastModified: fetched.lastModified,
  };
}
