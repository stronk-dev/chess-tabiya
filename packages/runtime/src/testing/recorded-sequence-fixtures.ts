// Test-only canonical legal populations from recorded-semantic-path criterion 6.
// Shared by compiler, actual owned-storage and authenticated Review controls; not production data.
const INITIAL = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

export const RECORDED_SEQUENCE_POSITIVES = Object.freeze([
  { projection: "derived.exchange.trade_completed", fen: "4k3/8/4p3/3p4/4P3/8/8/4K3 w - - 0 1", moves: ["e4d5", "e6d5"] },
  { projection: "derived.pawn.sequence.contact_timing", fen: "4k3/8/8/3p4/8/8/4P3/4K3 w - - 0 1", moves: ["e2e4", "e8f7", "e4d5"] },
  { projection: "derived.pawn.sequence.harassment_pressure", fen: INITIAL, moves: ["d2d4", "d7d5", "g1f3", "g8f6", "e2e3", "c8g4", "h2h3", "g4h5"] },
  { projection: "derived.tactic.sequence.defender_consequence", fen: "r3k3/8/1n6/2B5/8/8/8/R3K3 w - - 0 1", moves: ["c5b6", "e8d7", "a1a8"] },
  { projection: "derived.tactic.deflection_observed", fen: "1B5k/r3q3/2n5/8/8/8/8/4R1K1 w - - 0 1", moves: ["b8a7", "c6a7", "e1e7"] },
  { projection: "derived.tactic.attraction_observed", fen: "4k3/8/4B3/8/8/8/8/R5K1 w - - 0 1", moves: ["e6d7", "e8d7", "a1d1"] },
  { projection: "derived.tactic.line_blocker_clearance_observed", fen: "q3k3/8/8/8/N7/8/8/R3K3 w - - 0 1", moves: ["a4b6", "e8f7", "a1a8"] },
  { projection: "derived.tactic.square_clearance_observed", fen: "4k3/8/8/8/8/8/8/RN2K3 w - - 0 1", moves: ["b1c3", "e8d7", "a1b1"] },
  { projection: "derived.tactic.interference_observed", fen: "r3k3/8/1R6/q7/8/8/8/6K1 w - - 0 1", moves: ["b6a6", "e8d7", "a6a5"] },
  { projection: "derived.tactic.check_zwischenzug_observed", fen: "4k3/8/8/8/1b6/2N5/1P6/3Q2K1 b - - 0 1", moves: ["b4c3", "d1h5", "e8f8", "b2c3"] },
  { projection: "derived.tactic.overload_exploitation_observed", fen: "1B5k/r3q3/2n5/8/8/8/8/4R1K1 w - - 0 1", moves: ["b8a7", "c6a7", "e1e7"] },
] as const);

export const RECORDED_SEQUENCE_HARD_NEGATIVES = Object.freeze([
  { projection: "derived.exchange.trade_completed", fen: "4k3/8/4p3/3p4/4P3/8/8/4K3 w - - 0 1", moves: ["e4d5", "e8f7", "e1f2", "e6d5"] },
  { projection: "derived.pawn.sequence.contact_timing", fen: INITIAL, moves: ["a2a3", "h7h6", "b2b3"] },
  { projection: "derived.pawn.sequence.harassment_pressure", fen: INITIAL, moves: ["d2d4", "d7d5", "g1f3", "g8f6", "e2e3", "c8g4", "h2h3", "g4f5"] },
  { projection: "derived.tactic.sequence.defender_consequence", fen: "r3k3/8/1n6/2B5/8/8/8/R3K3 w - - 0 1", moves: ["c5b6", "e8d7", "a1a7"] },
  { projection: "derived.tactic.deflection_observed", fen: "1B5k/r7/2n1q3/8/8/8/8/4R1K1 w - - 0 1", moves: ["b8a7", "c6a7", "e1e6"] },
  { projection: "derived.tactic.attraction_observed", fen: "4k3/8/1n6/8/2B5/8/8/R5K1 w - - 0 1", moves: ["c4d5", "b6d5", "a1d1"] },
  { projection: "derived.tactic.line_blocker_clearance_observed", fen: "4k3/8/8/8/8/8/8/RN2K3 w - - 0 1", moves: ["b1c3", "e8d7", "a1b1"] },
  { projection: "derived.tactic.square_clearance_observed", fen: "q3k3/8/8/8/N7/8/8/R3K3 w - - 0 1", moves: ["a4b6", "e8f7", "a1a8"] },
  { projection: "derived.tactic.interference_observed", fen: "r3k3/8/1R6/q7/8/8/8/6K1 w - - 0 1", moves: ["b6b5", "e8d7", "b5a5"] },
  { projection: "derived.tactic.check_zwischenzug_observed", fen: "4k3/8/8/8/1b6/2N5/1P6/3Q2K1 b - - 0 1", moves: ["b4c3", "d1g4", "e8f8", "b2c3"] },
  { projection: "derived.tactic.overload_exploitation_observed", fen: "1B5k/r3q3/1n6/8/8/8/8/4R1K1 w - - 0 1", moves: ["b8a7", "b6a8", "e1e7"] },
] as const);

export const RECORDED_ATTRACTION_FIVE = { fen: "3r3k/8/8/8/8/2N5/2P5/6K1 w - - 0 1", moves: ["c3d5", "d8d5", "c2c4", "h8g8", "c4d5"] } as const;
export const RECORDED_DEFLECTION_CHECK = { fen: "7k/4q1r1/8/8/8/8/8/R1K1R3 w - - 0 1", moves: ["a1a8", "g7g8", "e1e7"] } as const;

// D3736: independent legal follow-ups, including both colours and stationary-piece controls.
export const RECORDED_CASTLING_ATTRACTION = Object.freeze([
  { name: "white", fen: "4B1k1/8/8/8/8/8/8/4K2R w K - 0 1", moves: ["e8f7", "g8f7", "e1h1"], arrival: "f7", rook: "f1", emits: true },
  { name: "black", fen: "4k2r/8/8/8/8/8/8/4b1K1 b k - 0 1", moves: ["e1f2", "g1f2", "e8h8"], arrival: "f2", rook: "f8", emits: true },
  { name: "stationary king", fen: "4B1k1/8/8/8/8/8/8/6KR w K - 0 1", moves: ["e8f7", "g8f7", "g1h1"], arrival: "f7", rook: "f1", emits: true },
  { name: "quiet castling", fen: "1Bk5/8/8/8/8/8/8/4K2R w K - 0 1", moves: ["b8c7", "c8c7", "e1h1"], arrival: "c7", rook: "f1", emits: false },
  { name: "stationary rook", fen: "1Bk5/8/8/8/8/8/8/4KR2 w F - 0 1", moves: ["b8c7", "c8c7", "e1f1"], arrival: "c7", rook: "f1", emits: false },
  { name: "white five-edge queen", fen: "k3Bq2/8/8/8/8/8/8/6KR w K - 0 1", moves: ["e8f7", "f8f7", "g1h1", "a8b8", "f1f7"], arrival: "f7", rook: "f7", emits: true },
  { name: "black five-edge queen", fen: "6kr/8/8/8/8/8/8/K3bQ2 b k - 0 1", moves: ["e1f2", "f1f2", "g8h8", "a1b1", "f8f2"], arrival: "f2", rook: "f2", emits: true },
] as const);
