import type { DrawShape } from "@lichess-org/chessground/draw";
import type { Key } from "@lichess-org/chessground/types";

import type { LiveSessionDetail } from "./api.js";

export function relayedMarkShapes(detail: Pick<LiveSessionDetail, "marks"> | undefined): readonly DrawShape[] {
  return Object.freeze((detail?.marks ?? []).map((mark) => Object.freeze({
    orig: mark.orig as Key,
    ...(mark.dest === undefined ? {} : { dest: mark.dest as Key }),
    brush: mark.brush,
  })));
}
export function markAttribution(detail: Pick<LiveSessionDetail, "marks" | "marksTruncated">): string {
  if (detail.marks.length === 0) return "";
  if (detail.marks.some((mark) => mark.drawnBy === undefined)) {
    return `Some marks were drawn by an account that no longer exists.${detail.marksTruncated ? " Showing the 128 most recent." : ""}`;
  }
  const handles = [...new Set(detail.marks.map((mark) => `@${mark.drawnBy!.handle}`))];
  return `Marks drawn by ${handles.join(" and ")}.${detail.marksTruncated ? " Showing the 128 most recent." : ""}`;
}
