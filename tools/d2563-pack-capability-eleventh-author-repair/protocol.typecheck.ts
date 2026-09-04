type LeaseReceipt = Readonly<{
  jobId: string;
  leaseOwner: string;
  leaseGeneration: number;
  jobRequestDigest: `sha256:${string}`;
}>;

type ApplicationReceipt = Readonly<{
  schema: "evidence_application_receipt@1";
  jobId: string;
  runId: string;
  nodeId: string;
  fromRevision: number;
  toRevision: number;
  firstEventSeq: number;
  lastEventSeq: number;
  eventDigest: `sha256:${string}`;
}>;

type Success = Readonly<{ kind: "success"; payload: unknown; objectiveProposal: unknown | null; acquisition: unknown }>;

type DurableJobState =
  | Readonly<{ state: "admitted"; leaseGeneration: number }>
  | Readonly<{ state: "running"; leaseExpiresAt: string; lease: LeaseReceipt }>
  | Readonly<{ state: "retry_wait"; leaseGeneration: number; nextAttemptAt: string; basis: unknown }>
  | Readonly<{ state: "settled_success"; leaseGeneration: number; resultSeq: number; settlement: Success }>
  | Readonly<{ state: "settled_empty" | "settled_unavailable" | "cancelled"; leaseGeneration: number; settlement: unknown }>
  | Readonly<{ state: "consumed"; leaseGeneration: number; resultSeq: number; settlement: Success; consumedAt: string; applicationReceipt: ApplicationReceipt }>;

void ({
  state: "running",
  leaseExpiresAt: "later",
  lease: { jobId: "job-a", leaseOwner: "worker-a", leaseGeneration: 2, jobRequestDigest: "sha256:abcd" },
} satisfies DurableJobState);

void ({
  state: "consumed",
  leaseGeneration: 2,
  resultSeq: 1,
  settlement: { kind: "success", payload: {}, objectiveProposal: null, acquisition: {} },
  consumedAt: "now",
  applicationReceipt: { schema: "evidence_application_receipt@1", jobId: "job-a", runId: "run-a", nodeId: "node-a", fromRevision: 2, toRevision: 3, firstEventSeq: 7, lastEventSeq: 7, eventDigest: "sha256:abcd" },
} satisfies DurableJobState);

// @ts-expect-error a running job has no owner-only authority without generation/request identity
void ({ state: "running", leaseExpiresAt: "later", lease: { jobId: "job-a", leaseOwner: "worker-a" } } satisfies DurableJobState);
// @ts-expect-error consumed success cannot omit its application receipt
void ({ state: "consumed", leaseGeneration: 2, resultSeq: 1, settlement: { kind: "success", payload: {}, objectiveProposal: null, acquisition: {} }, consumedAt: "now" } satisfies DurableJobState);
// @ts-expect-error application receipts cannot ride an admitted row
void ({ state: "admitted", leaseGeneration: 0, applicationReceipt: {} } satisfies DurableJobState);
