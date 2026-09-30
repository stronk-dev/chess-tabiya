interface ImportFailure {
  readonly code?: unknown;
  readonly message?: unknown;
}

function failure(value: unknown): ImportFailure {
  return typeof value === "object" && value !== null ? value as ImportFailure : {};
}

// ux-import-and-account.md §2.3 (IMP-a9): the game importer and the repertoire importer disagree
// about multi-game, variation-bearing PGN by design — one keeps a played game, the other keeps an
// opening tree. Each refusal names the form that accepts what was refused, so the two stop reading
// as contradictory answers to the same question.
export const REPERTOIRE_IMPORT_POINTER = "To keep several games or an analysis tree with variations as an opening repertoire, use Import repertoire under Learn › Repertoire gaps, which accepts both.";

export interface PgnSideHint {
  readonly white?: string;
  readonly black?: string;
  /** Set only when exactly one player header names the signed-in learner. */
  readonly side?: "white" | "black";
}

function header(pgn: string, tag: "White" | "Black"): string | undefined {
  const value = new RegExp(`^\\s*\\[${tag}\\s+"((?:[^"\\\\]|\\\\.)*)"\\s*\\]`, "mu").exec(pgn)?.[1]?.replace(/\\(.)/gu, "$1").trim();
  return value === undefined || value === "" || value === "?" ? undefined : value;
}

/**
 * IMP-a5: the PGN's own White/Black headers usually answer "Your side" before anything is parsed on
 * the server. The hint reads the first game's headers only; the server remains the parsing authority.
 */
export function pgnSideHint(pgn: string, handle: string | undefined): PgnSideHint | undefined {
  const white = header(pgn, "White");
  const black = header(pgn, "Black");
  if (white === undefined && black === undefined) return undefined;
  const me = handle?.replace(/^@/u, "").toLocaleLowerCase();
  const matches = (name: string | undefined) => me !== undefined && me !== "" && name?.replace(/^@/u, "").toLocaleLowerCase() === me;
  const side = matches(white) && !matches(black) ? "white" : matches(black) && !matches(white) ? "black" : undefined;
  return Object.freeze({ ...(white === undefined ? {} : { white }), ...(black === undefined ? {} : { black }), ...(side === undefined ? {} : { side }) });
}

/** Learner-facing import refusals. The server remains the parsing authority. */
export function importFailureCopy(value: unknown): string {
  const error = failure(value);
  const code = typeof error.code === "string" ? error.code : "";
  const message = typeof error.message === "string" ? error.message : String(value);

  if (code === "IMPORT_SOURCE_NOT_FOUND") return "That Lichess game could not be found. Check that the game is public and the URL contains its eight-character game id.";
  if (code === "IMPORT_SOURCE_UNAVAILABLE") return "Lichess did not answer in time. Your game was not stored; try the URL again or paste its PGN.";
  if (code === "IMPORT_SOURCE_UNSUPPORTED") return "This URL source is not supported. Use one public Lichess game URL, or paste one game's PGN.";
  if (code === "IMPORT_INVALID_PGN" || code === "IMPORT_INVALID") {
    if (/exactly one game/iu.test(message)) return `This importer accepts one game at a time. Paste or export a single completed game. ${REPERTOIRE_IMPORT_POINTER}`;
    if (/variations are not accepted/iu.test(message)) return `This importer keeps one played main line. Remove analysis variations, or export the completed game rather than the analysis tree. ${REPERTOIRE_IMPORT_POINTER}`;
    if (/unsupported PGN variant/iu.test(message)) return `${message}. Only Standard and From Position games can be imported.`;
    if (/64 KiB/iu.test(message)) return "That PGN is larger than the 64 KiB single-game limit. Export one game without an attached analysis tree.";
    if (/300 plies/iu.test(message)) return "That game is longer than the 300-turn import limit.";
    if (/at least one move/iu.test(message)) return "The PGN has headers but no played moves.";
    if (/invalid starting position/iu.test(message)) return "The PGN's starting position is invalid or incomplete.";
    if (/illegal PGN move:/iu.test(message)) return `A recorded move is illegal from the PGN's position (${message.replace(/^.*illegal PGN move:\s*/iu, "")}).`;
    if (/could not be parsed/iu.test(message)) return "The text is not a readable PGN. Export one completed game and paste the full headers plus moves.";
    return "The PGN was refused because it does not meet the single-game import contract.";
  }
  return "The game could not be imported. Nothing was stored; try again.";
}
