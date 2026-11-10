import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { ActivityStrip, activityLevel } from "../../packages/ui/src/activity-strip";
import { Alert, AlertDescription, AlertTitle } from "../../packages/ui/src/alert";
import { avatarInitials, avatarTint } from "../../packages/ui/src/avatar-initials";
import { Card, CardContent, CardHeader, CardTitle } from "../../packages/ui/src/card";
import { firstDayOfWeek, isSameDay, matchesDate, parseISODate, toISODate } from "../../packages/ui/src/dates";
import { DescriptionDetails, DescriptionItem, DescriptionList, DescriptionTerm } from "../../packages/ui/src/description-list";
import { acceptsFile, sortFiles } from "../../packages/ui/src/file-accept";
import { fileTypeLabel, formatAbsoluteTime, formatBytes, formatRelativeTime } from "../../packages/ui/src/format";
import { Kbd, KbdGroup } from "../../packages/ui/src/kbd";
import { placeholderList, placeholderText } from "../../packages/ui/src/placeholder";
import { groupByRecency } from "../../packages/ui/src/recency";
import { Separator } from "../../packages/ui/src/separator";
import { Skeleton } from "../../packages/ui/src/skeleton";
import { StatGroup } from "../../packages/ui/src/stat-group";
import { StatusDot } from "../../packages/ui/src/status-dot";
import { Timeline, TimelineItem } from "../../packages/ui/src/timeline";
import * as ui from "../../packages/ui/src/index";
import * as chat from "../../packages/ai-ui/src/format";
import * as ai from "../../packages/ai-ui/src/index";

// Each module here is imported by its own path, the way a Server Component reaches it through the built index: none may
// carry the directive (tests/unit/client-boundaries.test.ts proves the build keeps them that way).
const plain = (pkg: string, file: string) =>
  assert.doesNotMatch(readFileSync(new URL(`../../packages/${pkg}/src/${file}`, import.meta.url), "utf8"), /^\s*["']use client["']/m, `${pkg}/${file}`);

test("the modules of the pure helpers and the hook-free components carry no directive", () => {
  for (const file of [
    "format.ts",
    "avatar-initials.ts",
    "dates.ts",
    "file-accept.ts",
    "placeholder.ts",
    "recency.ts",
    "theme.ts",
    "language-marks.ts",
    "media-logic.ts",
    "card.tsx",
    "alert.tsx",
    "separator.tsx",
    "skeleton.tsx",
    "stat-group.tsx",
    "status-dot.tsx",
    "description-list.tsx",
    "kbd.tsx",
    "timeline.tsx",
    "activity-strip.tsx",
    "file-size.tsx",
    "index.ts",
  ])
    plain("ui", file);
  for (const file of ["format.ts", "reset-expiry.ts", "provider-icon-data.ts", "contracts.ts", "index.tsx"]) plain("ai-ui", file);
});

// Intl separates a number from its unit with a no-break space in some locales.
const spaced = (text: string) => text.replace(/\s/g, " ");

test("formatBytes steps by 1024 with the locale's digits and unit labels, and refuses a count that is not one", () => {
  assert.equal(formatBytes("en", 0), "0 B");
  assert.equal(formatBytes("en", 812), "812 B");
  assert.equal(formatBytes("en", 1536), "1.5 kB");
  assert.equal(formatBytes("en", 26_214_400), "25 MB");
  assert.equal(spaced(formatBytes("es", 2_516_582)), "2,4 MB");
  assert.equal(spaced(formatBytes("en", 1024 ** 5)), "1,024 TB");
  assert.throws(() => formatBytes("en", -1), RangeError);
  assert.throws(() => formatBytes("en", Number.NaN), RangeError);
});

test("formatRelativeTime reads the clock it is given, in the locale, and turns into a date when far", () => {
  const now = Date.UTC(2026, 10, 10, 12, 0, 0);
  assert.equal(formatRelativeTime(now - 10_000, now, "en"), "now");
  assert.equal(formatRelativeTime(now - 180_000, now, "en"), "3 minutes ago");
  assert.equal(formatRelativeTime(now - 180_000, now, "es"), "hace 3 minutos");
  assert.equal(formatRelativeTime(now - 86_400_000, now, "en"), "yesterday");
  assert.equal(formatRelativeTime(new Date(now + 2 * 3_600_000).toISOString(), now, "en"), "in 2 hours");
  assert.equal(formatRelativeTime(now - 40 * 86_400_000, now, "en", { timeZone: "UTC" }), "Oct 1, 2026");
  assert.equal(formatRelativeTime(now - 3 * 86_400_000, now, "en", { absoluteAfterDays: 2, timeZone: "UTC" }), "Nov 7, 2026");
  assert.equal(formatRelativeTime("not a date", now, "en"), "");
});

test("formatAbsoluteTime prints a date with fixed options or with options picked from the clock it is given", () => {
  const now = Date.UTC(2026, 10, 10, 12, 0, 0);
  assert.equal(formatAbsoluteTime(now, "en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }, { timeZone: "UTC" }), "10 Nov, 12:00");
  const sameInstant = (date: Date, at: number): Intl.DateTimeFormatOptions => (date.getTime() === at ? { timeStyle: "short" } : { dateStyle: "medium" });
  assert.equal(spaced(formatAbsoluteTime(now, "en", sameInstant, { now, timeZone: "UTC" })), "12:00 PM");
  assert.equal(formatAbsoluteTime(now - 86_400_000, "en", sameInstant, { now, timeZone: "UTC" }), "Nov 9, 2026");
  assert.equal(formatAbsoluteTime("not a date", "en", {}), "");
});

test("fileTypeLabel prefers the extension, falls back to the MIME subtype and never prints more than four letters", () => {
  assert.equal(fileTypeLabel("report.final.PDF"), "PDF");
  assert.equal(fileTypeLabel(null, "application/json; charset=utf-8"), "JSON");
  assert.equal(fileTypeLabel("archive", "image/svg+xml"), "SVG");
  assert.equal(fileTypeLabel("notes.jpeg"), "JPEG");
  assert.equal(fileTypeLabel(), "FILE");
});

test("avatarInitials and avatarTint give the same answer on the server and in the browser", () => {
  assert.equal(avatarInitials("Ada Lovelace"), "AL");
  assert.equal(avatarInitials("ada@example.org"), "A");
  assert.equal(avatarInitials("élodie de la tour"), "ÉT");
  assert.equal(avatarInitials("istanbul", "?", "tr"), "İ");
  // No locale is English: the same initials on a server and in a browser, whatever the runtime's language.
  assert.equal(avatarInitials("istanbul"), "I");
  assert.equal(avatarInitials("   "), "?");
  assert.equal(avatarInitials("", "–"), "–");
  assert.equal(avatarTint("AL"), 3);
  assert.equal(avatarTint(" al "), avatarTint("AL"));
  assert.notEqual(avatarTint("GH"), avatarTint("AL"));
  for (const text of ["", "A", "ZZ", "é", "山田"]) assert.ok([1, 2, 3, 4, 5].includes(avatarTint(text)));
});

test("the date helpers are local calendar days", () => {
  assert.equal(toISODate(new Date(2026, 0, 5)), "2026-01-05");
  assert.equal(toISODate(parseISODate("2026-11-10")!), "2026-11-10");
  assert.equal(parseISODate("2026-02-30"), undefined);
  assert.equal(parseISODate("10/11/2026"), undefined);
  assert.equal(parseISODate(null), undefined);
  assert.equal(isSameDay(new Date(2026, 0, 5, 1), new Date(2026, 0, 5, 23)), true);
  assert.equal(isSameDay(new Date(2026, 0, 5), new Date(2026, 0, 6)), false);
  assert.equal(isSameDay(new Date(2026, 0, 5), null), false);
  const day = new Date(2026, 10, 10);
  assert.equal(matchesDate(day, { before: new Date(2026, 10, 11) }), true);
  assert.equal(matchesDate(day, { after: new Date(2026, 10, 10) }), false);
  assert.equal(matchesDate(day, { from: new Date(2026, 10, 1), to: new Date(2026, 10, 10) }), true);
  assert.equal(matchesDate(day, { dayOfWeek: [day.getDay()] }), true);
  assert.equal(matchesDate(day, [false, (date) => date.getDate() === 10]), true);
  assert.equal(matchesDate(day, undefined), false);
  assert.equal(firstDayOfWeek("en-US"), 0);
  assert.equal(firstDayOfWeek("en-GB"), 1);
  assert.equal(firstDayOfWeek("not a locale"), 1);
});

test("acceptsFile and sortFiles apply a dropzone's rules to any list of files", () => {
  const pdf = new File(["x"], "Report.PDF", { type: "application/pdf" });
  const png = new File(["xx"], "photo.png", { type: "image/png" });
  const big = new File(["x".repeat(64)], "big.png", { type: "image/png" });
  assert.equal(acceptsFile(pdf, ".pdf"), true);
  assert.equal(acceptsFile(png, "image/*, .pdf"), true);
  assert.equal(acceptsFile(pdf, "image/*"), false);
  assert.equal(acceptsFile(pdf, undefined), true);
  const sorted = sortFiles([pdf, png, big, png], { accept: "image/*", maxSize: 16, maxFiles: 1 });
  assert.deepEqual(sorted.accepted, [png]);
  assert.deepEqual(
    sorted.rejected.map((rejection) => [rejection.file.name, rejection.reason]),
    [
      ["Report.PDF", "type"],
      ["big.png", "size"],
      ["photo.png", "count"],
    ],
  );
  assert.equal(sortFiles([png, pdf], { multiple: false }).accepted.length, 1);
});

test("placeholder data and recency groups are plain functions", () => {
  assert.equal(placeholderText(24), "xxxxx xxx xxxxxxx xxxx x");
  assert.equal(placeholderText(24, 3).length, 24);
  assert.equal(placeholderText(0), "");
  assert.deepEqual(placeholderList(3, (index) => index * 2), [0, 2, 4]);
  assert.deepEqual(placeholderList(-1, () => 1), []);
  const now = new Date(2026, 10, 10, 12);
  const groups = groupByRecency([{ id: "b", at: now.getTime() - 26 * 3_600_000 }, { id: "a", at: now.getTime() - 3_600_000 }], (item) => item.at, now);
  assert.deepEqual(groups.map((group) => [group.bucket, group.items.map((item) => item.id)]), [["today", ["a"]], ["yesterday", ["b"]]]);
  assert.deepEqual([activityLevel(0, 10), activityLevel(1, 10), activityLevel(10, 10), activityLevel(5, 0)], [0, 1, 4, 0]);
});

test("each helper is still exported from the module it used to live in and from the index, as the same function", async () => {
  const [fileSize, relativeTime, fileThumb, avatar, calendar, dropzone, loading] = await Promise.all([
    import("../../packages/ui/src/file-size"),
    import("../../packages/ui/src/relative-time"),
    import("../../packages/ui/src/file-thumb"),
    import("../../packages/ui/src/avatar"),
    import("../../packages/ui/src/calendar"),
    import("../../packages/ui/src/dropzone"),
    import("../../packages/ui/src/loading"),
  ]);
  assert.equal(fileSize.formatBytes, formatBytes);
  assert.equal(relativeTime.formatRelativeTime, formatRelativeTime);
  assert.equal(relativeTime.formatAbsoluteTime, formatAbsoluteTime);
  assert.equal(fileThumb.fileTypeLabel, fileTypeLabel);
  assert.equal(avatar.avatarInitials, avatarInitials);
  assert.equal(avatar.avatarTint, avatarTint);
  assert.equal(calendar.toISODate, toISODate);
  assert.equal(calendar.parseISODate, parseISODate);
  assert.equal(calendar.isSameDay, isSameDay);
  assert.equal(calendar.matchesDate, matchesDate);
  assert.equal(calendar.firstDayOfWeek, firstDayOfWeek);
  assert.equal(dropzone.acceptsFile, acceptsFile);
  assert.equal(dropzone.sortFiles, sortFiles);
  assert.equal(loading.placeholderText, placeholderText);
  assert.equal(loading.placeholderList, placeholderList);
  for (const [name, helper] of Object.entries({ formatBytes, formatRelativeTime, formatAbsoluteTime, fileTypeLabel, avatarInitials, avatarTint, toISODate, parseISODate, isSameDay, matchesDate, firstDayOfWeek, acceptsFile, sortFiles, placeholderText, placeholderList, groupByRecency, activityLevel }))
    assert.equal((ui as Record<string, unknown>)[name], helper, `index lost ${name}`);
  const display = await import("../../packages/ui/src/display");
  const data = await import("../../packages/ui/src/data");
  assert.equal(display.Card, Card);
  assert.equal(display.Alert, Alert);
  assert.equal(display.Separator, Separator);
  assert.equal(display.Skeleton, Skeleton);
  assert.equal(data.StatusDot, StatusDot);
  assert.equal(data.StatGroup, StatGroup);
  assert.equal(data.DescriptionList, DescriptionList);
  assert.equal(ui.Card, Card);
  assert.equal(ui.StatusDot, StatusDot);
});

test("the chat helpers are plain functions, still exported from where they were", async () => {
  assert.equal(chat.hostnameFromUrl("https://www.example.org/a/b?c=1"), "example.org");
  assert.equal(chat.hostnameFromUrl("not a url"), "not a url");
  assert.equal(chat.sourcePath("https://example.org/docs/a%20b/?q=1"), "/docs/a b/?q=1");
  assert.equal(chat.sourcePath("https://example.org/"), "");
  assert.deepEqual([999, 42_100, 200_000, 1_250_000, Number.NaN].map(chat.formatTokens), ["999", "42.1k", "200k", "1.3M", ""]);
  assert.equal(chat.codeFilename("TypeScript"), "snippet.ts");
  assert.equal(chat.codeFilename(undefined), "snippet.txt");
  assert.equal(chat.codeFilename("python", "main"), "main.py");
  assert.deepEqual(["image/png", "video/webm", "audio/ogg", "text/csv", "application/pdf", "font/woff2", undefined].map(chat.attachmentCategory), ["image", "video", "audio", "document", "document", "unknown", "unknown"]);
  const [citations, agent, codeBlock, attachments] = await Promise.all([
    import("../../packages/ai-ui/src/citations"),
    import("../../packages/ai-ui/src/agent"),
    import("../../packages/ai-ui/src/code-block"),
    import("../../packages/ai-ui/src/attachments"),
  ]);
  assert.equal(citations.hostnameFromUrl, chat.hostnameFromUrl);
  assert.equal(citations.sourcePath, chat.sourcePath);
  assert.equal(agent.formatTokens, chat.formatTokens);
  assert.equal(codeBlock.codeFilename, chat.codeFilename);
  assert.equal(attachments.attachmentCategory, chat.attachmentCategory);
  assert.equal(attachments.formatBytes, chat.formatBytes);
  for (const name of ["hostnameFromUrl", "sourcePath", "formatTokens", "codeFilename", "attachmentCategory", "formatBytes"] as const)
    assert.equal(ai[name], chat[name], `index lost ${name}`);
});

test("the chat formatBytes keeps its English text without a locale and is the generic one with a locale", () => {
  assert.equal(chat.formatBytes(undefined), "");
  assert.equal(chat.formatBytes(-1), "");
  assert.equal(chat.formatBytes(812), "812 B");
  assert.equal(chat.formatBytes(1536), "1.5 KB");
  assert.equal(chat.formatBytes(15_872), "16 KB");
  assert.equal(chat.formatBytes(26_214_400), "25 MB");
  assert.equal(chat.formatBytes(1536, "en"), formatBytes("en", 1536));
  assert.equal(chat.formatBytes(1536, "es"), formatBytes("es", 1536));
  assert.equal(chat.formatBytes(undefined, "es"), "");
  assert.equal(chat.formatBytes(Number.POSITIVE_INFINITY, "es"), "");
  assert.equal(ai.attachmentDetail({ id: "a", name: "report.pdf", mediaType: "application/pdf", size: 15_872 }), "PDF · 16 KB");
});

test("the hook-free components render from modules without the directive", () => {
  const card = renderToStaticMarkup(
    <Card interactive aria-label="Usage">
      <CardHeader>
        <CardTitle as="h3">Usage</CardTitle>
      </CardHeader>
      <CardContent>42</CardContent>
    </Card>,
  );
  assert.match(card, /^<section data-slot="card" data-interactive="true" class="fui-card" aria-label="Usage">/);
  assert.match(card, /<h3 data-slot="card-title" class="fui-card-title">Usage<\/h3>/);
  const alert = renderToStaticMarkup(
    <Alert variant="destructive">
      <AlertTitle>Sync failed</AlertTitle>
      <AlertDescription>Try again.</AlertDescription>
    </Alert>,
  );
  assert.match(alert, /^<div role="alert" data-slot="alert" data-variant="destructive" class="fui-alert">/);
  assert.match(renderToStaticMarkup(<Alert>Saved</Alert>), /role="status"/);
  assert.equal(renderToStaticMarkup(<Separator orientation="vertical" />), '<hr data-orientation="vertical" aria-orientation="vertical" class="fui-separator"/>');
  assert.equal(renderToStaticMarkup(<Skeleton className="w" />), '<div aria-hidden="true" class="fui-skeleton w"></div>');
  assert.match(renderToStaticMarkup(<StatusDot tone="success" label="Healthy" pulse />), /^<span data-slot="status" data-tone="success" data-pulse="true" class="fui-status"><span aria-hidden="true" class="fui-status-dot"><\/span><span class="fui-status-label">Healthy<\/span><\/span>$/);
  assert.match(renderToStaticMarkup(<StatusDot label="Idle" hideLabel />), /<span class="fui-sr-only">Idle<\/span>/);
  assert.equal(renderToStaticMarkup(<StatGroup className="x" />), '<div data-slot="stat-group" class="fui-stat-group x"></div>');
  assert.equal(
    renderToStaticMarkup(
      <DescriptionList layout="auto">
        <DescriptionItem>
          <DescriptionTerm>Plan</DescriptionTerm>
          <DescriptionDetails>Team</DescriptionDetails>
        </DescriptionItem>
      </DescriptionList>,
    ),
    '<dl data-layout="auto" class="fui-description-list"><div class="fui-description-item"><dt class="fui-description-term">Plan</dt><dd class="fui-description-details">Team</dd></div></dl>',
  );
  assert.match(
    renderToStaticMarkup(
      <KbdGroup sequence>
        <Kbd>g</Kbd>
        <Kbd>i</Kbd>
      </KbdGroup>,
    ),
    /<kbd class="fui-kbd">g<\/kbd><span class="fui-kbd-separator">then<\/span><kbd class="fui-kbd">i<\/kbd>/,
  );
  const timeline = renderToStaticMarkup(
    <Timeline>
      <TimelineItem title="Deployed" tone="success" time="09:41" />
    </Timeline>,
  );
  assert.match(timeline, /^<ol data-slot="timeline" class="fui-timeline"><li data-slot="timeline-item" data-tone="success" class="fui-timeline-item">/);
  // A Server Component can hand the strip its formatter, which a client component could not take across the boundary.
  const strip = renderToStaticMarkup(<ActivityStrip caption="Requests" cells={[{ label: "Mon", value: 5 }, { label: "Tue", value: 0 }]} formatValue={(value) => `${value} requests`} />);
  assert.match(strip, /title="Mon: 5 requests"/);
  assert.match(strip, /<td>0 requests<\/td>/);
});
