import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { resolve } from "node:path";
import ts from "typescript";

test("generic source only depends on presentation libraries and local modules", async () => {
  const directory = resolve(import.meta.dirname, "../../packages/ui/src");
  for (const file of await readdir(directory)) {
    if (!/\.tsx?$/.test(file)) continue;
    const source = ts.createSourceFile(
      file,
      await readFile(resolve(directory, file), "utf8"),
      ts.ScriptTarget.Latest,
      true,
    );
    function visit(node: ts.Node) {
      if (
        (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) &&
        node.moduleSpecifier &&
        ts.isStringLiteral(node.moduleSpecifier)
      ) {
        const specifier = node.moduleSpecifier.text;
        assert.ok(
          specifier.startsWith("./") ||
            specifier === "react" ||
            specifier === "lucide-react" ||
            specifier.startsWith("@base-ui/react/"),
          `${file}: forbidden dependency ${specifier}`,
        );
      }
      if (ts.isCallExpression(node) && ts.isIdentifier(node.expression))
        assert.notEqual(
          node.expression.text,
          "fetch",
          `${file}: network access belongs to the host`,
        );
      if (ts.isJsxAttribute(node))
        assert.notEqual(
          node.name.getText(source),
          "data-tauri-drag-region",
          `${file}: platform chrome belongs to the host`,
        );
      ts.forEachChild(node, visit);
    }
    visit(source);
  }
});

test("AI package points inward without leaking its contract into generic exports", async () => {
  const root = resolve(import.meta.dirname, "../..");
  const ui = JSON.parse(
    await readFile(resolve(root, "packages/ui/package.json"), "utf8"),
  );
  const ai = JSON.parse(
    await readFile(resolve(root, "packages/ai-ui/package.json"), "utf8"),
  );
  assert.equal(ai.peerDependencies["@fabrials/ui"], ui.version);
  assert.equal(ai.version, ui.version);
  assert.equal(ui.dependencies["@fabrials/ai-ui"], undefined);
  assert.deepEqual(ui.sideEffects, ["**/*.css"]);
});
