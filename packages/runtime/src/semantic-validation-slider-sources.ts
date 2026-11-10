/** Build/test-only D4172 physical-slider2 literal propositions, under independent review.
 * No collector, production mirror, FEN-driven classifier or engine supplies expected output.
 * Explicit paths contain every near→far square including their final endpoint; r() merely
 * assembles that literal path into endpoint/interior plus explicitly supplied occupied blockers.
 * Primary piece-placement/capture/EP/promotion/castling facts establish physical board identity.
 * Accepted foundation-source-identity§3.4 / line-blocker-membership@1 separately supplies the
 * disclosed root/direction join, complete occupancy beyond first blocker and membership signs.
 * Retained Python copyright Niklas Fiekas, GPL-3.0-or-later; corresponding source/licence:
 * https://github.com/niklasf/python-chess/tree/3516d7c6c0879af724c2855fac5a304a4ef40949
 * https://github.com/niklasf/python-chess/blob/3516d7c6c0879af724c2855fac5a304a4ef40949/LICENSE.txt
 */
import { OPPOSITION_LITERAL_SOURCE } from "./semantic-validation-opposition-sources.js";
import { SEMANTIC_VALIDATION_CASTLING_SOURCES } from "./semantic-validation-castling-sources.js";
import { SEMANTIC_VALIDATION_TRANSITION_SOURCES } from "./semantic-validation-transition-sources.js";
import type { SemanticCanonicalValue, SemanticEdgeInput, SemanticMirrorOperandRule, SemanticValidationCase, SemanticValidationPropositionRecord } from "./semantic-validation.js";
type Color = "white" | "black";
type Obj = { readonly [key: string]: SemanticCanonicalValue };
type Piece = Obj & { readonly color: Color; readonly role: string; readonly square: string };
type Ray = Obj & { readonly slider: Piece; readonly endpoint: string; readonly strictInterior: readonly string[]; readonly blockers: readonly Piece[] };
type Sign = "gained" | "lost" | "membership_changed";
type Change = Obj & { readonly sign: Sign; readonly root: Piece; readonly before: Ray | null; readonly after: Ray | null };
interface Example { readonly id: string; readonly partner: string; readonly beforeFen: string; readonly moveUci: string; readonly afterFen: string; readonly events: readonly Change[]; readonly horizontalPartner?: string }
const p = (color: Color, role: string, square: string): Piece => ({ color, role, square });
const r = (slider: Piece, path: string, blockers: readonly Piece[] = []): Ray => {
  const squares = path.split(" "); const endpoint = squares.pop();
  if (!endpoint) throw Error("Every literal ray has an explicit final endpoint");
  return { slider, endpoint, strictInterior: squares, blockers: [...blockers] };
};
const D = { SW: [-1,-1], W: [-1,0], NW: [-1,1], S: [0,-1], N: [0,1], SE: [1,-1], E: [1,0], NE: [1,1] } as const;
const c = (root: Piece, direction: keyof typeof D, sign: Sign, before: Ray | null, after: Ray | null): Change => ({ root, direction: { df: D[direction][0], dr: D[direction][1] }, sign, before, after });
const ex = (id: string, partner: string, beforeFen: string, moveUci: string, afterFen: string, events: readonly Change[], horizontalPartner?: string): Example =>
  ({ id, partner, beforeFen, moveUci, afterFen, events, ...(horizontalPartner ? { horizontalPartner } : {}) });
const wa1 = p("white","rook","a1"), ba8 = p("black","rook","a8");
const wb1 = p("white","rook","b1"), bb8 = p("black","rook","b8");
const wh1 = p("white","rook","h1"), bh8 = p("black","rook","h8");
const wa2 = p("white","rook","a2"), ba7 = p("black","rook","a7");
const wba1 = p("white","bishop","a1"), bba8 = p("black","bishop","a8");
const wqa1 = p("white","queen","a1"), bqa8 = p("black","queen","a8");
const wpa7 = p("white","pawn","a7"), bpa2 = p("black","pawn","a2");

export const SLIDER_LITERAL_EXAMPLES: readonly Example[] = [
  ex("border.white","border.black","6k1/8/8/8/8/8/8/R6K w - - 0 1","a1b1","6k1/8/8/8/8/8/8/1R5K b - - 1 1",[
    c(wa1,"W","gained",null,r(wb1,"a1")),
  ],"border-east.white"),
  ex("border.black","border.white","r6k/8/8/8/8/8/8/6K1 b - - 0 1","a8b8","1r5k/8/8/8/8/8/8/6K1 w - - 1 2",[
    c(ba8,"W","gained",null,r(bb8,"a8")),
  ],"border-east.black"),
  ex("border-east.white","border-east.black","1k6/8/8/8/8/8/8/K6R w - - 0 1","h1g1","1k6/8/8/8/8/8/8/K5R1 b - - 1 1",[
    c(wh1,"E","gained",null,r(p("white","rook","g1"),"h1")),
  ],"border.white"),
  ex("border-east.black","border-east.white","k6r/8/8/8/8/8/8/1K6 b - - 0 1","h8g8","k5r1/8/8/8/8/8/8/1K6 w - - 1 2",[
    c(bh8,"E","gained",null,r(p("black","rook","g8"),"h8")),
  ],"border.black"),
  ex("border-loss.white","border-loss.black","6k1/8/8/8/8/8/8/1R5K w - - 0 1","b1a1","6k1/8/8/8/8/8/8/R6K b - - 1 1",[
    c(wb1,"W","lost",r(wb1,"a1"),null),
  ]),
  ex("border-loss.black","border-loss.white","1r5k/8/8/8/8/8/8/6K1 b - - 0 1","b8a8","r6k/8/8/8/8/8/8/6K1 w - - 1 2",[
    c(bb8,"W","lost",r(bb8,"a8"),null),
  ]),
  ex("vertical.white","vertical.black","6k1/8/8/8/8/8/8/R6K w - - 0 1","a1a2","6k1/8/8/8/8/8/R7/7K b - - 1 1",[
    c(wa1,"S","gained",null,r(wa2,"a1")),
  ]),
  ex("vertical.black","vertical.white","r6k/8/8/8/8/8/8/6K1 b - - 0 1","a8a7","7k/r7/8/8/8/8/8/6K1 w - - 1 2",[
    c(ba8,"N","gained",null,r(ba7,"a8")),
  ]),
  ex("vertical-loss.white","vertical-loss.black","6k1/8/8/8/8/8/R7/7K w - - 0 1","a2a1","6k1/8/8/8/8/8/8/R6K b - - 1 1",[
    c(wa2,"S","lost",r(wa2,"a1"),null),
  ]),
  ex("vertical-loss.black","vertical-loss.white","7k/r7/8/8/8/8/8/6K1 b - - 0 1","a7a8","r6k/8/8/8/8/8/8/6K1 w - - 1 2",[
    c(ba7,"N","lost",r(ba7,"a8"),null),
  ]),
  ex("bishop.white","bishop.black","6k1/8/8/8/8/8/8/B6K w - - 0 1","a1b2","6k1/8/8/8/8/8/1B6/7K b - - 1 1",[
    c(wba1,"SW","gained",null,r(p("white","bishop","b2"),"a1")),
    c(wba1,"NW","gained",null,r(p("white","bishop","b2"),"a3")),
    c(wba1,"SE","gained",null,r(p("white","bishop","b2"),"c1")),
  ],"bishop-east.white"),
  ex("bishop.black","bishop.white","b6k/8/8/8/8/8/8/6K1 b - - 0 1","a8b7","7k/1b6/8/8/8/8/8/6K1 w - - 1 2",[
    c(bba8,"SW","gained",null,r(p("black","bishop","b7"),"a6")),
    c(bba8,"NW","gained",null,r(p("black","bishop","b7"),"a8")),
    c(bba8,"NE","gained",null,r(p("black","bishop","b7"),"c8")),
  ],"bishop-east.black"),
  ex("bishop-east.white","bishop-east.black","1k6/8/8/8/8/8/8/K6B w - - 0 1","h1g2","1k6/8/8/8/8/8/6B1/K7 b - - 1 1",[
    c(p("white","bishop","h1"),"SW","gained",null,r(p("white","bishop","g2"),"f1")),
    c(p("white","bishop","h1"),"SE","gained",null,r(p("white","bishop","g2"),"h1")),
    c(p("white","bishop","h1"),"NE","gained",null,r(p("white","bishop","g2"),"h3")),
  ],"bishop.white"),
  ex("bishop-east.black","bishop-east.white","k6b/8/8/8/8/8/8/1K6 b - - 0 1","h8g7","k7/6b1/8/8/8/8/8/1K6 w - - 1 2",[
    c(p("black","bishop","h8"),"NW","gained",null,r(p("black","bishop","g7"),"f8")),
    c(p("black","bishop","h8"),"SE","gained",null,r(p("black","bishop","g7"),"h6")),
    c(p("black","bishop","h8"),"NE","gained",null,r(p("black","bishop","g7"),"h8")),
  ],"bishop.black"),
  ex("queen.white","queen.black","6k1/8/8/8/8/8/8/Q6K w - - 0 1","a1b2","6k1/8/8/8/8/8/1Q6/7K b - - 1 1",[
    c(wqa1,"SW","gained",null,r(p("white","queen","b2"),"a1")), c(wqa1,"W","gained",null,r(p("white","queen","b2"),"a2")),
    c(wqa1,"NW","gained",null,r(p("white","queen","b2"),"a3")), c(wqa1,"S","gained",null,r(p("white","queen","b2"),"b1")),
    c(wqa1,"SE","gained",null,r(p("white","queen","b2"),"c1")),
  ]),
  ex("queen.black","queen.white","q6k/8/8/8/8/8/8/6K1 b - - 0 1","a8b7","7k/1q6/8/8/8/8/8/6K1 w - - 1 2",[
    c(bqa8,"SW","gained",null,r(p("black","queen","b7"),"a6")), c(bqa8,"W","gained",null,r(p("black","queen","b7"),"a7")),
    c(bqa8,"NW","gained",null,r(p("black","queen","b7"),"a8")), c(bqa8,"N","gained",null,r(p("black","queen","b7"),"b8")),
    c(bqa8,"NE","gained",null,r(p("black","queen","b7"),"c8")),
  ]),
  ex("blockers.white","blockers.black","6k1/8/p7/8/b7/8/N7/R6K w - - 0 1","a2b4","6k1/8/p7/8/bN6/8/8/R6K b - - 1 1",[
    c(wa1,"N","membership_changed",r(wa1,"a2 a3 a4 a5 a6 a7 a8",[p("white","knight","a2"),p("black","bishop","a4"),p("black","pawn","a6")]),r(wa1,"a2 a3 a4 a5 a6 a7 a8",[p("black","bishop","a4"),p("black","pawn","a6")])),
  ]),
  ex("blockers.black","blockers.white","r6k/n7/8/B7/8/P7/8/6K1 b - - 0 1","a7b5","r6k/8/8/Bn6/8/P7/8/6K1 w - - 1 2",[
    c(ba8,"S","membership_changed",r(ba8,"a7 a6 a5 a4 a3 a2 a1",[p("black","knight","a7"),p("white","bishop","a5"),p("white","pawn","a3")]),r(ba8,"a7 a6 a5 a4 a3 a2 a1",[p("white","bishop","a5"),p("white","pawn","a3")])),
  ]),
  ex("same-count.white","same-count.black","6k1/8/8/8/8/8/P7/R6K w - - 0 1","a2a3","6k1/8/8/8/8/P7/8/R6K b - - 0 1",[
    c(wa1,"N","membership_changed",r(wa1,"a2 a3 a4 a5 a6 a7 a8",[p("white","pawn","a2")]),r(wa1,"a2 a3 a4 a5 a6 a7 a8",[p("white","pawn","a3")])),
  ]),
  ex("same-count.black","same-count.white","r6k/p7/8/8/8/8/8/6K1 b - - 0 1","a7a6","r6k/8/p7/8/8/8/8/6K1 w - - 0 2",[
    c(ba8,"S","membership_changed",r(ba8,"a7 a6 a5 a4 a3 a2 a1",[p("black","pawn","a7")]),r(ba8,"a7 a6 a5 a4 a3 a2 a1",[p("black","pawn","a6")])),
  ]),
  ex("moving-root.white","moving-root.black","6k1/8/8/8/8/8/8/R3K3 w - - 0 1","a1a2","6k1/8/8/8/8/8/R7/4K3 b - - 1 1",[
    c(wa1,"S","gained",null,r(wa2,"a1")),
    c(wa1,"E","membership_changed",r(wa1,"b1 c1 d1 e1 f1 g1 h1",[p("white","king","e1")]),r(wa2,"b2 c2 d2 e2 f2 g2 h2")),
  ]),
  ex("moving-root.black","moving-root.white","r3k3/8/8/8/8/8/8/6K1 b - - 0 1","a8a7","4k3/r7/8/8/8/8/8/6K1 w - - 1 2",[
    c(ba8,"N","gained",null,r(ba7,"a8")),
    c(ba8,"E","membership_changed",r(ba8,"b8 c8 d8 e8 f8 g8 h8",[p("black","king","e8")]),r(ba7,"b7 c7 d7 e7 f7 g7 h7")),
  ]),
  ex("replacement.white","replacement.black","r5k1/8/8/8/8/8/8/R6K w - - 0 1","a1a8","R5k1/8/8/8/8/8/8/7K b - - 0 1",[
    c(wa1,"S","gained",null,r(p("white","rook","a8"),"a7 a6 a5 a4 a3 a2 a1")),
    c(wa1,"N","lost",r(wa1,"a2 a3 a4 a5 a6 a7 a8"),null),
    c(wa1,"E","membership_changed",r(wa1,"b1 c1 d1 e1 f1 g1 h1"),r(p("white","rook","a8"),"b8 c8 d8 e8 f8 g8 h8",[p("black","king","g8")])),
    c(ba8,"S","lost",r(ba8,"a7 a6 a5 a4 a3 a2 a1"),null),
    c(ba8,"E","lost",r(ba8,"b8 c8 d8 e8 f8 g8 h8",[p("black","king","g8")]),null),
  ]),
  ex("replacement.black","replacement.white","r6k/8/8/8/8/8/8/R5K1 b - - 0 1","a8a1","7k/8/8/8/8/8/8/r5K1 w - - 0 2",[
    c(wa1,"N","lost",r(wa1,"a2 a3 a4 a5 a6 a7 a8"),null),
    c(wa1,"E","lost",r(wa1,"b1 c1 d1 e1 f1 g1 h1",[p("white","king","g1")]),null),
    c(ba8,"S","lost",r(ba8,"a7 a6 a5 a4 a3 a2 a1"),null),
    c(ba8,"N","gained",null,r(p("black","rook","a1"),"a2 a3 a4 a5 a6 a7 a8")),
    c(ba8,"E","membership_changed",r(ba8,"b8 c8 d8 e8 f8 g8 h8"),r(p("black","rook","a1"),"b1 c1 d1 e1 f1 g1 h1",[p("white","king","g1")])),
  ]),
  ex("promotion-queen.white","promotion-queen.black","6k1/P7/8/8/8/8/8/7K w - - 0 1","a7a8q","Q5k1/8/8/8/8/8/8/7K b - - 0 1",[
    c(wpa7,"S","gained",null,r(p("white","queen","a8"),"a7 a6 a5 a4 a3 a2 a1")),
    c(wpa7,"SE","gained",null,r(p("white","queen","a8"),"b7 c6 d5 e4 f3 g2 h1")),
    c(wpa7,"E","gained",null,r(p("white","queen","a8"),"b8 c8 d8 e8 f8 g8 h8",[p("black","king","g8")])),
  ]),
  ex("promotion-queen.black","promotion-queen.white","7k/8/8/8/8/8/p7/6K1 b - - 0 1","a2a1q","7k/8/8/8/8/8/8/q5K1 w - - 0 2",[
    c(bpa2,"N","gained",null,r(p("black","queen","a1"),"a2 a3 a4 a5 a6 a7 a8")),
    c(bpa2,"E","gained",null,r(p("black","queen","a1"),"b1 c1 d1 e1 f1 g1 h1",[p("white","king","g1")])),
    c(bpa2,"NE","gained",null,r(p("black","queen","a1"),"b2 c3 d4 e5 f6 g7 h8")),
  ]),
  ex("promotion-rook.white","promotion-rook.black","6k1/P7/8/8/8/8/8/7K w - - 0 1","a7a8r","R5k1/8/8/8/8/8/8/7K b - - 0 1",[
    c(wpa7,"S","gained",null,r(p("white","rook","a8"),"a7 a6 a5 a4 a3 a2 a1")),
    c(wpa7,"E","gained",null,r(p("white","rook","a8"),"b8 c8 d8 e8 f8 g8 h8",[p("black","king","g8")])),
  ]),
  ex("promotion-rook.black","promotion-rook.white","7k/8/8/8/8/8/p7/6K1 b - - 0 1","a2a1r","7k/8/8/8/8/8/8/r5K1 w - - 0 2",[
    c(bpa2,"N","gained",null,r(p("black","rook","a1"),"a2 a3 a4 a5 a6 a7 a8")),
    c(bpa2,"E","gained",null,r(p("black","rook","a1"),"b1 c1 d1 e1 f1 g1 h1",[p("white","king","g1")])),
  ]),
  ex("promotion-bishop.white","promotion-bishop.black","6k1/P7/8/8/8/8/8/7K w - - 0 1","a7a8b","B5k1/8/8/8/8/8/8/7K b - - 0 1",[
    c(wpa7,"SE","gained",null,r(p("white","bishop","a8"),"b7 c6 d5 e4 f3 g2 h1")),
  ]),
  ex("promotion-bishop.black","promotion-bishop.white","7k/8/8/8/8/8/p7/6K1 b - - 0 1","a2a1b","7k/8/8/8/8/8/8/b5K1 w - - 0 2",[
    c(bpa2,"NE","gained",null,r(p("black","bishop","a1"),"b2 c3 d4 e5 f6 g7 h8")),
  ]),
  ex("promotion-knight.white","promotion-knight.black","6k1/P7/8/8/8/8/8/7K w - - 0 1","a7a8n","N5k1/8/8/8/8/8/8/7K b - - 0 1",[]),
  ex("promotion-knight.black","promotion-knight.white","7k/8/8/8/8/8/p7/6K1 b - - 0 1","a2a1n","7k/8/8/8/8/8/8/n5K1 w - - 0 2",[]),
  ex("capture-promotion.white","capture-promotion.black","1r4k1/P7/8/8/8/8/8/7K w - - 0 1","a7b8q","1Q4k1/8/8/8/8/8/8/7K b - - 0 1",[
    c(wpa7,"SW","gained",null,r(p("white","queen","b8"),"a7")), c(wpa7,"W","gained",null,r(p("white","queen","b8"),"a8")),
    c(wpa7,"S","gained",null,r(p("white","queen","b8"),"b7 b6 b5 b4 b3 b2 b1")),
    c(wpa7,"SE","gained",null,r(p("white","queen","b8"),"c7 d6 e5 f4 g3 h2")),
    c(wpa7,"E","gained",null,r(p("white","queen","b8"),"c8 d8 e8 f8 g8 h8",[p("black","king","g8")])),
    c(bb8,"W","lost",r(bb8,"a8"),null), c(bb8,"S","lost",r(bb8,"b7 b6 b5 b4 b3 b2 b1"),null),
    c(bb8,"E","lost",r(bb8,"c8 d8 e8 f8 g8 h8",[p("black","king","g8")]),null),
  ]),
  ex("capture-promotion.black","capture-promotion.white","7k/8/8/8/8/8/p7/1R4K1 b - - 0 1","a2b1q","7k/8/8/8/8/8/8/1q4K1 w - - 0 2",[
    c(wb1,"W","lost",r(wb1,"a1"),null), c(wb1,"N","lost",r(wb1,"b2 b3 b4 b5 b6 b7 b8"),null),
    c(wb1,"E","lost",r(wb1,"c1 d1 e1 f1 g1 h1",[p("white","king","g1")]),null),
    c(bpa2,"W","gained",null,r(p("black","queen","b1"),"a1")), c(bpa2,"NW","gained",null,r(p("black","queen","b1"),"a2")),
    c(bpa2,"N","gained",null,r(p("black","queen","b1"),"b2 b3 b4 b5 b6 b7 b8")),
    c(bpa2,"E","gained",null,r(p("black","queen","b1"),"c1 d1 e1 f1 g1 h1",[p("white","king","g1")])),
    c(bpa2,"NE","gained",null,r(p("black","queen","b1"),"c2 d3 e4 f5 g6 h7")),
  ]),
  ex("capture-knight.white","capture-knight.black","1r4k1/P7/8/8/8/8/8/7K w - - 0 1","a7b8n","1N4k1/8/8/8/8/8/8/7K b - - 0 1",[
    c(bb8,"W","lost",r(bb8,"a8"),null), c(bb8,"S","lost",r(bb8,"b7 b6 b5 b4 b3 b2 b1"),null),
    c(bb8,"E","lost",r(bb8,"c8 d8 e8 f8 g8 h8",[p("black","king","g8")]),null),
  ]),
  ex("capture-knight.black","capture-knight.white","7k/8/8/8/8/8/p7/1R4K1 b - - 0 1","a2b1n","7k/8/8/8/8/8/8/1n4K1 w - - 0 2",[
    c(wb1,"W","lost",r(wb1,"a1"),null), c(wb1,"N","lost",r(wb1,"b2 b3 b4 b5 b6 b7 b8"),null),
    c(wb1,"E","lost",r(wb1,"c1 d1 e1 f1 g1 h1",[p("white","king","g1")]),null),
  ]),
  // All castle boards use distant BlackKb8 (and independent WhiteKb1 color partners), so
  // a crossing rook on g1/g8 does not put the non-moving king in check before the castle.
  ex("castle-king.white","castle-king.black","1k6/8/8/8/8/8/8/4K2R w K - 0 1","e1h1","1k6/8/8/8/8/8/8/5RK1 b - - 1 1",[
    c(wh1,"W","membership_changed",r(wh1,"g1 f1 e1 d1 c1 b1 a1",[p("white","king","e1")]),r(p("white","rook","f1"),"e1 d1 c1 b1 a1")),
    c(wh1,"E","gained",null,r(p("white","rook","f1"),"g1 h1",[p("white","king","g1")])),
  ]),
  ex("castle-king.black","castle-king.white","4k2r/8/8/8/8/8/8/1K6 b k - 0 1","e8h8","5rk1/8/8/8/8/8/8/1K6 w - - 1 2",[
    c(bh8,"W","membership_changed",r(bh8,"g8 f8 e8 d8 c8 b8 a8",[p("black","king","e8")]),r(p("black","rook","f8"),"e8 d8 c8 b8 a8")),
    c(bh8,"E","gained",null,r(p("black","rook","f8"),"g8 h8",[p("black","king","g8")])),
  ]),
  ex("castle-queen.white","castle-queen.black","1k6/8/8/8/8/8/8/R3K3 w Q - 0 1","e1a1","1k6/8/8/8/8/8/8/2KR4 b - - 1 1",[
    c(wa1,"W","gained",null,r(p("white","rook","d1"),"c1 b1 a1",[p("white","king","c1")])),
    c(wa1,"E","membership_changed",r(wa1,"b1 c1 d1 e1 f1 g1 h1",[p("white","king","e1")]),r(p("white","rook","d1"),"e1 f1 g1 h1")),
  ]),
  ex("castle-queen.black","castle-queen.white","r3k3/8/8/8/8/8/8/1K6 b q - 0 1","e8a8","2kr4/8/8/8/8/8/8/1K6 w - - 1 2",[
    c(ba8,"W","gained",null,r(p("black","rook","d8"),"c8 b8 a8",[p("black","king","c8")])),
    c(ba8,"E","membership_changed",r(ba8,"b8 c8 d8 e8 f8 g8 h8",[p("black","king","e8")]),r(p("black","rook","d8"),"e8 f8 g8 h8")),
  ]),
  ex("stationary-king.white","stationary-king.black","1k6/8/8/8/8/8/8/6KR w K - 0 1","g1h1","1k6/8/8/8/8/8/8/5RK1 b - - 1 1",[
    c(wh1,"W","membership_changed",r(wh1,"g1 f1 e1 d1 c1 b1 a1",[p("white","king","g1")]),r(p("white","rook","f1"),"e1 d1 c1 b1 a1")),
    c(wh1,"E","gained",null,r(p("white","rook","f1"),"g1 h1",[p("white","king","g1")])),
  ]),
  ex("stationary-king.black","stationary-king.white","6kr/8/8/8/8/8/8/1K6 b k - 0 1","g8h8","5rk1/8/8/8/8/8/8/1K6 w - - 1 2",[
    c(bh8,"W","membership_changed",r(bh8,"g8 f8 e8 d8 c8 b8 a8",[p("black","king","g8")]),r(p("black","rook","f8"),"e8 d8 c8 b8 a8")),
    c(bh8,"E","gained",null,r(p("black","rook","f8"),"g8 h8",[p("black","king","g8")])),
  ]),
  ex("stationary-rook.white","stationary-rook.black","1k6/8/8/8/8/8/8/4KR2 w K - 0 1","e1f1","1k6/8/8/8/8/8/8/5RK1 b - - 1 1",[
    c(p("white","rook","f1"),"W","membership_changed",r(p("white","rook","f1"),"e1 d1 c1 b1 a1",[p("white","king","e1")]),r(p("white","rook","f1"),"e1 d1 c1 b1 a1")),
    c(p("white","rook","f1"),"E","membership_changed",r(p("white","rook","f1"),"g1 h1"),r(p("white","rook","f1"),"g1 h1",[p("white","king","g1")])),
  ]),
  ex("stationary-rook.black","stationary-rook.white","4kr2/8/8/8/8/8/8/1K6 b k - 0 1","e8f8","5rk1/8/8/8/8/8/8/1K6 w - - 1 2",[
    c(p("black","rook","f8"),"W","membership_changed",r(p("black","rook","f8"),"e8 d8 c8 b8 a8",[p("black","king","e8")]),r(p("black","rook","f8"),"e8 d8 c8 b8 a8")),
    c(p("black","rook","f8"),"E","membership_changed",r(p("black","rook","f8"),"g8 h8"),r(p("black","rook","f8"),"g8 h8",[p("black","king","g8")])),
  ]),
  ex("crossing.white","crossing.black","1k6/8/8/8/8/8/8/5KR1 w K - 0 1","f1g1","1k6/8/8/8/8/8/8/5RK1 b - - 1 1",[
    c(p("white","rook","g1"),"W","membership_changed",r(p("white","rook","g1"),"f1 e1 d1 c1 b1 a1",[p("white","king","f1")]),r(p("white","rook","f1"),"e1 d1 c1 b1 a1")),
    c(p("white","rook","g1"),"E","membership_changed",r(p("white","rook","g1"),"h1"),r(p("white","rook","f1"),"g1 h1",[p("white","king","g1")])),
  ]),
  ex("crossing.black","crossing.white","5kr1/8/8/8/8/8/8/1K6 b k - 0 1","f8g8","5rk1/8/8/8/8/8/8/1K6 w - - 1 2",[
    c(p("black","rook","g8"),"W","membership_changed",r(p("black","rook","g8"),"f8 e8 d8 c8 b8 a8",[p("black","king","f8")]),r(p("black","rook","f8"),"e8 d8 c8 b8 a8")),
    c(p("black","rook","g8"),"E","membership_changed",r(p("black","rook","g8"),"h8"),r(p("black","rook","f8"),"g8 h8",[p("black","king","g8")])),
  ]),
  ex("ep.white","ep.black","7k/8/8/4Pp1r/8/8/8/K7 w - f6 0 1","e5f6","7k/8/5P2/7r/8/8/8/K7 b - - 0 1",[
    c(p("black","rook","h5"),"W","membership_changed",r(p("black","rook","h5"),"g5 f5 e5 d5 c5 b5 a5",[p("black","pawn","f5"),p("white","pawn","e5")]),r(p("black","rook","h5"),"g5 f5 e5 d5 c5 b5 a5")),
  ]),
  ex("ep.black","ep.white","k7/8/8/8/4pP1R/8/8/7K b - f3 0 1","e4f3","k7/8/8/8/7R/5p2/8/7K w - - 0 2",[
    c(p("white","rook","h4"),"W","membership_changed",r(p("white","rook","h4"),"g4 f4 e4 d4 c4 b4 a4",[p("white","pawn","f4"),p("black","pawn","e4")]),r(p("white","rook","h4"),"g4 f4 e4 d4 c4 b4 a4")),
  ]),
  ex("quiet-rook.white","quiet-rook.black","6k1/8/8/8/8/8/7K/R7 w - - 0 1","h2g2","6k1/8/8/8/8/8/6K1/R7 b - - 1 1",[]),
  ex("quiet-rook.black","quiet-rook.white","r7/7k/8/8/8/8/8/6K1 b - - 0 1","h7g7","r7/6k1/8/8/8/8/8/6K1 w - - 1 2",[]),
  ex("quiet-bishop.white","quiet-bishop.black","6k1/8/8/8/8/8/7K/B7 w - - 0 1","h2g2","6k1/8/8/8/8/8/6K1/B7 b - - 1 1",[]),
  ex("quiet-bishop.black","quiet-bishop.white","b7/7k/8/8/8/8/8/6K1 b - - 0 1","h7g7","b7/6k1/8/8/8/8/8/6K1 w - - 1 2",[]),
  ex("quiet-queen.white","quiet-queen.black","6k1/8/8/8/8/8/7K/Q7 w - - 0 1","h2g2","6k1/8/8/8/8/8/6K1/Q7 b - - 1 1",[]),
  ex("quiet-queen.black","quiet-queen.white","q7/7k/8/8/8/8/8/6K1 b - - 0 1","h7g7","q7/6k1/8/8/8/8/8/6K1 w - - 1 2",[]),
  ex("no-sliders.white","no-sliders.black","6k1/8/8/8/8/8/8/7K w - - 0 1","h1g1","6k1/8/8/8/8/8/8/6K1 b - - 1 1",[]),
  ex("no-sliders.black","no-sliders.white","7k/8/8/8/8/8/8/6K1 b - - 0 1","h8g8","6k1/8/8/8/8/8/8/6K1 w - - 1 2",[]),
  // The endpoint is excluded from blocker membership, even when a real occupant arrives there.
  ex("endpoint.black","endpoint.white","6k1/8/1n6/8/8/8/8/R6K b - - 0 1","b6a8","n5k1/8/8/8/8/8/8/R6K w - - 1 2",[]),
  ex("endpoint.white","endpoint.black","r6k/8/8/8/8/1N6/8/6K1 w - - 0 1","b3a1","r6k/8/8/8/8/8/8/N5K1 b - - 1 1",[]),
  ex("incompatible.white","incompatible.black","6k1/8/8/8/8/8/P7/B6K w - - 0 1","a2a3","6k1/8/8/8/8/P7/8/B6K b - - 0 1",[]),
  ex("incompatible.black","incompatible.white","b6k/p7/8/8/8/8/8/6K1 b - - 0 1","a7a6","b6k/8/p7/8/8/8/8/6K1 w - - 0 2",[]),
  // Origin and strict-interior geometry change, but every actual blocker list stays unchanged.
  ex("moving-equal.white","moving-equal.black","6k1/8/8/8/8/8/R7/7K w - - 0 1","a2a3","6k1/8/8/8/8/R7/8/7K b - - 1 1",[]),
  ex("moving-equal.black","moving-equal.white","7k/r7/8/8/8/8/8/6K1 b - - 0 1","a7a6","7k/8/r7/8/8/8/8/6K1 w - - 1 2",[]),
];

export const SLIDER_LITERAL_SUBJECT = { kind: "event", projection: { id: "rules.transition.event.slider_ray", version: 2 } } as const;
export function sliderLiteralOperands(row: Example): readonly Change[] {
  return row.events.map(value => ({ beforeFen: row.beforeFen, moveUci: row.moveUci, afterFen: row.afterFen, ...value }));
}
const ordered = (path: readonly string[], value: "identity" | "color" | "square"): SemanticMirrorOperandRule => ({ sourcePath: path, partnerPath: path, value, collection: "ordered" });
const mirrorRules: readonly SemanticMirrorOperandRule[] = [
  { sourcePath: ["beforeFen"], partnerPath: ["beforeFen"], value: "input_before_fen", collection: "scalar" },
  { sourcePath: ["moveUci"], partnerPath: ["moveUci"], value: "input_move_uci", collection: "scalar" },
  { sourcePath: ["afterFen"], partnerPath: ["afterFen"], value: "input_after_fen", collection: "scalar" },
  ordered(["sign"],"identity"), ordered(["root","color"],"color"), ordered(["root","role"],"identity"), ordered(["root","square"],"square"),
  { sourcePath: ["direction","df"], partnerPath: ["direction","df"], value: "signed_file_delta", collection: "scalar" },
  { sourcePath: ["direction","dr"], partnerPath: ["direction","dr"], value: "signed_rank_delta", collection: "scalar" },
  ...["before","after"].flatMap(stage => [
    ordered([stage],"identity"), ordered([stage,"slider","color"],"color"), ordered([stage,"slider","role"],"identity"), ordered([stage,"slider","square"],"square"),
    ordered([stage,"endpoint"],"square"), ordered([stage,"strictInterior","*"],"square"),
    ordered([stage,"blockers","*","color"],"color"), ordered([stage,"blockers","*","role"],"identity"), ordered([stage,"blockers","*","square"],"square"),
  ]),
];
interface SourceCase { readonly arm: SemanticValidationCase["arm"]; readonly input: SemanticEdgeInput; readonly proposition: Omit<SemanticValidationPropositionRecord,"factConstraintSha256"> }
const id = (example: string, arm: string) => `cited.literal-board.slider2.${example}.${arm}`;
const cases: SourceCase[] = SLIDER_LITERAL_EXAMPLES.flatMap(row => {
  const input: SemanticEdgeInput = { kind: "edge", beforeFen: row.beforeFen, moveUci: row.moveUci, afterFen: row.afterFen };
  if (row.events.length === 0) return [{ arm: "semantic_negative", input, proposition: { subject: SLIDER_LITERAL_SUBJECT, case: { id: id(row.id,"negative"), version: 1 }, factConstraint: [], expectation: { kind: "omits" } } }];
  const absolute: SourceCase = { arm: "positive", input, proposition: { subject: SLIDER_LITERAL_SUBJECT, case: { id: id(row.id,"absolute"), version: 1 }, factConstraint: [], expectation: { kind: "emits_exact", events: sliderLiteralOperands(row).map(operands => ({ sign: operands.sign, operands })) } } };
  const mirror = (geometry: "horizontal" | "color_and_vertical", partner: string): SourceCase => ({ arm: "orientation", input, proposition: { subject: SLIDER_LITERAL_SUBJECT, case: { id: id(row.id,geometry), version: 1 }, factConstraint: [], expectation: { kind: "mirrors", geometry,
    partnerCase: { kind: "case", id: id(partner,geometry), version: 1, subject: SLIDER_LITERAL_SUBJECT, arm: "orientation" }, targetEvents: { nonEmpty: true, pairing: "canonical_subject_sign_operands" }, operandRules: mirrorRules } } });
  return [absolute,mirror("color_and_vertical",row.partner),...(row.horizontalPartner ? [mirror("horizontal",row.horizontalPartner)] : [])];
});

export const SLIDER_LITERAL_SOURCE = Object.freeze({
  sourceId: "python-chess.literal-board.slider2", sourceRevision: OPPOSITION_LITERAL_SOURCE.sourceRevision, licence: OPPOSITION_LITERAL_SOURCE.licence, url: OPPOSITION_LITERAL_SOURCE.url,
  text: OPPOSITION_LITERAL_SOURCE.text + "\nPhysical capture/EP/promotion facts:\n" + SEMANTIC_VALIDATION_TRANSITION_SOURCES[0]!.text + "\nComplete physical castling relocations:\n" + SEMANTIC_VALIDATION_CASTLING_SOURCES[0]!.text,
  operation: { id: "runtime.semantic.foundation_edge", version: 1 } as const, cases,
});
