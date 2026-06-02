import {
  DOCS_ALLOWED_HOSTS,
  DOCS_DEFAULT_RETRY_COUNT,
  DOCS_DEFAULT_RETRY_DELAY_MS,
  DOCS_DEFAULT_TIMEOUT_MS,
  DOCS_USER_AGENT,
} from "./config.js";
import { type FetchedDocsText } from "./types.js";

type FetchDocsTextOptions = {
  timeoutMs?: number;
  retryCount?: number;
  retryDelayMs?: number;
  headers?: Record<string, string>;
};

class DocsHttpError extends Error {
  readonly status: number;

  constructor(status: number) {
    super(`Docs fetch failed with HTTP ${status}`);
    this.status = status;
  }
}

export function assertAllowedDocsUrl(value: string): URL {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error(`Invalid docs URL: ${value}`);
  }

  if (!["http:", "https:"].includes(url.protocol)) {
    throw new Error(`Unsupported docs URL protocol: ${url.protocol}`);
  }

  if (!DOCS_ALLOWED_HOSTS.has(url.hostname)) {
    throw new Error(`Unsupported docs URL host: ${url.hostname}`);
  }

  return url;
}

function createTimeoutSignal(timeoutMs: number): {
  signal: AbortSignal;
  clear: () => void;
} {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  return {
    signal: controller.signal,
    clear: () => clearTimeout(timeout),
  };
}

function shouldRetry(error: unknown): boolean {
  if (error instanceof DocsHttpError) {
    return error.status === 429 || error.status >= 500;
  }

  return true;
}

async function wait(ms: number): Promise<void> {
  if (ms <= 0) {
    return;
  }

  await new Promise(resolve => {
    setTimeout(resolve, ms);
  });
}

async function fetchDocsTextOnce(
  parsedUrl: URL,
  timeoutMs: number,
  headers: Record<string, string> | undefined,
): Promise<FetchedDocsText> {
  const timeout = createTimeoutSignal(timeoutMs);

  try {
    const response = await fetch(parsedUrl, {
      redirect: "follow",
      signal: timeout.signal,
      headers: {
        "User-Agent": DOCS_USER_AGENT,
        Accept: "text/markdown,text/plain,text/html;q=0.9,*/*;q=0.1",
        ...headers,
      },
    });

    if (!response.ok) {
      throw new DocsHttpError(response.status);
    }

    const contentType = response.headers.get("content-type") ?? undefined;
    const text = await response.text();

    return {
      url: parsedUrl.toString(),
      finalUrl: response.url || parsedUrl.toString(),
      text,
      contentType,
      etag: response.headers.get("etag") ?? undefined,
      lastModified: response.headers.get("last-modified") ?? undefined,
      fetchedAt: new Date().toISOString(),
    };
  } catch (error) {
    if (timeout.signal.aborted) {
      throw new Error(`Docs fetch timed out after ${timeoutMs}ms`);
    }
    throw error;
  } finally {
    timeout.clear();
  }
}

export async function fetchDocsText(
  url: string,
  options: FetchDocsTextOptions = {},
): Promise<FetchedDocsText> {
  const parsedUrl = assertAllowedDocsUrl(url);
  const timeoutMs = options.timeoutMs ?? DOCS_DEFAULT_TIMEOUT_MS;
  const retryCount = options.retryCount ?? DOCS_DEFAULT_RETRY_COUNT;
  const retryDelayMs = options.retryDelayMs ?? DOCS_DEFAULT_RETRY_DELAY_MS;
  let lastError: unknown;

  for (let attempt = 0; attempt <= retryCount; attempt += 1) {
    try {
      return await fetchDocsTextOnce(parsedUrl, timeoutMs, options.headers);
    } catch (error) {
      lastError = error;
      if (attempt >= retryCount || !shouldRetry(error)) {
        break;
      }

      await wait(retryDelayMs * (attempt + 1));
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error(`Failed to fetch ${parsedUrl.toString()}`);
}
