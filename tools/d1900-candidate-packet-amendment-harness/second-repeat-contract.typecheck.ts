// DISPOSABLE compile contract — D1961. Expected errors prove widened authorities stay closed.
const MOVE_IDENTITY_CONVENTION = "chessops-king-takes-rook@1" as const;
const CANDIDATE_PACKET_COMPILER_VERSION = 1 as const;
const ABSTENTION_REASONS = {
  "rules.example.available@1": ["source_unavailable", "budget_exhausted"],
  "rules.example.other@1": ["input_abstained"],
} as const;

type ReasonMap = typeof ABSTENTION_REASONS;
type Abstention = {
  [Projection in keyof ReasonMap]: {
    readonly projection: Projection;
    readonly reason: ReasonMap[Projection][number];
  }
}[keyof ReasonMap];

interface PacketIdentity {
  readonly moveIdentityConvention: typeof MOVE_IDENTITY_CONVENTION;
  readonly compilerVersion: typeof CANDIDATE_PACKET_COMPILER_VERSION;
}

const validIdentity: PacketIdentity = {
  moveIdentityConvention: MOVE_IDENTITY_CONVENTION,
  compilerVersion: CANDIDATE_PACKET_COMPILER_VERSION,
};
const validReason: Abstention = {
  projection: "rules.example.available@1",
  reason: "budget_exhausted",
};

const wrongConvention: PacketIdentity = {
  // @ts-expect-error the packet retains the one exported move convention literally
  moveIdentityConvention: "standard-uci@1",
  compilerVersion: CANDIDATE_PACKET_COMPILER_VERSION,
};
const wrongVersion: PacketIdentity = {
  moveIdentityConvention: MOVE_IDENTITY_CONVENTION,
  // @ts-expect-error the receipt cannot widen the compiler version
  compilerVersion: 2,
};
// @ts-expect-error this reason exists, but not for this projection
const crossedReason: Abstention = {
  projection: "rules.example.other@1",
  reason: "budget_exhausted",
};

void validIdentity;
void validReason;
void wrongConvention;
void wrongVersion;
void crossedReason;
