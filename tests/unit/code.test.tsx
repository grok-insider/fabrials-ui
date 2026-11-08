import { test } from "node:test";
import assert from "node:assert/strict";
import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync } from "node:fs";
import { CodePanel, CodeTabs, File, Files, Folder, LanguageIcon, PackageInstall, RepoInfo, highlightCode, languageMark, packageCommand } from "../../packages/ui/src/index";

const uiStyles = readFileSync(new URL("../../packages/ui/src/styles.css", import.meta.url), "utf8");

const kinds = (code: string, language: string) =>
  highlightCode(code, language)
    .flat()
    .filter((token) => token.type && token.type !== "punctuation" && token.type !== "variable")
    .map((token) => `${token.type}:${token.text}`);

test("the highlighter classifies TypeScript, JSX, JSON and shell", () => {
  assert.deepEqual(kinds('import { Button } from "@fabrials/ui";', "ts"), [
    "keyword:import",
    "type:Button",
    "keyword:from",
    'string:"@fabrials/ui"',
  ]);
  assert.deepEqual(kinds('<Button size="sm">Go</Button>', "tsx").slice(0, 3), ["type:Button", "attribute:size", 'string:"sm"']);
  assert.deepEqual(kinds('{ "style": "base-nova", "rsc": true }', "json"), ['property:"style"', 'string:"base-nova"', 'property:"rsc"', "keyword:true"]);
  assert.deepEqual(kinds("npx shadcn@latest add --yes @fabrials/button", "bash").slice(0, 2), ["function:npx", "attribute:--yes"]);
  assert.deepEqual(kinds("curl https://x.dev/#top # fetch", "bash"), ["function:curl", "comment:# fetch"]);
});

test("the highlighter also reads the languages answers use: Python, Rust, Go, SQL, YAML, TOML and diffs", () => {
  assert.deepEqual(kinds('@retry(attempts=5)\ndef sync(mailbox_id: str) -> int:  # headers only\n    return len(f"{mailbox_id}")', "py"), [
    "attribute:@retry",
    "number:5",
    "keyword:def",
    "function:sync",
    "comment:# headers only",
    "keyword:return",
    "function:len",
    'string:f"{mailbox_id}"',
  ]);
  assert.deepEqual(kinds('class Mailbox:\n    """Docs."""', "python"), ["keyword:class", "type:Mailbox", 'string:"""Docs."""']);
  // Rust: attributes, lifetimes and primitives, macros (but not a != after a name) and a turbofish call.
  assert.deepEqual(kinds("#[derive(Debug)]\npub fn sync<'a>(id: &'a str) -> u32 {\n    println!(\"{id}\");\n    if n != 0 { items.iter().collect::<Vec<_>>() }\n}", "rs"), [
    "attribute:#[derive(Debug)]",
    "keyword:pub",
    "keyword:fn",
    "type:'a",
    "type:'a",
    "type:str",
    "type:u32",
    "function:println!",
    'string:"{id}"',
    "keyword:if",
    "number:0",
    "function:iter",
    "function:collect",
    "type:Vec",
  ]);
  assert.deepEqual(kinds("func Sync(id string) (int, error) {\n\tdefer close(ch) // done\n\treturn len(id), nil\n}", "go"), [
    "keyword:func",
    "function:Sync",
    "type:string",
    "type:int",
    "type:error",
    "keyword:defer",
    "function:close",
    "comment:// done",
    "keyword:return",
    "function:len",
    "keyword:nil",
  ]);
  // SQL keywords in any case; placeholders and a Postgres cast are not keywords.
  assert.deepEqual(kinds("SELECT count(*) FROM headers WHERE id = $1 AND at > now() - interval '7 days' AND t::text = 'x';", "sql"), [
    "keyword:SELECT",
    "function:count",
    "keyword:FROM",
    "keyword:WHERE",
    "keyword:AND",
    "function:now",
    "keyword:interval",
    "string:'7 days'",
    "keyword:AND",
    "string:'x'",
  ]);
  // A # inside a value is not a comment; a key named on is a key.
  assert.deepEqual(kinds("on:\n  branches: [master]  # main line\nretry: { attempts: 5, enabled: true }\nurl: https://x.test/#top", "yaml"), [
    "property:on",
    "property:branches",
    "comment:# main line",
    "property:retry",
    "property:attempts",
    "number:5",
    "property:enabled",
    "keyword:true",
    "property:url",
  ]);
  // A table header starts its line; an array after a key is not one.
  assert.deepEqual(kinds('[package]\nname = "relay-sync" # the crate\nfeatures = ["rt"]\n[[bin]]', "toml"), [
    "type:[package]",
    "property:name",
    'string:"relay-sync"',
    "comment:# the crate",
    "property:features",
    'string:"rt"',
    "type:[[bin]]",
  ]);
  assert.deepEqual(kinds("--- a/x.ts\n+++ b/x.ts\n@@ -1,2 +1,2 @@\n-old line\n+new line\n context", "diff"), [
    "comment:--- a/x.ts",
    "comment:+++ b/x.ts",
    "keyword:@@ -1,2 +1,2 @@",
    "deleted:-old line",
    "inserted:+new line",
  ]);
});

test("tokens that cross lines are split per line, and unknown languages stay plain", () => {
  const lines = highlightCode("/* one\ntwo */\nconst x = 1", "ts");
  assert.equal(lines.length, 3);
  assert.equal(lines[0]![0]!.type, "comment");
  assert.equal(lines[1]![0]!.type, "comment");
  assert.deepEqual(highlightCode("plain text", "cobol"), [[{ text: "plain text", type: undefined }]]);
});

test("package commands follow each manager", () => {
  assert.equal(packageCommand("npm", "shadcn@latest add @fabrials/button"), "npx shadcn@latest add @fabrials/button");
  assert.equal(packageCommand("pnpm", "shadcn@latest init"), "pnpm dlx shadcn@latest init");
  assert.equal(packageCommand("bun", "@fabrials/ui", "install"), "bun add @fabrials/ui");
});

test("a code panel shows its file, marks lines and copies without removed lines", () => {
  const html = renderToStaticMarkup(
    <CodePanel title="app/page.tsx" language="tsx" code={"const a = 1;\nconst b = 2;\nconst c = 3;"} highlightLines={[1]} removedLines={[2]} addedLines={[3]} highlightWords={["c"]} lineNumbers />,
  );
  assert.match(html, /<figcaption class="fui-code-panel-bar">[\s\S]*app\/page\.tsx/);
  assert.match(html, /data-highlighted="true"/);
  assert.match(html, /data-diff="removed"/);
  assert.match(html, /data-diff="added"/);
  assert.match(html, /<mark class="fui-code-word">c<\/mark>/);
  // Only the name c is boxed, not the c of each const.
  assert.equal(html.match(/<mark class="fui-code-word">/g)?.length, 1);
  assert.match(html, /data-line-numbers="true"/);
});

test("a language's logo answers to its names and extensions, in its own colour, and is never read", () => {
  for (const name of ["ts", "tsx", "TypeScript", ".ts", " mts "]) assert.equal(languageMark(name)?.id, "typescript", name);
  assert.equal(languageMark("py")?.name, "Python");
  assert.equal(languageMark("rs")?.id, "rust");
  assert.equal(languageMark("diff")?.id, "git");
  assert.equal(languageMark("cobol"), null);
  const python = renderToStaticMarkup(<LanguageIcon language="py" />);
  assert.match(python, /^<svg aria-hidden="true" class="fui-language-icon" data-language="python" data-slot="language-icon" fill="currentColor" focusable="false" style="--fui-language-color:#3776AB" viewBox="0 0 24 24"><path d="M/);
  // Only the black logos take the text's ink in the dark theme.
  const inked = ["rs", "md", "java", "py", "go", "ts", "js", "bash"].filter((language) => /data-ink=""/.test(renderToStaticMarkup(<LanguageIcon language={language} />)));
  assert.deepEqual(inked, ["rs", "md", "java"]);
  // Without a logo of its own, a language gets a plain glyph in the ink around it; so does a share-alike logo (Ruby).
  const glyph = (language?: string) => renderToStaticMarkup(<LanguageIcon language={language} />);
  assert.match(glyph("sql"), /lucide-database/);
  assert.match(glyph("json"), /lucide-braces/);
  assert.match(glyph("rb"), /lucide-file-code/);
  assert.match(glyph(undefined), /lucide-file-text/);
  for (const language of ["sql", "rb", undefined]) {
    const tag = glyph(language).slice(0, glyph(language).indexOf(">"));
    assert.match(tag, /class="[^"]*fui-language-icon/);
    assert.match(tag, /aria-hidden="true"/);
  }
  assert.doesNotMatch(glyph("sql"), /data-language|--fui-language-color/);
  assert.match(uiStyles, /\.fui-language-icon\[data-language\] \{\s*color: var\(--fui-language-color\);/);
  assert.match(uiStyles, /:is\(\.dark, \[data-theme="dark"\]\) \.fui-language-icon\[data-ink\] \{\s*color: inherit;/);
  assert.match(uiStyles, /\[data-theme="system"\] \.fui-language-icon\[data-ink\] \{\s*color: inherit;/);
  // In forced colours every mark takes the system's text colour, the brand colour too.
  assert.match(uiStyles, /@media \(forced-colors: active\) \{\s*\.fui-language-icon,\s*:root \.fui-language-icon\[data-language\] \{\s*color: CanvasText;/);
});

test("the code bars carry the language's logo: a panel before its title, tabs on each tab or once before them", () => {
  const panel = renderToStaticMarkup(<CodePanel code="x = 1" language="py" title="sync.py" />);
  assert.match(panel, /<span class="fui-code-panel-title"><svg aria-hidden="true" class="fui-language-icon" data-language="python"[^]*<span>sync\.py<\/span>/);
  const mixed = renderToStaticMarkup(
    <CodeTabs
      items={[
        { value: "py", label: "Python", language: "py", code: "x = 1" },
        { value: "rs", label: "Rust", language: "rs", code: "let x = 1;" },
      ]}
    />,
  );
  assert.equal(mixed.match(/class="fui-language-icon"/g)?.length, 2);
  assert.match(mixed, /data-language="python"[^]*>Python<\/button>[^]*data-language="rust"[^]*>Rust<\/button>/);
  assert.doesNotMatch(mixed, /fui-code-tabs-language/);
  // One language for every tab: its logo once, at the start of the bar.
  const install = renderToStaticMarkup(<PackageInstall command="shadcn@latest add @fabrials/button" persistKey={null} />);
  assert.equal(install.match(/fui-language-icon/g)?.length, 1);
  assert.match(install, /<div class="fui-code-panel-bar"><svg aria-hidden="true" class="fui-language-icon fui-code-tabs-language" data-language="gnubash"/);
});

test("package install offers every manager, file trees and repository links render", () => {
  const install = renderToStaticMarkup(<PackageInstall command="shadcn@latest add @fabrials/button" persistKey={null} />);
  for (const name of ["npm", "pnpm", "yarn", "bun"]) assert.match(install, new RegExp(`>${name}<`));
  assert.match(install, /npx/);
  const tree = renderToStaticMarkup(
    <Files>
      <Folder name="components" defaultOpen>
        <File name="button.tsx" highlighted />
      </Folder>
      <Folder name="lib">
        <File name="utils.ts" />
      </Folder>
    </Files>,
  );
  assert.match(tree, /aria-expanded="true"[\s\S]*button\.tsx/);
  assert.doesNotMatch(tree, /utils\.ts/); // closed folders render no children
  const repo = renderToStaticMarkup(<RepoInfo owner="grok-insider" repo="fabrials-ui" stars={1234} forks={null} />);
  assert.match(repo, /1.2K/);
  assert.doesNotMatch(repo, /forks/);
});
