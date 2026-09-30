import { EngineSupervisor, type EngineSpec, type EngineSupervisorOptions, type EngineIdentity, type EngineHealth, type EngineRequest, type EngineExchangeRequest, type EngineExchangeCapture, type EngineArtifactCapture, type TranscriptEntry } from "./engine-supervisor.js";

export interface SharedEngineSpec extends EngineSpec {
  /** Logical role over an exactly identical launch/options specification. No alias chains. */
  readonly sharedProcessWith?: string;
}

/** Application allocation adapter; the frozen semantic supervisor/selector roots stay unchanged. */
export class SharedEngineSupervisor extends EngineSupervisor {
  readonly #roles: ReadonlyMap<string, SharedEngineSpec>;

  constructor(specs: readonly SharedEngineSpec[], options: EngineSupervisorOptions = {}) {
    const roles = new Map<string, SharedEngineSpec>();
    for (const spec of specs) {
      if (roles.has(spec.id)) throw new TypeError(`Duplicate engine id: ${spec.id}`);
      roles.set(spec.id, spec);
    }
    const processImage = (spec: SharedEngineSpec): string => JSON.stringify(Object.fromEntries(
      Object.entries(spec).filter(([key]) => !["id", "kind", "sharedProcessWith"].includes(key)).sort(([a], [b]) => a.localeCompare(b))
        .map(([key, value]) => [key, key === "options" ? Object.fromEntries(Object.entries(value as object).sort(([a], [b]) => a.localeCompare(b))) : value]),
    ));
    for (const spec of specs) {
      if (spec.sharedProcessWith === undefined) continue;
      const physical = roles.get(spec.sharedProcessWith);
      if (physical === undefined || physical.sharedProcessWith !== undefined || processImage(spec) !== processImage(physical)) {
        throw new TypeError(`Shared engine ${spec.id} must name an identical physical launch/options (no alias chains)`);
      }
    }
    super(specs.filter((spec) => spec.sharedProcessWith === undefined), {
      ...options,
      onLifecycle: (event) => {
        for (const role of specs.filter((spec) => spec.id === event.engineId || spec.sharedProcessWith === event.engineId)) {
          try { options.onLifecycle?.({ ...event, engineId: role.id }); } catch { /* bookkeeping cannot alter supervision or another role */ }
        }
      },
    });
    this.#roles = roles;
  }

  #physical(id: string): string { return this.#roles.get(id)?.sharedProcessWith ?? id; }
  #identity(id: string, identity: EngineIdentity): EngineIdentity {
    const role = this.#roles.get(id);
    return role?.sharedProcessWith === undefined ? identity : Object.freeze({ ...identity, id: role.id, kind: role.kind });
  }
  override async start(id: string): Promise<EngineIdentity> { return this.#identity(id, await super.start(this.#physical(id))); }
  override async startAll(): Promise<readonly EngineIdentity[]> { return Promise.all([...this.#roles.keys()].map((id) => this.start(id))); }
  override execute(id: string, request: EngineRequest): Promise<readonly string[]> { return super.execute(this.#physical(id), request); }
  override async exchange(id: string, request: EngineExchangeRequest): Promise<EngineExchangeCapture> {
    const capture = await super.exchange(this.#physical(id), request);
    return Object.freeze({ ...capture, identity: this.#identity(id, capture.identity) });
  }
  override artifact(id: string): EngineArtifactCapture | null { return super.artifact(this.#physical(id)); }
  override establishedGeneration(id: string): number | null { return super.establishedGeneration(this.#physical(id)); }
  override async checkHealth(id: string): Promise<EngineHealth> { await super.checkHealth(this.#physical(id)); return this.health(id); }
  override health(id: string): EngineHealth {
    const health = super.health(this.#physical(id));
    return Object.freeze({ ...health, id, ...(health.identity === undefined ? {} : { identity: this.#identity(id, health.identity) }) });
  }
  override transcript(id: string): readonly TranscriptEntry[] { return super.transcript(this.#physical(id)); }
  // Base shutdown sees physical engines only and stops each once.
}
