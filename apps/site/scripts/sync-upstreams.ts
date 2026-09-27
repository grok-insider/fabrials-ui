/**
 * Fetches the components listed in upstreams/*.json and writes a reviewed
 * snapshot under registry/external/<library>/. Nothing is published from
 * here: the snapshot lands in a pull request, and the build republishes it
 * only while it passes the offline checks in lib/external.ts.
 *
 *   bun run registry:sync            every upstream
 *   bun run registry:sync magicui    one upstream
 *
 * The license gate runs here first. The repository's license file (read at
 * the commit being synced) and every npm package an item uses must carry a
 * permissive license; anything else, or anything unclear, stops the sync.
 */
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { checkConformance } from "../lib/conformance";
import { classifyLicenseText, copyrightNotice, isAllowedLicense, npmLicense, spdxExpressionAllowed } from "../lib/license";
import {
  classifyRegistryDependency,
  dependenciesOf,
  type RegistryItemJson,
  type SnapshotDependency,
  type SnapshotItem,
  type UpstreamManifest,
  type UpstreamSnapshot,
} from "../lib/upstreams";

const sha256 = (text: string) => createHash("sha256").update(text).digest("hex");
const token = process.env.GITHUB_TOKEN ?? process.env.GH_TOKEN;

async function get(url: string, headers: Record<string, string> = {}): Promise<string> {
  const response = await fetch(url, { headers: { "user-agent": "fabrials-ui-sync", ...headers } });
  if (!response.ok) throw new Error(`${response.status} ${url}`);
  return response.text();
}

async function github<T>(path: string): Promise<T> {
  return JSON.parse(
    await get(`https://api.github.com/${path}`, {
      accept: "application/vnd.github+json",
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    }),
  ) as T;
}

const npmCache = new Map<string, { version: string; license: string }>();
async function npmPackage(name: string, spec: string) {
  const key = `${name}@${spec}`;
  const cached = npmCache.get(key);
  if (cached) return cached;
  let result: { version: string; license: string };
  if (spec === "latest") {
    const doc = JSON.parse(await get(`https://registry.npmjs.org/${name.replace("/", "%2F")}/latest`)) as { version: string; license?: unknown };
    result = { version: doc.version, license: npmLicense(doc.license) ?? "" };
  } else {
    const out = JSON.parse(execFileSync("npm", ["view", key, "version", "license", "--json"], { encoding: "utf8" })) as
      | { version: string; license?: unknown }
      | { version: string; license?: unknown }[];
    const doc = Array.isArray(out) ? out[out.length - 1]! : out;
    result = { version: doc.version, license: npmLicense(doc.license) ?? "" };
  }
  npmCache.set(key, result);
  return result;
}

class GateError extends Error {}

async function syncUpstream(manifest: UpstreamManifest) {
  const repo = await github<{ default_branch: string }>(`repos/${manifest.repository}`);
  const commit = (await github<{ sha: string }>(`repos/${manifest.repository}/commits/${repo.default_branch}`)).sha;
  const license = await github<{ path: string; content: string; license: { spdx_id: string } }>(
    `repos/${manifest.repository}/license?ref=${commit}`,
  );
  const licenseText = Buffer.from(license.content, "base64").toString("utf8");
  const spdx = classifyLicenseText(licenseText);
  if (!spdx || !isAllowedLicense(spdx) || spdx !== license.license.spdx_id)
    throw new GateError(
      `${manifest.name}: license not accepted (text reads as ${spdx ?? "unknown"}, GitHub says ${license.license.spdx_id})`,
    );

  const dir = `registry/external/${manifest.name}`;
  await rm(dir, { recursive: true, force: true });
  await mkdir(`${dir}/items`, { recursive: true });
  await mkdir(`${dir}/demos`, { recursive: true });
  await writeFile(`${dir}/LICENSE`, licenseText);

  const listed = new Set(manifest.items.map((item) => item.name));
  const queue = manifest.items.map((item) => ({ ...item, hidden: false }));
  const items: SnapshotItem[] = [];
  const seen = new Set<string>();

  async function gateDependencies(owner: string, raw: RegistryItemJson): Promise<SnapshotDependency[]> {
    const deps: SnapshotDependency[] = [];
    for (const dep of dependenciesOf(raw)) {
      const found = await npmPackage(dep.name, dep.spec);
      if (!spdxExpressionAllowed(found.license))
        throw new GateError(`${manifest.name}/${owner}: npm package ${dep.name}@${found.version} is "${found.license || "unlicensed"}"`);
      deps.push({ name: dep.name, version: found.version, license: found.license, declared: dep.declared });
    }
    return deps;
  }

  function gateRegistryDependencies(owner: string, raw: RegistryItemJson, enqueue: boolean) {
    for (const dependency of raw.registryDependencies ?? []) {
      const target = classifyRegistryDependency(dependency, manifest);
      if (target.kind === "foreign") throw new GateError(`${manifest.name}/${owner}: depends on another registry (${target.ref})`);
      if (target.kind === "same" && enqueue && !seen.has(target.name) && !queue.some((q) => q.name === target.name))
        queue.push({ name: target.name, hidden: !listed.has(target.name) });
    }
  }

  while (queue.length) {
    const next = queue.shift()!;
    if (seen.has(next.name)) continue;
    seen.add(next.name);
    const text = await get(manifest.registry.replace("{name}", next.name));
    const raw = JSON.parse(text) as RegistryItemJson & { title?: string };
    gateRegistryDependencies(next.name, raw, true);
    const dependencies = await gateDependencies(next.name, raw);
    await writeFile(`${dir}/items/${next.name}.json`, text);
    const item: SnapshotItem = {
      name: next.name,
      title:
        raw.title && raw.title !== next.name
          ? raw.title
          : next.name.replace(/(^|-)(\w)/g, (_, dash: string, c: string) => `${dash ? " " : ""}${c.toUpperCase()}`),
      description: raw.description ?? "",
      type: raw.type,
      sha256: sha256(text),
      dependencies,
      registryDependencies: raw.registryDependencies ?? [],
      conformance: checkConformance({ sources: raw.files.map((file) => file.content), css: raw.css, cssVars: raw.cssVars }),
      ...(next.hidden ? { hidden: true } : {}),
    };
    if ("demo" in next && next.demo) {
      const demoText = await get(manifest.registry.replace("{name}", next.demo));
      const demo = JSON.parse(demoText) as RegistryItemJson;
      gateRegistryDependencies(next.demo, demo, false);
      await gateDependencies(next.demo, demo);
      await writeFile(`${dir}/demos/${next.demo}.json`, demoText);
      item.demo = { name: next.demo, sha256: sha256(demoText) };
    }
    items.push(item);
  }

  const snapshot: UpstreamSnapshot = {
    name: manifest.name,
    title: manifest.title,
    homepage: manifest.homepage,
    repository: manifest.repository,
    registry: manifest.registry,
    tier: manifest.tier,
    description: manifest.description,
    commit,
    fetchedAt: new Date().toISOString().slice(0, 10),
    license: { spdx, github: license.license.spdx_id, path: license.path, sha256: sha256(licenseText), copyright: copyrightNotice(licenseText) },
    items: items.sort((a, b) => a.name.localeCompare(b.name)),
  };
  await writeFile(`${dir}/upstream.json`, `${JSON.stringify(snapshot, null, 2)}\n`);
  const flagged = items.filter((item) => item.conformance.length).length;
  console.log(`${manifest.name}: ${items.length} items at ${commit.slice(0, 7)} (${spdx}); ${flagged} with design notes.`);
}

const only = process.argv.slice(2);
const manifests: UpstreamManifest[] = [];
for (const file of (await readdir("upstreams")).filter((f) => f.endsWith(".json")).sort()) {
  const manifest = JSON.parse(await readFile(`upstreams/${file}`, "utf8")) as UpstreamManifest;
  if (!only.length || only.includes(manifest.name)) manifests.push(manifest);
}
let failed = false;
for (const manifest of manifests) {
  try {
    await syncUpstream(manifest);
  } catch (error) {
    if (!(error instanceof GateError)) throw error;
    failed = true;
    console.error(`Rejected: ${error.message}`);
    await rm(`registry/external/${manifest.name}`, { recursive: true, force: true });
  }
}
if (failed) process.exit(1);
