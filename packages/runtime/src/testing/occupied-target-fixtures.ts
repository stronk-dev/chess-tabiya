// D3762 legal transition controls, not authored instruction or a calibration population.
export const OCCUPIED_TARGET_IDENTITY_CASES = [
  { name: "white queenside long king", fen: "4k3/8/8/8/8/8/8/2R2K2 w C - 0 1", uci: "f1c1", side: "white", target: "c1", sign: null },
  { name: "black queenside long king", fen: "2r2k2/8/8/8/8/8/8/4K3 b c - 0 1", uci: "f8c8", side: "black", target: "c8", sign: null },
  { name: "white queenside ordinary king", fen: "4k3/8/8/8/8/8/8/2R1K3 w C - 0 1", uci: "e1c1", side: "white", target: "c1", sign: null },
  { name: "black queenside ordinary king", fen: "2r1k3/8/8/8/8/8/8/4K3 b c - 0 1", uci: "e8c8", side: "black", target: "c8", sign: null },
  { name: "white kingside c king", fen: "4k3/8/8/8/8/8/8/2K3R1 w G - 0 1", uci: "c1g1", side: "white", target: "g1", sign: null },
  { name: "black kingside c king", fen: "2k3r1/8/8/8/8/8/8/4K3 b g - 0 1", uci: "c8g8", side: "black", target: "g8", sign: null },
  { name: "white kingside b king", fen: "4k3/8/8/8/8/8/8/1K4R1 w G - 0 1", uci: "b1g1", side: "white", target: "g1", sign: null },
  { name: "black kingside b king", fen: "1k4r1/8/8/8/8/8/8/4K3 b g - 0 1", uci: "b8g8", side: "black", target: "g8", sign: null },
  { name: "white retained bishop gained", fen: "7k/8/8/8/8/4B3/8/R6K w - - 0 1", uci: "a1e1", side: "white", target: "e3", sign: "gained" },
  { name: "black retained bishop gained", fen: "r6k/8/4b3/8/8/8/8/7K b - - 0 1", uci: "a8e8", side: "black", target: "e6", sign: "gained" },
  { name: "white retained bishop lost", fen: "7k/8/8/8/8/4B3/8/4R2K w - - 0 1", uci: "e1a1", side: "white", target: "e3", sign: "lost" },
  { name: "black retained bishop lost", fen: "4r2k/8/4b3/8/8/8/8/7K b - - 0 1", uci: "e8a8", side: "black", target: "e6", sign: "lost" },
] as const;
