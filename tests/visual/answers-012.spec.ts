// The answer and step pieces of 0.12 in a real browser: six references of the bench with axe, then what the keys do, what a
// screen reader is told and where things sit. Assertions read state and geometry, never pixels.
import { expect, test, type Locator, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const STORY = "/iframe.html?id=tests-answers-and-steps--pieces&viewMode=story";

// Storybook's own accessibility panel may be running axe in the same frame: wait for it rather than fail.
async function audit(page: Page) {
  for (let attempt = 0; ; attempt += 1) {
    try {
      return await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
    } catch (error) {
      if (!String(error).includes("Axe is already running") || attempt === 3) throw error;
      await page.waitForTimeout(200);
    }
  }
}

async function open(page: Page, theme = "light") {
  await page.goto(`${STORY}&globals=theme:${theme}`);
  await expect(page.locator("#storybook-root h1").first()).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
}

for (const theme of ["light", "dark"]) {
  for (const width of [390, 768, 1440]) {
    test(`answers ${theme} ${width}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 960 });
      await open(page, theme);
      await expect(page.locator("html")).toHaveClass(theme === "dark" ? /dark/ : /^(?!.*dark).*$/);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      const result = await audit(page);
      expect(result.violations).toEqual([]);
      await expect(page).toHaveScreenshot(`answers-${theme}-${width}.png`, { fullPage: true });
    });
  }
}

const evening = (page: Page) => page.getByRole("radiogroup", { name: "Which of these do you say in the evening?" });
const picked = (page: Page) => page.getByTestId("evening-value");

test("one answer: Space picks, the arrows move the pick and pass over the option that was ruled out", async ({ page }) => {
  await open(page);
  const group = evening(page);
  const option = (name: string) => group.getByRole("radio", { name });
  await expect(group.getByRole("radio")).toHaveCount(4);
  await option("Bonjour").focus();
  await expect(option("Bonjour")).toHaveAttribute("aria-checked", "false");
  await page.keyboard.press("Space");
  await expect(option("Bonjour")).toHaveAttribute("aria-checked", "true");
  await page.keyboard.press("ArrowDown");
  await expect(option("Bonsoir")).toBeFocused();
  await expect(option("Bonsoir")).toHaveAttribute("aria-checked", "true");
  // Merci was ruled out: it is announced as such, cannot be picked, and the arrows go past it.
  await expect(option("Merci")).toHaveAttribute("aria-disabled", "true");
  await expect(option("Merci")).toHaveAccessibleName(/Merci\s*, Ruled out/);
  await page.keyboard.press("ArrowDown");
  await expect(option("Salut")).toBeFocused();
  await expect(picked(page)).toHaveText("Picked: salut");
  await page.keyboard.press("ArrowDown");
  await expect(option("Bonjour")).toBeFocused();
  await page.keyboard.press("ArrowUp");
  await expect(option("Salut")).toBeFocused();
  await option("Merci").click({ force: true });
  await expect(picked(page)).toHaveText("Picked: salut");
  // The group is one tab stop: Tab leaves it.
  await page.keyboard.press("Tab");
  await expect(page.getByRole("textbox", { name: "Notes" })).toBeFocused();
});

test("a marker's key picks its option from the page and moves focus to it, but is a letter in a text field", async ({ page }) => {
  await open(page);
  const group = evening(page);
  const second = group.getByRole("radio", { name: "Bonsoir" });
  await expect(second).toHaveAttribute("aria-keyshortcuts", "B");
  await expect(second.locator(".fui-choice-marker")).toHaveText("B");
  await expect(second.locator(".fui-choice-marker")).toHaveAttribute("aria-hidden", "true");
  // The name is the answer itself, in its own language: no aria-label over it.
  await expect(second).not.toHaveAttribute("aria-label");
  await expect(second.locator('[lang="fr"]')).toHaveText("Bonsoir");

  await page.locator("body").press("b");
  await expect(second).toHaveAttribute("aria-checked", "true");
  await expect(second).toBeFocused();
  await expect(picked(page)).toHaveText("Picked: bonsoir");

  // The ruled-out option has no key.
  await expect(group.getByRole("radio", { name: /Merci/ })).not.toHaveAttribute("aria-keyshortcuts");
  await page.locator("body").press("c");
  await expect(picked(page)).toHaveText("Picked: bonsoir");
  // With a modifier it is the browser's or the host's.
  await page.keyboard.press("Control+a");
  await expect(picked(page)).toHaveText("Picked: bonsoir");

  const notes = page.getByRole("textbox", { name: "Notes" });
  await notes.focus();
  await page.keyboard.type("ad");
  await expect(notes).toHaveValue("ad");
  await expect(picked(page)).toHaveText("Picked: bonsoir");

  // A group without shortcuts does not answer to its numbers.
  const primes = page.getByRole("group", { name: "Which of these are prime?" });
  await page.locator("body").press("2");
  await expect(primes.getByRole("checkbox", { name: /^9/ })).toHaveAttribute("aria-checked", "false");
});

test("several answers: each is a checkbox described by its second line, ticked with Space", async ({ page }) => {
  await open(page);
  const primes = page.getByRole("group", { name: "Which of these are prime?" });
  const nine = primes.getByRole("checkbox", { name: "9", exact: true });
  await expect(nine).toHaveAccessibleDescription("Three times three.");
  await expect(nine.locator(".fui-choice-marker")).toHaveText("2");
  await nine.focus();
  await page.keyboard.press("Space");
  await expect(nine).toHaveAttribute("aria-checked", "true");
  await page.keyboard.press("Space");
  await expect(nine).toHaveAttribute("aria-checked", "false");
  await expect(primes.getByRole("checkbox", { name: "7", exact: true })).toHaveAttribute("aria-checked", "true");
});

test("after an answer the group can be read and focused but not changed, and each marked option says its verdict", async ({ page }) => {
  await open(page);
  const wrong = page.getByRole("radiogroup", { name: "Evening, answered wrong" });
  await expect(wrong).toHaveAttribute("aria-readonly", "true");
  const mine = wrong.getByRole("radio", { name: /^Bonjour/ });
  const right = wrong.getByRole("radio", { name: /^Bonsoir/ });
  await expect(mine).toHaveAccessibleName(/Bonjour\s*, Your answer, incorrect/);
  await expect(right).toHaveAccessibleName(/Bonsoir\s*, Correct answer/);
  await expect(wrong.getByRole("radio", { name: "Salut", exact: true })).toHaveCount(1);
  await expect(mine.locator("svg")).toHaveCount(1);
  await expect(right.locator("svg")).toHaveCount(1);
  await expect(mine).toHaveAttribute("data-result", "incorrect");
  await expect(right).toHaveAttribute("data-result", "missed");
  expect(await right.evaluate((node) => getComputedStyle(node).borderTopStyle)).toBe("dashed");

  await mine.focus();
  await expect(mine).toBeFocused();
  await page.keyboard.press("ArrowDown");
  await expect(right).toBeFocused();
  await page.keyboard.press("Space");
  await right.click();
  await expect(mine).toHaveAttribute("aria-checked", "true");
  await expect(right).toHaveAttribute("aria-checked", "false");

  const correct = page.getByRole("radiogroup", { name: "Evening, answered right" });
  await expect(correct.getByRole("radio", { name: /^Bonsoir/ })).toHaveAccessibleName(/Bonsoir\s*, Correct$/);

  const primes = page.getByRole("group", { name: "Primes, answered" });
  const nine = primes.getByRole("checkbox", { name: /^9/ });
  await expect(nine).toHaveAttribute("aria-readonly", "true");
  await expect(nine).toHaveAccessibleName(/9\s*, Your answer, incorrect/);
  await nine.click();
  await expect(nine).toHaveAttribute("aria-checked", "true");

  // The panel under the group is a polite status with the verdict in words and an icon.
  const panel = page.locator('[data-slot="choice-feedback"][data-tone="incorrect"]');
  await expect(panel).toHaveAttribute("role", "status");
  await expect(panel).toContainText("Not quite");
  await expect(panel.locator("svg")).toHaveCount(1);
});

test("forced colors: a right and a wrong answer differ by icon and by the style of their edge, in one system colour", async ({ page }) => {
  await page.emulateMedia({ forcedColors: "active" });
  await open(page);
  const primes = page.getByRole("group", { name: "Primes, answered" });
  const read = (option: Locator) =>
    option.evaluate((node) => {
      const style = getComputedStyle(node);
      return { style: style.borderTopStyle, color: style.borderTopColor, width: style.borderTopWidth, icon: node.querySelector("svg")?.getAttribute("class") ?? "" };
    });
  const correct = await read(primes.getByRole("checkbox", { name: /^7/ }));
  const incorrect = await read(primes.getByRole("checkbox", { name: /^9/ }));
  const missed = await read(primes.getByRole("checkbox", { name: /^13/ }));
  expect([correct.style, incorrect.style, missed.style]).toEqual(["solid", "double", "dashed"]);
  expect(incorrect.color).toBe(correct.color);
  expect(missed.color).toBe(correct.color);
  expect(correct.icon).toContain("circle-check");
  expect(incorrect.icon).toContain("circle-x");
  expect(correct.icon).not.toBe(incorrect.icon);
  // The edge is the system's text colour, not the theme's tone.
  const canvasText = await page.evaluate(() => {
    const probe = document.createElement("span");
    probe.style.color = "CanvasText";
    document.body.append(probe);
    const color = getComputedStyle(probe).color;
    probe.remove();
    return color;
  });
  expect(correct.color).toBe(canvasText);
  // A pick keeps a cue of its own: the keycap is filled in Highlight.
  const pick = evening(page).getByRole("radio", { name: "Bonjour" });
  await pick.click();
  const [fill, highlight] = await pick.locator(".fui-choice-marker").evaluate((node) => {
    const probe = document.createElement("span");
    probe.style.color = "Highlight";
    document.body.append(probe);
    const system = getComputedStyle(probe).color;
    probe.remove();
    return [getComputedStyle(node).backgroundColor, system];
  });
  expect(fill).toBe(highlight);
});

const card = (page: Page) => page.getByRole("article", { name: "Card 3 of 20" });

test("a card reveals once on Space, announces its answer and takes the focus", async ({ page }) => {
  await open(page);
  const hidden = card(page);
  const answer = hidden.locator(".fui-reveal-card-back");
  // The answer's region is there, polite and empty, before anything is revealed.
  await expect(answer).toHaveAttribute("aria-live", "polite");
  await expect(answer).toBeEmpty();
  const show = hidden.getByRole("button", { name: "Show answer" });
  await expect(show).toHaveAttribute("aria-keyshortcuts", "Space");
  await expect(show.locator("kbd")).toHaveAttribute("aria-hidden", "true");

  // Space in a field is a space.
  const notes = page.getByRole("textbox", { name: "Notes" });
  await notes.focus();
  await page.keyboard.press("Space");
  await expect(notes).toHaveValue(" ");
  await expect(answer).toBeEmpty();

  await hidden.focus();
  await page.keyboard.down("Space");
  await expect(answer).toHaveText("the lighthouse");
  // Holding the key repeats it: the card stays revealed and the page does not scroll under it.
  const scrolled = await page.evaluate(() => scrollY);
  await page.keyboard.down("Space");
  await page.keyboard.down("Space");
  await page.keyboard.up("Space");
  await expect(answer).toHaveText("the lighthouse");
  expect(await page.evaluate(() => scrollY)).toBe(scrolled);
  await expect(hidden).toHaveAttribute("data-revealed", "");
  await expect(hidden).toBeFocused();
  await expect(show).toHaveCount(0);

  // What follows the answer is there now: the ratings, here without keys. One click rates; a second rates nothing more.
  const bar = hidden.getByRole("group", { name: "How well did you know it?" });
  await expect(bar.getByRole("button")).toHaveCount(3);
  await expect(bar.locator("kbd")).toHaveCount(0);
  await bar.getByRole("button", { name: /Good/ }).click();
  await bar.getByRole("button", { name: /Hard/ }).click();
  await expect(page.getByTestId("ratings-hidden")).toHaveText("Ratings given: 1");
});

test("the reveal button reveals too, and focus goes to the card it leaves", async ({ page }) => {
  await open(page);
  const hidden = card(page);
  await hidden.getByRole("button", { name: "Show answer" }).click();
  await expect(hidden.locator(".fui-reveal-card-back")).toHaveText("the lighthouse");
  await expect(hidden).toBeFocused();
  // Space on another control is that control's; from the page itself it reveals.
  await open(page);
  const other = page.getByRole("toolbar", { name: "A pager" }).getByRole("button", { name: "Next step" });
  await other.focus();
  await page.keyboard.press("Space");
  await expect(card(page).locator(".fui-reveal-card-back")).toBeEmpty();
  await other.blur();
  await page.keyboard.press("Space");
  await expect(card(page).locator(".fui-reveal-card-back")).toHaveText("the lighthouse");
  await expect(card(page)).toBeFocused();
});

test("a rating's key rates once from anywhere but a field, and a second press before the next card rates nothing", async ({ page }) => {
  await open(page);
  const shown = page.getByRole("article", { name: "Card 4 of 20" });
  const bar = shown.getByRole("group", { name: "How well did you know it?" });
  const given = page.getByTestId("ratings-shown");
  const good = bar.getByRole("button", { name: /Good/ });
  await expect(good).toHaveAttribute("aria-keyshortcuts", "3");
  await expect(good.locator("kbd")).toHaveText("3");
  await expect(good.locator("kbd")).toHaveAttribute("aria-hidden", "true");
  await expect(good).toHaveAccessibleName("Good In 5 days");

  const notes = page.getByRole("textbox", { name: "Notes" });
  await notes.focus();
  await page.keyboard.type("3");
  await expect(notes).toHaveValue("3");
  await expect(given).toHaveText("Ratings given: 0");
  await notes.blur();

  // A key that is not a rating's does nothing; a held key is one press.
  await page.keyboard.press("4");
  await expect(given).toHaveText("Ratings given: 0");
  await page.keyboard.down("3");
  await page.keyboard.down("3");
  await page.keyboard.up("3");
  await expect(given).toHaveText("Ratings given: 1");
  await page.keyboard.press("3");
  await page.keyboard.press("1");
  await good.click();
  await expect(given).toHaveText("Ratings given: 1");
  // The hidden card's ratings were not there to take the key.
  await expect(page.getByTestId("ratings-hidden")).toHaveText("Ratings given: 0");
});

const sort = (page: Page) => page.getByRole("toolbar", { name: "Bubble sort" });

test("step controls are one tab stop, the arrows move between the keys, and the ends disable previous and next", async ({ page }) => {
  await open(page);
  const bar = sort(page);
  const previous = bar.getByRole("button", { name: "Previous step" });
  const next = bar.getByRole("button", { name: "Next step" });
  const play = bar.locator(".fui-step-controls-play");
  await expect(bar.locator(".fui-step-controls-count")).toHaveText("Step 1 of 4");
  await expect(previous).toBeDisabled();
  await expect(next).toBeEnabled();
  await expect(play).toHaveText("Play");

  // A disabled key stays in the arrow order, so the keys do not shift under the reader.
  await previous.focus();
  await page.keyboard.press("ArrowRight");
  await expect(play).toBeFocused();
  await page.keyboard.press("ArrowRight");
  await expect(next).toBeFocused();
  await page.keyboard.press("Tab");
  expect(await bar.evaluate((node) => node.contains(document.activeElement))).toBe(false);
  await page.keyboard.press("Shift+Tab");
  await expect(next).toBeFocused();

  const status = bar.getByRole("status");
  await expect(status).toBeEmpty();
  await page.keyboard.press("Enter");
  await expect(page.getByTestId("frame")).toHaveText("Swap 7 and 2");
  await expect(status).toHaveText("Step 2 of 4");
  await expect(previous).toBeEnabled();
  await page.keyboard.press("Enter");
  await page.keyboard.press("Enter");
  await expect(page.getByTestId("frame")).toHaveText("Sorted");
  await expect(bar.locator(".fui-step-controls-count")).toHaveText("Step 4 of 4");
  await expect(next).toBeDisabled();
  await expect(next).toBeFocused();
  await expect(play).toHaveText("Replay");
  // Reset goes back to the first step.
  await bar.getByRole("button", { name: "Back to the start" }).click();
  await expect(page.getByTestId("frame")).toHaveText("Compare 4 and 7");
  await expect(status).toHaveText("Step 1 of 4");
  // A speed is a pressed key in a named group.
  const speeds = bar.getByRole("group", { name: "Speed" });
  await expect(speeds.getByRole("button", { name: "1×", exact: true })).toHaveAttribute("aria-pressed", "true");
  await speeds.getByRole("button", { name: "2×" }).click();
  await expect(speeds.getByRole("button", { name: "2×" })).toHaveAttribute("aria-pressed", "true");
  await expect(speeds.getByRole("button", { name: "1×", exact: true })).toHaveAttribute("aria-pressed", "false");
});

test("play advances on the clock, speaks only when it stops, and ends on Replay", async ({ page }) => {
  await page.clock.install();
  await open(page);
  const bar = sort(page);
  const play = bar.locator(".fui-step-controls-play");
  const frame = page.getByTestId("frame");
  const status = bar.getByRole("status");
  await play.click();
  await expect(play).toHaveText("Pause");
  await expect(frame).toHaveText("Compare 4 and 7");
  await page.clock.runFor(1000);
  await expect(frame).toHaveText("Swap 7 and 2");
  // Each tick moves the counter; the live region stays quiet while it plays.
  await expect(bar.locator(".fui-step-controls-count")).toHaveText("Step 2 of 4");
  await expect(status).toBeEmpty();
  await play.click();
  await expect(play).toHaveText("Play");
  await expect(status).toHaveText("Step 2 of 4");
  await page.clock.runFor(5000);
  await expect(frame).toHaveText("Swap 7 and 2");

  await play.click();
  await expect(status).toBeEmpty();
  await page.clock.runFor(1000);
  await expect(frame).toHaveText("Compare 7 and 9");
  await page.clock.runFor(1000);
  await expect(frame).toHaveText("Sorted");
  await expect(play).toHaveText("Replay");
  await expect(status).toHaveText("Step 4 of 4");
  await page.clock.runFor(5000);
  await expect(frame).toHaveText("Sorted");
  // Replay starts again from the first step, and a step by hand pauses.
  await play.click();
  await expect(frame).toHaveText("Compare 4 and 7");
  await expect(play).toHaveText("Pause");
  await bar.getByRole("button", { name: "Next step" }).click();
  await expect(play).toHaveText("Play");
  await page.clock.runFor(5000);
  await expect(frame).toHaveText("Swap 7 and 2");
  // At twice the speed a step takes half the time.
  await bar.getByRole("button", { name: "2×" }).click();
  await play.click();
  await page.clock.runFor(500);
  await expect(frame).toHaveText("Compare 7 and 9");
});

test("in a right-to-left page the chevrons turn and the counter is in the reader's digits", async ({ page }) => {
  await open(page);
  const transform = (bar: Locator, key: string) => bar.locator(`.fui-step-controls-${key} .fui-step-controls-chevron`).evaluate((node) => getComputedStyle(node).transform);
  const rtl = page.getByRole("toolbar", { name: "الخطوات" });
  expect(await transform(rtl, "previous")).toBe("matrix(-1, 0, 0, 1, 0, 0)");
  expect(await transform(rtl, "next")).toBe("matrix(-1, 0, 0, 1, 0, 0)");
  expect(await transform(sort(page), "previous")).toBe("none");
  await expect(rtl.locator(".fui-step-controls-count")).toHaveText("الخطوة ٥ من ١٢");
  // Previous is at the right, next at the left.
  const previous = (await rtl.getByRole("button", { name: "الخطوة السابقة" }).boundingBox())!;
  const next = (await rtl.getByRole("button", { name: "الخطوة التالية" }).boundingBox())!;
  expect(previous.x).toBeGreaterThan(next.x);
  // The arrow keys follow the page: Left goes on to the next key.
  await rtl.getByRole("button", { name: "الخطوة السابقة" }).focus();
  await page.keyboard.press("ArrowLeft");
  await expect(rtl.getByRole("button", { name: "تشغيل" })).toBeFocused();
});

test("segments are as wide as their weight, name the current one in the bar's value, and stay out of the tab order", async ({ page }) => {
  await open(page);
  const bar = page.getByRole("progressbar", { name: "Today's session" });
  await expect(bar).toHaveAttribute("aria-valuetext", "Step 3 of 5, Listening");
  await expect(bar).toHaveAttribute("aria-valuenow", "2");
  await expect(bar).toHaveAttribute("aria-valuemax", "5");
  await expect(bar).toHaveAccessibleDescription("About 12 minutes left");
  const parts = bar.locator(".fui-progress-part");
  await expect(parts).toHaveCount(5);
  await expect(bar.locator('[aria-current="step"]')).toHaveText("Listening, current");
  await expect(parts.first()).toHaveText("Warm-up, done");
  const widths = await parts.evaluateAll((nodes) => nodes.map((node) => node.getBoundingClientRect().width));
  const unit = widths.reduce((sum, width) => sum + width, 0) / 20;
  [2, 5, 4, 3, 6].forEach((weight, index) => expect(Math.abs(widths[index]! - weight * unit)).toBeLessThan(1));
  // The current one stands taller than a done one and carries an edge.
  const drawn = (index: number) =>
    parts.nth(index).evaluate((node) => {
      const style = getComputedStyle(node, "::before");
      return { height: parseFloat(style.height), border: style.borderTopWidth };
    });
  expect((await drawn(2)).height).toBeGreaterThan((await drawn(1)).height);
  expect((await drawn(2)).border).not.toBe("0px");
  expect(await bar.evaluate((node) => node.querySelectorAll("button, [tabindex]").length)).toBe(0);
  await expect(page.getByRole("progressbar", { name: "Session, done" })).toHaveAttribute("aria-valuetext", "5 of 5 done");
});

test("segment buttons: one tab stop, the arrows and Home and End move, Enter calls back, the current one is marked", async ({ page }) => {
  await open(page);
  const quiz = page.getByRole("toolbar", { name: "Questions" });
  await expect(quiz).toHaveAccessibleDescription("Go back to any question.");
  await expect(page.getByRole("progressbar", { name: "Questions" })).toHaveCount(0);
  const buttons = quiz.getByRole("button");
  await expect(buttons).toHaveCount(6);
  await expect(quiz.locator('[aria-current="step"]')).toHaveAccessibleName("Question 4, current");
  await expect(buttons.nth(0)).toHaveAccessibleName("Question 1, correct");
  await expect(buttons.nth(1)).toHaveAccessibleName("Question 2, incorrect");
  await expect(buttons.nth(2)).toHaveAccessibleName("Question 3, skipped");
  await expect(buttons.nth(4)).toHaveAccessibleName("Question 5, to do");
  // Right and wrong are drawn apart without colour: a solid line and a dashed one.
  const image = (index: number) => buttons.nth(index).evaluate((node) => getComputedStyle(node, "::before").backgroundImage);
  expect(await image(0)).toBe("none");
  expect(await image(1)).toMatch(/^repeating-linear-gradient/);
  expect(await image(2)).toMatch(/^repeating-linear-gradient/);
  expect(await image(1)).not.toBe(await image(2));

  await buttons.first().focus();
  await page.keyboard.press("ArrowRight");
  await expect(buttons.nth(1)).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.getByTestId("quiz-picked")).toHaveText("Opened: Question 2");
  await page.keyboard.press("End");
  await expect(buttons.nth(5)).toBeFocused();
  await page.keyboard.press("Home");
  await expect(buttons.nth(0)).toBeFocused();
  await page.keyboard.press("ArrowLeft");
  await expect(buttons.nth(5)).toBeFocused();
  await page.keyboard.press("Space");
  await expect(page.getByTestId("quiz-picked")).toHaveText("Opened: Question 6");
  await page.keyboard.press("Tab");
  expect(await quiz.evaluate((node) => node.contains(document.activeElement))).toBe(false);
  // Each button is a target of at least 24 px, whatever the thickness of its line.
  expect((await buttons.first().boundingBox())!.height).toBeGreaterThanOrEqual(24);
});

test("a mark sits at its value from the start of the track, mirrored in a right-to-left page, and describes the bar", async ({ page }) => {
  await open(page);
  const centre = async (bar: Locator, index = 0) => {
    const track = (await bar.locator(".fui-progress-track").boundingBox())!;
    const tick = (await bar.locator(".fui-progress-mark-tick").nth(index).boundingBox())!;
    return { track, tick, x: tick.x + tick.width / 2 };
  };
  const test25 = page.getByRole("progressbar", { name: "Placement test" });
  const first = await centre(test25, 0);
  expect(Math.abs(first.x - (first.track.x + first.track.width * 0.4))).toBeLessThan(1);
  const second = await centre(test25, 1);
  expect(Math.abs(second.x - (second.track.x + second.track.width * 0.8))).toBeLessThan(1);
  // The tick crosses the track.
  expect(first.tick.y).toBeLessThan(first.track.y);
  expect(first.tick.y + first.tick.height).toBeGreaterThan(first.track.y + first.track.height);
  await expect(test25).toHaveAccessibleDescription("The test stops when it is sure, between 10 and 25 questions. The shortest test ends here. Most tests are over by here");
  await expect(test25).toHaveAttribute("aria-valuenow", "6");
  // A caption is under the bar, centred on its tick, inside the bar's width; the other label is only spoken.
  const caption = (await test25.locator(".fui-progress-mark-caption").boundingBox())!;
  expect(caption.y).toBeGreaterThanOrEqual(first.track.y + first.track.height);
  expect(Math.abs(caption.x + caption.width / 2 - first.x)).toBeLessThan(1);
  await expect(test25.locator(".fui-progress-mark-caption")).toHaveCount(1);
  const hint = (await test25.locator(".fui-progress-hint").boundingBox())!;
  expect(hint.y).toBeGreaterThanOrEqual(caption.y + caption.height - 0.5);

  const rtl = page.getByRole("progressbar", { name: "الاختبار" });
  const mirrored = await centre(rtl);
  expect(Math.abs(mirrored.x - (mirrored.track.x + mirrored.track.width * 0.6))).toBeLessThan(1);
});

test("a marked text: numbers match the notes, each mark has its spoken prefix, and the line says the severity", async ({ page }) => {
  await open(page);
  const marks = page.locator(".fui-marked-text .fui-mark");
  await expect(marks).toHaveCount(4);
  const notes = page.getByRole("list", { name: "Notes" }).getByRole("listitem");
  await expect(notes).toHaveCount(4);
  const prefixes = ["Mistake 1: ", "Mistake 2: ", "Warning 3: ", "Note 4: "];
  const lines = ["solid", "solid", "dashed", "dotted"];
  const passages = ["go", "buyed", "apple", "at home"];
  for (let index = 0; index < 4; index += 1) {
    const mark = marks.nth(index);
    await expect(mark.locator("sup")).toHaveText(String(index + 1));
    await expect(mark.locator("sup")).toHaveAttribute("aria-hidden", "true");
    expect(await mark.locator(".fui-sr-only").evaluate((node) => node.textContent)).toBe(prefixes[index]);
    expect(await mark.evaluate((node) => getComputedStyle(node).textDecorationStyle)).toBe(lines[index]);
    expect(await mark.evaluate((node) => getComputedStyle(node).textDecorationLine)).toBe("underline");
    expect(await mark.evaluate((node) => [...node.childNodes].filter((child) => child.nodeType === 3).map((child) => child.textContent).join(""))).toBe(passages[index]);
    // The mark is described by the note that carries its number.
    const id = await mark.getAttribute("aria-describedby");
    const note = page.locator(`[id="${id}"]`);
    await expect(note.locator(".fui-annotation-number")).toHaveText(String(index + 1));
    await expect(notes.nth(index)).toHaveAttribute("id", id!);
  }
  await expect(notes.nth(0)).toContainText("Mistake 1. Tense");
  await expect(notes.nth(0)).toContainText("Written: go");
  await expect(notes.nth(0)).toContainText("Suggested: went");
  const fragment = (kind: string) => notes.nth(0).locator(`[data-kind="${kind}"]`).evaluate((node) => `${node.tagName} ${getComputedStyle(node).textDecorationLine}`);
  expect(await fragment("before")).toBe("BDI line-through");
  expect(await fragment("after")).toBe("BDI underline");
});

test("a diff reads without colour: removed is struck through, added is underlined, each with a spoken prefix", async ({ page }) => {
  await open(page);
  const diff = page.locator(".fui-text-diff-text");
  await expect(diff.locator("del")).toHaveText(["Removed: go", "Removed: buyed", "Removed: apple"]);
  await expect(diff.locator("ins")).toHaveText(["Added: went", "Added: bought", "Added: apples"]);
  expect(await diff.locator("del").first().evaluate((node) => getComputedStyle(node).textDecorationLine)).toBe("line-through");
  expect(await diff.locator("ins").first().evaluate((node) => getComputedStyle(node).textDecorationLine)).toBe("underline");
  expect(await diff.locator("del .fui-sr-only").first().evaluate((node) => node.getBoundingClientRect().width)).toBeLessThanOrEqual(1);
  // Without the marks the text is the second version; without the additions, the first.
  const text = await diff.evaluate((node) => {
    const clone = node.cloneNode(true) as HTMLElement;
    clone.querySelectorAll(".fui-sr-only, del").forEach((part) => part.remove());
    return clone.textContent;
  });
  expect(text).toBe("Yesterday I went to the market and bought three apples.");
  await expect(page.locator(".fui-text-diff-legend")).toHaveAttribute("aria-hidden", "true");
});

test("nothing moves under reduced motion, and the answer rises in without it", async ({ page }) => {
  await open(page);
  await card(page).getByRole("button", { name: "Show answer" }).click();
  const answer = card(page).locator(".fui-reveal-card-answer");
  expect(await answer.evaluate((node) => getComputedStyle(node).animationName)).toBe("none");
  expect(await evening(page).getByRole("radio").first().evaluate((node) => getComputedStyle(node).transitionDuration)).toBe("0s");
  await page.emulateMedia({ reducedMotion: "no-preference" });
  expect(await answer.evaluate((node) => getComputedStyle(node).animationName)).toBe("fui-rise");
});

test("the component pages draw: the choice group in context, the reveal card's playground and its session", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));

  await page.goto("/iframe.html?id=components-choice-group--overview&viewMode=story&globals=theme:light");
  await expect(page.locator("#storybook-root h1").first()).toHaveText("Choice group");
  const group = page.getByRole("radiogroup", { name: "Which of these do you say in the evening?" });
  await group.getByRole("radio", { name: "Bonjour" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Bonsoir is the evening one" })).toBeVisible();
  await page.goto("/iframe.html?id=components-choice-group--playground&viewMode=story&globals=theme:light");
  await expect(page.getByRole("radiogroup", { name: "Which of these do you say in the evening?" })).toBeVisible();

  await page.goto("/iframe.html?id=components-reveal-card--overview&viewMode=story&globals=theme:light");
  await expect(page.locator("#storybook-root h1").first()).toHaveText("Reveal card");
  const session = page.getByRole("article", { name: "Card 1 of 3" });
  await session.focus();
  await page.keyboard.press("Space");
  await expect(session.locator(".fui-reveal-card-back")).toContainText("the lighthouse");
  await page.keyboard.press("3");
  // The next card comes up with the focus on it, and the count says one was reviewed.
  await expect(page.getByRole("article", { name: "Card 2 of 3" })).toBeFocused();
  await expect(page.getByText("Reviewed: 1")).toBeVisible();
  await page.goto("/iframe.html?id=components-reveal-card--playground&viewMode=story&globals=theme:light");
  const card = page.getByRole("article", { name: "Card 3 of 20" });
  await card.getByRole("button", { name: "Show answer" }).click();
  await expect(card.getByRole("group", { name: "How well did you know it?" })).toBeVisible();
  expect(errors).toEqual([]);
});
