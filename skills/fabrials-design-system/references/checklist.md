# QA checklist

Run this before saying UI work is done. Report each item as checked, not applicable, or not tested (with the reason). "Looks fine" is not a result; a screenshot, a test run or a measured value is.

## 1. Rules

- [ ] The screen follows its recipe in `layout.md` (landing, index, docs, workspace, settings, sign-in, states).
- [ ] Components come from `@fabrials/ui` / `@fabrials/ai-ui` (or registry shims and blocks); no re-implemented control, no edited `vendor/` copy.
- [ ] The anti-slop checks in `style-rules.md` pass; run the `rg` scan on the changed files and review every hit.
- [ ] Only tokens: no literal colours, radii, shadows or font stacks in product code.
- [ ] Copy is sentence case, names destinations, and errors say what happened and what to do.
- [ ] Loading, empty, error, stale or offline, and long-content cases exist for every collection and panel you touched.
- [ ] Data in stories, previews, screenshots and tests is synthetic.

## 2. Look, in an isolated browser

Never resize or emulate a viewport in the owner's desktop browser window: it shrinks the page they are using. The owner's daily browser also runs Dark Reader, which recolours pages but not canvases, so dither and theme checks there are wrong anyway.

Use one of:

- The repository's visual suite: `bun run test:visual:container` (Storybook plus Playwright and axe in the pinned container; light and dark at 390, 768 and 1440 px).
- A headless Playwright run in the pinned container against a local server. Save as `shots/shoot.cjs`:

```js
const { chromium } = require("/pw/node_modules/playwright-core");
const url = process.env.URL ?? "http://127.0.0.1:3210/";
(async () => {
  const browser = await chromium.launch();
  for (const [width, height] of [[390, 844], [768, 1024], [1440, 900], [2560, 1315]])
    for (const colorScheme of ["light", "dark"]) {
      const context = await browser.newContext({ viewport: { width, height }, colorScheme, reducedMotion: "reduce" });
      const page = await context.newPage();
      await page.goto(url, { waitUntil: "networkidle" });
      await page.screenshot({ path: `/out/${width}-${colorScheme}.png`, fullPage: true });
      console.log(width, colorScheme, "no sideways scroll:", await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      await context.close();
    }
  await browser.close();
})();
```

```sh
docker run --rm --network host -e URL=http://127.0.0.1:3210/ \
  -v "$PWD/shots:/out" \
  -v "<design-system repo>/node_modules/.bun/playwright-core@1.58.2:/pw:ro" \
  mcr.microsoft.com/playwright:v1.58.2-noble@sha256:6446946a1d9fd62d9ae501312a2d76a43ee688542b21622056a372959b65d63d \
  node /out/shoot.cjs
```

  `colorScheme` only switches apps that follow the system theme; for an app that stores the choice, set the `dark` class on the root before the screenshot. Then open the PNGs and look at them.
- `agent-browser` or another clean headless context for quick looks.

Check each changed screen:

- [ ] Light and dark, both designed (not one inverted into the other).
- [ ] 390 x 844: one column, 16 px gutter, 44 px targets, menus in sheets, nothing clipped.
- [ ] 768 and 1440 px: layout switches where `layout.md` says.
- [ ] 2560 x 1315 at DPR 1 (the owner's screen): content still starts at the left gutter; no centred island, no stretched card rows, prose keeps its measure.
- [ ] No horizontal page scroll at any size (`scrollWidth <= innerWidth`); wide tables scroll inside their labelled region.
- [ ] Dither: text on the calm side or a solid surface; the canvas fades into the surface behind it in both themes; at most one `DitherBand`.
- [ ] 200 % text size: nothing overlaps or clips.

## 3. Behaviour

- [ ] Keyboard only: every action reachable with Tab, Enter, Space, arrows and Escape, in a sensible order; the skip link works in shells.
- [ ] Focus is visible (2 px Stormlight outline with offset) on every interactive element, including custom ones.
- [ ] Overlays trap focus, close on Escape and return focus to the trigger.
- [ ] Every control has an accessible name; icon buttons have `aria-label`; colour never carries meaning alone.
- [ ] axe (WCAG 2 A/AA, 2.1 AA) reports no violations in either theme. The visual suite runs it; for other pages use `@axe-core/playwright` in the same container.
- [ ] `prefers-reduced-motion: reduce`: reveals are skipped, loops stop, durations are 0, state changes still show.
- [ ] Buttons with async work show `loading` and cannot be pressed twice; failures stay visible where they happened.

## 4. Commands

In the design-system repository:

```sh
bun install --frozen-lockfile
bun run check                  # types, lint, unit tests, package build, site checks and tests
bun run test:visual:container  # visual and accessibility suite; update snapshots only for intended changes
bun run registry:build         # when registry sources, shims or upstream snapshots changed (tests fail if stale)
```

In a product, run its own checks from its `AGENTS.md`, and `bun run vendor <product> --check` (from the design-system repo) when the vendored copy should match the build.

A new public component or variant also needs a story, a keyboard test and a visual reference, and a public contract change needs a version bump and a note in `docs/migration-<version>.md`.

## 5. Headed tests on the owner's desktop

Only when native integration needs a real window (use the `syl` workflow for that):

- [ ] Inspect Hyprland workspaces first and use an empty one; do not move existing windows.
- [ ] Close every window you opened and return to the previous workspace, unless the owner has switched elsewhere.

## 6. Report

- What changed, with before/after screenshots for visible changes (both themes; the sizes you checked).
- The checks you ran and their results; what you did not test and why.
- Any conflict you found between the product's `DESIGN.md`, the design-system `DESIGN.md` and the code.
