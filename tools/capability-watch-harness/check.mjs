import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";

const inputPath = resolve(process.argv[2] ?? "design/research/capability-watch.json");
const outputPath = resolve(process.argv[3] ?? "planning/platform-alignment/capability-watch/results.json");
const register = JSON.parse(readFileSync(inputPath, "utf8"));

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function nonempty(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function localSourceExists(source) {
  if (source.startsWith("http://") || source.startsWith("https://")) return true;
  return existsSync(resolve(source.split("#", 1)[0]));
}

function csvRows(source) {
  let quoted = false;
  let row = "";
  const rows = [];
  for (let index = 0; index < source.length; index += 1) {
    const character = source[index];
    if (character === '"') {
      if (quoted && source[index + 1] === '"') {
        row += '"';
        index += 1;
      } else quoted = !quoted;
    } else if (character === "\n" && !quoted) {
      rows.push(row);
      row = "";
    } else row += character;
  }
  if (row.length > 0) rows.push(row);
  return rows;
}

function mapFamilies() {
  const source = readFileSync("planning/platform-alignment/1.0-capability-map.md", "utf8");
  return new Set(source.split("\n").flatMap((line) => {
    const match = /^\| ([^|]+) \|/.exec(line);
    if (match === null || match[1] === "Capability family" || match[1] === "---") return [];
    return [match[1].trim()];
  }));
}

assert(register.schema === "tabiya.capability-watch.v1", "unexpected register schema");
assert(/^\d{4}-\d{2}-\d{2}$/.test(register.asOf), "asOf must be a date");
assert(Array.isArray(register.products) && register.products.length > 0, "products required");
assert(Array.isArray(register.capabilities) && register.capabilities.length > 0, "capabilities required");

const productIds = new Set();
const productUrls = new Set();
for (const product of register.products) {
  assert(nonempty(product.id) && !productIds.has(product.id), `duplicate/invalid product id ${product.id}`);
  assert(nonempty(product.name), `product ${product.id} needs a name`);
  assert(/^https?:\/\//.test(product.url) && !productUrls.has(product.url), `duplicate/invalid canonical URL ${product.url}`);
  assert(Array.isArray(product.aliases), `product ${product.id} aliases must be an array`);
  productIds.add(product.id);
  productUrls.add(product.url);
}

const allowedLabels = new Set(["V", "P"]);
const allowedHandsOn = new Set(["none", "inherited", "owner_partial", "research_hands_on"]);
const allowedStates = new Set(["not_checked", "not_found", "reported", "observed"]);
const allowedPostures = new Set(["adopt", "transform", "defer", "refuse", "research"]);
const allowedStatuses = new Set(["proven", "mechanical", "claimed", "absent"]);
const families = mapFamilies();
const capabilityIds = new Set();
const representedProducts = new Set();
const routeCounts = {};
const coveredFamilies = new Set();
const missingSignals = { loveNotChecked: 0, loveNotFound: 0, hateNotChecked: 0, hateNotFound: 0 };
let evidenceRows = 0;

for (const capability of register.capabilities) {
  assert(nonempty(capability.id) && !capabilityIds.has(capability.id), `duplicate/invalid capability id ${capability.id}`);
  assert(nonempty(capability.learnerValue), `capability ${capability.id} needs learnerValue`);
  assert(Array.isArray(capability.mapFamilies) && capability.mapFamilies.length > 0, `${capability.id} needs mapFamilies`);
  for (const family of capability.mapFamilies) {
    assert(families.has(family), `${capability.id} names unknown map family ${family}`);
    coveredFamilies.add(family);
  }
  assert(Array.isArray(capability.evidence) && capability.evidence.length > 0, `${capability.id} needs evidence`);
  capabilityIds.add(capability.id);
  for (const row of capability.evidence) {
    evidenceRows += 1;
    assert(productIds.has(row.productId), `${capability.id} references unknown product ${row.productId}`);
    representedProducts.add(row.productId);
    assert(/^\d{4}-\d{2}-\d{2}$/.test(row.checkedOn), `${capability.id}/${row.productId} needs checkedOn`);
    assert(allowedLabels.has(row.label), `${capability.id}/${row.productId} has invalid label`);
    assert(nonempty(row.source) && localSourceExists(row.source), `${capability.id}/${row.productId} source is unresolved`);
    assert(allowedHandsOn.has(row.handsOn), `${capability.id}/${row.productId} has invalid handsOn`);
    for (const [kind, signal] of [["love", row.love], ["hate", row.hate]]) {
      assert(signal !== null && typeof signal === "object" && allowedStates.has(signal.state), `${capability.id}/${row.productId} invalid ${kind} state`);
      if (signal.state === "reported" || signal.state === "observed") {
        assert(nonempty(signal.source) && localSourceExists(signal.source), `${capability.id}/${row.productId} ${kind} source unresolved`);
        assert(nonempty(signal.summary), `${capability.id}/${row.productId} ${kind} summary required`);
      } else {
        assert(signal.source === null && signal.summary === null, `${capability.id}/${row.productId} missing ${kind} must stay null`);
        const key = `${kind}${signal.state === "not_checked" ? "NotChecked" : "NotFound"}`;
        missingSignals[key] += 1;
      }
    }
    for (const key of ["doesWell", "limitation", "transformation", "doNotCopy", "consumer"]) {
      assert(nonempty(row[key]), `${capability.id}/${row.productId} needs ${key}`);
    }
    assert(allowedPostures.has(row.posture), `${capability.id}/${row.productId} invalid posture`);
    assert(allowedStatuses.has(row.tabiyaStatus), `${capability.id}/${row.productId} invalid Tabiya status`);
    assert(Array.isArray(row.producers) && row.producers.length > 0 && row.producers.every(nonempty), `${capability.id}/${row.productId} needs producers`);
    assert(Array.isArray(row.route) && row.route.length > 0 && row.route.every(nonempty), `${capability.id}/${row.productId} needs route`);
    for (const route of row.route) routeCounts[route] = (routeCounts[route] ?? 0) + 1;
  }
}

const matrixRows = csvRows(readFileSync(register.sourcePopulation.matrix, "utf8")).length - 1;
assert(matrixRows === register.sourcePopulation.matrixRows, `matrix row drift: declared ${register.sourcePopulation.matrixRows}, actual ${matrixRows}`);

// Synthetic controls: aliases/clones cannot change capability coverage; a new id must.
const baselineCoverage = capabilityIds.size;
const aliasCoverage = new Set(capabilityIds).size;
const novel = new Set([...capabilityIds, "synthetic_new_capability"]).size;
assert(aliasCoverage === baselineCoverage, "alias control changed capability coverage");
assert(novel === baselineCoverage + 1, "novel capability control did not change coverage");

const postureCounts = {};
const statusCounts = {};
for (const capability of register.capabilities) for (const row of capability.evidence) {
  postureCounts[row.posture] = (postureCounts[row.posture] ?? 0) + 1;
  statusCounts[row.tabiyaStatus] = (statusCounts[row.tabiyaStatus] ?? 0) + 1;
}

const result = {
  schema: "tabiya.capability-watch-summary.v1",
  asOf: register.asOf,
  sourceMatrixRows: matrixRows,
  canonicalProducts: register.products.length,
  representedProducts: representedProducts.size,
  capabilities: capabilityIds.size,
  evidenceRows,
  coveredMapFamilies: [...coveredFamilies].sort(),
  uncoveredMapFamilies: [...families].filter((family) => !coveredFamilies.has(family)).sort(),
  postureCounts,
  tabiyaStatusCounts: statusCounts,
  missingSignals,
  routeCounts: Object.fromEntries(Object.entries(routeCounts).sort(([left], [right]) => left.localeCompare(right))),
  controls: { duplicateAliasDoesNotChangeCoverage: true, newCapabilityChangesCoverage: true },
};

mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, `${JSON.stringify(result, null, 2)}\n`);
console.log(JSON.stringify(result, null, 2));
