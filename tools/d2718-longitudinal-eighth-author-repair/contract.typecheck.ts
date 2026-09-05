import { createRun } from "../../packages/runtime/src/index.js";

import { LockedLongitudinalSourceStore, type CompleteClaimReceipt, type LockedSourceRecord } from "./contract.js";

declare const source: LockedSourceRecord;
void new LockedLongitudinalSourceStore([source]);

// @ts-expect-error imported mainline length is derived from replay, never caller-supplied storage truth
void ({ ...source, importedMainlinePlies: 12 } satisfies LockedSourceRecord);

// @ts-expect-error a complete claim receipt requires the immutable claimed cut
void ({ runId: "run", learnerId: "learner", claimedSourceDigest: `sha256:${"a".repeat(64)}`, derivedRev: 1, generation: 1, token: "token", worker: "worker" } satisfies CompleteClaimReceipt);

// @ts-expect-error a complete claim receipt requires the derivation revision
void ({ runId: "run", learnerId: "learner", claimedRequestedSeq: 1, claimedSourceDigest: `sha256:${"a".repeat(64)}`, generation: 1, token: "token", worker: "worker" } satisfies CompleteClaimReceipt);

void createRun;
