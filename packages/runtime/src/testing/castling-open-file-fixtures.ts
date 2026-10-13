// D3757: legal move fixtures, not authored teaching or a calibration population.
export const CASTLING_OPEN_FILE_CASES = [
  { name: "white kingside", fen: "4k3/8/8/8/8/8/7P/4K2R w K - 0 1", uci: "e1h1", from: "h1", to: "f1", side: "white", fileClass: "open_file" },
  { name: "black kingside", fen: "4k2r/7p/8/8/8/8/8/4K3 b k - 0 1", uci: "e8h8", from: "h8", to: "f8", side: "black", fileClass: "open_file" },
  { name: "white queenside", fen: "4k3/8/8/8/8/8/P7/R3K3 w Q - 0 1", uci: "e1a1", from: "a1", to: "d1", side: "white", fileClass: "open_file" },
  { name: "black queenside", fen: "r3k3/p7/8/8/8/8/8/4K3 b q - 0 1", uci: "e8a8", from: "a8", to: "d8", side: "black", fileClass: "open_file" },
  { name: "white stationary king", fen: "4k3/8/8/8/8/8/7P/6KR w H - 0 1", uci: "g1h1", from: "h1", to: "f1", side: "white", fileClass: "open_file" },
  { name: "black stationary king", fen: "6kr/7p/8/8/8/8/8/4K3 b h - 0 1", uci: "g8h8", from: "h8", to: "f8", side: "black", fileClass: "open_file" },
  { name: "white swapped origins", fen: "4k3/8/8/8/8/8/6P1/5KR1 w G - 0 1", uci: "f1g1", from: "g1", to: "f1", side: "white", fileClass: "open_file" },
  { name: "black swapped origins", fen: "5kr1/6p1/8/8/8/8/8/4K3 b g - 0 1", uci: "f8g8", from: "g8", to: "f8", side: "black", fileClass: "open_file" },
  { name: "white nonstandard queenside", fen: "4k3/8/8/8/8/8/1P6/1R4K1 w B - 0 1", uci: "g1b1", from: "b1", to: "d1", side: "white", fileClass: "open_file" },
  { name: "black nonstandard queenside", fen: "1r4k1/1p6/8/8/8/8/8/4K3 b b - 0 1", uci: "g8b8", from: "b8", to: "d8", side: "black", fileClass: "open_file" },
  { name: "white half-open", fen: "4k3/8/5p2/8/8/8/7P/4K2R w K - 0 1", uci: "e1h1", from: "h1", to: "f1", side: "white", fileClass: "half_open_file" },
  { name: "black half-open", fen: "4k2r/7p/8/8/8/5P2/8/4K3 b k - 0 1", uci: "e8h8", from: "h8", to: "f8", side: "black", fileClass: "half_open_file" },
] as const;

export const CASTLING_OPEN_FILE_NEGATIVES = [
  { name: "white stationary rook", fen: "4k3/8/8/8/8/8/5P2/4KR2 w F - 0 1", uci: "e1f1" },
  { name: "black stationary rook", fen: "4kr2/5p2/8/8/8/8/8/4K3 b f - 0 1", uci: "e8f8" },
  { name: "white already open source", fen: "4k3/8/8/8/8/8/8/4K2R w K - 0 1", uci: "e1h1" },
  { name: "black already open source", fen: "4k2r/8/8/8/8/8/8/4K3 b k - 0 1", uci: "e8h8" },
  { name: "white already half-open source", fen: "4k3/8/7p/8/8/8/8/4K2R w K - 0 1", uci: "e1h1" },
  { name: "black already half-open source", fen: "4k2r/8/8/8/8/7P/8/4K3 b k - 0 1", uci: "e8h8" },
  { name: "white own pawn on destination file", fen: "4k3/8/8/8/8/8/5P1P/4K2R w K - 0 1", uci: "e1h1" },
  { name: "black own pawn on destination file", fen: "4k2r/5p1p/8/8/8/8/8/4K3 b k - 0 1", uci: "e8h8" },
] as const;
