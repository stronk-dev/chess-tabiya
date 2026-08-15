import type { LiveSessionDetail } from "./api.js";

export function voteAttribution(detail: Pick<LiveSessionDetail, "vote" | "voteAdapter">): string {
  const vote = detail.vote;
  if (vote === undefined || vote.total === 0) return "No votes yet.";
  if (vote.relayed === 0) return `${vote.total} votes, all from signed-in members.`;
  if (detail.voteAdapter !== undefined) return `${vote.relayed} of ${vote.total} votes relayed by @${detail.voteAdapter.handle}. Tabiya cannot verify chat identities; a tally is only as trustworthy as its adapter.`;
  return `${vote.relayed} of ${vote.total} votes were relayed by an adapter account that is no longer configured. Tabiya cannot verify chat identities.`;
}
