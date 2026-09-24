/**
 * Origin-specific immutable-revision adapters (rfc/theory-knowledge-pipeline.md §2 rule 1, repaired
 * for [[D1895]]). A URL is pinned only when a named adapter recognises its origin AND extracts a
 * revision token from the URL's own structure. There is no generic "looks immutable" test: a
 * substring check cannot establish that a server keeps bytes fixed, so an unknown origin is
 * unpinned by construction.
 */
export type RevisionAdapterId = "mediawiki_oldid" | "github_commit";

export interface PinnedRevision {
  readonly adapter: RevisionAdapterId;
  readonly revision: string;
}

/** Hosts whose `index.php?oldid=` addresses one immutable stored revision. */
export const MEDIAWIKI_REVISION_HOSTS = Object.freeze(["en.wikibooks.org", "en.wikipedia.org"] as const);

function parsed(url: string): URL | undefined {
  try {
    const value = new URL(url);
    return value.protocol === "https:" && value.username === "" && value.password === "" && value.port === "" && value.hash === "" ? value : undefined;
  } catch {
    return undefined;
  }
}

function mediawiki(url: URL): PinnedRevision | undefined {
  if (!(MEDIAWIKI_REVISION_HOSTS as readonly string[]).includes(url.hostname) || url.pathname !== "/w/index.php") return undefined;
  const oldids = url.searchParams.getAll("oldid");
  if (oldids.length !== 1 || !/^[1-9][0-9]{0,11}$/.test(oldids[0]!)) return undefined;
  return Object.freeze({ adapter: "mediawiki_oldid", revision: oldids[0]! });
}

function github(url: URL): PinnedRevision | undefined {
  const segments = url.pathname.split("/").slice(1);
  if (url.search !== "") return undefined;
  if (url.hostname === "github.com" && segments.length >= 5 && segments[2] === "blob" && /^[0-9a-f]{40}$/.test(segments[3]!) && segments.slice(4).every((part) => part !== "")) {
    return Object.freeze({ adapter: "github_commit", revision: segments[3]! });
  }
  if (url.hostname === "raw.githubusercontent.com" && segments.length >= 4 && /^[0-9a-f]{40}$/.test(segments[2]!) && segments.slice(3).every((part) => part !== "")) {
    return Object.freeze({ adapter: "github_commit", revision: segments[2]! });
  }
  return undefined;
}

/** The pinned revision a URL addresses, or `undefined` when no adapter can prove it immutable. */
export function pinnedRevision(url: string): PinnedRevision | undefined {
  const value = parsed(url);
  if (value === undefined) return undefined;
  return mediawiki(value) ?? github(value);
}
