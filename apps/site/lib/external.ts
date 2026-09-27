/**
 * Loads the aggregator snapshots from registry/external/ and re-checks them
 * offline before anything is built or shown: the license, the stored bytes
 * and the dependency list must still be what the sync accepted. A snapshot
 * edited by hand, or a dependency added without the gate, fails here.
 */
import { createHash } from "node:crypto";
import { readdirSync, readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { isAllowedLicense, classifyLicenseText, spdxExpressionAllowed } from "./license";
import {
  classifyRegistryDependency,
  dependenciesOf,
  externalSlug,
  type RegistryItemJson,
  type SnapshotItem,
  type UpstreamSnapshot,
} from "./upstreams";

export type ExternalItem = {
  slug: string;
  library: UpstreamSnapshot;
  item: SnapshotItem;
  raw: RegistryItemJson;
  demo?: RegistryItemJson;
};

export type ExternalLibrary = { snapshot: UpstreamSnapshot; licenseText: string; items: ExternalItem[] };

const sha256 = (text: string) => createHash("sha256").update(text).digest("hex");

export function loadExternal(root = "registry/external"): ExternalLibrary[] {
  if (!existsSync(root)) return [];
  const libraries: ExternalLibrary[] = [];
  for (const name of readdirSync(root).sort()) {
    const dir = join(root, name);
    if (!existsSync(join(dir, "upstream.json"))) continue;
    const snapshot = JSON.parse(readFileSync(join(dir, "upstream.json"), "utf8")) as UpstreamSnapshot;
    const problem = (message: string) => new Error(`registry/external/${name}: ${message}`);
    if (snapshot.name !== name) throw problem("folder and snapshot name differ");
    const licenseText = readFileSync(join(dir, "LICENSE"), "utf8");
    if (sha256(licenseText) !== snapshot.license.sha256) throw problem("LICENSE changed since the sync");
    if (!isAllowedLicense(snapshot.license.spdx) || classifyLicenseText(licenseText) !== snapshot.license.spdx)
      throw problem(`license ${snapshot.license.spdx} is not accepted`);
    const items = snapshot.items.map((item): ExternalItem => {
      const text = readFileSync(join(dir, "items", `${item.name}.json`), "utf8");
      if (sha256(text) !== item.sha256) throw problem(`${item.name} changed since the sync`);
      const raw = JSON.parse(text) as RegistryItemJson;
      const recorded = new Set(item.dependencies.map((dep) => dep.name));
      for (const dep of dependenciesOf(raw))
        if (!recorded.has(dep.name)) throw problem(`${item.name} uses ${dep.name}, which the gate never checked`);
      for (const dep of item.dependencies)
        if (!spdxExpressionAllowed(dep.license)) throw problem(`${item.name}: ${dep.name} is ${dep.license}`);
      for (const dependency of raw.registryDependencies ?? [])
        if (classifyRegistryDependency(dependency, snapshot).kind === "foreign")
          throw problem(`${item.name} depends on another registry (${dependency})`);
      let demo: RegistryItemJson | undefined;
      if (item.demo) {
        const demoText = readFileSync(join(dir, "demos", `${item.demo.name}.json`), "utf8");
        if (sha256(demoText) !== item.demo.sha256) throw problem(`${item.demo.name} changed since the sync`);
        demo = JSON.parse(demoText) as RegistryItemJson;
      }
      return { slug: externalSlug(name, item.name), library: snapshot, item, raw, demo };
    });
    libraries.push({ snapshot, licenseText, items });
  }
  return libraries;
}

/** Items shown in the catalogue (dependencies pulled in by the sync stay out). */
export const visibleExternal = (libraries: ExternalLibrary[]) =>
  libraries.flatMap((library) => library.items.filter((entry) => !entry.item.hidden));
