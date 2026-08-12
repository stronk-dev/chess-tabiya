export type SourceLicence =
  | {
      readonly basis: "spdx";
      readonly spdx: "CC0-1.0" | "CC-BY-SA-4.0";
      readonly noticeText: string | null;
      readonly rationale: null;
    }
  | {
      readonly basis: "no-rights-asserted";
      readonly spdx: null;
      readonly noticeText: null;
      readonly rationale: string;
    };

export type SourceOrigin =
  | {
      readonly kind: "http";
      readonly url: string;
      readonly status: number;
      readonly sha256: string | null;
      readonly bytes: number | null;
      readonly etag: string | null;
    }
  | {
      readonly kind: "local-file";
      readonly path: string;
      readonly sha256: string;
      readonly bytes: number;
    }
  | {
      readonly kind: "engine";
      readonly engineId: string;
      readonly engineName: string | null;
      readonly engineVersion: string;
      readonly profile: {
        readonly threads: number;
        readonly hashMb: number;
        readonly multiPv: number;
      };
      readonly budget: { readonly depth: number } | { readonly movetimeMs: number };
      readonly fen: string;
      readonly evidenceKind: string;
    };

export interface SourceEntry {
  readonly sourceId: string;
  readonly retrievedAt: string;
  readonly origin: SourceOrigin;
  readonly licence: SourceLicence;
}

export interface SourceManifest {
  readonly schema: "tabiya.sourcing.manifest.v1";
  readonly entries: readonly SourceEntry[];
}

export const EVIDENCE_KINDS = [
  "opening_identity",
  "position_legality",
  "explorer_frequency",
  "tablebase_result",
  "engine_eval",
  "puzzle_provenance",
] as const;
export type EvidenceKind = (typeof EVIDENCE_KINDS)[number];

export const ABSTENTION_REASONS = [
  "out_of_range",
  "source_unavailable",
  "no_data_at_band",
  "licence_withheld",
] as const;

export interface EvidenceRecord {
  readonly kind: EvidenceKind;
  readonly anchor: Readonly<Record<string, string>>;
  readonly sourceId: string;
  readonly retrievedAt: string;
  readonly grounds: "citable_source" | "machine_validation";
  readonly values: Readonly<Record<string, unknown>>;
  readonly supports: readonly string[];
  readonly templateId?: string;
}

export interface EvidenceAbstention {
  readonly kind: EvidenceKind;
  readonly anchor: Readonly<Record<string, string>>;
  readonly sourceId: string;
  readonly retrievedAt: string;
  readonly reason: (typeof ABSTENTION_REASONS)[number];
  readonly detail: string;
}

export interface EvidenceLedger {
  readonly schema: "tabiya.sourcing.evidence.v1";
  readonly packId?: string;
  readonly packVersion?: string;
  readonly packDigest?: string;
  readonly sourcedAt: string;
  readonly records: readonly EvidenceRecord[];
  readonly abstentions: readonly EvidenceAbstention[];
}

export interface SourcingIssue {
  readonly severity: "error" | "warning";
  readonly code: string;
  readonly path: string;
  readonly message: string;
}

export class SourcingError extends Error {
  constructor(
    readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "SourcingError";
  }
}
