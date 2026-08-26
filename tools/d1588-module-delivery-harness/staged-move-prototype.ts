// DISPOSABLE research prototype — D1590. Not production code.
export type MoveInputMode = "click" | "drag" | "touch" | "keyboard_grid" | "text";
export type CheckResult = "risk" | "empty" | "unavailable";

export interface InputRestoreReceipt {
  readonly mode: MoveInputMode;
  readonly activeSquare: string;
  readonly origin: string | null;
  readonly focus: "board" | "keyboard_grid" | "text";
  readonly textValue?: string;
}

export type StagedMoveState =
  | { readonly kind: "idle"; readonly generation: number }
  | { readonly kind: "checking"; readonly generation: number; readonly mode: MoveInputMode; readonly uci: string; readonly restore: InputRestoreReceipt }
  | { readonly kind: "warning"; readonly generation: number; readonly mode: MoveInputMode; readonly uci: string; readonly restore: InputRestoreReceipt }
  | { readonly kind: "unavailable"; readonly generation: number; readonly mode: MoveInputMode; readonly uci: string; readonly restore: InputRestoreReceipt }
  | { readonly kind: "committing"; readonly generation: number; readonly mode: MoveInputMode; readonly uci: string; readonly restore: InputRestoreReceipt };

export interface StagedMoveRequest {
  readonly generation: number;
  readonly uci: string;
}

export interface StagedMoveResolution {
  readonly accepted: boolean;
  readonly commitUci?: string;
}

/**
 * Proves one generation-token protocol can sit after BoardInputController and
 * before the existing onMove mutation for every input mode.
 */
export class StagedMoveCoordinator {
  #state: StagedMoveState = Object.freeze({ kind: "idle", generation: 0 });

  get state(): StagedMoveState {
    return this.#state;
  }

  stage(mode: MoveInputMode, uci: string, restore: InputRestoreReceipt): StagedMoveRequest {
    const generation = this.#state.generation + 1;
    this.#state = Object.freeze({ kind: "checking", generation, mode, uci, restore });
    return Object.freeze({ generation, uci });
  }

  resolve(request: StagedMoveRequest, result: CheckResult): StagedMoveResolution {
    if (this.#state.kind !== "checking" || this.#state.generation !== request.generation || this.#state.uci !== request.uci) {
      return Object.freeze({ accepted: false });
    }
    if (result === "empty") return this.#commit();
    this.#state = Object.freeze({
      kind: result === "risk" ? "warning" : "unavailable",
      generation: this.#state.generation,
      mode: this.#state.mode,
      uci: this.#state.uci,
      restore: this.#state.restore,
    });
    return Object.freeze({ accepted: true });
  }

  confirm(): StagedMoveResolution {
    if (this.#state.kind !== "warning" && this.#state.kind !== "unavailable") return Object.freeze({ accepted: false });
    return this.#commit();
  }

  revise(): InputRestoreReceipt | undefined {
    if (this.#state.kind === "idle" || this.#state.kind === "committing") return undefined;
    const restore = this.#state.restore;
    this.#state = Object.freeze({ kind: "idle", generation: this.#state.generation + 1 });
    return restore;
  }

  settled(): void {
    if (this.#state.kind !== "committing") return;
    this.#state = Object.freeze({ kind: "idle", generation: this.#state.generation });
  }

  #commit(): StagedMoveResolution {
    if (this.#state.kind !== "checking" && this.#state.kind !== "warning" && this.#state.kind !== "unavailable") {
      return Object.freeze({ accepted: false });
    }
    const { generation, mode, uci, restore } = this.#state;
    this.#state = Object.freeze({ kind: "committing", generation, mode, uci, restore });
    return Object.freeze({ accepted: true, commitUci: uci });
  }
}
