import { test } from "node:test";
import assert from "node:assert/strict";
import { renderToStaticMarkup } from "react-dom/server";
import {
  ConfirmActionButton,
  ConfirmDialog,
  FileThumb,
  FilterChip,
  SettingsSection,
  ShimmerText,
  SuggestionCard,
  SuggestionGrid,
  TruncatedText,
  fileTypeLabel,
} from "../../packages/ui/src/index";

test("confirm action button renders only its trigger until opened", () => {
  const html = renderToStaticMarkup(
    <ConfirmActionButton
      buttonProps={{ variant: "outline", size: "sm" }}
      confirmLabel="Revoke"
      description="Anyone with the link loses access."
      destructive
      onConfirm={async () => ({ ok: true })}
      title="Revoke link?"
    >
      Revoke link
    </ConfirmActionButton>,
  );
  assert.match(html, /type="button"/);
  assert.match(html, /data-variant="outline"/);
  assert.match(html, />Revoke link</);
  assert.doesNotMatch(html, /Revoke link\?/);
  assert.equal(
    renderToStaticMarkup(
      <ConfirmDialog
        confirmLabel="Delete"
        description="Gone for good."
        onConfirm={() => undefined}
        onOpenChange={() => undefined}
        open={false}
        title="Delete?"
      />,
    ),
    "",
  );
});

test("truncated text renders the full text in a truncating trigger without an open tooltip", () => {
  const html = renderToStaticMarkup(
    <div>
      <TruncatedText className="row-title">A very long conversation title that overflows</TruncatedText>
    </div>,
  );
  assert.match(html, /<span[^>]*class="fui-truncated-text row-title"/);
  assert.match(html, /A very long conversation title that overflows/);
  assert.doesNotMatch(html, /fui-truncated-text-tooltip/);
});

test("settings section labels itself with its heading and description", () => {
  const html = renderToStaticMarkup(
    <SettingsSection
      description="Shown to other members."
      id="profile"
      status={<span>Saved</span>}
      title="Profile"
    >
      <input aria-label="Name" />
    </SettingsSection>,
  );
  assert.match(html, /<section id="profile" aria-labelledby="profile-heading" aria-describedby="profile-description"/);
  assert.match(html, /<h2 id="profile-heading" class="fui-settings-section-title">Profile<\/h2><span>Saved<\/span>/);
  assert.match(html, /<p id="profile-description"/);
  const generated = renderToStaticMarkup(
    <SettingsSection headingLevel={3} title="Danger zone">
      body
    </SettingsSection>,
  );
  const labelled = generated.match(/aria-labelledby="([^"]+)"/)?.[1];
  assert.ok(labelled);
  assert.match(generated, new RegExp(`<h3 id="${labelled.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"`));
  assert.doesNotMatch(generated, /aria-describedby/);
});

test("filter chip renders as a link or a remove button with an accessible name", () => {
  const link = renderToStaticMarkup(<FilterChip href="/files" label="Type" value="image/png" />);
  assert.match(link, /^<a /);
  assert.match(link, /href="\/files"/);
  assert.match(link, /aria-label="Clear type filter \(image\/png\)"/);
  assert.match(link, /Type:<\/span><span class="fui-filter-chip-value">image\/png/);

  const routed = renderToStaticMarkup(
    <FilterChip href="/chats" label="Owner" render={<a data-router="" />} value="Ada" />,
  );
  assert.match(routed, /data-router=""/);
  assert.match(routed, /href="\/chats"/);

  const button = renderToStaticMarkup(
    <FilterChip clearLabel="Remove owner" label="Owner" onRemove={() => undefined} value="Ada" />,
  );
  assert.match(button, /^<button type="button" class="fui-filter-chip" aria-label="Remove owner"/);
});

test("suggestion grid wraps each card in a list item", () => {
  const html = renderToStaticMarkup(
    <SuggestionGrid aria-label="Suggestions" columns={3}>
      <SuggestionCard description="Summarize the release notes" icon={<svg />} title="Summarize" />
      {null}
      <SuggestionCard disabled title="Plan" />
    </SuggestionGrid>,
  );
  assert.match(html, /<ul class="fui-suggestion-grid" style="--fui-suggestion-columns:3" aria-label="Suggestions">/);
  assert.equal(html.match(/<li class="fui-suggestion-grid-item">/g)?.length, 2);
  assert.match(html, /<span aria-hidden="true" class="fui-suggestion-card-icon">/);
  assert.match(html, /fui-suggestion-card-description">Summarize the release notes/);
  assert.match(html, /<button type="button" class="fui-suggestion-card" disabled="">/);
});

test("shimmer text is plain text with CSS variables for the sweep", () => {
  const html = renderToStaticMarkup(
    <ShimmerText as="span" duration={1.4}>
      Thinking
    </ShimmerText>,
  );
  assert.equal(
    html,
    '<span class="fui-shimmer-text" style="--fui-shimmer-spread:16px;--fui-shimmer-duration:1.4s">Thinking</span>',
  );
  assert.match(renderToStaticMarkup(<ShimmerText>Loading</ShimmerText>), /^<p /);
});

test("file thumb shows an image for image sources and a typed tile otherwise", () => {
  const image = renderToStaticMarkup(<FileThumb mime="image/png" src="/files/1" />);
  assert.match(image, /^<img src="\/files\/1" alt="" width="40" height="40" loading="lazy"/);
  const tile = renderToStaticMarkup(<FileThumb filename="report.final.pdf" mime="application/pdf" src="/files/2" />);
  assert.match(tile, /aria-hidden="true"/);
  assert.match(tile, /fui-file-thumb-ext">PDF</);
  const labelled = renderToStaticMarkup(<FileThumb alt="Archive" mime="application/zip" size={56} />);
  assert.match(labelled, /role="img" aria-label="Archive"/);
  assert.match(labelled, /--fui-file-thumb-size:56px/);
  assert.equal(fileTypeLabel(null, "application/vnd.ms-excel"), "VND");
  assert.equal(fileTypeLabel("notes", "text/markdown; charset=utf-8"), "MARK");
  assert.equal(fileTypeLabel(undefined, undefined), "FILE");
  assert.equal(fileTypeLabel("photo.JPEG", "image/jpeg"), "JPEG");
});
