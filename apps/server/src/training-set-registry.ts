// rfc/pack-training-forms.md §1: installed sibling documents, not fields on member packs.
import { readFile, readdir } from "node:fs/promises";
import { extname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { digestCanonicalJson, type TrainingSetDefinition } from "@chess-tabiya/schema/drill-pack";

import type { PackRecord, PackSummary } from "./pack-registry.js";
import { validateTrainingSet } from "./training-set-validation.js";

export interface TrainingSetPackLookup {
  get(id: string): Pick<PackRecord, "document" | "summary"> | undefined;
}

export interface TrainingSetSummary {
  readonly id: string;
  readonly digest: string;
  readonly title: string;
  readonly memberCount: number;
  readonly passMark?: TrainingSetDefinition["passMark"];
  readonly tempo?: TrainingSetDefinition["tempo"];
  readonly reviewStatus: string;
  readonly channel: "official" | "community";
}

export interface TrainingSetView extends TrainingSetSummary {
  readonly formatVersion: "0.1";
  readonly members: readonly { readonly ordinal: number; readonly pack: PackSummary }[];
}

function freeze<T>(value: T): T {
  if (value !== null && typeof value === "object" && !Object.isFrozen(value)) {
    for (const child of Object.values(value)) freeze(child);
    Object.freeze(value);
  }
  return value;
}

export class TrainingSetRegistry {
  readonly #sets: ReadonlyMap<string, { readonly document: TrainingSetDefinition; readonly digest: string }>;
  readonly #packs: TrainingSetPackLookup;

  private constructor(sets: ReadonlyMap<string, { readonly document: TrainingSetDefinition; readonly digest: string }>, packs: TrainingSetPackLookup) {
    this.#sets = new Map(sets);
    this.#packs = packs;
  }

  static async fromDocuments(documents: readonly { readonly source: string; readonly value: unknown }[], packs: TrainingSetPackLookup): Promise<TrainingSetRegistry> {
    const sets = new Map<string, { readonly document: TrainingSetDefinition; readonly digest: string }>();
    for (const entry of documents) {
      const result = validateTrainingSet(entry.value, { publication: true, packs: { get: id => packs.get(id)?.document } });
      if (!result.valid || result.document === undefined) {
        throw new TypeError(`Invalid training set ${entry.source}: ${result.issues.map(issue => `${issue.code} at ${issue.path}: ${issue.message}`).join("; ")}`);
      }
      const document = freeze(structuredClone(result.document));
      if (sets.has(document.id)) throw new TypeError(`Duplicate training set ${document.id}: ${entry.source}`);
      sets.set(document.id, Object.freeze({ document, digest: await digestCanonicalJson(document) }));
    }
    return new TrainingSetRegistry(sets, packs);
  }

  static async loadDefault(packs: TrainingSetPackLookup, directory = fileURLToPath(new URL("../../../content/training-sets/", import.meta.url))): Promise<TrainingSetRegistry> {
    let entries: import("node:fs").Dirent[];
    try { entries = await readdir(directory, { withFileTypes: true }); }
    catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
      entries = [];
    }
    const files = entries.filter(entry => entry.isFile() && extname(entry.name) === ".json").map(entry => join(directory, entry.name)).sort();
    const documents = await Promise.all(files.map(async source => ({ source, value: JSON.parse(await readFile(source, "utf8")) as unknown })));
    return TrainingSetRegistry.fromDocuments(documents, packs);
  }

  list(): readonly TrainingSetSummary[] {
    return Object.freeze([...this.#sets.keys()].sort().map(id => {
      const { members: _members, formatVersion: _formatVersion, ...summary } = this.get(id)!;
      return Object.freeze(summary);
    }));
  }

  get(id: string): TrainingSetView | undefined {
    const record = this.#sets.get(id);
    if (record === undefined) return undefined;
    const { document, digest } = record;
    // Recheck the live catalogue rather than retaining a withdrawn member's old publication state.
    const members = [...document.members].sort((left, right) => left.ordinal - right.ordinal).map(member => {
      const pack = this.#packs.get(member.packId);
      if (pack === undefined) throw new TypeError(`Training set ${id} has unavailable member ${member.packId}`);
      return freeze({ ordinal: member.ordinal, pack: structuredClone(pack.summary) });
    });
    const allPublished = members.every(member => member.pack.reviewStatus === "published");
    return freeze({ id, digest, title: document.title, formatVersion: document.formatVersion, memberCount: members.length, members,
      ...(document.passMark === undefined ? {} : { passMark: document.passMark }),
      ...(document.tempo === undefined ? {} : { tempo: document.tempo }),
      reviewStatus: document.provenance.reviewStatus === "published" && !allPublished ? "draft" : document.provenance.reviewStatus,
      channel: document.provenance.reviewStatus === "published" && allPublished && members.every(member => member.pack.channel === "official") ? "official" : "community",
    });
  }
}
