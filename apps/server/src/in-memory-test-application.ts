// TEST-ONLY composition (rfc/longitudinal-store.md §C, criterion 27). An isolated in-memory
// application has no second SQLite connection, so it has no longitudinal worker and reports
// `longitudinal.status: "disabled_test"`. `main.ts` never imports this module (census-tested), and it
// cannot satisfy worker/readiness acceptance.
import { composeApplication, type ApplicationOptions, type ChessTabiyaApplication } from "./application.js";

export function createInMemoryTestApplication(
  options: Omit<ApplicationOptions, "databasePath" | "longitudinalWorkerEntry"> = {},
): Promise<ChessTabiyaApplication> {
  return composeApplication({ ...options, databasePath: ":memory:" }, { kind: "disabled_test" });
}
