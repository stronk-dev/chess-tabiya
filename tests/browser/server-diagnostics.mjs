// Test-only observation of the actual browser server. Never imported by production.
// Request-window CPU is inclusive main-thread CPU, NOT exclusive handler CPU.
import { AsyncLocalStorage } from "node:async_hooks";
import { Server } from "node:http";
import { performance } from "node:perf_hooks";
import { DatabaseSync } from "node:sqlite";

export function arrivalWriteRoute(method, url) {
  if (method !== "POST" || typeof url !== "string") return undefined;
  const path = url.split("?", 1)[0];
  if (path === "/runs") return "/runs";
  if (/^\/runs\/[^/]+\/moves$/u.test(path)) return "/runs/:id/moves";
  return undefined;
}

export function installArrivalServerDiagnostics({
  report = (row) => console.log(`ARRIVAL_SERVER_PHASES ${JSON.stringify(row)}`),
  now = () => performance.now(),
  cpu = (previous) => process.threadCpuUsage(previous),
} = {}) {
  const context = new AsyncLocalStorage();
  const emitDescriptor = Object.getOwnPropertyDescriptor(Server.prototype, "emit");
  // EventEmitter owns emit on current Node; preserve that inheritance on cleanup.
  const originalEmit = Server.prototype.emit;
  const execDescriptor = Object.getOwnPropertyDescriptor(DatabaseSync.prototype, "exec");
  const originalExec = execDescriptor.value;
  let installed = true;
  const safeCpu = (previous) => { try { return cpu(previous); } catch { return undefined; } };
  Object.defineProperty(DatabaseSync.prototype, "exec", { ...execDescriptor, value: function (...args) {
    const window = context.getStore();
    const sql = args[0];
    const token = typeof sql === "string" ? /^\s*(BEGIN|COMMIT|ROLLBACK)\b/iu.exec(sql)?.[1]?.toLowerCase() : undefined;
    if (!installed || window === undefined || window.closed || token === undefined) return originalExec.apply(this, args);
    const started = now();
    try { return originalExec.apply(this, args); }
    finally {
      const phase = window.sqlite[token];
      const elapsed = now() - started;
      phase.count++;
      phase.totalMs += elapsed;
      phase.maxMs = Math.max(phase.maxMs, elapsed);
    }
  } });
  Object.defineProperty(Server.prototype, "emit", { configurable: true, writable: true, value: function (event, ...args) {
    if (!installed || event !== "request") return originalEmit.call(this, event, ...args);
    const [request, response] = args;
    const route = arrivalWriteRoute(request.method, request.url);
    if (route === undefined) return originalEmit.call(this, event, ...args);
    const window = { closed: false, startedAt: new Date().toISOString(), started: now(), initialCpu: safeCpu(), sqlite: {
      begin: { count: 0, totalMs: 0, maxMs: 0 },
      commit: { count: 0, totalMs: 0, maxMs: 0 },
      rollback: { count: 0, totalMs: 0, maxMs: 0 },
    } };
    const finish = (outcome) => {
      if (window.closed) return;
      window.closed = true;
      const elapsedMs = now() - window.started;
      const usage = window.initialCpu === undefined ? undefined : safeCpu(window.initialCpu);
      const mainThreadCpuMs = usage === undefined ? null : (usage.user + usage.system) / 1000;
      // No SQL text, request/response bytes, ids, headers, cookies or raw traces.
      // Fixed-size aggregates include every matching SQL call rather than drop overflow.
      const row = { route, outcome, startedAt: window.startedAt, statusCode: response.statusCode, requestWindowMs: elapsedMs,
        mainThreadCpuMs, sqlite: window.sqlite };
      // Observation/report failures must not turn a successful write into a failed response.
      try { report(row); } catch { /* diagnostics are not application authority */ }
    };
    response.once("finish", () => finish("finished"));
    response.once("close", () => finish("closed"));
    return context.run(window, () => originalEmit.call(this, event, ...args));
  } });
  return () => {
    if (!installed) return;
    installed = false;
    Object.defineProperty(DatabaseSync.prototype, "exec", execDescriptor);
    if (emitDescriptor === undefined) delete Server.prototype.emit;
    else Object.defineProperty(Server.prototype, "emit", emitDescriptor);
    context.disable();
  };
}
