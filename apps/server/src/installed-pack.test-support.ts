import { PackRegistry } from "./pack-registry.js";
import { PrincipleRegistry } from "./principle-registry.js";
import { ShapeRegistry } from "./shape-registry.js";

/** Installed-corpus tests use the same explicit source dependencies as application startup. */
export async function loadInstalledPackRegistry(
  options: Parameters<typeof PackRegistry.loadDefault>[0] = {},
): Promise<PackRegistry> {
  const shapes = options.shapes ?? await ShapeRegistry.loadDefault();
  const principles = options.principles ?? await PrincipleRegistry.loadDefault();
  return PackRegistry.loadDefault({ ...options, shapes, principles });
}
