import type { AssistanceConfig } from "../../packages/runtime/src/assistance.js";

type AssistanceField = keyof Omit<AssistanceConfig, "version">;

declare function writeAssistance<Key extends AssistanceField>(
  key: Key,
  value: AssistanceConfig[Key],
): void;

writeAssistance("markers", "live");
writeAssistance("boardLighting", "evidence");

// @ts-expect-error version is not an assistance field write
writeAssistance("version", 4);
// @ts-expect-error unknown fields do not enter the closed resource
writeAssistance("engineSource", "stockfish");
// @ts-expect-error the value must belong to the selected field
writeAssistance("markers", "evidence");

declare const widened: string;
// @ts-expect-error a widened key is not proof of one closed field
writeAssistance(widened, "off");
