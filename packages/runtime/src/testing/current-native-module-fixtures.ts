// Test-only legal source/consumer fixtures. No evidence or provider result is manufactured.
export const CURRENT_NATIVE_MODULE_CASES = [
  ["rules.structural.event.king_opposition@2", "r7/8/8/4k3/8/4K3/8/8 w - - 0 1", "e3d3"],
  ["rules.structural.event.backward_pawn@2", "7k/8/2p5/8/3P1N2/8/8/7K w - - 0 1", "f4d5"],
  ["derived.structural.event.pawn_file_group@1", "7k/p7/8/8/8/8/P7/7K w - - 0 1", "a2a3"],
  ["rules.transition.event.slider_ray@2", "4k3/8/8/8/8/8/B7/R3K3 w - - 0 1", "a2b3"],
  ["derived.activity.event.file_state@1", "7k/1p6/8/8/3p4/1N6/2P5/7K w - - 0 1", "b3d4"],
  ["derived.activity.event.file_access_revealed@1", "7k/1p6/8/8/3p4/1N6/2P5/3R3K w - - 0 1", "b3d4"],
  ["rules.structural.event.pawn_islands@2", "7k/1p6/8/8/3p4/1N6/2P5/3R3K w - - 0 1", "b3d4"],
] as const;
