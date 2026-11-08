/**
 * Writes lib/demo-code.generated.ts: for every preview on a component's docs page (the demos in components/ui-demos*.tsx), the
 * code that makes it, as the page shows it under Code. The code is the demo's own source: the imports it uses, the helpers it
 * calls (data, state, small components) and the preview itself. The docs stage's layout wrapper (Frame, components/demo-frame)
 * becomes the layout it stands for: a single child stands alone unless the frame sets its width, several children sit in a
 * plain grid or row (frameLayout). Prettier formats the result.
 *
 *   bun scripts/generate-demo-code.ts           write the file
 *   bun scripts/generate-demo-code.ts --check   fail if it is stale
 */
import { execFileSync } from "node:child_process";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import * as prettier from "prettier";
import ts from "typescript";
import { frameLayout, type FrameWidth } from "../components/demo-frame";

const check = process.argv.includes("--check");
const OUT = "lib/demo-code.generated.ts";
const SOURCES = [
  ["components/ui-demos.tsx", "demos"],
  ["components/ui-demos-more.tsx", "moreDemos"],
  ["components/ui-demos-instrument.tsx", "instrumentDemos"],
] as const;
const FRAME = "Frame";
const MODULE_ORDER = ["react", "lucide-react", "@fabrials/ui", "@fabrials/ui/dither", "@fabrials/ai-ui"];

const program = ts.createProgram(
  SOURCES.map(([file]) => file),
  { noResolve: true, noLib: true, types: [], jsx: ts.JsxEmit.Preserve, target: ts.ScriptTarget.Latest },
);
const checker = program.getTypeChecker();

type Import = { from: string; imported: string; typeOnly: boolean; order: number };

function pascal(slug: string) {
  return slug.replace(/(^|-)([a-z0-9])/g, (_, __: string, c: string) => c.toUpperCase());
}

async function demosOf(file: string, mapName: string) {
  const sf = program.getSourceFile(file);
  if (!sf) throw new Error(`Cannot read ${file}`);
  const imports = new Map<string, Import>();
  let map: ts.ObjectLiteralExpression | undefined;
  let mapStatement: ts.Statement | undefined;
  for (const statement of sf.statements) {
    if (ts.isImportDeclaration(statement) && statement.importClause) {
      const from = (statement.moduleSpecifier as ts.StringLiteral).text;
      const clause = statement.importClause;
      const bindings = clause.namedBindings;
      if (clause.name) imports.set(clause.name.text, { from, imported: "default", typeOnly: clause.isTypeOnly, order: imports.size });
      if (bindings && ts.isNamedImports(bindings))
        for (const element of bindings.elements)
          imports.set(element.name.text, {
            from,
            imported: element.propertyName?.text ?? element.name.text,
            typeOnly: clause.isTypeOnly || element.isTypeOnly,
            order: imports.size,
          });
    }
    if (ts.isVariableStatement(statement))
      for (const declaration of statement.declarationList.declarations)
        if (ts.isIdentifier(declaration.name) && declaration.name.text === mapName && declaration.initializer && ts.isObjectLiteralExpression(declaration.initializer)) {
          map = declaration.initializer;
          mapStatement = statement;
        }
  }
  if (!map || !mapStatement) throw new Error(`No ${mapName} in ${file}`);

  const topStatement = (node: ts.Node): ts.Statement | undefined => {
    let current: ts.Node = node;
    while (current.parent && current.parent !== sf) current = current.parent;
    return current.parent === sf ? (current as ts.Statement) : undefined;
  };
  const isFrame = (statement: ts.Statement) =>
    (ts.isFunctionDeclaration(statement) && statement.name?.text === FRAME) ||
    (ts.isImportDeclaration(statement) && (statement.moduleSpecifier as ts.StringLiteral).text.endsWith("/demo-frame"));

  /** The top-level helpers and the imported names a node uses. */
  const references = (root: ts.Node, self: ts.Statement | undefined) => {
    const helpers = new Set<ts.Statement>();
    const used = new Set<string>();
    const visit = (node: ts.Node) => {
      if (ts.isIdentifier(node)) {
        const parent = node.parent;
        const symbol =
          ts.isShorthandPropertyAssignment(parent) && parent.name === node
            ? checker.getShorthandAssignmentValueSymbol(parent)
            : checker.getSymbolAtLocation(node);
        const declaration = symbol?.declarations?.[0];
        if (declaration) {
          if (ts.isImportSpecifier(declaration) || ts.isImportClause(declaration) || ts.isNamespaceImport(declaration)) {
            if (imports.has(node.text) && node.text !== FRAME) used.add(node.text);
          } else {
            const statement = topStatement(declaration);
            if (statement && statement !== self && statement !== mapStatement && !ts.isImportDeclaration(statement)) helpers.add(statement);
          }
        }
      }
      ts.forEachChild(node, visit);
    };
    visit(root);
    return { helpers, used };
  };

  /** A node's source with the docs stage wrapper taken out. */
  const render = (node: ts.Node): string => {
    const start = node.getStart(sf);
    const edits: { from: number; to: number; text: string }[] = [];
    const visit = (child: ts.Node) => {
      if (ts.isJsxElement(child) && child.openingElement.tagName.getText(sf) === FRAME) {
        const kids = child.children.filter((kid) => !(ts.isJsxText(kid) && kid.containsOnlyTriviaWhiteSpaces));
        const only = kids.length === 1 ? kids[0]! : undefined;
        const attribute = (name: string) =>
          child.openingElement.attributes.properties.find((item): item is ts.JsxAttribute => ts.isJsxAttribute(item) && item.name.getText(sf) === name);
        const inline = Boolean(attribute("inline"));
        const widthValue = attribute("width")?.initializer;
        if (widthValue && !ts.isStringLiteral(widthValue)) throw new Error(`${file}: a Frame's width must be a string literal`);
        const width = widthValue ? frameLayout.widths[widthValue.text as FrameWidth] : "";
        if (width === undefined) throw new Error(`${file}: unknown Frame width ${widthValue!.getText(sf)}`);
        if (only && (ts.isJsxElement(only) || ts.isJsxSelfClosingElement(only) || ts.isJsxFragment(only))) {
          edits.push({
            from: child.getStart(sf),
            to: child.getEnd(),
            text: width && !inline ? `<div className="${width}">${render(only)}</div>` : render(only),
          });
          return;
        }
        edits.push({
          from: child.openingElement.getStart(sf),
          to: child.openingElement.getEnd(),
          text: `<div className="${inline ? frameLayout.inline : [frameLayout.stack.split(" ")[0], width, ...frameLayout.stack.split(" ").slice(1)].filter(Boolean).join(" ")}">`,
        });
        edits.push({ from: child.closingElement.getStart(sf), to: child.closingElement.getEnd(), text: "</div>" });
        child.children.forEach(visit);
        return;
      }
      ts.forEachChild(child, visit);
    };
    visit(node);
    let text = sf.text.slice(start, node.getEnd());
    for (const edit of edits.sort((a, b) => b.from - a.from)) text = text.slice(0, edit.from - start) + edit.text + text.slice(edit.to - start);
    return text;
  };

  const out = new Map<string, string>();
  for (const property of map.properties) {
    if (!ts.isPropertyAssignment(property)) throw new Error(`${file}: unexpected entry ${property.getText(sf).slice(0, 40)}`);
    const slug = ts.isStringLiteral(property.name) || ts.isIdentifier(property.name) ? property.name.text : property.name.getText(sf);
    const demo = property.initializer;
    if (!ts.isArrowFunction(demo) && !ts.isFunctionExpression(demo)) throw new Error(`${file}: ${slug} is not a function`);

    // Every helper the preview needs, and every helper those need.
    const helpers = new Set<ts.Statement>();
    const used = new Set<string>();
    const queue: [ts.Node, ts.Statement | undefined][] = [[demo.body, undefined]];
    while (queue.length) {
      const [node, self] = queue.shift()!;
      const found = references(node, self);
      for (const name of found.used) used.add(name);
      for (const helper of found.helpers)
        if (!helpers.has(helper) && !isFrame(helper)) {
          helpers.add(helper);
          queue.push([helper, helper]);
        }
    }

    // A preview that is one local component with no props (once the wrapper is gone) is that component.
    let body = demo.body;
    while (ts.isParenthesizedExpression(body)) body = body.expression;
    const rendered = ts.isBlock(demo.body) ? undefined : render(body).trim();
    const lone = rendered?.match(/^<([A-Z][A-Za-z0-9]*)\s*\/>$/)?.[1];
    const alone = lone ? [...helpers].find((helper) => ts.isFunctionDeclaration(helper) && helper.name?.text === lone) : undefined;

    const byModule = new Map<string, string[]>();
    for (const name of [...used].sort((a, b) => imports.get(a)!.order - imports.get(b)!.order)) {
      const { from, imported, typeOnly } = imports.get(name)!;
      const specifier = `${typeOnly ? "type " : ""}${imported === name ? name : `${imported} as ${name}`}`;
      byModule.set(from, [...(byModule.get(from) ?? []), specifier]);
    }
    const modules = [...byModule.keys()].sort((a, b) => {
      const rank = (from: string) => (MODULE_ORDER.includes(from) ? MODULE_ORDER.indexOf(from) : MODULE_ORDER.length);
      return rank(a) - rank(b) || a.localeCompare(b);
    });
    const lines = modules.map((from) => `import { ${byModule.get(from)!.join(", ")} } from "${from}";`);

    const parts = [lines.join("\n")];
    for (const helper of [...helpers].sort((a, b) => a.pos - b.pos)) {
      const text = render(helper);
      parts.push(helper === alone && !/^export\s/.test(text) ? `export ${text}` : text);
    }
    if (!alone) {
      const name = `${pascal(slug)}Example`;
      parts.push(ts.isBlock(demo.body) ? `export function ${name}() ${render(demo.body)}` : `export function ${name}() {\n  return (\n${rendered}\n  );\n}`);
    }
    try {
      out.set(slug, (await prettier.format(parts.join("\n\n"), { parser: "typescript", printWidth: 80 })).trimEnd());
    } catch (error) {
      throw new Error(`${file}: the code of ${slug} does not parse\n${String(error).slice(0, 400)}`);
    }
  }
  return out;
}

const all = new Map<string, string>();
for (const [file, mapName] of SOURCES)
  for (const [slug, code] of await demosOf(file, mapName)) {
    if (!all.has(slug)) all.set(slug, code);
  }

// Every snippet under Code must compile on its own, as a reader would paste it: the demos' code above and the code the example
// sets give their own previews. Each is type-checked as a module of this app (inside node_modules, so the app's own checks
// never see the files, and the packages resolve as they do for the site).
const { exampleSets } = (await import("../components/examples/index")) as typeof import("../components/examples/index");
const snippets = new Map([...all].map(([slug, code]) => [slug, code]));
for (const [slug, set] of Object.entries(exampleSets)) {
  if (!set.previewCode) continue;
  // Written by hand, so held to the same format as the demos' code.
  if ((await prettier.format(set.previewCode, { parser: "typescript", printWidth: 80 })).trimEnd() !== set.previewCode) {
    console.error(`The preview code of ${slug} is not formatted (Prettier, print width 80).`);
    process.exit(1);
  }
  snippets.set(`preview-${slug}`, set.previewCode);
}
const scratch = "node_modules/.cache/demo-code-check";
await rm(scratch, { recursive: true, force: true });
await mkdir(scratch, { recursive: true });
let failure = "";
try {
  for (const [name, code] of snippets) await writeFile(`${scratch}/${name}.tsx`, `"use client";\n${code}\n`);
  await writeFile(
    `${scratch}/tsconfig.json`,
    JSON.stringify({
      extends: "../../../tsconfig.json",
      compilerOptions: { noEmit: true, incremental: false },
      include: ["*.tsx"],
      exclude: [],
    }),
  );
  execFileSync("node_modules/.bin/tsc", ["-p", `${scratch}/tsconfig.json`], { stdio: "pipe" });
} catch (error) {
  failure = (error as { stdout?: Buffer }).stdout?.toString() || String(error);
} finally {
  await rm(scratch, { recursive: true, force: true });
}
if (failure) {
  console.error(`The code of a preview does not compile on its own:\n${failure.slice(0, 4000)}`);
  process.exit(1);
}

const content = `// Generated by scripts/generate-demo-code.ts from components/ui-demos*.tsx (bun run registry:demo-code). Do not edit.
// The code under the Code tab of each component preview at ui.fabrials.com.
export const demoCode: Record<string, string> = {
${[...all.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([slug, code]) => `  ${JSON.stringify(slug)}: ${JSON.stringify(code)},`).join("\n")}
};
`;
const current = await readFile(OUT, "utf8").catch(() => "");
const counted = `the code of ${all.size} demos and ${snippets.size - all.size} example previews, each compiling on its own`;
if (current === content) console.log(`${check ? "Checked" : "Unchanged"}: ${counted}.`);
else if (check) {
  console.error(`${OUT} is out of date (run bun run registry:demo-code).`);
  process.exit(1);
} else {
  await writeFile(OUT, content);
  console.log(`Wrote ${counted}.`);
}
