import type { Page } from "@playwright/test";

// A3's four region families, mapped explicitly to the production projections. An arbitrary
// overflow:auto node is NOT a declared region. These are layout identities, not evidence IDs.
export const COMPOSITION_SCROLL_REGIONS = [
  { selector: ".companion-section", family: "rail", axes: "y" },
  { selector: ".compare", family: "rail", axes: "y" },
  { selector: ".timeline-strip .timeline ol", family: "strip-x", axes: "x" },
  { selector: ".compare .boards, .compare .strip-band, .evaluation-table-wrap", family: "strip-x", axes: "x" },
  { selector: ".companion-queue.band .seat-card", family: "seat-card", axes: "y" },
  { selector: ".objective-copy", family: "seat-card", axes: "y" },
  { selector: ".inspector-grid, .sheet, .support-menu, .notation-panel, .group-creator, .shape-panel, .comparison-inspector", family: "sheet-body", axes: "y" },
  { selector: '.dialog[role="dialog"], .modal[role="dialog"]', family: "sheet-body", axes: "y" },
] as const;

export interface CompositionIssue {
  kind: "horizontal_body" | "undeclared_scroll" | "nested_scroll" | "clipped_box" | "covered_control" | "hidden_control" | "unreachable_control" | "keyboard_projection";
  element: string;
  detail: string;
}
export interface CompositionConformance {
  version: 1;
  cell: string;
  viewport: { width: number; height: number };
  controls: number;
  boxes: number;
  keyboardProjections: number;
  inertControls: number;
  scrollers: { element: string; family: string | null; axes: string }[];
  issues: CompositionIssue[];
}

/** Inspect the real post-gesture DOM; no click, focus, request or application state is forged.
 * Scroll only to inspect controls in declared containers, then restore every original offset.
 * Hidden/collapsed controls aren't current actions. Inert modal background and the semantic
 * keyboard projection are explicit, counted categories, not a blanket pointer-events exemption.
 */
export async function inspectComposition(page: Page, cell: string): Promise<CompositionConformance> {
  return page.evaluate(({ cell, regions }) => {
    const issues: CompositionIssue[] = [];
    const report: CompositionConformance = { version: 1, cell, viewport: { width: innerWidth, height: innerHeight }, controls: 0, boxes: 0, keyboardProjections: 0, inertControls: 0, scrollers: [], issues };
    const label = (e: HTMLElement): string => [e.tagName.toLowerCase(), e.id && `#${e.id}`, e.classList.length && `.${[...e.classList].join(".")}`, e.getAttribute("aria-label") && `[${e.getAttribute("aria-label")}]`, e.textContent?.trim().replace(/\s+/gu, " ").slice(0, 80)].filter(Boolean).join("");
    const visible = (e: HTMLElement): boolean => {
      if (e.closest("[hidden]")) return false;
      // Closed native details keep layout boxes in Chromium but do not paint their content.
      // Only their first summary is a present action; auditing the concealed inputs is false.
      for (let p = e.parentElement; p; p = p.parentElement) if (p instanceof HTMLDetailsElement && !p.open) {
        const summary = p.querySelector(":scope > summary");
        if (!summary?.contains(e)) return false;
      }
      const s = getComputedStyle(e);
      return s.display !== "none" && s.visibility !== "hidden" && s.visibility !== "collapse" && e.getClientRects().length > 0;
    };
    const painted = (e: HTMLElement): boolean => {
      for (let p: HTMLElement | null = e; p; p = p.parentElement) if (getComputedStyle(p).opacity === "0") return false;
      return true;
    };
    const declared = (e: HTMLElement, axis: string) => regions.find(r => e.matches(r.selector) && r.axes.includes(axis));
    const elements = [...document.body.querySelectorAll<HTMLElement>("*")].filter(visible);
    const pageOffset = { left: scrollX, top: scrollY };
    const offsets = elements.map(e => ({ e, left: e.scrollLeft, top: e.scrollTop }));
    const scrolling = new Map<HTMLElement, string>();
    for (const e of elements) {
      if (e.closest("[inert]")) continue;
      const s = getComputedStyle(e);
      const axes = [s.overflowX.match(/^(auto|scroll)$/u) && e.scrollWidth > e.clientWidth + 1 ? "x" : "", s.overflowY.match(/^(auto|scroll)$/u) && e.scrollHeight > e.clientHeight + 1 ? "y" : ""].join("");
      if (!axes) continue;
      scrolling.set(e, axes);
      report.scrollers.push({ element: label(e), family: regions.find(r => e.matches(r.selector))?.family ?? null, axes });
      for (const axis of axes) {
        if (!declared(e, axis)) {
          const r = e.getBoundingClientRect();
          const overflowing = [...e.querySelectorAll<HTMLElement>("*")].filter(visible).filter(child => {
            const c = child.getBoundingClientRect();
            return axis === "x" ? c.right > r.right + 1 || c.left < r.left - 1 : c.bottom > r.bottom + 1 || c.top < r.top - 1;
          }).slice(0, 5).map(label);
          issues.push({ kind: "undeclared_scroll", element: label(e), detail: `${axis}: ${overflowing.join("; ")}` });
        }
        for (let p = e.parentElement; p; p = p.parentElement) if (scrolling.get(p)?.includes(axis)) {
          issues.push({ kind: "nested_scroll", element: label(e), detail: `${axis} inside ${label(p)}` });
          break;
        }
      }
    }
    if (document.documentElement.scrollWidth > innerWidth + 1 || document.body.scrollWidth > innerWidth + 1) issues.push({ kind: "horizontal_body", element: "document", detail: `${document.documentElement.scrollWidth}/${document.body.scrollWidth} > ${innerWidth}` });

    function clipping(e: HTMLElement, r = e.getBoundingClientRect(), includeSelf = false): void {
      let box = { left: r.left, right: r.right, top: r.top, bottom: r.bottom };
      // Fixed descendants escape ordinary overflow ancestors until their actual containing
      // block. Their own frame still clips, as do transformed/contained ancestors. This
      // follows paint geometry; it is not a selector exemption for the notation panel.
      const fixedContainingBlock = (s: CSSStyleDeclaration) =>
        s.transform !== "none" || s.perspective !== "none" || s.filter !== "none"
        || s.backdropFilter !== "none" || /\b(layout|paint|strict|content)\b/u.test(s.contain)
        || /\b(transform|perspective|filter|backdrop-filter)\b/u.test(s.willChange)
        || s.contentVisibility === "auto";
      let escaping = !includeSelf && getComputedStyle(e).position === "fixed";
      for (let p = includeSelf ? e : e.parentElement; p; p = p.parentElement) {
        const s = getComputedStyle(p), r = p.getBoundingClientRect();
        if (escaping && !fixedContainingBlock(s)) continue;
        escaping = false;
        const bounds = { left: r.left + p.clientLeft, right: r.left + p.clientLeft + p.clientWidth, top: r.top + p.clientTop, bottom: r.top + p.clientTop + p.clientHeight };
        for (const axis of ["x", "y"] as const) {
          const overflow = axis === "x" ? s.overflowX : s.overflowY;
          if (!/^(auto|scroll|hidden|clip)$/u.test(overflow)) continue;
          const [lo, hi] = axis === "x" ? ["left", "right"] as const : ["top", "bottom"] as const;
          if (declared(p, axis) && /^(auto|scroll)$/u.test(overflow)) {
            // The descendant may be offscreen inside this real scroller. Its visible projection
            // still has to fit every clipping ancestor outside that region.
            box[lo] = Math.min(Math.max(box[lo], bounds[lo]), bounds[hi]);
            box[hi] = Math.min(Math.max(box[hi], bounds[lo]), bounds[hi]);
          } else if (box[lo] < bounds[lo] - 1 || box[hi] > bounds[hi] + 1) {
            issues.push({ kind: "clipped_box", element: label(e), detail: `${axis} by ${label(p)} (${box[lo]}..${box[hi]} outside ${bounds[lo]}..${bounds[hi]})` });
            return;
          }
        }
        if (s.position === "fixed") escaping = true;
      }
      if (escaping && (box.left < -1 || box.right > innerWidth + 1 || box.top < -1 || box.bottom > innerHeight + 1)) {
        issues.push({ kind: "clipped_box", element: label(e), detail: "fixed projection outside the viewport" });
      }
    }

    try {
      // Direct rendered text and actionable boxes, rather than empty wrappers/paint sprites.
      // Visually hidden atomic status prose has its own keyboard/live-region gates.
      for (const e of elements) {
        if (e.closest("[inert]") || !painted(e) || e.matches('.visually-hidden[role="status"][aria-live]')) continue;
        // These named non-actionable context projections are intentionally available only to
        // assistive technology below their breakpoint. Never exempt actionable descendants.
        const hiddenContext = e.closest<HTMLElement>('[aria-hidden="true"].visually-hidden-on-phone, .visually-hidden-below-rail');
        if (hiddenContext && getComputedStyle(hiddenContext).clipPath === "inset(50%)") continue;
        for (const n of e.childNodes) if (n.nodeType === Node.TEXT_NODE && n.textContent?.trim()) {
          const range = document.createRange(); range.selectNodeContents(n);
          let bounds = range.getBoundingClientRect();
          // The objective's compact summary deliberately elides prose; the full objective is
          // behind its separately audited button. Still audit the visible summary projection.
          if (e.matches('.objective-line > strong') && getComputedStyle(e).textOverflow === "ellipsis") {
            const own = e.getBoundingClientRect();
            bounds = new DOMRect(Math.max(bounds.left, own.left), bounds.top, Math.max(0, Math.min(bounds.right, own.right) - Math.max(bounds.left, own.left)), bounds.height);
          }
          report.boxes++; clipping(e, bounds, true);
        }
      }
      const candidates = elements.filter(e => e.matches('button,a[href],input:not([type="hidden"]),select,textarea,summary,[role="button"],[tabindex]'));
      for (const e of candidates) {
        if (e.closest("[inert]")) { report.inertControls++; continue; }
        if (e.matches(":disabled") || e.getAttribute("aria-disabled") === "true" || (e.hasAttribute("tabindex") && e.tabIndex < 0 && !e.matches("button,a[href],input,select,textarea,summary,[role=button]"))) continue;
        if (e.matches("[data-board-input-grid]")) {
          report.keyboardProjections++;
          const board = e.parentElement?.querySelector<HTMLElement>('[aria-label="Chessboard"]');
          const r = e.getBoundingClientRect(), b = board?.getBoundingClientRect();
          if (e.getAttribute("role") !== "grid" || e.querySelectorAll('[role="gridcell"]').length !== 64 || e.tabIndex !== 0 || !b || ["left", "top", "width", "height"].some(k => r[k as keyof DOMRect] !== b[k as keyof DOMRect])) issues.push({ kind: "keyboard_projection", element: label(e), detail: "semantic 8×8 projection does not match the visible board" });
          continue;
        }
        report.controls++;
        // Opacity does not disable focus or pointer actions. An invisible active control is
        // a failure, not a collapsed-control exemption (including opacity on an ancestor).
        if (!painted(e)) issues.push({ kind: "hidden_control", element: label(e), detail: "active control has zero-opacity paint" });
        clipping(e); // Before scrolling: hidden overflow cannot impersonate a usable scroller.
        e.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "instant" });
        const r = e.getBoundingClientRect();
        const x = r.left + r.width / 2, y = r.top + r.height / 2;
        if (r.width <= 0 || r.height <= 0 || x < 0 || y < 0 || x >= innerWidth || y >= innerHeight) issues.push({ kind: "unreachable_control", element: label(e), detail: `${x},${y} at ${innerWidth}×${innerHeight}` });
        else {
          const hit = document.elementFromPoint(x, y);
          if (!hit || !e.contains(hit)) issues.push({ kind: "covered_control", element: label(e), detail: `center hits ${hit instanceof HTMLElement ? label(hit) : hit?.tagName ?? "nothing"}` });
        }
      }
    } finally {
      for (const { e, left, top } of offsets) if (e.scrollLeft !== left || e.scrollTop !== top) e.scrollTo({ left, top, behavior: "instant" });
      window.scrollTo({ ...pageOffset, behavior: "instant" });
    }
    return report;
  }, { cell, regions: COMPOSITION_SCROLL_REGIONS });
}
