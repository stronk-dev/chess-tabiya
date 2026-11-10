// D4153 disposable diagnostics. No scheduling, population, deadline, retry or result changes.
// Vitest's installed public Reporter hooks report errors before a potentially missing final summary.
function print(scope, errors) {
  for (const error of errors ?? []) {
    process.stderr.write(`[software failure] ${scope}\n${String(error?.name ?? "Error")}: ${String(error?.message ?? error)}\n${String(error?.stack ?? "").slice(0, 16_384)}\n`);
  }
}
export default class SoftwareFailureReporter {
  onTestModuleCollected(module) { print(`collection ${module.relativeModuleId}`, module.errors()); }
  onTestModuleEnd(module) { print(`module ${module.relativeModuleId}`, module.errors()); }
  onTestCaseResult(test) {
    const result = test.result();
    if (result.state === "failed") print(`${test.module.relativeModuleId} > ${test.fullName}`, result.errors);
  }
  onTestRunEnd(_modules, errors) { print("unhandled", errors); }
}
