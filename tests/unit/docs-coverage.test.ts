import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import ts from "typescript";

// Two documents describe what the packages export, and both drift the moment a piece lands without them: the agent skill's
// table (`skills/fabrials-design-system/references/components.md`) and the site's catalogue (`apps/site/lib/ui-catalog.ts`).
// A third, `docs/migration-0.12.md`, is what a product reads before it upgrades, so an export it never names is one nobody
// finds. This test reads the exports from the source and holds the three together.

const root = resolve(import.meta.dirname, "../..");
const packages = ["ui", "ai-ui"] as const;
const INDEX = { ui: "ui/index.ts", "ai-ui": "ai-ui/index.tsx" } as const;

type Module = { key: string; source: ts.SourceFile };

const modules = new Map<string, Module>();
for (const pkg of packages)
  for (const file of readdirSync(resolve(root, "packages", pkg, "src")).sort())
    if (/\.tsx?$/.test(file))
      modules.set(`${pkg}/${file}`, {
        key: `${pkg}/${file}`,
        source: ts.createSourceFile(
          file,
          readFileSync(resolve(root, "packages", pkg, "src", file), "utf8"),
          ts.ScriptTarget.Latest,
          true,
          file.endsWith("x") ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
        ),
      });

function local(pkg: string, specifier: string) {
  const name = specifier.replace(/^\.\//, "");
  return modules.get(`${pkg}/${name}.tsx`) ?? modules.get(`${pkg}/${name}.ts`);
}

const exported = (node: ts.Node) =>
  ts.canHaveModifiers(node) && (ts.getModifiers(node)?.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword) ?? false);

/** Whether a name reaches the index as a value: a function, a class, a constant or an enum. Types are erased. */
function kindOf(pkg: string, module: Module, name: string, seen = new Set<string>()): "value" | "type" | undefined {
  const guard = `${module.key}#${name}`;
  if (seen.has(guard)) return undefined;
  seen.add(guard);
  const stars: Module[] = [];
  for (const statement of module.source.statements) {
    if (ts.isExportDeclaration(statement)) {
      if (statement.moduleSpecifier && ts.isStringLiteral(statement.moduleSpecifier)) {
        const target = local(pkg, statement.moduleSpecifier.text);
        if (!target) continue;
        if (!statement.exportClause) {
          stars.push(target);
          continue;
        }
        if (!ts.isNamedExports(statement.exportClause)) continue;
        for (const element of statement.exportClause.elements) {
          if (element.name.text !== name) continue;
          if (statement.isTypeOnly || element.isTypeOnly) return "type";
          return kindOf(pkg, target, (element.propertyName ?? element.name).text, seen);
        }
        continue;
      }
      if (statement.exportClause && ts.isNamedExports(statement.exportClause))
        for (const element of statement.exportClause.elements)
          if (element.name.text === name && !statement.isTypeOnly && !element.isTypeOnly)
            return kindOf(pkg, module, (element.propertyName ?? element.name).text, seen);
      continue;
    }
    if (!exported(statement)) continue;
    if ((ts.isFunctionDeclaration(statement) || ts.isClassDeclaration(statement)) && statement.name?.text === name) return "value";
    if (ts.isEnumDeclaration(statement) && statement.name.text === name) return "value";
    if (ts.isVariableStatement(statement))
      for (const declaration of statement.declarationList.declarations)
        if (ts.isIdentifier(declaration.name) && declaration.name.text === name) return "value";
    if ((ts.isTypeAliasDeclaration(statement) || ts.isInterfaceDeclaration(statement)) && statement.name.text === name) return "type";
  }
  for (const star of stars) {
    const found = kindOf(pkg, star, name, seen);
    if (found) return found;
  }
  return undefined;
}

/** Every value that reaches the two indexes, sorted. */
function valueExports(): Set<string> {
  const names = new Set<string>();
  const walk = (pkg: string, module: Module, seen = new Set<string>()) => {
    if (seen.has(module.key)) return;
    seen.add(module.key);
    for (const statement of module.source.statements) {
      if (ts.isExportDeclaration(statement)) {
        if (statement.moduleSpecifier && ts.isStringLiteral(statement.moduleSpecifier)) {
          const target = local(pkg, statement.moduleSpecifier.text);
          if (!target) continue;
          if (!statement.exportClause) {
            walk(pkg, target, seen);
            continue;
          }
          if (!ts.isNamedExports(statement.exportClause) || statement.isTypeOnly) continue;
          for (const element of statement.exportClause.elements) {
            if (element.isTypeOnly) continue;
            if (kindOf(pkg, target, (element.propertyName ?? element.name).text) === "value") names.add(element.name.text);
          }
          continue;
        }
        if (statement.exportClause && ts.isNamedExports(statement.exportClause) && !statement.isTypeOnly)
          for (const element of statement.exportClause.elements)
            if (!element.isTypeOnly && kindOf(pkg, module, (element.propertyName ?? element.name).text) === "value") names.add(element.name.text);
        continue;
      }
      if (!exported(statement)) continue;
      if ((ts.isFunctionDeclaration(statement) || ts.isClassDeclaration(statement)) && statement.name) names.add(statement.name.text);
      if (ts.isEnumDeclaration(statement)) names.add(statement.name.text);
      if (ts.isVariableStatement(statement))
        for (const declaration of statement.declarationList.declarations)
          if (ts.isIdentifier(declaration.name)) names.add(declaration.name.text);
    }
  };
  for (const pkg of packages) walk(pkg, modules.get(INDEX[pkg])!);
  return names;
}

const exportsNow = valueExports();
const read = (path: string) => readFileSync(resolve(root, path), "utf8");
const mentions = (text: string, name: string) => new RegExp(`(?<![\\w$])${name.replace(/[$]/g, "\\$")}(?![\\w$])`).test(text);

/** A name counted as `PascalCase`: a component, a class or a provider a product names in its own markup. */
const isComponent = (name: string) => /^[A-Z][a-z]/.test(name);
const components = [...exportsNow].filter(isComponent).sort();

// Parts that are documented through the component they belong to, with the reason each one is not a row of its own.
const THROUGH_PARENT: Record<string, string> = {
  AlertDialogFooter: "a part of AlertDialog",
  AlertDialogHeader: "a part of AlertDialog",
  AlertDialogMedia: "a part of AlertDialog",
  AlertDialogOverlay: "a part of AlertDialog",
  AlertDialogPortal: "a part of AlertDialog",
  DialogOverlay: "a part of Dialog",
  DialogPortal: "a part of Dialog",
  DropdownMenuGroup: "a part of DropdownMenu",
  DropdownMenuPortal: "a part of DropdownMenu",
  SelectScrollDownButton: "a part of Select, drawn by its own list",
  SelectScrollUpButton: "a part of Select, drawn by its own list",
  ImageViewerControlContext: "an internal context of ImageViewerProvider, reached through useImageViewer",
  ImageViewerGroupContext: "an internal context of ImageViewerGroup",
  ImageViewerOpenContext: "an internal context of ImageViewerProvider, reached through ZoomableImage",
  SidebarInsetContent: "a part of SidebarInset, named in its row",
  SidebarInsetHeaderActions: "a part of SidebarInsetHeader, named in the Sidebar row",
  FieldRequiredMark: "drawn by Field `required`; named in the Field row",
  FieldOptionalMark: "drawn by Field `optional`; named in the Field row",
  ModifierKeyText: "the text of a key chord; useModifierKey and Kbd cover the job, named in the Kbd row",
};

// A rule instead of one line per name: a part whose name ends like this is documented by the component it starts with.
const SUFFIXES = [
  { pattern: /^[A-Z][\w]*Portal$/, reason: "a portal of the overlay it starts with" },
  { pattern: /^[A-Z][\w]*Overlay$/, reason: "the scrim of the overlay it starts with" },
];

const throughParent = (name: string) => name in THROUGH_PARENT || SUFFIXES.some((suffix) => suffix.pattern.test(name));

test("every public component is in the skill's table or in the site catalogue", () => {
  const table = read("skills/fabrials-design-system/references/components.md");
  const catalogue = read("apps/site/lib/ui-catalog.ts");
  const missing = components.filter((name) => !mentions(table, name) && !mentions(catalogue, name) && !throughParent(name));
  assert.deepEqual(
    missing,
    [],
    `document these in references/components.md (or the catalogue): ${missing.join(", ")}`,
  );
});

test("every part excused as documented through its parent still exists", () => {
  for (const [name, reason] of Object.entries(THROUGH_PARENT)) {
    assert.ok(reason.length > 8, `${name} needs a reason`);
    assert.ok(exportsNow.has(name), `${name} is on the list as ${reason}, but the package no longer exports it`);
  }
  for (const { pattern, reason } of SUFFIXES) {
    const matched = [...exportsNow].filter((name) => pattern.test(name));
    assert.ok(matched.length > 0, `the rule "${reason}" (${pattern}) matches nothing`);
    for (const name of matched) assert.ok(isComponent(name), `${name} matched ${pattern} but is not a component`);
  }
});

const baseline = JSON.parse(read("tests/unit/__baselines__/exports-0.11.json")) as { version: string; valueExports: string[] };

test("the migration note names every value this release adds", () => {
  const note = read("docs/migration-0.12.md");
  const before = new Set(baseline.valueExports);
  const added = [...exportsNow].filter((name) => !before.has(name)).sort();
  assert.ok(added.length > 0, "no export was added: the baseline is not 0.11.0");
  const missing = added.filter((name) => !mentions(note, name));
  assert.deepEqual(missing, [], `docs/migration-0.12.md never names: ${missing.join(", ")}`);
});

test("the 0.11 baseline is still a subset of what the packages export", () => {
  for (const name of baseline.valueExports) assert.ok(exportsNow.has(name), `${name} was exported at 0.11.0 and is gone`);
});
