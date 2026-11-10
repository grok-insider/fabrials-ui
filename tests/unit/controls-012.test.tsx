import { test } from "node:test";
import assert from "node:assert/strict";
import { renderToStaticMarkup } from "react-dom/server";
import {
  Alert,
  AlertDescription,
  AlertTitle,
  badgeVariants,
  ChartLegend,
  ColorRamp,
  countLevel,
  countMilestone,
  countText,
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldLabel,
  FieldSeparator,
  FieldTitle,
  Input,
  LegendItem,
  Slider,
  SliderGroup,
  Swatch,
  Tabs,
  TabsList,
  TabsTrigger,
  Textarea,
  Toggle,
  tabsListVariants,
  toggleVariants,
} from "../../packages/ui/src/index";
import { GenerationFrame } from "../../packages/ai-ui/src/index";
import { sliderDecimals } from "../../packages/ui/src/slider";
import { countLimit } from "../../packages/ui/src/field-count";
import { rampColors } from "../../packages/ui/src/chart";
import { uiStyles, aiStyles as aiSheet } from "./read-styles";

const styles = uiStyles();
const aiStyles = aiSheet();

/** The 0.12 block of a stylesheet, up to the next one: another package appends its own after it. */
function block(sheet: string, marker: string) {
  const start = sheet.indexOf(`/* ${marker}`);
  assert.ok(start >= 0, `the block "${marker}" is in the stylesheet`);
  const end = sheet.indexOf("\n@layer", start + 1);
  return sheet.slice(start, end === -1 ? sheet.length : end);
}

// ------------------------------------------------------------------ counting

test("characters are UTF-16 units, graphemes and words follow the language", () => {
  // The measure of `maxLength` and of a text engine's limit.
  assert.equal(countText("hello"), 5);
  assert.equal(countText("a".repeat(280)), 280);
  assert.equal(countText(""), 0);
  // A family of four joined by zero-width joiners: eleven units, one grapheme.
  const family = "\u{1F468}\u200D\u{1F469}\u200D\u{1F467}\u200D\u{1F466}";
  assert.equal(family.length, 11);
  assert.equal(countText(family), 11);
  assert.equal(countText(family, "graphemes"), 1);
  // A letter with its marks is one grapheme too.
  assert.equal(countText("حَرَكَة", "graphemes"), 4);
  assert.ok(countText("حَرَكَة", "characters") > 3);
  // Words, in English and in a script without spaces between them.
  assert.equal(countText("the quick brown fox", "words"), 4);
  assert.equal(countText("   ", "words"), 0);
  assert.ok(countText("今天的部署没有失败", "words") > 1);
  // A hard limit counts what a limit can stop; words and graphemes cannot be stopped by `maxLength`.
  assert.deepEqual(countLimit({ max: 12 }), { unit: "characters", max: 12, soft: true, maxLength: undefined });
  assert.deepEqual(countLimit({ max: 12, soft: false }), { unit: "characters", max: 12, soft: false, maxLength: 12 });
  assert.deepEqual(countLimit({ max: 12, soft: false, unit: "words" }), { unit: "words", max: 12, soft: false, maxLength: undefined });
  assert.deepEqual(countLimit(true), { unit: "characters", max: undefined, soft: true, maxLength: undefined });
  assert.equal(countLimit({ max: Number.POSITIVE_INFINITY }).max, undefined);
});

test("the plain count is what a browser without Intl.Segmenter gives", () => {
  // One run between spaces: the reason the segmenter's answer is the one to trust.
  assert.equal(countText("今天的部署没有失败", "words", "en", { segment: false }), 1);
  assert.equal(countText("the quick brown fox", "words", "en", { segment: false }), 4);
  // A dash is not a space: the plain count reads one run, which is why the segmenter's answer is the one to trust.
  assert.equal(countText("a—b", "words", "en", { segment: false }), 1);
  assert.equal(countText("  ...  ", "words", "en", { segment: false }), 0);
  assert.equal(countText("\u{1F468}\u200D\u{1F469}", "graphemes", "en", { segment: false }), 3);
});

test("a level is nine tenths, the last one allowed, and past it", () => {
  assert.equal(countLevel(0, 20), "under");
  assert.equal(countLevel(17, 20), "under");
  assert.equal(countLevel(18, 20), "near");
  assert.equal(countLevel(19, 20), "near");
  assert.equal(countLevel(20, 20), "at");
  assert.equal(countLevel(21, 20), "over");
  assert.equal(countLevel(3, undefined), "under");
  assert.equal(countLevel(3, 0), "under");
  assert.equal(countLevel(1, 1), "at");
});

test("a live region hears a crossing once, and hears the way back", () => {
  // Nothing is said on the first paint, or again on a keystroke that changes no line.
  assert.equal(countMilestone(undefined, "under"), undefined);
  assert.equal(countMilestone("under", "under"), undefined);
  assert.equal(countMilestone("near", "near"), undefined);
  assert.equal(countMilestone("over", "over"), undefined);
  // Each line said once: nine tenths, the last one, past it.
  assert.equal(countMilestone("under", "near"), "near");
  assert.equal(countMilestone("under", "at"), "at");
  assert.equal(countMilestone("near", "at"), "at");
  assert.equal(countMilestone("under", "over"), "over");
  assert.equal(countMilestone("near", "over"), "over");
  assert.equal(countMilestone("at", "over"), "over");
  // Deleting says nothing until the text is under the limit again, and then it says that.
  assert.equal(countMilestone("at", "near"), undefined);
  assert.equal(countMilestone("near", "under"), undefined);
  assert.equal(countMilestone("over", "under"), "back");
  assert.equal(countMilestone("over", "at"), "back");
  assert.equal(countMilestone("over", "near"), "back");
});

// ------------------------------------------------------------------ slider

test("a slider's decimals come from its step", () => {
  assert.equal(sliderDecimals(1), 0);
  assert.equal(sliderDecimals(5), 0);
  assert.equal(sliderDecimals(0.1), 1);
  assert.equal(sliderDecimals(0.25), 2);
  assert.equal(sliderDecimals(0.05), 2);
  assert.equal(sliderDecimals(0.001), 3);
  assert.equal(sliderDecimals(0), 0);
  assert.equal(sliderDecimals(Number.NaN), 0);
  // What the value is written with: two decimals, as the step says, and the unit after it.
  const html = renderToStaticMarkup(<Slider defaultValue={0.35} label="Opacity" max={1} min={0} step={0.05} />);
  assert.match(html, /<span class="fui-slider-label" id="[^"]+">Opacity<\/span>/);
  assert.match(html, /<output[^>]*aria-hidden="true" class="fui-slider-value">0.35<\/output>/);
});

test("a slider without a label draws what it always drew", () => {
  const html = renderToStaticMarkup(<Slider aria-label="Size" defaultValue={40} />);
  assert.doesNotMatch(html, /fui-slider-label|fui-slider-value|data-label/);
  assert.match(html, /aria-label="Size"/);
  const labelled = renderToStaticMarkup(<Slider defaultValue={40} label="Size" step={5} unit="rows" />);
  // The name is the thumb's, and the unit is in what a screen reader hears and in what is drawn.
  assert.match(labelled, /aria-labelledby="[^"]+-label"/);
  assert.match(labelled, /aria-valuetext="40 rows"/);
  assert.match(labelled, /aria-hidden="true" class="fui-slider-value">40 rows</);
});

test("a group of sliders is one grid of rows", () => {
  const html = renderToStaticMarkup(
    <SliderGroup>
      <Slider label="Rows" max={48} min={4} unit="rows" defaultValue={12} />
      <Slider label="Columns" max={12} min={1} unit="cols" defaultValue={4} />
    </SliderGroup>,
  );
  assert.match(html, /^<div class="fui-slider-group-wrap"><div class="fui-slider-group">/);
  assert.equal(html.match(/class="fui-slider" data-label=""/g)?.length ?? 0, 0);
  assert.equal(html.match(/data-label=""/g)?.length, 2);
  const auto = renderToStaticMarkup(<SliderGroup columns="auto"><Slider label="Rows" defaultValue={1} /></SliderGroup>);
  assert.match(auto, /<div class="fui-slider-group" data-columns="auto">/);
  const css = block(styles, "0.12: what a notice, a count");
  assert.match(css, /\.fui-slider-group \{\s*display: grid;\s*grid-template-columns: auto minmax\(0, 1fr\) auto;/);
  assert.match(css, /@supports \(grid-template-columns: subgrid\) \{\s*\.fui-slider-group > \.fui-slider \{\s*grid-template-columns: subgrid;/);
  assert.match(css, /@container fui-slider-group \(max-width: 28rem\) \{/);
  assert.match(css, /\.fui-slider-group\[data-columns="auto"\] \{\s*grid-template-columns: repeat\(auto-fit, minmax\(14rem, 1fr\)\);/);
  assert.match(styles, /\.fui-slider-group-wrap \{\s*container: fui-slider-group \/ inline-size;/);
  // A disabled slider dims its track, not its words: 50 % of the muted ink is under the contrast a value keeps.
  assert.match(styles, /\.fui-slider\[data-disabled\] \.fui-slider-control \{\s*opacity: 0\.5;/);
  assert.doesNotMatch(styles, /\.fui-slider\[data-disabled\] \{\s*opacity: 0\.5;/);
});

// ------------------------------------------------------------------ classes and shapes

test("the variants helpers return the classes the components render", () => {
  const toggle = renderToStaticMarkup(<Toggle aria-label="Bold" size="sm" variant="outline" />);
  assert.match(toggle, new RegExp(`class="${toggleVariants({ variant: "outline", size: "sm" })}"`));
  assert.equal(toggleVariants({ variant: "outline", size: "sm" }), "fui-toggle fui-toggle-outline fui-toggle-size-sm");
  assert.equal(toggleVariants({}), "fui-toggle fui-toggle-default");
  // `plain` keeps no look of its own: the composer's pill is one, and its classes are its own.
  assert.equal(toggleVariants({ variant: "plain", className: "fui-composer-pill" }), "fui-composer-pill");
  const list = renderToStaticMarkup(
    <Tabs defaultValue="a">
      <TabsList variant="segmented">
        <TabsTrigger value="a">A</TabsTrigger>
      </TabsList>
    </Tabs>,
  );
  assert.match(list, new RegExp(`class="${tabsListVariants({ variant: "segmented" })}"`));
  assert.equal(tabsListVariants({ variant: "segmented" }), "fui-tabs-list fui-tabs-list-segmented");
  assert.equal(tabsListVariants({}), "fui-tabs-list");
  // A Badge keeps its own class and its attributes: the hooks are for a tag that cannot be one, and are guarded so they never
  // reach a Badge.
  assert.equal(badgeVariants({ variant: "outline", tone: "warning", size: "lg" }), "fui-badge fui-badge-tone-warning fui-badge-outline fui-badge-size-lg");
  assert.equal(badgeVariants({}), "fui-badge fui-badge-tone-neutral fui-badge-soft");
  const css = block(styles, "0.12: what a notice, a count");
  for (const hook of [".fui-badge-outline:not([data-variant])", ".fui-badge-solid:not([data-variant])", ".fui-badge-size-lg:not([data-size])", ".fui-badge-tone-danger:not([data-tone])", ".fui-tabs-list-segmented:not([data-variant])"]) {
    assert.ok(css.includes(hook), `${hook} is in the block`);
  }
});

test("a key that stays on says whether it is pressed, and can look like anything", () => {
  const off = renderToStaticMarkup(<Toggle aria-label="Bold" variant="outline" />);
  assert.match(off, /^<button type="button" tabindex="0" aria-pressed="false" data-slot="toggle" aria-label="Bold" class="fui-toggle fui-toggle-outline"><\/button>$/);
  const on = renderToStaticMarkup(<Toggle aria-label="Bold" defaultPressed variant="plain" className="fui-composer-pill" data-state="on" />);
  assert.match(on, /aria-pressed="true"/);
  assert.match(on, /data-pressed=""/);
  assert.match(on, /class="fui-composer-pill"/);
  assert.match(on, /data-state="on"/);
});

// ------------------------------------------------------------------ alert

test("a notice asks again with a promise, or says it cannot", () => {
  const plain = renderToStaticMarkup(
    <Alert>
      <AlertTitle>Title</AlertTitle>
      <AlertDescription>Body</AlertDescription>
    </Alert>,
  );
  assert.equal(plain, '<div role="status" data-slot="alert" data-variant="default" class="fui-alert"><div class="fui-alert-title">Title</div><div class="fui-description fui-alert-description">Body</div></div>');
  const retry = renderToStaticMarkup(
    <Alert onRetry={() => undefined} variant="warning">
      <AlertTitle>Title</AlertTitle>
    </Alert>,
  );
  assert.match(retry, /<div class="fui-actions fui-alert-action"><button type="button" tabindex="0" data-slot="button" data-variant="outline" data-size="sm" class="fui-button">Try again<\/button><\/div>/);
  const words = renderToStaticMarkup(
    <Alert labels={{ retry: "Intentar de nuevo" }} onRetry={() => undefined}>
      <AlertTitle>Title</AlertTitle>
    </Alert>,
  );
  assert.match(words, />Intentar de nuevo</);
  // A failure that repeating cannot help has no retry to offer.
  const final = renderToStaticMarkup(
    <Alert tone="danger">
      <AlertTitle>Title</AlertTitle>
    </Alert>,
  );
  assert.doesNotMatch(final, /fui-alert-action/);
});

test("a tone is a variant under the name 0.12 gives a status, and it wins", () => {
  const looks = (["neutral", "info", "success", "warning", "danger"] as const).map((tone) =>
    renderToStaticMarkup(<Alert tone={tone}>Body</Alert>),
  );
  assert.deepEqual(
    looks.map((html) => /data-variant="([^"]+)"/.exec(html)![1]),
    ["default", "info", "success", "warning", "destructive"],
  );
  assert.deepEqual(
    looks.map((html) => /role="([^"]+)"/.exec(html)![1]),
    ["status", "status", "status", "status", "alert"],
  );
  const both = renderToStaticMarkup(<Alert tone="info" variant="warning">Body</Alert>);
  assert.match(both, /data-variant="info"/);
  assert.match(both, /data-tone="info"/);
  // An alert with no tone carries no tone attribute: what a host puts there is its own.
  assert.doesNotMatch(renderToStaticMarkup(<Alert variant="info">Body</Alert>), /data-tone/);
  const css = block(styles, "0.12: what a notice, a count");
  assert.match(css, /\.fui-alert\[data-reveal\] \{\s*scroll-margin-block-start: calc\(var\(--fui-header-height, 0px\) \+ var\(--fui-space-3\)\);\s*scroll-margin-block-end: calc\(var\(--fui-action-bar-size, 0px\) \+ var\(--fui-keyboard-inset, 0px\) \+ var\(--fui-space-3\)\);/);
});

// ------------------------------------------------------------------ fields and counts

test("a count is a row under the field, named by it", () => {
  assert.equal(renderToStaticMarkup(<Input id="a" placeholder="Hi" />), '<input class="fui-input" id="a" placeholder="Hi"/>');
  assert.equal(renderToStaticMarkup(<Textarea id="t" rows={2} />), '<textarea class="fui-input fui-textarea" id="t" rows="2"></textarea>');
  const counted = renderToStaticMarkup(<Input count={{ max: 10 }} defaultValue="hello" id="a" />);
  assert.match(counted, /^<div class="fui-count-field"><input class="fui-input" id="a" aria-describedby="a-count" value="hello"\/>/);
  assert.match(counted, /<span class="fui-count" data-level="under" data-unit="characters" id="a-count"><span class="fui-count-value">5 \/ 10<\/span><\/span>/);
  // The region is always in the page: a region added the moment it speaks is not read.
  assert.match(counted, /<span class="fui-sr-only" data-slot="count-live" aria-live="polite" role="status"><\/span><\/div>$/);
  // The field's own description comes first, and the counter is added to it.
  const both = renderToStaticMarkup(<Textarea aria-describedby="hint" count={true} defaultValue="" />);
  assert.match(both, /aria-describedby="hint (_R_[^"]+|-?[^"]*count)"/);
  // Past the limit the counter says it in words, not in colour alone.
  const over = renderToStaticMarkup(<Input count={{ max: 3 }} defaultValue="abcdefgh" />);
  assert.match(over, /data-level="over"/);
  assert.match(over, /<span class="fui-count-over">5 over<\/span>/);
  // A hard limit is a `maxlength`, and only a count of characters can be one.
  const hard = renderToStaticMarkup(<Input count={{ max: 12, soft: false }} />);
  assert.match(hard, /maxLength="12"/);
  const words = renderToStaticMarkup(<Textarea count={{ max: 12, soft: false, unit: "words" }} />);
  assert.doesNotMatch(words, /maxlength/);
  // `true` is a bare counter.
  const bare = renderToStaticMarkup(<Textarea count={true} defaultValue="four" />);
  assert.match(bare, /<span class="fui-count-value">4<\/span>/);
  const css = block(styles, "0.12: what a notice, a count");
  assert.match(css, /\.fui-count \{[^}]*color: var\(--muted-foreground\);[^}]*font-family: var\(--fui-font-label\);/);
  assert.match(css, /\.fui-count-over \{\s*color: var\(--fui-danger-ink\);/);
  assert.match(css, /\.fui-count-field:has\(\.fui-count\[data-level="over"\]\) \.fui-input \{\s*border-color: color-mix\(in oklab, var\(--destructive\) 55%, var\(--fui-control-border\)\);/);
});

test("a field marks what it needs, and its parts draw the same plate", () => {
  const plain = renderToStaticMarkup(<Field id="name" label="Name">{(props) => <Input {...props} />}</Field>);
  assert.equal(plain, '<div class="fui-field"><label class="fui-label" for="name">Name</label><input class="fui-input" id="name"/></div>');
  const required = renderToStaticMarkup(
    <Field id="name" label="Name" required>
      {(props) => <Input {...props} />}
    </Field>,
  );
  assert.match(required, /Name<span aria-hidden="true" class="fui-field-required">\*<\/span><span class="fui-sr-only">required<\/span><\/label>/);
  const optional = renderToStaticMarkup(
    <Field id="name" label="Name" optional>
      {(props) => <Input {...props} />}
    </Field>,
  );
  assert.match(optional, /Name<span class="fui-field-optional">optional<\/span><\/label>/);
  // Required wins when both are given, and the words are the host's.
  const both = renderToStaticMarkup(
    <Field id="name" label="Name" labels={{ required: "obligatoire", optional: "facultatif" }} optional required>
      {(props) => <Input {...props} />}
    </Field>,
  );
  assert.match(both, />obligatoire<\/span>/);
  assert.doesNotMatch(both, /facultatif/);
  // The root takes a class, and a field whose parts are written out keeps the same plate.
  assert.match(renderToStaticMarkup(<Field className="host" label="Name">{(props) => <Input {...props} />}</Field>), /^<div class="fui-field host">/);
  const parts = renderToStaticMarkup(
    <Field id="parts">
      <FieldLabel required>Work email</FieldLabel>
      <FieldContent>
        <Input id="parts" />
        <FieldDescription>Only when a deployment fails.</FieldDescription>
      </FieldContent>
      <FieldError>Not reachable.</FieldError>
    </Field>,
  );
  assert.match(parts, /^<div class="fui-field" data-slot="field"><label class="fui-label fui-field-label" for="parts">Work email<span aria-hidden="true" class="fui-field-required">\*<\/span>/);
  assert.match(parts, /<div class="fui-field-content"><input class="fui-input" id="parts"\/><p class="fui-description fui-field-description" id="parts-description">Only when a deployment fails.<\/p><\/div>/);
  assert.match(parts, /<p class="fui-field-error" id="parts-error" role="alert">Not reachable.<\/p>/);
  // A title is a label that is not a form label; a separator is a line that can hold a word.
  assert.match(renderToStaticMarkup(<FieldTitle>Deploy key</FieldTitle>), /^<div class="fui-label fui-field-title">Deploy key<\/div>$/);
  const separator = renderToStaticMarkup(<FieldSeparator>or</FieldSeparator>);
  assert.match(separator, /^<div class="fui-field-separator" data-slot="field-separator" role="none"><span class="fui-field-separator-word">or<\/span><\/div>$/);
  assert.match(renderToStaticMarkup(<FieldSeparator />), /^<div class="fui-field-separator" data-slot="field-separator" role="none"><\/div>$/);
  const css = block(styles, "0.12: what a notice, a count");
  assert.match(css, /\.fui-field-separator:not\(:has\(\.fui-field-separator-word\)\) \{\s*gap: 0;/);
  assert.match(css, /\.fui-field-optional \{\s*margin-inline-start: var\(--fui-space-1-5\);\s*color: var\(--muted-foreground\);/);
});

// ------------------------------------------------------------------ chart

test("a legend is the chart's own rows, or a host's beside its visual", () => {
  const legend = renderToStaticMarkup(
    <ChartLegend>
      <LegendItem color="var(--chart-1)" label="Requests" />
      <LegendItem color="var(--chart-2)" hidden label="P95" onOnly={() => undefined} onToggle={() => undefined} />
    </ChartLegend>,
  );
  assert.match(legend, /^<div class="fui-chart-legend"><span class="fui-chart-legend-item"><span class="fui-chart-legend-static"><span aria-hidden="true" class="fui-chart-swatch" style="background:var\(--chart-1\)"><\/span><span>Requests<\/span><\/span><\/span>/);
  assert.match(legend, /<button type="button" aria-pressed="false" aria-label="Show P95" class="fui-chart-legend-toggle">/);
  assert.match(legend, /<span data-hidden="">P95<\/span>/);
  assert.match(legend, /<button type="button" aria-label="Show only P95" class="fui-chart-legend-only">Only<\/button>/);
  // Keys: a solid square, a dashed rule, or the dither in SVG cells (no data URI: a `url()` cannot read a token).
  assert.match(renderToStaticMarkup(<Swatch color="var(--chart-1)" />), /^<span aria-hidden="true" class="fui-chart-swatch" style="background:var\(--chart-1\)"><\/span>$/);
  assert.match(renderToStaticMarkup(<Swatch color="var(--destructive)" pattern="dashed" />), /data-pattern="dashed"/);
  const dither = renderToStaticMarkup(<Swatch color="var(--brand)" pattern="dither" />);
  assert.match(dither, /<pattern id="fui-swatch-[^"]+" width="4" height="4" patternUnits="userSpaceOnUse">/);
  assert.match(dither, /<rect width="2" height="2" fill="var\(--brand\)"><\/rect><rect x="2" y="2" width="2" height="2" fill="var\(--brand\)"><\/rect>/);
  assert.match(dither, /<rect width="10" height="10" fill="url\(#fui-swatch-[^"]+\)"><\/rect>/);
  // A paint the chart itself defines is drawn as it is, so a legend beside a chart matches the series.
  assert.match(renderToStaticMarkup(<Swatch color="url(#fui-dither-1-a)" />), /<rect width="10" height="10" fill="url\(#fui-dither-1-a\)"><\/rect>/);
  const css = block(styles, "0.12: what a notice, a count");
  assert.match(css, /\.fui-chart-swatch\[data-pattern="dashed"\] \{\s*align-self: center;\s*block-size: 0;\s*border-block-start: 2px dashed currentColor;/);
});

test("a ramp is painted in cells sampled from its stops, not in a gradient", () => {
  assert.equal(rampColors(["a", "b"], 3).length, 3);
  assert.deepEqual(rampColors(["a"], 4), ["a", "a", "a", "a"]);
  assert.deepEqual(rampColors(["a", "b"], 2), ["a", "b"]);
  assert.equal(rampColors(["a", "b"], 3)[1], "color-mix(in oklab, a 50%, b)");
  // Eight to twelve cells at most, and never fewer than two.
  assert.equal(rampColors(["a", "b"], 40).length, 12);
  assert.equal(rampColors(["a", "b"], 1).length, 2);
  assert.deepEqual(rampColors([], 10), []);
  const ramp = renderToStaticMarkup(
    <ColorRamp label="Rate" marks={[{ label: "half", value: 50 }]} max={100} min={0} steps={4} stops={["var(--chart-1)", "var(--chart-2)"]} />,
  );
  assert.match(ramp, /<span class="fui-color-ramp-label">Rate<\/span>/);
  assert.match(ramp, /<span aria-hidden="true" class="fui-color-ramp-bar" data-cells="4">/);
  assert.match(ramp, /<span class="fui-color-ramp-mark" style="--fui-ramp-mark:50%"><span class="fui-color-ramp-mark-label">half<\/span><\/span>/);
  // The bar is decoration; the words say what it stands for.
  assert.match(ramp, /<span class="fui-sr-only">from 0 to 100<\/span>/);
  const rtl = renderToStaticMarkup(
    <ColorRamp aria-hidden={undefined} labels={{ range: (min, max) => `من ${min} إلى ${max}` }} max={1} min={0} stops={["var(--brand)"]} />,
  );
  assert.match(rtl, /من 0 إلى 1/);
  const css = block(styles, "0.12: what a notice, a count");
  assert.match(css, /\.fui-color-ramp-bar > span \{\s*flex: 1 1 0;/);
  assert.match(css, /@media \(forced-colors: active\) \{[\s\S]*?\.fui-color-ramp-bar > span,\s*\.fui-color-ramp-mark \{\s*forced-color-adjust: none;/);
});

// ------------------------------------------------------------------ what a finished picture offers

test("a finished picture offers keys over it, plays a video, and opens", () => {
  const actions = renderToStaticMarkup(<GenerationFrame actions={["download", "copy"]} alt="A harbour" downloadName="harbour.png" src="/harbour.png" status="done" />);
  const frame = actions.slice(actions.indexOf("<figure"));
  assert.match(frame, /<img alt="A harbour" class="fui-generation-image" decoding="async" src="\/harbour.png"\/><div class="fui-generation-actions">/);
  assert.match(frame, /<a aria-label="Download" class="fui-generation-action" download="harbour.png" href="\/harbour.png" rel="noopener">/);
  // No clipboard in a server render, and no copy key: it appears where the browser has one.
  assert.doesNotMatch(frame, /aria-label="Copy the picture"/);
  const video = renderToStaticMarkup(<GenerationFrame alt="A film" kind="video" poster="/p.png" src="/v.mp4" status="done" />);
  assert.match(video, /<figure class="fui-generation" data-kind="video" data-status="done"/);
  assert.match(video, /<video aria-label="A film" class="fui-generation-video" controls="" playsInline="" poster="\/p.png" preload="metadata" src="\/v.mp4">/);
  assert.match(video, /role="status">Video ready</);
  assert.match(
    renderToStaticMarkup(<GenerationFrame alt="A film" kind="video" src="/v.mp4" status="generating" />),
    /class="fui-generation-words">Making the video</,
  );
  const open = renderToStaticMarkup(<GenerationFrame alt="A harbour" onOpen={() => undefined} src="/h.png" status="done" />);
  assert.match(open, /<button aria-label="Open" class="fui-generation-open" type="button"><img alt="A harbour"/);
  // The prompt shows while it works, cut to two lines and in its own direction.
  const prompt = renderToStaticMarkup(<GenerationFrame alt="A harbour" prompt="a harbour at dusk" progress={0.4} showPrompt status="generating" />);
  assert.match(prompt, /<p class="fui-generation-prompt" dir="auto">a harbour at dusk<\/p>/);
  assert.doesNotMatch(renderToStaticMarkup(<GenerationFrame alt="A harbour" prompt="a harbour at dusk" status="generating" />), /fui-generation-prompt/);
  // Nothing of this reaches a frame that was given none of it.
  const plain = renderToStaticMarkup(<GenerationFrame alt="A harbour" status="generating" />);
  assert.doesNotMatch(plain, /fui-generation-actions|fui-generation-prompt|fui-generation-open/);
  const css = block(aiStyles, "0.12: what a finished picture offers");
  assert.match(css, /\.fui-generation-actions \{[^}]*opacity: 0;/);
  assert.match(css, /@media \(hover: hover\) and \(pointer: fine\) \{\s*\.fui-generation-frame:hover \.fui-generation-actions \{\s*opacity: 1;/);
  assert.match(css, /\.fui-generation-frame:focus-within \.fui-generation-actions \{\s*opacity: 1;/);
  assert.match(css, /@media \(hover: none\) \{\s*\.fui-generation-actions \{\s*opacity: 1;/);
  assert.match(css, /@media \(pointer: coarse\) \{\s*\.fui-generation-action \{\s*inline-size: 2\.75rem;/);
  assert.match(css, /-webkit-line-clamp: 2;/);
});
