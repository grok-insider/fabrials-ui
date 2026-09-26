import {
  cp,
  mkdir,
  mkdtemp,
  readFile,
  writeFile,
  access,
  rename,
} from "node:fs/promises";
import { existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { fileHashes, verifyDistribution } from "./integrity.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const workspace = process.env.FABRIALS_WORKSPACE
  ? resolve(process.env.FABRIALS_WORKSPACE)
  : resolve(root, "../..");
// The enterprise mail monorepo keeps its client in apps/web; the standalone
// open-email repository is the client itself.
const openEmail = existsSync(resolve(workspace, "open-email/apps/web/package.json"))
  ? resolve(workspace, "open-email/apps/web/vendor")
  : resolve(workspace, "open-email/vendor");
const targets = {
  "ai-relay": resolve(workspace, "ai-relay/frontend/vendor"),
  spanreed: resolve(workspace, "spanreed/desktop/vendor"),
  "open-email": openEmail,
  "grok-insider-web": resolve(workspace, "grok-insider-web/vendor"),
  radiant: resolve(workspace, "radiant/vendor"),
  web: resolve(workspace, "web/vendor"),
  admin: resolve(workspace, "admin/vendor"),
  "fabrials-webmcp": resolve(workspace, "libs/fabrials-webmcp/vendor"),
  ditox: resolve(workspace, "ditox/gui/vendor"),
};
const genericOnly = new Set([
  "open-email",
  "grok-insider-web",
  "web",
  "admin",
  "ditox",
]);
const [consumer, mode = "--check"] = process.argv.slice(2);
if (!(consumer in targets) || !["--write", "--check"].includes(mode))
  throw new Error(
    `Usage: bun run vendor <${Object.keys(targets).join("|")}> [--check|--write]`,
  );

for (const name of genericOnly.has(consumer) ? ["ui"] : ["ui", "ai-ui"]) {
  const source = resolve(root, "packages", name);
  const pkg = JSON.parse(
    await readFile(resolve(source, "package.json"), "utf8"),
  );
  const metadata = {
    "package.json": `${JSON.stringify(pkg, null, 2)}\n`,
    LICENSE: await readFile(resolve(root, "LICENSE"), "utf8"),
  };
  const extra = name === "ui" ? "DESIGN.md" : "LOBE-ICONS-LICENSE";
  metadata[extra] = await readFile(resolve(root, extra), "utf8");
  if (name === "ui") {
    for (const file of ["verify.mjs", "integrity.mjs"])
      metadata[file] = await readFile(resolve(root, "scripts", file), "utf8");
  }
  const destination = resolve(
    targets[consumer],
    `fabrials-${name}-${pkg.version}`,
  );
  if (mode === "--check") {
    await verifyDistribution(destination);
    const expected = await fileHashes(resolve(source, "dist"));
    const actual = await fileHashes(resolve(destination, "dist"));
    if (JSON.stringify(expected) !== JSON.stringify(actual))
      throw new Error(`Distribution is behind source build: ${pkg.name}`);
    for (const [file, expectedContent] of Object.entries(metadata)) {
      if (
        (await readFile(resolve(destination, file), "utf8")) !== expectedContent
      )
        throw new Error(`Distribution metadata is behind source: ${file}`);
    }
  } else {
    const exists = await access(destination).then(
      () => true,
      () => false,
    );
    if (exists) await verifyDistribution(destination);
    await mkdir(targets[consumer], { recursive: true });
    const stage = await mkdtemp(resolve(targets[consumer], ".fabrials-stage-"));
    await cp(resolve(source, "dist"), resolve(stage, "dist"), {
      recursive: true,
    });
    for (const [file, content] of Object.entries(metadata))
      await writeFile(resolve(stage, file), content);
    const manifest = {
      schema: 1,
      name: pkg.name,
      version: pkg.version,
      files: await fileHashes(stage),
    };
    await writeFile(
      resolve(stage, "fabrials-manifest.json"),
      `${JSON.stringify(manifest, null, 2)}\n`,
    );
    await verifyDistribution(stage);
    let backup;
    if (exists) {
      await verifyDistribution(destination);
      const archive = await mkdtemp(
        resolve(targets[consumer], ".fabrials-backup-"),
      );
      backup = resolve(archive, `fabrials-${name}-${pkg.version}`);
      await rename(destination, backup);
    }
    try {
      await rename(stage, destination);
    } catch (error) {
      if (backup) await rename(backup, destination);
      throw error;
    }
  }
  console.log(
    `${mode === "--check" ? "Verified" : "Generated"} ${consumer}: ${pkg.name}@${pkg.version}`,
  );
}
