import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, join, resolve } from "node:path";
import ts from "typescript";
import { bundle, isClientSource } from "../../scripts/build.mjs";

const root = resolve(import.meta.dirname, "../..");
const packages = ["ui", "ai-ui"] as const;

// Libraries whose modules are client modules themselves: a file that imports or re-exports one is a client module too.
const CLIENT_LIBRARIES = /^(@base-ui\/react\/|cmdk$|embla-carousel-react$|motion\/react$|recharts$|sonner$|react-resizable-panels$)/;

// Directive-free on purpose although the scan finds a browser global.
const PLAIN_BY_DESIGN: Record<string, string> = {
  "ui/theme.ts": "reads `document` behind a typeof guard, and its subscription is only ever called from a client module",
  "ui/resolve-color.ts":
    "reads a colour through a canvas when one exists and returns the value untouched when none does; `DitherCanvas` and `useResolvedTokens`, both client modules, are its callers",
  "ui/export.ts":
    "downloads, serialises and copies in the browser, and every function says so when called without a DOM; the module itself must import on the server, where a Server Component reads `fileStem`",
  "ui/alert.tsx":
    "hands `onRetry` to `AlertRetry`, a client module that waits on the promise; the alert itself draws nothing in the browser and stays renderable from a Server Component without it",
};

// Client on purpose although the scan finds no hook, handler or browser API.
const CLIENT_BY_DESIGN: Record<string, string> = {
  "ui/icon-button.tsx":
    "a Base UI trigger clones it (`render={<IconButton />}`) and the merged props must reach the inner Button; rendered on the server they would land on the tooltip root",
};

type Module = { key: string; path: string; text: string; source: ts.SourceFile; client: boolean };

function load(pkg: string, file: string): Module {
  const path = resolve(root, "packages", pkg, "src", file);
  const text = readFileSync(path, "utf8");
  const source = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, file.endsWith("x") ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
  const first = source.statements[0];
  const client =
    first !== undefined && ts.isExpressionStatement(first) && ts.isStringLiteral(first.expression) && first.expression.text === "use client";
  return { key: `${pkg}/${file}`, path, text, source, client };
}

const modules = new Map<string, Module>();
for (const pkg of packages)
  for (const file of readdirSync(resolve(root, "packages", pkg, "src")).sort())
    if (/\.tsx?$/.test(file)) modules.set(`${pkg}/${file}`, load(pkg, file));

function local(pkg: string, specifier: string) {
  const name = specifier.replace(/^\.\//, "");
  return modules.get(`${pkg}/${name}.tsx`) ?? modules.get(`${pkg}/${name}.ts`);
}

function isFunctionValue(node: ts.Node | undefined): boolean {
  return node !== undefined && (ts.isArrowFunction(node) || ts.isFunctionExpression(node));
}

/** Why a module must run in the browser: hooks, context, handlers, browser globals, client libraries, functions handed to a component. */
function clientReasons({ source }: Module) {
  const reasons = new Set<string>();
  const functions = new Set<string>();
  for (const statement of source.statements) {
    if (ts.isFunctionDeclaration(statement) && statement.name) functions.add(statement.name.text);
  }
  function visit(node: ts.Node) {
    if ((ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) && node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) {
      const typeOnly = ts.isImportDeclaration(node) ? node.importClause?.isTypeOnly : node.isTypeOnly;
      if (!typeOnly && CLIENT_LIBRARIES.test(node.moduleSpecifier.text)) reasons.add(`imports ${node.moduleSpecifier.text}`);
      return;
    }
    if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && isFunctionValue(node.initializer)) functions.add(node.name.text);
    if (ts.isCallExpression(node)) {
      const callee = node.expression;
      const name = ts.isIdentifier(callee) ? callee.text : ts.isPropertyAccessExpression(callee) ? callee.name.text : "";
      if (/^use[A-Z]/.test(name)) reasons.add(`calls ${name}`);
      if (name === "createContext") reasons.add("creates a context");
    }
    if (
      (ts.isClassDeclaration(node) || ts.isClassExpression(node)) &&
      node.heritageClauses?.some((clause) => clause.types.some((type) => /\b(Pure)?Component$/.test(type.expression.getText(source))))
    )
      reasons.add("declares a class component");
    if (ts.isJsxAttribute(node)) {
      const name = node.name.getText(source);
      const value = node.initializer && ts.isJsxExpression(node.initializer) ? node.initializer.expression : undefined;
      if (/^on[A-Z]/.test(name)) reasons.add(`handles ${name}`);
      else if (isFunctionValue(value)) reasons.add(`passes a function as ${name}`);
      else if (value && ts.isIdentifier(value) && functions.has(value.text)) reasons.add(`passes the function ${value.text} as ${name}`);
    }
    if (
      ts.isIdentifier(node) &&
      /^(window|document|navigator)$/.test(node.text) &&
      !(ts.isPropertyAccessExpression(node.parent) && node.parent.name === node) &&
      !ts.isPropertyAssignment(node.parent) &&
      !ts.isPropertySignature(node.parent) &&
      !ts.isParameter(node.parent) &&
      !ts.isBindingElement(node.parent)
    )
      reasons.add(`reads ${node.text}`);
    ts.forEachChild(node, visit);
  }
  visit(source);
  return [...reasons];
}

test("a module that needs the browser says so, and one that does not stays callable from the server", () => {
  for (const module of modules.values()) {
    const reasons = clientReasons(module);
    if (reasons.length > 0 && !module.client)
      assert.ok(module.key in PLAIN_BY_DESIGN, `${module.key} lacks "use client" but ${reasons.join(", ")}`);
    if (reasons.length === 0 && module.client)
      assert.ok(module.key in CLIENT_BY_DESIGN, `${module.key} says "use client" without a hook, a handler, a context or a browser API`);
  }
  for (const key of [...Object.keys(PLAIN_BY_DESIGN), ...Object.keys(CLIENT_BY_DESIGN)])
    assert.ok(modules.has(key), `${key} is on an allow-list but no longer exists`);
  for (const key of Object.keys(PLAIN_BY_DESIGN)) assert.equal(modules.get(key)!.client, false, `${key} gained the directive: drop it from the list`);
  for (const key of Object.keys(CLIENT_BY_DESIGN)) {
    assert.equal(modules.get(key)!.client, true, `${key} lost the directive`);
    assert.deepEqual(clientReasons(modules.get(key)!), [], `${key} now has a reason of its own: drop it from the list`);
  }
});

/** The module a name exported by `module` is defined in, following `export … from` and `export *`. */
function definingModule(pkg: string, module: Module, name: string, seen = new Set<string>()): Module | undefined {
  if (seen.has(module.key)) return undefined;
  seen.add(module.key);
  const stars: Module[] = [];
  for (const statement of module.source.statements) {
    if (ts.isExportDeclaration(statement) && statement.moduleSpecifier && ts.isStringLiteral(statement.moduleSpecifier)) {
      const target = local(pkg, statement.moduleSpecifier.text);
      if (!target) continue;
      if (!statement.exportClause) stars.push(target);
      else if (ts.isNamedExports(statement.exportClause))
        for (const element of statement.exportClause.elements)
          if (element.name.text === name) return definingModule(pkg, target, (element.propertyName ?? element.name).text, seen);
      continue;
    }
    const exported = ts.canHaveModifiers(statement) && ts.getModifiers(statement)?.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword);
    if (!exported) continue;
    if ((ts.isFunctionDeclaration(statement) || ts.isClassDeclaration(statement)) && statement.name?.text === name) return module;
    if (ts.isVariableStatement(statement))
      for (const declaration of statement.declarationList.declarations)
        if (ts.isIdentifier(declaration.name) && declaration.name.text === name) return module;
  }
  for (const statement of module.source.statements)
    if (ts.isExportDeclaration(statement) && !statement.moduleSpecifier && statement.exportClause && ts.isNamedExports(statement.exportClause))
      for (const element of statement.exportClause.elements) if (element.name.text === name) return module;
  for (const star of stars) {
    const found = definingModule(pkg, star, name, seen);
    if (found) return found;
  }
  return undefined;
}

const INDEX = { ui: "ui/index.ts", "ai-ui": "ai-ui/index.tsx" } as const;

test("a directive-free module only renders what it takes from a client module, never calls it", () => {
  for (const module of modules.values()) {
    if (module.client || module.key === INDEX.ui || module.key === INDEX["ai-ui"]) continue;
    const pkg = module.key.split("/")[0]!;
    const clientNames = new Set<string>();
    for (const statement of module.source.statements) {
      if (!ts.isImportDeclaration(statement) || !ts.isStringLiteral(statement.moduleSpecifier) || statement.importClause?.isTypeOnly) continue;
      const specifier = statement.moduleSpecifier.text;
      const bindings = statement.importClause?.namedBindings;
      if (!bindings || !ts.isNamedImports(bindings)) continue;
      for (const element of bindings.elements) {
        if (element.isTypeOnly) continue;
        const imported = (element.propertyName ?? element.name).text;
        const from = specifier.startsWith("./")
          ? local(pkg, specifier)
          : specifier === "@fabrials/ui"
            ? modules.get(INDEX.ui)
            : undefined;
        if (!from) continue;
        const owner = definingModule(specifier.startsWith("./") ? pkg : "ui", from, imported);
        assert.ok(owner, `${module.key}: cannot find where ${imported} is defined`);
        if (owner.client) clientNames.add(element.name.text);
      }
    }
    if (clientNames.size === 0) continue;
    const visit = (node: ts.Node) => {
      if (ts.isImportDeclaration(node)) return;
      if (ts.isIdentifier(node) && clientNames.has(node.text)) {
        const parent = node.parent;
        const rendered =
          ((ts.isJsxOpeningElement(parent) || ts.isJsxSelfClosingElement(parent) || ts.isJsxClosingElement(parent)) && parent.tagName === node) ||
          ts.isTypeQueryNode(parent) ||
          ts.isExportSpecifier(parent) ||
          (ts.isPropertyAccessExpression(parent) && parent.name === node);
        assert.ok(rendered, `${module.key} uses ${node.text}, which lives in a client module, as a value: on the server it is only a reference`);
      }
      ts.forEachChild(node, visit);
    };
    visit(module.source);
  }
});

test("the index barrels carry no directive", () => {
  for (const key of Object.values(INDEX)) assert.equal(modules.get(key)!.client, false, `${key} must not say "use client"`);
});

test("the build reads the directive the way a parser does", () => {
  for (const module of modules.values()) assert.equal(isClientSource(module.text), module.client, module.key);
  assert.equal(isClientSource('// Origin: somewhere\n/* a note */\n"use client";\nimport x from "y";'), true);
  assert.equal(isClientSource("'use client'\nexport {};"), true);
  assert.equal(isClientSource('import x from "y";\n"use client";'), false);
  assert.equal(isClientSource('// "use client";\nexport {};'), false);
});

// What a Server Component calls: each must reach the index from a module without the directive.
const SERVER_SAFE = {
  ui: [
    "formatBytes",
    "formatRelativeTime",
    "formatAbsoluteTime",
    "fileTypeLabel",
    "avatarInitials",
    "avatarTint",
    "toISODate",
    "parseISODate",
    "isSameDay",
    "matchesDate",
    "firstDayOfWeek",
    "acceptsFile",
    "sortFiles",
    "placeholderText",
    "placeholderList",
    "groupByRecency",
    "recencyGroupFor",
    "languageMark",
    "activityLevel",
    "formatClock",
    "buttonVariants",
    "Card",
    "CardHeader",
    "CardTitle",
    "CardContent",
    "Alert",
    "AlertTitle",
    "Separator",
    "Skeleton",
    "Kbd",
    "StatGroup",
    "StatusDot",
    "DescriptionList",
    "Timeline",
    "ActivityStrip",
    "FileSize",
    "Spinner",
  ],
  "ai-ui": ["hostnameFromUrl", "sourcePath", "formatTokens", "codeFilename", "attachmentCategory", "formatBytes", "providerBrand"],
} as const;

test("the helpers and the hook-free components reach the index from modules without the directive", () => {
  for (const pkg of packages)
    for (const name of SERVER_SAFE[pkg]) {
      const owner = definingModule(pkg, modules.get(INDEX[pkg])!, name);
      assert.ok(owner, `${pkg} no longer exports ${name}`);
      assert.equal(owner.client, false, `${name} is defined in ${owner.key}, a client module`);
    }
});

function firstLine(path: string) {
  return readFileSync(path, "utf8").split("\n", 1)[0]!;
}

function assertBuilt(pkg: (typeof packages)[number], dist: string) {
  const built = new Set(readdirSync(dist).filter((file) => file.endsWith(".js")));
  for (const module of modules.values()) {
    if (!module.key.startsWith(`${pkg}/`)) continue;
    const file = `${basename(module.key).replace(/\.tsx?$/, "")}.js`;
    // A module of types only has no built file.
    if (!built.has(file)) continue;
    assert.equal(
      firstLine(resolve(dist, file)) === '"use client";',
      module.client,
      `${pkg}/dist/${file} ${module.client ? "lost" : "gained"} the directive of its source`,
    );
  }
  const index = readFileSync(resolve(dist, "index.js"), "utf8");
  assert.doesNotMatch(index, /["']use client["']/, `${pkg}/dist/index.js must stay directive-free`);
  for (const name of SERVER_SAFE[pkg]) {
    const from = new RegExp(`import \\{[^}]*\\b${name}\\b[^}]*\\} from "\\./([\\w-]+)\\.js"`).exec(index)?.[1];
    assert.ok(from, `${pkg}/dist/index.js does not import ${name} from a module of its own`);
    assert.notEqual(firstLine(resolve(dist, `${from}.js`)), '"use client";', `${pkg}/dist/index.js takes ${name} from ${from}.js, a client module`);
  }
}

test("a build writes the banner on the modules whose source has the directive, and on no other", async () => {
  for (const pkg of packages) {
    const out = mkdtempSync(join(tmpdir(), `fabrials-${pkg}-boundaries-`));
    try {
      await bundle(pkg, out);
      assertBuilt(pkg, out);
      if (pkg !== "ui") continue;
      // The built helpers are plain modules a server can load and call.
      const format = await import(resolve(out, "format.js"));
      const initials = await import(resolve(out, "avatar-initials.js"));
      const recency = await import(resolve(out, "recency.js"));
      assert.equal(format.formatBytes("en", 1536), "1.5 kB");
      assert.equal(format.formatRelativeTime(0, 180_000, "en"), "3 minutes ago");
      assert.equal(initials.avatarInitials("Ada Lovelace"), "AL");
      assert.equal(recency.groupByRecency([{ at: 0 }], (item: { at: number }) => item.at, new Date(0)).length, 1);
    } finally {
      rmSync(out, { recursive: true, force: true });
    }
  }
});

test("the built packages on disk agree with their sources", () => {
  for (const pkg of packages) {
    const dist = resolve(root, "packages", pkg, "dist");
    // Not built yet (`bun run check` builds after testing), or built before the source last changed.
    if (!existsSync(resolve(dist, "index.js"))) continue;
    const builtAt = statSync(resolve(dist, "index.js")).mtimeMs;
    if ([...modules.values()].some((module) => module.key.startsWith(`${pkg}/`) && statSync(module.path).mtimeMs > builtAt)) continue;
    assertBuilt(pkg, dist);
  }
});
