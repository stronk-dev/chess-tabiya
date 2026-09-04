import {
  parseLongitudinalReadQuery,
  type LongitudinalDenominatorRow,
  type LongitudinalObservationRow,
  type LongitudinalStructureStatRow,
  type ParsedLongitudinalReadQuery,
  type ProjectionAdmission,
} from "./contract.js";

declare const input: unknown;
declare const admissions: readonly ProjectionAdmission[];
const parsed: ParsedLongitudinalReadQuery = parseLongitudinalReadQuery(input, admissions);
parsed.learnerId satisfies string;

declare const denominator: LongitudinalDenominatorRow;
declare const observation: LongitudinalObservationRow;
declare const structure: LongitudinalStructureStatRow;
denominator.decisions satisfies number;
observation.occurredRefs satisfies readonly { readonly eventSeq: number }[];
structure.branchCount satisfies number;

// @ts-expect-error unparsed process/JSON values are not accepted as parsed queries
const forged: ParsedLongitudinalReadQuery = { learnerId: "learner", derivationRev: 1, through: { kind: "all_complete" }, filter: {} };
void forged;
