interface ImportFailure {
  readonly code?: unknown;
  readonly message?: unknown;
}

function failure(value: unknown): ImportFailure {
  return typeof value === "object" && value !== null ? value as ImportFailure : {};
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
    if (/exactly one game/iu.test(message)) return "This importer accepts one game at a time. Paste or export a single completed game.";
    if (/variations are not accepted/iu.test(message)) return "This importer keeps one played main line. Remove analysis variations, or export the completed game rather than the analysis tree.";
    if (/unsupported PGN variant/iu.test(message)) return `${message}. Only Standard and From Position games can be imported.`;
    if (/64 KiB/iu.test(message)) return "That PGN is larger than the 64 KiB single-game limit. Export one game without an attached analysis tree.";
    if (/300 plies/iu.test(message)) return "That game is longer than the 300-ply import limit.";
    if (/at least one move/iu.test(message)) return "The PGN has headers but no played moves.";
    if (/invalid starting position/iu.test(message)) return "The PGN's starting position is invalid or incomplete.";
    if (/illegal PGN move:/iu.test(message)) return `A recorded move is illegal from the PGN's position (${message.replace(/^.*illegal PGN move:\s*/iu, "")}).`;
    if (/could not be parsed/iu.test(message)) return "The text is not a readable PGN. Export one completed game and paste the full headers plus moves.";
    return `The PGN was refused: ${message}`;
  }
  return message;
}
