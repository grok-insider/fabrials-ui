/**
 * The aggregator: third-party components from permissively licensed shadcn
 * registries, copied into this repository at a reviewed snapshot and
 * republished at ui.fabrials.com/r/<library>-<item>.json. Pure helpers only;
 * the network lives in scripts/sync-upstreams.ts and the file system in
 * lib/external.ts and the build scripts.
 */
import type { ConformanceFinding } from "./conformance";

export type Tier = "fabrials" | "community";

/** upstreams/<library>.json, written by hand and reviewed in a pull request. */
export type UpstreamManifest = {
  name: string;
  title: string;
  homepage: string;
  /** GitHub owner/repo; its license file is the one the gate reads. */
  repository: string;
  /** Item URL template with {name}. */
  registry: string;
  tier: Tier;
  description: string;
  items: { name: string; demo?: string }[];
};

export type SnapshotDependency = { name: string; version: string; license: string; declared: boolean };

export type SnapshotItem = {
  name: string;
  title: string;
  description: string;
  type: string;
  sha256: string;
  demo?: { name: string; sha256: string };
  dependencies: SnapshotDependency[];
  registryDependencies: string[];
  conformance: ConformanceFinding[];
  /** Pulled in because a listed item depends on it; not shown on its own. */
  hidden?: boolean;
};

/** registry/external/<library>/upstream.json, written by the sync. */
export type UpstreamSnapshot = Omit<UpstreamManifest, "items"> & {
  commit: string;
  fetchedAt: string;
  license: { spdx: string; github: string; path: string; sha256: string; copyright: string };
  items: SnapshotItem[];
};

export type RegistryFile = { path: string; type: string; target?: string; content: string };

export type RegistryItemJson = {
  name: string;
  type: string;
  title?: string;
  description?: string;
  dependencies?: string[];
  devDependencies?: string[];
  registryDependencies?: string[];
  files: RegistryFile[];
  cssVars?: { theme?: Record<string, string>; light?: Record<string, string>; dark?: Record<string, string> };
  css?: Record<string, unknown>;
  docs?: string;
};

/** Modules every React app already has; never recorded as dependencies. */
const PLATFORM = new Set(["react", "react-dom", "next", "react/jsx-runtime"]);

/** The npm package a bare import belongs to, or null for local and platform imports. */
export function packageOf(specifier: string): string | null {
  if (specifier.startsWith(".") || specifier.startsWith("@/") || specifier.startsWith("node:")) return null;
  const name = specifier.startsWith("@") ? specifier.split("/").slice(0, 2).join("/") : specifier.split("/")[0]!;
  return PLATFORM.has(name) || name.startsWith("next/") ? null : name;
}

export function importsOf(source: string): string[] {
  const found = new Set<string>();
  for (const match of source.matchAll(/(?:from|import)\s*["']([^"']+)["']/g)) found.add(match[1]!);
  return [...found].sort();
}

/** Declared dependencies plus the packages the files actually import. */
export function dependenciesOf(item: RegistryItemJson): { name: string; spec: string; declared: boolean }[] {
  const declared = new Map<string, string>();
  for (const dep of item.dependencies ?? []) {
    const at = dep.lastIndexOf("@");
    const name = at > 0 ? dep.slice(0, at) : dep;
    declared.set(name, at > 0 ? dep.slice(at + 1) : "latest");
  }
  const imported = new Set(item.files.flatMap((file) => importsOf(file.content)).map(packageOf).filter((x): x is string => !!x));
  const names = new Set([...declared.keys(), ...imported]);
  return [...names]
    .sort()
    .map((name) => ({ name, spec: declared.get(name) ?? "latest", declared: declared.has(name) }));
}

/** shadcn primitives the files import (`@/components/ui/<name>`), declared or not. */
export function primitivesOf(item: RegistryItemJson): string[] {
  const names = new Set<string>();
  for (const file of item.files)
    for (const specifier of importsOf(file.content)) {
      const match = /^@\/components\/ui\/([\w-]+)$/.exec(specifier);
      if (match) names.add(match[1]!);
    }
  return [...names].sort();
}

/** Where a registry dependency points, from one upstream's point of view. */
export function classifyRegistryDependency(
  dependency: string,
  upstream: Pick<UpstreamManifest, "name" | "registry">,
): { kind: "same"; name: string } | { kind: "shadcn"; name: string } | { kind: "foreign"; ref: string } {
  const template = upstream.registry;
  const [prefix, suffix] = template.split("{name}") as [string, string];
  if (dependency.startsWith(prefix) && dependency.endsWith(suffix))
    return { kind: "same", name: dependency.slice(prefix.length, dependency.length - suffix.length) };
  const namespaced = /^@([\w-]+)\/([\w-]+)$/.exec(dependency);
  if (namespaced) {
    const host = new URL(prefix).hostname.replace(/^www\./, "");
    return host.startsWith(namespaced[1]!) || namespaced[1] === upstream.name
      ? { kind: "same", name: namespaced[2]! }
      : { kind: "foreign", ref: dependency };
  }
  if (/^[a-z0-9-]+$/.test(dependency)) return { kind: "shadcn", name: dependency };
  return { kind: "foreign", ref: dependency };
}

export const externalSlug = (library: string, item: string) => `${library}-${item}`;

function sourceComment(lines: string[]) {
  return `/*\n${lines.map((line) => (line ? ` * ${line}` : " *")).join("\n")}\n */\n`;
}

/**
 * The notice kept at the top of every copied file: where it came from, and
 * the license terms that travel with it (the full text for short licenses,
 * the standard notice for Apache-2.0).
 */
export function noticeHeader(title: string, snapshot: UpstreamSnapshot, licenseText: string): string {
  const origin = `${title} from ${snapshot.title} (${snapshot.homepage}), ${snapshot.license.spdx}.`;
  const via = "Distributed unchanged by ui.fabrials.com under the same license.";
  if (snapshot.license.spdx === "Apache-2.0")
    return sourceComment([
      origin,
      via,
      "",
      snapshot.license.copyright,
      "Licensed under the Apache License, Version 2.0; you may not use this file except in compliance",
      "with the License. You may obtain a copy at http://www.apache.org/licenses/LICENSE-2.0",
    ]);
  return sourceComment([origin, via, "", ...licenseText.replace(/\r/g, "").trim().split("\n")]);
}

/**
 * Places a notice after the file's imports. The shadcn CLI rewrites import
 * paths on install and drops any comment above the first import, so a
 * notice at the very top would not reach the app.
 */
export function withNotice(content: string, notice: string): string {
  const statement =
    /^(?:import\s[\s\S]*?\sfrom\s*["'][^"']+["']|import\s*["'][^"']+["']|export\s+(?:type\s+)?(?:\*|\{[^}]*\})\s*from\s*["'][^"']+["']);?[ \t]*$/gm;
  const directive = /^(["']use (?:client|server)["'];?[ \t]*\n)/.exec(content);
  let end = directive ? directive[0].length : 0;
  for (const match of content.matchAll(statement)) {
    const gap = content.slice(end, match.index);
    // Stop at the first real statement between imports.
    if (gap.replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, "").trim()) break;
    end = match.index! + match[0].length;
  }
  if (end === 0) return notice + content;
  const before = content.slice(0, end);
  const after = content.slice(end).replace(/^\n*/, "");
  return `${before}\n\n${notice.endsWith("\n") ? notice : `${notice}\n`}${after}`;
}

/** The item as ui.fabrials.com publishes it. */
export function publishExternalItem(
  raw: RegistryItemJson,
  item: SnapshotItem,
  snapshot: UpstreamSnapshot,
  licenseText: string,
  { origin, shims }: { origin: string; shims: Set<string> },
) {
  // Upstreams sometimes import a primitive without declaring it; install what the code uses.
  const declared = raw.registryDependencies ?? [];
  const undeclared = primitivesOf(raw).filter((name) => !declared.includes(name));
  const registryDependencies = [...declared, ...undeclared].map((dependency) => {
    const target = classifyRegistryDependency(dependency, snapshot);
    if (target.kind === "same") return `${origin}/r/${externalSlug(snapshot.name, target.name)}.json`;
    if (target.kind === "shadcn") return shims.has(target.name) ? `${origin}/r/${target.name}.json` : target.name;
    throw new Error(`${snapshot.name}/${item.name} depends on another registry: ${target.ref}`);
  });
  const header = noticeHeader(item.title, snapshot, licenseText);
  return {
    $schema: "https://ui.shadcn.com/schema/registry-item.json",
    name: externalSlug(snapshot.name, item.name),
    type: raw.type,
    title: item.title,
    description: item.description,
    author: `${snapshot.title} (https://github.com/${snapshot.repository})`,
    dependencies: item.dependencies.map((dep) => `${dep.name}@^${dep.version}`),
    ...(raw.devDependencies?.length ? { devDependencies: raw.devDependencies } : {}),
    registryDependencies,
    files: raw.files.map((file) => ({ ...file, content: withNotice(file.content, header) })),
    ...(raw.cssVars ? { cssVars: raw.cssVars } : {}),
    ...(raw.css ? { css: raw.css } : {}),
    ...(raw.docs ? { docs: raw.docs } : {}),
    meta: {
      source: "external",
      tier: snapshot.tier,
      library: snapshot.name,
      libraryTitle: snapshot.title,
      license: snapshot.license.spdx,
      upstream: snapshot.registry.replace("{name}", item.name),
      repository: `https://github.com/${snapshot.repository}`,
      commit: snapshot.commit,
      sha256: item.sha256,
      conformance: item.conformance.map((finding) => finding.check),
    },
  };
}

/** Site-relative path (under components/external/<library>/) for an upstream file. */
export function materializedPath(file: RegistryFile): string {
  if (file.target) {
    const parts = file.target.split("/");
    return (parts[0] === "components" ? parts.slice(2) : parts).join("/");
  }
  return file.path.split("/").pop()!;
}

/**
 * Rewrites an upstream file's imports the way the shadcn CLI would for this
 * site: its own registry paths point at components/external/<library>/, and
 * shadcn primitives and lib/utils stay where the site keeps them.
 */
export function rewriteImports(source: string, library: string): string {
  return source
    .replace(/(["'])@\/registry\/[\w-]+\/(?:ui\/)?([^"']+)\1/g, `$1@/components/external/${library}/$2$1`)
    .replace(/(["'])@\/components\/(?!ui\/|external\/)[\w-]+\/([^"']+)\1/g, `$1@/components/external/${library}/$2$1`);
}

/** Serialises a shadcn `css` object ({"@keyframes x": {from: {...}}}) to CSS text. */
export function cssText(rules: Record<string, unknown>, indent = ""): string {
  return Object.entries(rules)
    .map(([selector, body]) => {
      if (typeof body === "string") return `${indent}${selector}: ${body};`;
      const inner = cssText(body as Record<string, unknown>, `${indent}  `);
      return `${indent}${selector} {\n${inner}\n${indent}}`;
    })
    .join("\n");
}
