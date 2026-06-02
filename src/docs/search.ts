import { type DocsCatalogEntry, type DocsSearchResult } from "./types.js";

const STOP_WORDS = new Set([
  "and",
  "api",
  "can",
  "complete",
  "docs",
  "example",
  "examples",
  "for",
  "from",
  "guide",
  "how",
  "integration",
  "the",
  "this",
  "use",
  "using",
  "with",
]);

function tokenize(value: string): string[] {
  return Array.from(
    new Set(
      value
        .toLowerCase()
        .split(/[^a-z0-9]+/)
        .filter(token => token.length >= 2),
    ),
  );
}

function distinctiveTokens(tokens: string[]): string[] {
  const distinctive = tokens.filter(
    token => token.length >= 3 && !STOP_WORDS.has(token),
  );

  return distinctive.length > 0 ? distinctive : tokens;
}

function countMatches(value: string, tokens: string[]): number {
  const lower = value.toLowerCase();
  return tokens.reduce(
    (count, token) => count + (lower.includes(token) ? 1 : 0),
    0,
  );
}

function createSnippet(entry: DocsCatalogEntry, tokens: string[]): string | undefined {
  const haystack = entry.content ?? entry.summary;
  if (!haystack) {
    return undefined;
  }

  const lower = haystack.toLowerCase();
  const index = tokens
    .map(token => lower.indexOf(token))
    .filter(position => position >= 0)
    .sort((a, b) => a - b)[0];

  if (index === undefined) {
    return haystack.slice(0, 240).trim();
  }

  const start = Math.max(0, index - 100);
  const end = Math.min(haystack.length, index + 180);
  const prefix = start > 0 ? "..." : "";
  const suffix = end < haystack.length ? "..." : "";

  return `${prefix}${haystack.slice(start, end).trim()}${suffix}`;
}

export function searchDocsEntries(
  entries: DocsCatalogEntry[],
  {
    query,
    section,
    limit,
    includeSnippets,
  }: {
    query: string;
    section?: string;
    limit: number;
    includeSnippets: boolean;
  },
): DocsSearchResult[] {
  const tokens = tokenize(query);
  const normalizedSection = section?.trim().toLowerCase();

  if (tokens.length === 0) {
    return [];
  }

  const requiredTokens = distinctiveTokens(tokens);

  return entries
    .filter(entry =>
      normalizedSection
        ? entry.section.toLowerCase().includes(normalizedSection)
        : true,
    )
    .map(entry => {
      const titleScore = countMatches(entry.title, tokens) * 8;
      const sectionScore = countMatches(entry.section, tokens) * 4;
      const summaryScore = countMatches(entry.summary ?? "", tokens) * 3;
      const contentScore = countMatches(entry.content ?? "", tokens);
      const distinctiveScore =
        countMatches(entry.title, requiredTokens) * 10 +
        countMatches(entry.section, requiredTokens) * 4 +
        countMatches(entry.summary ?? "", requiredTokens) * 3 +
        countMatches(entry.content ?? "", requiredTokens);
      const exactTitleBonus = entry.title
        .toLowerCase()
        .includes(query.toLowerCase())
        ? 12
        : 0;
      const hasDistinctiveMatch = distinctiveScore > 0;
      const score =
        hasDistinctiveMatch
          ? titleScore +
            sectionScore +
            summaryScore +
            contentScore +
            distinctiveScore +
            exactTitleBonus
          : 0;

      return {
        entry,
        score,
        snippet: includeSnippets ? createSnippet(entry, tokens) : undefined,
      };
    })
    .filter(result => result.score > 0)
    .sort((a, b) => b.score - a.score || a.entry.title.localeCompare(b.entry.title))
    .slice(0, limit);
}
