import type { Page } from "@playwright/test";

export interface VocabularyFinding {
  kind: "uci" | "evaluation" | "producer";
  text: string;
  element: string;
  inspector: boolean;
}

/** Accepted play-composition A4: inspect current rendered text, including accessible
 * equivalents and offscreen content in real scroll regions. Never click, mutate a chess
 * answer, or exempt a node merely because it declares an evidence-consumer attribute.
 */
export interface VocabularyReport {
  version: 1;
  cell: string;
  viewport: { width: number; height: number };
  ordinaryTextNodes: number;
  inspectorTextNodes: number;
  leaks: VocabularyFinding[];
  inspectorExamples: VocabularyFinding[];
}

export async function inspectCompositionVocabulary(page: Page, cell = "calibration"): Promise<VocabularyReport> {
  return page.evaluate(cell => {
    const report: VocabularyReport = { version: 1, cell, viewport: { width: innerWidth, height: innerHeight }, ordinaryTextNodes: 0, inspectorTextNodes: 0, leaks: [], inspectorExamples: [] };
    const blocks = new Map<HTMLElement, { text: string; inspector: boolean }>();
    const patterns = [
      { kind: "uci" as const, expression: /\b[a-h][1-8][a-h][1-8][qrbn]?\b/giu },
      // Signed decimal evaluations and mate scores, not ordinary chess counts or SAN.
      { kind: "evaluation" as const, expression: /(?<![\w.])[+−-]\d+\.\d+\b|\bM[+−-]?\d+\b/gu },
      { kind: "producer" as const, expression: /Tabiya['’]s|phase bands|detector|recorded mass|evidence recorded\./giu },
    ];
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    let node: Node | null;
    while ((node = walker.nextNode())) {
      const parent = node.parentElement;
      if (!parent || !node.textContent?.trim() || parent.closest("script,style,template,noscript,[hidden]")) continue;
      let concealed = false;
      for (let p: HTMLElement | null = parent; p; p = p.parentElement) {
        const style = getComputedStyle(p);
        if (style.display === "none" || style.visibility === "hidden" || style.visibility === "collapse") { concealed = true; break; }
        if (p instanceof HTMLDetailsElement && !p.open && !p.querySelector(":scope > summary")?.contains(parent)) { concealed = true; break; }
      }
      if (concealed) continue;
      const range = document.createRange(); range.selectNodeContents(node);
      if (range.getClientRects().length === 0) continue;
      const inspector = parent.closest('.inspector-surface[role="dialog"][aria-modal="true"],.comparison-inspector[role="dialog"][aria-modal="true"]') !== null;
      if (inspector) report.inspectorTextNodes++; else report.ordinaryTextNodes++;
      // Inline markup must not split the token/phrase being tested. Preserve actual text
      // spacing and group only within its containing block, not across distinct paragraphs.
      let block = parent;
      while (block.parentElement && /^(inline|inline-block|inline-flex|inline-grid|contents)$/u.test(getComputedStyle(block).display)) block = block.parentElement;
      const accumulated = blocks.get(block);
      blocks.set(block, { text: (accumulated?.text ?? "") + node.textContent, inspector });
    }
    for (const [parent, value] of blocks) {
      const { inspector } = value;
      const text = value.text.trim().replace(/\s+/gu, " ");
      for (const { kind, expression } of patterns) {
        expression.lastIndex = 0;
        if (!expression.test(text)) continue;
        const finding: VocabularyFinding = { kind, text, element: [parent.tagName.toLowerCase(), parent.id ? `#${parent.id}` : "", ...parent.classList].join(" "), inspector };
        (inspector ? report.inspectorExamples : report.leaks).push(finding);
      }
    }
    return report;
  }, cell);
}
