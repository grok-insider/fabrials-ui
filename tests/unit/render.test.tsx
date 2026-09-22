import { test } from "node:test";
import assert from "node:assert/strict";
import { renderToStaticMarkup } from "react-dom/server";
import {
  BulkActions,
  Field,
  Input,
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
