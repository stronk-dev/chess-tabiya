export interface PackAttributionDraft {
  readonly sourceId: string;
  readonly noticeText: string;
  readonly url: string;
  readonly retrievedAt: string;
  readonly licence: string;
}

export interface PackProvenanceDraft {
  readonly valid: boolean;
  readonly posture: "original" | "cc_by_sa" | "unsupported";
  readonly licence?: string;
  readonly sources: readonly string[];
  readonly attribution: readonly PackAttributionDraft[];
}

function record(value: unknown): Record<string, unknown> | undefined {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? value as Record<string, unknown>
    : undefined;
}

function text(value: unknown): string { return typeof value === "string" ? value : ""; }

function parseDocument(documentJson: string): Record<string, unknown> {
  const parsed = record(JSON.parse(documentJson));
  if (parsed === undefined) throw new TypeError("Pack JSON must be an object");
  return parsed;
}

export function readPackProvenance(documentJson: string): PackProvenanceDraft {
  try {
    const document = parseDocument(documentJson);
    const provenance = record(document.provenance) ?? {};
    const licence = typeof provenance.licence === "string" ? provenance.licence : undefined;
    const sources = Array.isArray(provenance.sources) ? provenance.sources.filter((value): value is string => typeof value === "string") : [];
    const rawAttribution = Array.isArray(provenance.attribution) ? provenance.attribution : [];
    const attribution = rawAttribution.map((value): PackAttributionDraft => {
      const row = record(value) ?? {};
      return {
        sourceId: text(row.sourceId),
        noticeText: text(row.noticeText),
        url: text(row.url),
        retrievedAt: text(row.retrievedAt),
        licence: text(row.licence),
      };
    });
    const posture = licence === "CC-BY-SA-4.0"
      ? "cc_by_sa"
      : licence === undefined && attribution.length === 0
        ? "original"
        : "unsupported";
    return { valid: true, posture, ...(licence === undefined ? {} : { licence }), sources, attribution };
  } catch {
    return { valid: false, posture: "unsupported", sources: [], attribution: [] };
  }
}

function rewrite(documentJson: string, mutate: (provenance: Record<string, unknown>) => void): string {
  const document = parseDocument(documentJson);
  const provenance = { ...(record(document.provenance) ?? { reviewStatus: "draft" }) };
  mutate(provenance);
  document.provenance = provenance;
  return JSON.stringify(document, null, 2);
}

export function setPackProvenancePosture(documentJson: string, posture: "original" | "cc_by_sa"): string {
  return rewrite(documentJson, (provenance) => {
    if (posture === "original") {
      delete provenance.licence;
      delete provenance.attribution;
      return;
    }
    provenance.licence = "CC-BY-SA-4.0";
    provenance.attribution ??= [];
  });
}

export function setPackProvenanceSources(documentJson: string, sources: readonly string[]): string {
  return rewrite(documentJson, (provenance) => {
    const normalized = sources.map((source) => source.trim()).filter(Boolean);
    if (normalized.length === 0) delete provenance.sources;
    else provenance.sources = [...new Set(normalized)];
  });
}

export function addPackAttribution(documentJson: string): string {
  return rewrite(documentJson, (provenance) => {
    const rows = Array.isArray(provenance.attribution) ? [...provenance.attribution] : [];
    rows.push({ sourceId: "", licence: "CC-BY-SA-4.0", noticeText: "" });
    provenance.licence = "CC-BY-SA-4.0";
    provenance.attribution = rows;
  });
}

export function updatePackAttribution(documentJson: string, index: number, patch: Partial<PackAttributionDraft>): string {
  return rewrite(documentJson, (provenance) => {
    const rows = Array.isArray(provenance.attribution) ? [...provenance.attribution] : [];
    const current = record(rows[index]);
    if (current === undefined) return;
    const next: Record<string, unknown> = { ...current, ...patch, licence: "CC-BY-SA-4.0" };
    for (const optional of ["url", "retrievedAt"] as const) if (next[optional] === "") delete next[optional];
    rows[index] = next;
    provenance.licence = "CC-BY-SA-4.0";
    provenance.attribution = rows;
  });
}

export function removePackAttribution(documentJson: string, index: number): string {
  return rewrite(documentJson, (provenance) => {
    const rows = Array.isArray(provenance.attribution) ? provenance.attribution.filter((_, candidate) => candidate !== index) : [];
    provenance.attribution = rows;
  });
}
