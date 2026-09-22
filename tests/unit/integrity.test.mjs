import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, writeFile, rm, symlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileHashes, verifyDistribution } from "../../scripts/integrity.mjs";

async function fixture(run) {
  const directory = await mkdtemp(join(tmpdir(), "fabrials-ui-integrity-"));
  try {
    await writeFile(
      join(directory, "package.json"),
      JSON.stringify({ name: "@fabrials/ui", version: "0.2.0" }),
    );
    await writeFile(join(directory, "index.js"), "export const example = 1;");
    await writeFile(
      join(directory, "fabrials-manifest.json"),
      JSON.stringify({
        schema: 1,
        name: "@fabrials/ui",
        version: "0.2.0",
        files: await fileHashes(directory),
      }),
    );
    await run(directory);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}

test("unmodified distributions verify", () =>
  fixture(async (directory) => {
    assert.equal((await verifyDistribution(directory)).version, "0.2.0");
  }));

test("modified and unexpected files fail verification", () =>
  fixture(async (directory) => {
    await writeFile(join(directory, "index.js"), "export const example = 2;");
    await assert.rejects(
      () => verifyDistribution(directory),
      /modified or incomplete/,
    );
  }));

test("unmanifested files fail verification", () =>
  fixture(async (directory) => {
    await writeFile(
      join(directory, "unexpected.js"),
      "export const injected = true;",
    );
    await assert.rejects(
      () => verifyDistribution(directory),
      /modified or incomplete/,
    );
  }));

test("distribution traversal refuses symlinks", () =>
  fixture(async (directory) => {
    await symlink(join(directory, "index.js"), join(directory, "linked.js"));
    await assert.rejects(
      () => verifyDistribution(directory),
      /Symlink not allowed/,
    );
  }));
