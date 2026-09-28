import { test } from "node:test";
import assert from "node:assert/strict";
import { renderToStaticMarkup } from "react-dom/server";
import { CodePanel, File, Files, Folder, PackageInstall, RepoInfo, highlightCode, packageCommand } from "../../packages/ui/src/index";

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
  assert.match(html, /data-line-numbers="true"/);
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
