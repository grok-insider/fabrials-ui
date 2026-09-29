import { test } from "node:test";
import assert from "node:assert/strict";
import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync } from "node:fs";
import { Alert, AlertTitle, Card, CardHeader, CardTitle, CardContent, NativeCheckbox, NativeSelect, StatePanel, Table, TableHeader, TableHead, TableBody, TableRow, TableCell, BulkActions } from "../../packages/ui/src/index";
import { buttonVariants } from "../../packages/ui/src/button-variants";

test("native controls preserve form names, values and disabled semantics", () => {
  const html = renderToStaticMarkup(<form><NativeSelect name="account" defaultValue="support" required><option value="support">Support</option></NativeSelect><NativeCheckbox name="confirmed" value="yes" defaultChecked disabled /></form>);
  assert.match(html, /name="account"/);
  assert.match(html, /value="support" selected/);
  assert.match(html, /type="checkbox"/);
  assert.match(html, /disabled=""/);
  assert.match(html, /checked=""/);
});

test("cards and feedback retain host heading levels and alert semantics", () => {
  const html = renderToStaticMarkup(<Card><CardHeader><CardTitle as="h3">Account</CardTitle></CardHeader><CardContent><Alert variant="destructive"><AlertTitle>Unavailable</AlertTitle></Alert><StatePanel headingLevel={4} state="empty" title="Sin mensajes" /></CardContent></Card>);
  assert.match(html, /<h3[^>]*>Account<\/h3>/);
  assert.match(html, /role="alert"/);
  assert.match(html, /<h4>Sin mensajes<\/h4>/);
});

test("collection labels are localizable without changing native table semantics", () => {
  const html = renderToStaticMarkup(<><Table regionLabel="Usuarios"><TableHeader><TableRow><TableHead>Nombre</TableHead></TableRow></TableHeader><TableBody><TableRow><TableCell>Ana</TableCell></TableRow></TableBody></Table><BulkActions count={2} regionLabel="Acciones" label="2 seleccionados">Archivar</BulkActions></>);
  assert.match(html, /aria-label="Usuarios"/);
  assert.match(html, /scope="col"/);
  assert.match(html, /aria-label="Acciones"/);
  assert.match(html, /2 seleccionados/);
});

test("server link styles have no client boundary and dark mode supports either host attribute", () => {
  assert.match(buttonVariants({ variant: "outline", size: "sm" }), /fui-button-outline fui-button-size-sm/);
  const helper = readFileSync(new URL("../../packages/ui/src/button-variants.ts", import.meta.url), "utf8");
  assert.doesNotMatch(helper, /use client/);
  const css = readFileSync(new URL("../../packages/ui/src/tokens.css", import.meta.url), "utf8");
  assert.match(css, /\.dark,\s*\[data-theme="dark"\]/);
  assert.match(css, /:root,\s*\.light,\s*\[data-theme="light"\]\s*\{/);
});

test("segmented toggles get a 44 px hit area on touch and narrow screens without growing their group", () => {
  const styles = readFileSync(new URL("../../packages/ui/src/styles.css", import.meta.url), "utf8");
  const at = styles.indexOf(".fui-toggle::before");
  assert.ok(at > 0, "the toggle extends its hit area with a pseudo-element");
  assert.match(styles.slice(styles.lastIndexOf("@media", at), at), /^@media \(max-width: 767px\), \(pointer: coarse\)/);
  assert.match(styles.slice(at, at + 200), /inset-block: -3px/);
  // A painted 44 px default would make a theme switcher three 44 px squares and break a 390 px site header: only size="lg" paints the whole height.
  assert.doesNotMatch(styles.slice(styles.lastIndexOf("@media", at), at + 900), /\.fui-toggle,\s*\.fui-toggle-group\[data-size\] \.fui-toggle/);
  assert.match(styles.slice(at, at + 900), /\.fui-toggle-group\[data-size="lg"\] \.fui-toggle::before \{\s*content: none;/);
});
