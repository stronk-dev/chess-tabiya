// Only the Playwright server launch preloads this observer; deployable main.js does not.
import { installArrivalServerDiagnostics } from "./server-diagnostics.mjs";
installArrivalServerDiagnostics();
