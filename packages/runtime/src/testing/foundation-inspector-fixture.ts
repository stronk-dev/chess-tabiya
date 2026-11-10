// Test-only genuine source seeds. Actual values/pages must still be collected through production owners.
export const FOUNDATION_INSPECTOR_CASES = [
    ["rules.structural.reading.king_opposition@3", "r7/8/8/8/8/4k3/8/4K3 b - - 0 1", "a8a7", null],
    ["rules.structural.reading.backward_pawn@3", "1r5k/8/8/p1p5/8/1P6/8/7K w - - 0 1", "h1g1", "backward_pawns"],
    ["derived.structural.reading.pawn_file_group@1", "4k3/8/P6p/8/P6p/8/P6p/4K3 w - - 0 1", "a6a7", "pawn_file_groups"],
    ["derived.activity.reading.file_state@1", "1r5k/8/8/p1p5/8/1P6/2P5/7K w - - 0 1", "h1g1", "file_states"],
    ["derived.square.reading.future_file_challenge@1", "7k/7p/8/8/8/8/P7/7K w - - 0 1", "h1g1", "future_file_challenges"],
    ["derived.square.reading.capture_migration_reach@1", "7k/7p/8/8/8/8/P7/7K w - - 0 1", "h1g1", "capture_migration_reaches"],
    ["derived.structural.reading.outpost_candidate@1", "7k/2p5/8/4N3/3P4/8/8/7K w - - 0 1", "h1g1", "outpost_candidates"],
    ["derived.structural.reading.occupied_outpost@1", "7k/2p5/8/4N3/3P4/8/8/7K w - - 0 1", "h1g1", "occupied_outposts"],
    ["derived.pawn.consequence.backward_pawn_legal_advance@1", "1r5k/8/8/p1p5/8/1P6/8/1R5K w - - 0 1", "b3b4", "backward_pawn_advance"],
] as const;
