// Shared sourcing manifest types. Admission and current registry membership remain server-owned.
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
