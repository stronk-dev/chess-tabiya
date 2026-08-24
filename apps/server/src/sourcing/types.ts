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
  "explorer_position_census",
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

export interface ClaimAssertion {
  readonly kind: string;
  readonly args: Readonly<Record<string, unknown>>;
  readonly select?: string;
}

export type ClaimSpan =
  | { readonly span: string; readonly assertion: ClaimAssertion }
  | { readonly span: string; readonly authored: true };

export interface ClaimBinding {
  readonly claimId: string;
  readonly pointer: string;
  readonly textSha256: string;
  readonly spans: readonly ClaimSpan[];
}

export interface EvidenceLedger {
  readonly schema: "tabiya.sourcing.evidence.v1";
  readonly packId?: string;
  readonly packVersion?: string;
  readonly packDigest?: string;
  readonly sourcedAt: string;
  readonly records: readonly EvidenceRecord[];
  readonly abstentions: readonly EvidenceAbstention[];
  readonly claimBindings?: readonly ClaimBinding[];
}

export type SourcingIssueCode =
  | "ATTACH_SOURCE_LINE_MISSING"
  | "ATTACH_SPAN_REQUIRED"
  | "ATTACH_TARGET_FORBIDDEN"
  | "ATTRIBUTION_MISSING"
  | "CANDIDATE_ALREADY_PROMOTED"
  | "CANDIDATE_ALREADY_REVIEWED"
  | "CANDIDATE_IDENTITY_COLLISION"
  | "CHECKPOINT_PLIES_INVALID"
  | "CLAIM_ASSERTION_UNDECLARED"
  | "CLAIM_ASSERTION_UNRECORDED"
  | "CLAIM_AUTHOR_LABEL_REQUIRED"
  | "CLAIM_BINDING_DUPLICATE"
  | "CLAIM_CENSUS_INCOMPLETE"
  | "CLAIM_FEN_OFF_PACK"
  | "CLAIM_LABEL_UNEARNED"
  | "CLAIM_POINTER_INVALID"
  | "CLAIM_POINTER_REBOUND"
  | "CLAIM_READING_UNATTRIBUTED"
  | "CLAIM_SPAN_ABSENT"
  | "CLAIM_SPAN_AMBIGUOUS"
  | "CLAIM_SPAN_CONTRADICTED"
  | "CLAIM_TEXT_DRIFTED"
  | "DEVIATION_COST_CONTRADICTED"
  | "DEVIATION_COST_OUT_OF_RANGE"
  | "DEVIATION_COST_UNBACKED"
  | "ENGINE_COVERAGE_INCOMPLETE"
  | "ENGINE_ASSESSMENT_UNGROUNDED"
  | "ENGINE_EVAL_UNAVAILABLE"
  | "ENGINE_INSTRUMENT_UNRECORDED"
  | "ENOENT"
  | "EVIDENCE_ANCHOR_BROKEN"
  | "EVIDENCE_DIGEST_STALE"
  | "EVIDENCE_INVALID"
  | "EVIDENCE_KIND_MISMATCH"
  | "EVIDENCE_KIND_UNEXPECTED"
  | "EVIDENCE_OVERREACH"
  | "EVIDENCE_PACK_MISMATCH"
  | "EVIDENCE_READ_ERROR"
  | "EVIDENCE_RETRIEVED_AT_MISMATCH"
  | "EVIDENCE_SOURCE_UNLINKED"
  | "EVIDENCE_TEMPLATE_CONFLICT"
  | "EVIDENCE_TIMESTAMP_DERIVED"
  | "EVIDENCE_TYPE_UNBACKED"
  | "EVIDENCE_VALUES_INVALID"
  | "FIXTURE_PROVENANCE_INVALID"
  | "FIXTURE_REQUEST_MISMATCH"
  | "GRADUATION_CLEARANCE_VACUOUS"
  | "LICENCE_MIXED"
  | "LICENCE_FIELD_INVALID"
  | "MANIFEST_ENTRY_UNUSED"
  | "MANIFEST_DUPLICATE_ENTRY"
  | "MANIFEST_EMPTY"
  | "MANIFEST_INVALID"
  | "MANIFEST_ORIGIN_INVALID"
  | "MANIFEST_PROVENANCE_SYNTHETIC"
  | "MANIFEST_READ_ERROR"
  | "MOVE_NOT_IN_RESPONSE"
  | "OFFLINE_JOB_HTTP_PROVENANCE"
  | "PACK_INVALID"
  | "PACK_READ_ERROR"
  | "PRIORITY_INVALID"
  | "PRIORITY_READ_ERROR"
  | "PUZZLE_MOVE_PARITY_INVALID"
  | "SOURCE_HTTP_ERROR"
  | "SOURCE_DENIED"
  | "STALE_LOCK_HELD"
  | "SYZYGY_ASSESSMENT_UNGROUNDED"
  | "VERIFY_ASSESSMENT_CONTRADICTED"
  | "VERIFY_ASSESSMENT_INDETERMINATE"
  | "VERIFY_DEVIATION_COST_CONTRADICTED"
  | "VERIFY_SPINE_CATEGORY_REGRESSION"
  | "WALK_QUERY_BUDGET_EXCEEDED";

export interface SourcingIssue {
  readonly severity: "error" | "warning";
  readonly code: SourcingIssueCode;
  readonly path: string;
  readonly message: string;
}

export type SourcingErrorCode =
  | "ANCHOR_UNRESOLVED"
  | "ARGUMENT_INVALID"
  | "ARGUMENT_MISSING"
  | "ATTACH_CHECK_FAILED"
  | "ATTACH_TARGET_FORBIDDEN"
  | "ATTACH_SPAN_REQUIRED"
  | "ATTACH_SOURCE_LINE_MISSING"
  | "AUTHORING_MULTIPV_UNSUPPORTED"
  | "CANDIDATE_IDENTITY_COLLISION"
  | "CANDIDATE_NOT_CLEAN"
  | "CHECKPOINT_PLIES_INVALID"
  | "COUNT_INVALID"
  | "DRAFT_PACK_INVALID"
  | "DEVIATION_COST_OUT_OF_RANGE"
  | "ECO_REQUIRED"
  | "EMITTED_PACK_INVALID"
  | "ENGINE_EVAL_UNAVAILABLE"
  | "EXPLORER_LINES_INVALID"
  | "EXPLORER_RESPONSE_INVALID"
  | "FIXTURE_PROVENANCE_INVALID"
  | "FIXTURE_REQUEST_MISMATCH"
  | "INVALID_REQUEST"
  | "LEARNER_SIDE_REQUIRED"
  | "LINES_REQUIRED"
  | "LOCK_LOST"
  | "MOVE_NOT_IN_RESPONSE"
  | "OPENINGS_HEADER_INVALID"
  | "OPENINGS_NAME_REQUIRED"
  | "OPENINGS_PGN_ILLEGAL"
  | "OPENINGS_PGN_INVALID"
  | "OPENINGS_ROW_INVALID"
  | "OPENINGS_ROW_NOT_FOUND"
  | "OPENINGS_SPLIT_INVALID"
  | "OPPONENT_REQUIRED"
  | "POSITIONS_REQUIRED"
  | "POSITION_LIST_INVALID"
  | "PUZZLE_CSV_INVALID"
  | "PUZZLE_FEN_INVALID"
  | "PUZZLE_HEADER_INVALID"
  | "PUZZLE_LINE_ILLEGAL"
  | "PUZZLE_MOVE_PARITY_INVALID"
  | "PUZZLE_ROW_INVALID"
  | "RATINGS_NOT_A_GROUP"
  | "RATING_BAND_INVALID"
  | "RATING_BAND_REQUIRED"
  | "SF_ARGS_INVALID"
  | "SOURCE_HTTP_ERROR"
  | "SOURCE_UNAVAILABLE"
  | "SPEEDS_NOT_A_SPEED"
  | "STALE_LOCK_HELD"
  | "TABLEBASE_SOURCE_UNAVAILABLE"
  | "VERIFY_ASSESSMENT_CONTRADICTED"
  | "VERIFY_ASSESSMENT_INDETERMINATE"
  | "VERIFY_ASSESSMENT_NOT_GROUNDABLE"
  | "VERIFY_ASSESSMENT_NOT_SYZYGY"
  | "VERIFY_DEVIATION_COST_CONTRADICTED"
  | "VERIFY_ENGINE_UNAVAILABLE"
  | "VERIFY_LEDGER_MERGE_CONFLICT"
  | "VERIFY_SPINE_CATEGORY_REGRESSION"
  | "WALK_ENUMERATE_UNSUPPORTED"
  | "WALK_QUERY_BUDGET_EXCEEDED"
  | "WINDOW_INVALID"
  | "WINDOW_REQUIRED"
  | "ZSTD_UNAVAILABLE";

export class SourcingError extends Error {
  constructor(
    readonly code: SourcingErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "SourcingError";
  }
}
