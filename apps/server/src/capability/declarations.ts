// rfc/pack-capability-contract.md §2.3, §2.6, §2.7, §3.1 — builds the capability applicability image
// and every capability declaration, with its semantics digest, from the independent author authority
// (`rfc/contracts/pack-capability-applicability-v1.json`), the live pack schema, the F1 manifest, the
// convention tables, the shape/principle registries and the authored lifecycle.
//
// Nothing here is an authority of its own: the author artifact owns the mapping inputs, the tree owns
// the meaning, and `make capability-check` fails when a stored digest no longer matches the tree at
// the same version. The remedy is always one of two things: revert the meaning change, or add a
// version transition to `packages/runtime/src/capability/lifecycle.ts` and regenerate.

import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";

import {
  canonicalCapabilityRequirements,
  capabilityId,
  capabilityKey,
  closedSchemaInventory,
  mapSchemaMembers,
  semverCapabilityId,
  resolvedShapeDependencies,
  canonicalJson,
  classifyUnion,
  valueAtPointer,
  type CapabilityApplicability,
  type CapabilityId,
  type CapabilityKey,
  type CapabilityVersion,
  type SchemaMemberIdentity,
} from "@chess-tabiya/schema";
import type {
  CapabilityLifecycleRow,
  CapabilityMeaningSource,
  CapabilitySiteRef,
  CapabilitySubjectKind,
  GeneratedCapabilityDeclaration,
} from "@chess-tabiya/runtime";
import type { CompiledEvidenceManifest } from "@chess-tabiya/runtime";

import { CapabilitySourceIndex, sha256Hex } from "./source-image.js";

export const DECLARATION_DIGEST_DOMAIN = "tabiya.capability.declaration.v1" as const;

export interface ApplicabilityAuthority {
  readonly artifact: string;
  readonly schema: { readonly path: string; readonly sha256: string; readonly canonicalSha256: string };
  readonly closedVocabulary: {
    readonly inventorySha256: string;
    readonly expandedMappingSha256: string;
    readonly sourceInventory: readonly SchemaMemberIdentity[];
  };
  readonly always: readonly { readonly capability: CapabilityId; readonly subject: CapabilitySubjectKind; readonly sites: readonly string[]; readonly dependencies: readonly string[] }[];
  readonly resolvedReferences: readonly { readonly pointer: string; readonly registry: "shape" | "principle"; readonly value: "shape-reference" | "id" | "id-when-ground-kind-shape_plan" }[];
  readonly memberDependencies: {
    readonly rows: readonly { readonly capability: string; readonly dependsOn: readonly string[] }[];
    readonly projectionRule: { readonly engineCondition: Readonly<Record<string, readonly string[]>> };
  };
  readonly metadataExclusions: readonly string[];
  readonly meaningAuthority: {
    readonly interpreterRoots: readonly { readonly subject: string; readonly schemaPointer: string; readonly property: string; readonly sites: readonly string[]; readonly admissionSites: readonly string[] }[];
    readonly censusTypes: readonly string[];
    readonly constantRoots: readonly { readonly capability: string; readonly sites: readonly string[] }[];
    readonly conventions: { readonly module: string; readonly tables: readonly string[]; readonly ids: Readonly<Record<string, string>> };
    readonly externalSources: readonly { readonly package: string; readonly version: string; readonly integrity: string; readonly lockfile: string; readonly lockfileKey: string; readonly manifestSites: readonly string[] }[];
  };
  readonly lifecycleSubjects: readonly { readonly subjectId: string; readonly subject: CapabilitySubjectKind; readonly versions: readonly { readonly version: number; readonly sites: readonly string[] }[] }[];
  readonly expandedAuthoritySha256: string;
}

export interface RegistryEntry {
  readonly id: string;
  readonly version: string;
  readonly document: Readonly<Record<string, unknown>>;
}

export interface DeclarationBuildInputs {
  readonly root: string;
  readonly index: CapabilitySourceIndex;
  readonly schema: unknown;
  readonly authority: ApplicabilityAuthority;
  readonly lifecycle: readonly CapabilityLifecycleRow[];
  readonly manifest: CompiledEvidenceManifest;
  readonly conventions: Readonly<Record<string, Readonly<Record<string, string>>>>;
  readonly shapes: readonly RegistryEntry[];
  readonly principles: readonly RegistryEntry[];
  /** Previously generated declarations; non-current versions are retained with frozen digests. */
  readonly previous: readonly GeneratedCapabilityDeclaration[];
}

const PACK_SCOPE_CONSUMERS = ["authoring.predicate", "runtime.objective_condition", "runtime.guard_condition"] as const;

function parseSite(site: string): { readonly module: string; readonly symbol: string } {
  const [module, symbol] = site.split("#");
  if (module === undefined || symbol === undefined) throw new TypeError(`site is not module#symbol: ${site}`);
  return { module, symbol };
}

const symbolSource = (site: string): CapabilityMeaningSource => ({ kind: "ast", site: { kind: "symbol", ...parseSite(site) } });

/** The current version of a subject: the lifecycle's last retained version, else integer 1. */
export function currentVersion(lifecycle: readonly CapabilityLifecycleRow[], subjectId: string, fallback: CapabilityVersion = { kind: "integer", value: 1 }): CapabilityVersion {
  const row = lifecycle.find((candidate) => candidate.subjectId === subjectId);
  return row?.versions.at(-1)?.version ?? fallback;
}

/** The generated applicability image (§2.7): schema members, unconditional rows, resolved references. */
export function buildApplicability(schema: unknown, authority: ApplicabilityAuthority, lifecycle: readonly CapabilityLifecycleRow[]): readonly CapabilityApplicability[] {
  const inventory = closedSchemaInventory(schema, authority.metadataExclusions);
  if (canonicalJson(inventory.rows) !== canonicalJson(authority.closedVocabulary.sourceInventory)) {
    throw new TypeError("SCHEMA_CAPABILITY_UNANNOTATED: the live schema's closed members differ from the author artifact's source inventory; review the artifact (make pack-capability-author-repair-update)");
  }
  const mappings = mapSchemaMembers(schema, inventory);
  if (sha256Hex(canonicalJson(mappings)) !== authority.closedVocabulary.expandedMappingSha256) {
    throw new TypeError("CAPABILITY_IDENTITY_MISMATCH: the public ids do not expand to the author artifact's mapping digest");
  }
  const rows: CapabilityApplicability[] = mappings.map(({ sourceIdentity, id }) => ({
    selector: { kind: "schema_member", sourceIdentity },
    capability: { id, version: currentVersion(lifecycle, id) },
  }));
  for (const row of authority.always) rows.push({ selector: { kind: "always" }, capability: { id: row.capability.id, version: currentVersion(lifecycle, row.capability.id) } });
  for (const row of authority.resolvedReferences) rows.push({ selector: { kind: "resolved", pointer: row.pointer, registry: row.registry, value: row.value } });
  return Object.freeze(rows);
}

interface LockPackage { readonly version: string; readonly integrity: string; readonly key: string }

export function readLockPackages(lockfile: string): ReadonlyMap<string, readonly LockPackage[]> {
  const out = new Map<string, LockPackage[]>();
  const lines = lockfile.split("\n");
  const start = lines.indexOf("packages:");
  const end = lines.indexOf("snapshots:");
  for (let index = start + 1; index < (end < 0 ? lines.length : end); index += 1) {
    const match = /^ {2}'?(@?[^@\s']+)@([^:'(]+)'?:$/u.exec(lines[index]!);
    if (match === null) continue;
    const integrity = /resolution: \{integrity: ([^}]+)\}/u.exec(lines[index + 1] ?? "")?.[1];
    if (integrity === undefined) continue;
    const rows = out.get(match[1]!) ?? [];
    rows.push({ version: match[2]!, integrity, key: `${match[1]}@${match[2]}` });
    out.set(match[1]!, rows);
  }
  return out;
}

function packageSource(root: string, name: string, lock: ReadonlyMap<string, readonly LockPackage[]>): CapabilityMeaningSource {
  const resolved = lock.get(name) ?? [];
  if (resolved.length !== 1) throw new TypeError(`CAPABILITY_PACKAGE_UNRESOLVED: ${name} resolves to ${resolved.length} lockfile entries`);
  const [entry] = resolved as [LockPackage];
  return { kind: "package_dependency", package: name, version: entry.version, integrity: entry.integrity, lockfile: "pnpm-lock.yaml", lockfileKey: entry.key };
}

/** Workspace manifests that pin `name`, with the pinned specifier. Part of the package source image. */
function manifestPins(root: string, name: string): readonly string[] {
  const manifests = ["package.json", "apps/server/package.json", "apps/web/package.json", "packages/runtime/package.json", "packages/schema/package.json"];
  return manifests.flatMap((path) => {
    const manifest = JSON.parse(readFileSync(resolve(root, path), "utf8")) as Record<string, Record<string, string> | undefined>;
    return (["dependencies", "devDependencies"] as const).flatMap((section) => {
      const specifier = manifest[section]?.[name];
      return specifier === undefined ? [] : [`${path}#${section}.${name}=${specifier}`];
    });
  }).sort();
}

function memberBranchSchema(schema: unknown, identity: SchemaMemberIdentity): unknown {
  const node = valueAtPointer(schema, identity.schemaPointer) as Record<string, unknown> | undefined;
  if (node === undefined) throw new TypeError(`schema member pointer ${identity.schemaPointer} is absent`);
  const form = classifyUnion(node);
  if (form === undefined) return { member: identity.member };
  const branches = node.oneOf as readonly Record<string, unknown>[];
  if (form.form === "key") return branches[form.keys.indexOf(String(identity.member))];
  return branches.filter((branch) => {
    const property = (branch.properties as Record<string, Record<string, unknown>>)[form.discriminator]!;
    return property.const === identity.member || (Array.isArray(property.enum) && property.enum.includes(identity.member));
  });
}

interface Draft {
  readonly subjectId: string;
  readonly id: CapabilityId;
  readonly subject: CapabilitySubjectKind;
  readonly sources: CapabilityMeaningSource[];
  readonly dependsOn: CapabilityId[];
  readonly conventionText?: string;
  readonly availability: GeneratedCapabilityDeclaration["availability"];
  readonly providerFamily?: GeneratedCapabilityDeclaration["providerFamily"];
  readonly sourceImage: () => unknown;
}

function providerFamilyOf(producerId: string): GeneratedCapabilityDeclaration["providerFamily"] {
  if (producerId.startsWith("live.stockfish")) return "analysis";
  if (producerId.startsWith("live.syzygy")) return "tablebase";
  if (producerId.startsWith("human.maia")) return "opponent";
  if (producerId.startsWith("human.explorer")) return "corpus";
  throw new TypeError(`provider producer ${producerId} has no provider family`);
}

export interface BuiltCapabilityContract {
  readonly applicability: readonly CapabilityApplicability[];
  readonly declarations: readonly GeneratedCapabilityDeclaration[];
  /** Every `module#symbol` reached by any AST-backed declaration's closure. */
  readonly reachedSites: readonly string[];
}

export function buildCapabilityContract(inputs: DeclarationBuildInputs): BuiltCapabilityContract {
  const { index, schema, authority, lifecycle, manifest } = inputs;
  const applicability = buildApplicability(schema, authority, lifecycle);
  const lock = readLockPackages(readFileSync(resolve(inputs.root, "pnpm-lock.yaml"), "utf8"));
  const drafts = new Map<CapabilityKey, Draft>();
  const put = (draft: Draft): void => {
    const key = capabilityKey(draft.id);
    const existing = drafts.get(key);
    if (existing !== undefined) {
      if (existing.subject !== draft.subject) throw new TypeError(`CAPABILITY_IDENTITY_COLLISION: ${key} is both ${existing.subject} and ${draft.subject}`);
      for (const source of draft.sources) if (!existing.sources.some((candidate) => canonicalJson(candidate) === canonicalJson(source))) existing.sources.push(source);
      return;
    }
    drafts.set(key, draft);
  };
  const members = new Map<string, CapabilityId>();
  const familyByPointer = new Map(authority.meaningAuthority.interpreterRoots.map((family) => [family.schemaPointer, family]));
  for (const row of applicability) {
    if (row.selector.kind !== "schema_member") continue;
    const identity = row.selector.sourceIdentity;
    const capability = row.capability!;
    members.set(canonicalJson({ member: identity.member, schemaPointer: identity.schemaPointer }), capability);
    const family = familyByPointer.get(identity.schemaPointer);
    const sources: CapabilityMeaningSource[] = [{ kind: "schema_member", sourceIdentity: identity }];
    if (family !== undefined) {
      for (const site of family.sites) {
        const { module, symbol } = parseSite(site);
        sources.push({ kind: "ast", site: { kind: "discriminant_arm", module, owner: symbol, property: family.property, value: String(identity.member) } });
      }
    }
    const expression = identity.schemaPointer === "/$defs/structuralExpression" || identity.schemaPointer === "/$defs/transitionExpression";
    put({
      subjectId: capability.id,
      id: capability,
      subject: expression ? "expression_node" : "vocabulary_arm",
      sources,
      dependsOn: [],
      availability: "local",
      sourceImage: () => ({ domain: "tabiya.capability.schema-member.v2", sourceIdentity: identity, node: memberBranchSchema(schema, identity) }),
    });
  }
  for (const row of authority.always) {
    put({
      subjectId: row.capability.id,
      id: { id: row.capability.id, version: currentVersion(lifecycle, row.capability.id) },
      subject: row.subject,
      sources: [...row.sites, ...row.dependencies].map(symbolSource),
      dependsOn: [],
      availability: "local",
      sourceImage: () => null,
    });
  }
  for (const row of authority.meaningAuthority.constantRoots) {
    put({
      subjectId: row.capability,
      id: { id: row.capability, version: currentVersion(lifecycle, row.capability) },
      subject: "constant_table",
      sources: row.sites.map(symbolSource),
      dependsOn: [],
      availability: "local",
      sourceImage: () => null,
    });
  }
  const conventions = authority.meaningAuthority.conventions;
  for (const table of conventions.tables) {
    for (const [key, text] of Object.entries(inputs.conventions[table] ?? {})) {
      const id = conventions.ids[key];
      if (id === undefined) throw new TypeError(`CAPABILITY_DECLARATION_MISSING: convention ${table}.${key} has no capability id in the author artifact`);
      put({
        subjectId: id,
        id: { id, version: currentVersion(lifecycle, id) },
        subject: "convention",
        sources: [{ kind: "convention_entry", module: conventions.module, table, key }],
        dependsOn: [],
        conventionText: text,
        availability: "local",
        sourceImage: () => ({ domain: "tabiya.capability.convention.v1", table, key, text }),
      });
    }
  }
  for (const key of Object.keys(conventions.ids)) {
    if (!conventions.tables.some((table) => Object.hasOwn(inputs.conventions[table] ?? {}, key))) throw new TypeError(`CAPABILITY_DECLARATION_EXTRA: convention id ${key} names no convention entry`);
  }
  const projections = new Map(manifest.projections.map((projection) => [`${projection.id}@${projection.version}`, projection]));
  const producers = new Map(manifest.producers.map((producer) => [producer.id, producer]));
  for (const projection of manifest.projections) {
    const producer = producers.get(projection.producer.id);
    if (producer === undefined) throw new TypeError(`projection ${projection.id} names an unknown producer`);
    const dependencyRefs = [
      ...projection.dependsOn,
      ...(projection.derivation?.inputs ?? []),
      ...(projection.derivation?.anyOf ?? []).flat(),
    ];
    const dependsOn = dependencyRefs.flatMap((ref) => (projections.has(`${ref.id}@${ref.version}`) ? [capabilityId(ref.id, ref.version)] : []));
    put({
      subjectId: projection.id,
      id: capabilityId(projection.id, projection.version),
      subject: "projection",
      sources: [{ kind: "f1_projection", projection: capabilityId(projection.id, projection.version) }],
      dependsOn: [...canonicalCapabilityRequirements(dependsOn)],
      availability: producer.availability,
      ...(producer.availability === "provider" ? { providerFamily: providerFamilyOf(producer.id) } : {}),
      sourceImage: () => ({ domain: "tabiya.capability.f1-projection.v1", declaration: projection }),
    });
  }
  for (const subject of authority.lifecycleSubjects) {
    for (const version of subject.versions) {
      const id = capabilityId(subject.subjectId, version.version);
      const draft: Draft = {
        subjectId: subject.subjectId,
        id,
        subject: subject.subject,
        sources: version.sites.map(symbolSource),
        dependsOn: [],
        availability: "local",
        sourceImage: () => ({ domain: "tabiya.capability.lifecycle-subject.v1", version: version.version }),
      };
      put(draft);
    }
  }
  for (const [registry, entries] of [["shape", inputs.shapes], ["principle", inputs.principles]] as const) {
    for (const entry of entries) {
      const id = semverCapabilityId(`${registry}.${entry.id}`, entry.version);
      put({
        subjectId: id.id,
        id,
        subject: "resolved_reference",
        sources: [{ kind: "resolved_content", registry, entryId: entry.id }],
        dependsOn: registry === "shape" ? [...resolvedShapeDependencies(schema, members, entry.document)] : [],
        availability: "build_time",
        sourceImage: () => ({ domain: "tabiya.capability.resolved-content.v1", registry, entryId: entry.id, version: entry.version, contentSha256: sha256Hex(canonicalJson(entry.document)) }),
      });
    }
  }
  // Member dependencies (§2.7): literal author rows plus the two projection rules.
  const bySubject = (subjectId: string): Draft => {
    const draft = [...drafts.values()].filter((candidate) => candidate.subjectId === subjectId).sort((left, right) => (capabilityKey(left.id) < capabilityKey(right.id) ? -1 : 1)).at(-1);
    if (draft === undefined) throw new TypeError(`CAPABILITY_DECLARATION_MISSING: ${subjectId} is referenced by a member dependency and is not declared`);
    return draft;
  };
  const scope = new Set(manifest.consumers.filter((consumer) => (PACK_SCOPE_CONSUMERS as readonly string[]).includes(consumer.id)).flatMap((consumer) => consumer.accepts.map((ref) => ref.id)));
  const addDependency = (from: string, to: string): void => {
    const target = bySubject(to);
    if (target.subject === "projection" && !scope.has(to)) throw new TypeError(`CAPABILITY_SCOPE_VIOLATION: ${from} depends on projection ${to}, which no pack-meaning consumer accepts`);
    const draft = bySubject(from);
    if (!draft.dependsOn.some((existing) => capabilityKey(existing) === capabilityKey(target.id))) draft.dependsOn.push(target.id);
  };
  for (const row of authority.memberDependencies.rows) for (const dependency of row.dependsOn) addDependency(row.capability, dependency);
  const structuralUnion = "/$defs/structuralFeature";
  for (const identity of authority.closedVocabulary.sourceInventory) {
    if (identity.schemaPointer === structuralUnion) {
      const predicate = `rules.structural.predicate.${String(identity.member)}`;
      if (drafts.has(capabilityKey(capabilityId(predicate, 1))) && scope.has(predicate)) addDependency(`structuralFeature.${String(identity.member)}`, predicate);
    }
    if (identity.schemaPointer === "/$defs/fileTemplateFeature" || identity.schemaPointer === "/$defs/squareTemplateFeature") {
      const owner = identity.schemaPointer.split("/").at(-1)!;
      const feature = `structuralFeature.${String(identity.member)}`;
      if ([...drafts.values()].some((candidate) => candidate.subjectId === feature)) addDependency(`${owner}.${String(identity.member)}`, feature);
    }
    if (identity.schemaPointer === "/$defs/engineCondition") {
      for (const projection of authority.memberDependencies.projectionRule.engineCondition[String(identity.member)] ?? []) addDependency(`engineCondition.${String(identity.member)}`, projection);
    }
  }
  // Semantics digests, current versions only; retained historical versions keep their frozen digest.
  const previous = new Map(inputs.previous.map((row) => [capabilityKey(row.id), row]));
  const all = [...drafts.values()];
  const draftByKey = new Map<CapabilityKey, Draft>(all.map((draft) => [capabilityKey(draft.id), draft]));
  const reachedSites = new Set<string>();
  const digests = new Map<CapabilityKey, string>();
  const packageCache = new Map<string, CapabilityMeaningSource>();
  const digestOf = (key: CapabilityKey, stack: readonly CapabilityKey[]): string => {
    const known = digests.get(key);
    if (known !== undefined) return known;
    if (stack.includes(key)) throw new TypeError(`CAPABILITY_DEPENDENCY_CYCLE: ${[...stack, key].join(" -> ")}`);
    const draft = draftByKey.get(key);
    if (draft === undefined) {
      const frozen = previous.get(key);
      if (frozen === undefined) throw new TypeError(`CAPABILITY_DECLARATION_MISSING: ${key} is depended on and neither current nor retained`);
      return frozen.semanticsDigest;
    }
    const images: string[] = [];
    const closureSites = new Set<string>();
    const packages = new Set<string>();
    for (const source of draft.sources) {
      if (source.kind === "ast") {
        images.push(index.siteImage(source.site as CapabilitySiteRef));
        const closure = index.closure(source.site as CapabilitySiteRef);
        for (const site of closure.sites) closureSites.add(site);
        for (const name of closure.packages) packages.add(name);
      } else if (source.kind === "package_dependency") continue;
      else if (source.kind === "schema_member" || source.kind === "f1_projection" || source.kind === "resolved_content" || source.kind === "convention_entry") {
        images.push(sha256Hex(canonicalJson(draft.sourceImage())));
      }
    }
    const rootSites = new Set(draft.sources.flatMap((source) => (source.kind === "ast" ? [`${source.site.module}#${source.site.kind === "symbol" ? source.site.symbol : source.site.owner}`] : [])));
    const closureImages = [...closureSites].filter((site) => !rootSites.has(site)).sort().map((site) => {
      reachedSites.add(site);
      const { module, symbol } = parseSite(site);
      return `${site}=${index.siteImage({ kind: "symbol", module, symbol })}`;
    });
    for (const site of rootSites) reachedSites.add(site);
    for (const name of [...packages].sort()) {
      if (!packageCache.has(name)) packageCache.set(name, packageSource(inputs.root, name, lock));
      const source = packageCache.get(name)!;
      if (!draft.sources.some((candidate) => candidate.kind === "package_dependency" && candidate.package === name)) draft.sources.push(source);
    }
    const packageImages = draft.sources.flatMap((source) => (source.kind === "package_dependency"
      ? [sha256Hex(canonicalJson({ domain: "tabiya.capability.package.v1", package: source.package, version: source.version, integrity: source.integrity, lockfileKey: source.lockfileKey, manifests: manifestPins(inputs.root, source.package) }))]
      : []));
    const dependencies = [...draft.dependsOn].sort((left, right) => (capabilityKey(left) < capabilityKey(right) ? -1 : 1)).map((dependency) => ({
      key: capabilityKey(dependency),
      digest: digestOf(capabilityKey(dependency), [...stack, key]),
    }));
    const digest = `sha256:${sha256Hex(canonicalJson({
      domain: DECLARATION_DIGEST_DOMAIN,
      id: draft.id,
      subject: draft.subject,
      images: [...images].sort(),
      closure: closureImages,
      packages: packageImages.sort(),
      dependencies,
      ...(draft.conventionText === undefined ? {} : { conventionText: draft.conventionText }),
    }))}`;
    digests.set(key, digest);
    return digest;
  };
  const declarations: GeneratedCapabilityDeclaration[] = [];
  for (const draft of all) {
    const key = capabilityKey(draft.id);
    const semanticsDigest = digestOf(key, []);
    declarations.push(Object.freeze({
      subjectId: draft.subjectId,
      id: draft.id,
      subject: draft.subject,
      sources: Object.freeze(draft.sources.map((source) => Object.freeze(source))),
      dependsOn: Object.freeze([...canonicalCapabilityRequirements(draft.dependsOn)]),
      ...(draft.conventionText === undefined ? {} : { conventionText: draft.conventionText }),
      semanticsDigest,
      availability: draft.availability,
      ...(draft.providerFamily === undefined ? {} : { providerFamily: draft.providerFamily }),
    }));
  }
  // Retain obsolete versions named by the lifecycle, frozen exactly as they were generated.
  for (const row of lifecycle) {
    for (const version of row.versions) {
      const key = capabilityKey({ id: row.subjectId, version: version.version });
      if (draftByKey.has(key)) continue;
      const frozen = previous.get(key);
      if (frozen === undefined) throw new TypeError(`CAPABILITY_DECLARATION_MISSING: lifecycle retains ${key} but no generated declaration exists to freeze`);
      declarations.push(frozen);
    }
  }
  declarations.sort((left, right) => (capabilityKey(left.id) < capabilityKey(right.id) ? -1 : 1));
  return Object.freeze({ applicability, declarations: Object.freeze(declarations), reachedSites: Object.freeze([...reachedSites].sort()) });
}

export function loadRegistryEntries(root: string, directory: "content/shapes" | "content/principles"): readonly RegistryEntry[] {
  return readdirSync(resolve(root, directory)).filter((name) => name.endsWith(".json")).sort().map((name) => {
    const document = JSON.parse(readFileSync(resolve(root, directory, name), "utf8")) as Record<string, unknown>;
    if (typeof document.id !== "string" || typeof document.version !== "string") throw new TypeError(`${directory}/${name} has no id/version`);
    return Object.freeze({ id: document.id, version: document.version, document });
  });
}
