export interface ThemeArtworkAsset {
  id: string;
  file: string;
  author: string;
  license: string;
  redistributionBasis: string;
  source: string;
}

export const THEME_ARTWORK_ASSETS: readonly ThemeArtworkAsset[] = Object.freeze([
  Object.freeze({
    id: "board.brown",
    file: "board-skins/brown.css",
    author: "lichess-org / Chessground contributors",
    license: "GPL-3.0-or-later",
    redistributionBasis: "Extracted from the pinned @lichess-org/chessground 10.1.1 package.",
    source: "https://github.com/lichess-org/chessground",
  }),
  Object.freeze({
    id: "board.olive",
    file: "board-skins/olive.css",
    author: "Tabiya contributors",
    license: "AGPL-3.0-or-later",
    redistributionBasis: "Original CSS board skin distributed with Tabiya.",
    source: "LICENSE",
  }),
  Object.freeze({
    id: "pieces.cburnett",
    file: "@lichess-org/chessground/assets/chessground.cburnett.css",
    author: "Colin M.L. Burnett",
    license: "GPL-2.0-or-later",
    redistributionBasis: "Bundled by the pinned Chessground package; Lichess COPYING.md lists the set GPLv2+.",
    source: "https://github.com/lichess-org/lila/blob/master/COPYING.md",
  }),
  Object.freeze({
    id: "pieces.mono",
    file: "piece-skins/mono.css",
    author: "Thibault Duplessis and Colin M.L. Burnett",
    license: "GPL-2.0-or-later",
    redistributionBasis: "Geometry from Lichess Mono; neutral fill recolored without changing the shapes.",
    source: "https://github.com/lichess-org/lila/tree/master/public/piece/mono",
  }),
]);
