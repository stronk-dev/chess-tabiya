// Position-only software fixtures: replace installed-content acquisition, not application
// composition, registry validation, SQLite, authentication, routing or evidence factories.
// Real-content and native release journeys continue to use the installed catalogues.
import { vi } from "vitest";
import { ShapeRegistry } from "./shape-registry.js";
import { PrincipleRegistry } from "./principle-registry.js";
import { PackRegistry } from "./pack-registry.js";
import { TrainingSetRegistry } from "./training-set-registry.js";
import { CampaignRegistry } from "./campaign-registry.js";

type CatalogueObserver = <T>(label: string, load: () => Promise<T>) => Promise<T>;

/** Call in beforeEach; the owning fixture must restore spies in afterEach. */
export function installEmptyApplicationCatalogues(
  observe: CatalogueObserver = (_label, load) => load(),
): void {
  const shapes = new ShapeRegistry();
  const principles = new PrincipleRegistry();
  vi.spyOn(ShapeRegistry, "loadDefault").mockImplementation(() => observe("fixture shapes", async () => shapes));
  vi.spyOn(PrincipleRegistry, "loadDefault").mockImplementation(() => observe("fixture principles", async () => principles));
  vi.spyOn(PackRegistry, "loadDefault").mockImplementation(options => observe("fixture packs", () => PackRegistry.fromDocuments([], options)));
  vi.spyOn(TrainingSetRegistry, "loadDefault").mockImplementation(packs => observe("fixture training sets", () => TrainingSetRegistry.fromDocuments([], packs)));
  vi.spyOn(CampaignRegistry, "loadDefault").mockImplementation(packs => observe("fixture campaigns", () => CampaignRegistry.fromDocuments([], packs)));
}
