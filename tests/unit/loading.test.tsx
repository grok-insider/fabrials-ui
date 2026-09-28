import { test } from "node:test";
import assert from "node:assert/strict";
import { renderToString } from "react-dom/server";
import { Loading, placeholderList, placeholderText, useLoading } from "../../packages/ui/src/index";

function Probe() {
  return <p>{useLoading() ? "skeleton" : "content"}</p>;
}

test("Loading marks its content as a skeleton only while loading, on the server too", () => {
  const busy = renderToString(
    <Loading when label="Loading accounts">
      <Probe />
    </Loading>,
  );
  assert.match(busy, /data-fui-loading=""/);
  assert.match(busy, /aria-busy="true"/);
  assert.match(busy, /<span role="status" class="fui-sr-only">Loading accounts<\/span>/);
  assert.match(busy, /class="fui-loading-content" inert=""/);
  assert.match(busy, /<p>skeleton<\/p>/);

  const done = renderToString(
    <Loading when={false} label="Loading accounts">
      <Probe />
    </Loading>,
  );
  assert.doesNotMatch(done, /data-fui-loading|aria-busy|inert/);
  // The status region stays in the DOM (empty), so the next announcement is heard.
  assert.match(done, /<span role="status" class="fui-sr-only"><\/span>/);
  assert.match(done, /<p>content<\/p>/);
});

test("the content keeps the same element structure in both states, so nothing remounts", () => {
  const strip = (html: string) => html.replace(/ (data-fui-loading|aria-busy|inert)="[^"]*"/g, "").replace(/>[^<]*</g, "><");
  const busy = renderToString(<Loading when><Probe /></Loading>);
  const done = renderToString(<Loading when={false}><Probe /></Loading>);
  assert.equal(strip(busy), strip(done));
});

test("placeholder copy is deterministic and wraps like words", () => {
  assert.equal(placeholderText(24), placeholderText(24));
  assert.equal(placeholderText(24).length, 24);
  assert.notEqual(placeholderText(24, 1), placeholderText(24));
  assert.match(placeholderText(40), /^x+( x+)+$/);
  assert.equal(placeholderText(0), "");
  assert.deepEqual(placeholderList(3, (i) => ({ id: i })), [{ id: 0 }, { id: 1 }, { id: 2 }]);
  assert.deepEqual(placeholderList(-1, (i) => i), []);
});
