import { test } from "node:test";
import assert from "node:assert/strict";
import { renderToStaticMarkup } from "react-dom/server";
import {
  BulkActions,
  Field,
  Input,
  ProductLockup,
  Snippet,
  Stat,
  WorkspaceShell,
} from "../../packages/ui/src/index";

test("bulk actions do not occupy space without a selection", () => {
  assert.equal(
    renderToStaticMarkup(
      <BulkActions count={0}>
        <button>Remove</button>
      </BulkActions>,
    ),
    "",
  );
  assert.match(
    renderToStaticMarkup(
      <BulkActions count={2}>
        <button>Remove</button>
      </BulkActions>,
    ),
    /2 selected/,
  );
});

test("field wires hints and errors to the actual input", () => {
  const html = renderToStaticMarkup(
    <Field
      id="alias"
      label="Account alias"
      description="Team name"
      error="Name required"
    >
      {(props) => <Input {...props} />}
    </Field>,
  );
  assert.match(html, /for="alias"/);
  assert.match(html, /aria-describedby="alias-description alias-error"/);
  assert.match(html, /aria-invalid="true"/);
  assert.match(html, /id="alias-error"/);
});

test("shell renders supplied navigation without manufacturing routes or platform regions", () => {
  const html = renderToStaticMarkup(
    <WorkspaceShell
      contentId="mail-content"
      navigation={
        <nav>
          <a href="/accounts">Accounts</a>
        </nav>
      }
      header={<span>Host actions</span>}
    >
      <h1>Inbox</h1>
    </WorkspaceShell>,
  );
  assert.match(html, /href="#mail-content"/);
  assert.match(html, /id="mail-content"/);
  assert.match(html, /href="\/accounts"/);
  assert.doesNotMatch(html, /data-tauri|localStorage/);
  assert.equal((html.match(/<main/g) ?? []).length, 1);
});

test("lockup, stat and snippet keep their names and copy text", () => {
  const html = renderToStaticMarkup(
    <>
      <ProductLockup product="Spanreed" tagline="by Fabrials" gem="ruby" />
      <Stat label="Requests" value="12" />
      <Snippet label="Install">curl example</Snippet>
    </>,
  );
  assert.match(html, /data-gem="ruby"/);
  assert.match(html, /Spanreed/);
  assert.match(html, /by Fabrials/);
  assert.match(html, /Requests/);
  assert.match(html, />12</);
  assert.match(html, /aria-label="Install"/);
  assert.match(html, /curl example/);
  assert.match(html, /aria-label="Copy command"/);
});
