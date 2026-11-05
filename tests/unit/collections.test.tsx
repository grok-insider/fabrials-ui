import { test } from "node:test";
import assert from "node:assert/strict";
import { renderToStaticMarkup } from "react-dom/server";
import {
  acceptsFile,
  ContextMenu,
  ContextMenuTrigger,
  Dropzone,
  ListBox,
  SidePanel,
  SidePanelBody,
  SidePanelClose,
  SidePanelHeader,
  SidePanelTitle,
  sortFiles,
  VirtualList,
} from "@fabrials/ui";

const rows = Array.from({ length: 5 }, (_, index) => ({ id: `r${index}`, name: `Row ${index}` }));

test("listbox: one tab stop, options with their selection, Item geometry, disabled rows marked", () => {
  const html = renderToStaticMarkup(
    <ListBox
      aria-label="Rows"
      items={rows}
      getKey={(row) => row.id}
      renderItem={(row) => row.name}
      defaultSelected={["r1"]}
      isDisabled={(row) => row.id === "r3"}
    />,
  );
  assert.match(html, /<div aria-label="Rows" role="listbox" tabindex="0"/);
  assert.equal(html.match(/role="option"/g)?.length, 5);
  assert.match(html, /aria-selected="true"[^>]*data-key="r1"[^>]*data-selected=""[^>]*data-current=""/);
  assert.match(html, /aria-disabled="true"[^>]*data-key="r3"/);
  assert.match(html, /class="fui-item fui-listbox-option"/);
  assert.doesNotMatch(html, /aria-multiselectable/);
  const many = renderToStaticMarkup(<ListBox aria-label="Rows" selectionMode="multiple" items={rows} getKey={(row) => row.id} renderItem={(row) => row.name} />);
  assert.match(many, /aria-multiselectable="true"/);
  assert.doesNotMatch(many, /data-current/);
});

test("a virtual listbox draws a window of rows on a canvas as tall as all of them, each with its position", () => {
  const items = Array.from({ length: 5000 }, (_, index) => ({ id: `x${index}` }));
  const html = renderToStaticMarkup(
    <ListBox aria-label="Log" items={items} getKey={(row) => row.id} renderItem={(row) => row.id} virtual={{ estimateSize: 40, overscan: 2 }} height={400} />,
  );
  assert.match(html, /data-virtual=""/);
  assert.match(html, /class="fui-listbox-canvas" style="block-size:200000px"/);
  const drawn = html.match(/role="option"/g)?.length ?? 0;
  assert.ok(drawn > 0 && drawn < 40, `drew ${drawn}`);
  assert.match(html, /aria-posinset="1" aria-setsize="5000"/);
  const list = renderToStaticMarkup(<VirtualList aria-label="Feed" items={items} getKey={(row) => row.id} renderItem={(row) => row.id} estimateSize={40} />);
  assert.match(list, /role="region" aria-label="Feed" tabindex="0" class="fui-virtual-list"/);
  assert.match(list, /<div role="list" class="fui-listbox-canvas"/);
  assert.ok((list.match(/role="listitem"/g)?.length ?? 0) < 40);
});

test("an empty listbox shows what the host gives it", () => {
  const html = renderToStaticMarkup(<ListBox aria-label="None" items={[] as { id: string }[]} getKey={(row) => row.id} renderItem={() => null} empty={<p>Nothing here</p>} />);
  assert.match(html, /data-empty=""/);
  assert.match(html, /<div class="fui-listbox-empty"><p>Nothing here<\/p><\/div>/);
  assert.doesNotMatch(html, /role="listbox"/);
});

test("dropzone: accept rules by extension, wildcard and exact type; size and count refusals carry their reason", () => {
  const pdf = new File(["%PDF"], "Receipt.PDF", { type: "application/pdf" });
  const png = new File(["x"], "scan.png", { type: "image/png" });
  const big = new File([new Uint8Array(2048)], "photo.jpg", { type: "image/jpeg" });
  const txt = new File(["x"], "notes.txt", { type: "text/plain" });
  assert.equal(acceptsFile(pdf, ".pdf"), true);
  assert.equal(acceptsFile(png, "image/*"), true);
  assert.equal(acceptsFile(txt, ".pdf,image/*"), false);
  assert.equal(acceptsFile(txt, undefined), true);
  const sorted = sortFiles([pdf, txt, big, png], { accept: ".pdf,image/*", maxSize: 1024, maxFiles: 1 });
  assert.deepEqual(sorted.accepted.map((file) => file.name), ["Receipt.PDF"]);
  assert.deepEqual(sorted.rejected.map((item) => [item.file.name, item.reason]), [["notes.txt", "type"], ["photo.jpg", "size"], ["scan.png", "count"]]);
  assert.equal(sortFiles([pdf, png], { multiple: false }).rejected[0]?.reason, "count");
});

test("dropzone: the real file input sits in the button, named by it and described by the hint and the error", () => {
  const html = renderToStaticMarkup(<Dropzone id="up" accept=".pdf" description="PDF only." error="Too large." />);
  assert.match(html, /<input id="up" type="file" accept=".pdf" multiple="" class="fui-sr-only" aria-describedby="up-description up-error" aria-invalid="true"\/>Choose files<\/label>/);
  assert.match(html, /class="fui-dropzone" data-invalid=""/);
  assert.match(html, /role="alert">Too large\.<\/p>/);
});

test("side panel: a named complementary landmark with a resize separator; closed, nothing", () => {
  const html = renderToStaticMarkup(
    <SidePanel defaultWidth={320} minWidth={240} maxWidth={480}>
      <SidePanelHeader>
        <SidePanelTitle>Details</SidePanelTitle>
        <SidePanelClose />
      </SidePanelHeader>
      <SidePanelBody>Body</SidePanelBody>
    </SidePanel>,
  );
  const titleId = html.match(/<h2 id="([^"]+)" class="fui-side-panel-title">Details<\/h2>/)?.[1];
  assert.ok(titleId);
  assert.match(html, new RegExp(`<aside aria-labelledby="${titleId}"`));
  assert.match(html, /--fui-side-panel-width:320px/);
  assert.match(html, /role="separator" aria-orientation="vertical" aria-label="Resize panel" aria-valuenow="320" aria-valuemin="240" aria-valuemax="480" tabindex="0"/);
  assert.match(html, /aria-label="Close panel"/);
  assert.equal(renderToStaticMarkup(<SidePanel open={false}>Body</SidePanel>), "");
});

test("context menu: the trigger is a plain region; the menu renders only when opened", () => {
  const html = renderToStaticMarkup(
    <ContextMenu>
      <ContextMenuTrigger>Row</ContextMenuTrigger>
    </ContextMenu>,
  );
  assert.match(html, /data-slot="context-menu-trigger"/);
  assert.match(html, /class="fui-context-menu-trigger"/);
  assert.doesNotMatch(html, /role="menu"/);
});
