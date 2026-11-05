// Keyboard and behaviour of the 0.10 inputs in a real browser: what jsdom cannot see (focus, the browser's own input
// events, layout). Engine-agnostic: assertions read state and geometry, never pixels.
import { expect, test, type Page } from "@playwright/test";

const open = async (page: Page, id: string, width = 1440) => {
  await page.setViewportSize({ width, height: 1000 });
  await page.goto(`/iframe.html?id=${id}&viewMode=story&globals=theme:light`);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
};

test("search: the clear button comes with text, Escape clears first and then belongs to the page", async ({ page }) => {
  await open(page, "fabrials-inputs--text-fields");
  const field = page.getByRole("searchbox", { name: "Search messages" });
  const clearButton = field.locator("..").getByRole("button", { name: "Clear search" });
  await expect(clearButton).toHaveCount(0);
  await field.click();
  await page.keyboard.type("invoice");
  await expect(field).toHaveValue("invoice");
  await expect(clearButton).toHaveCount(1);
  await page.evaluate(() => {
    (window as unknown as { escapes: number }).escapes = 0;
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") (window as unknown as { escapes: number }).escapes += 1;
    });
  });
  await page.keyboard.press("Escape");
  await expect(field).toHaveValue("");
  await expect(field).toBeFocused();
  expect(await page.evaluate(() => (window as unknown as { escapes: number }).escapes)).toBe(0);
  await page.keyboard.press("Escape");
  expect(await page.evaluate(() => (window as unknown as { escapes: number }).escapes)).toBe(1);

  const controlled = page.getByRole("searchbox", { name: "Search files" });
  await controlled.locator("..").getByRole("button", { name: "Clear search" }).click();
  await expect(controlled).toHaveValue("");
  await expect(controlled).toBeFocused();
  await expect(page.getByRole("searchbox", { name: "Search accounts" })).toHaveAttribute("aria-busy", "true");
});

test("password: the eye is a toggle, Caps Lock is said, and a submitted form hides the password again", async ({ page }) => {
  await open(page, "fabrials-inputs--text-fields");
  const field = page.getByLabel("Account password");
  const toggle = page.getByRole("form", { name: "Sign in" }).getByRole("button", { name: "Show password" });
  await expect(field).toHaveAttribute("type", "password");
  await toggle.click();
  await expect(field).toHaveAttribute("type", "text");
  await expect(toggle).toHaveAttribute("aria-pressed", "true");
  await field.focus();
  await page.keyboard.press("Enter");
  await expect(field).toHaveAttribute("type", "password");
  await expect(toggle).toHaveAttribute("aria-pressed", "false");

  await field.focus();
  await field.dispatchEvent("keydown", { key: "A", modifierCapsLock: true });
  const warning = page.getByText("Caps Lock is on");
  await expect(warning).toBeVisible();
  expect(await field.getAttribute("aria-describedby")).toContain(await warning.getAttribute("id"));
  await field.blur();
  await expect(warning).toHaveCount(0);
});

test("number field: arrows step, Shift steps large, Home and End go to the limits, the keys stop at the ends", async ({ page }) => {
  await open(page, "fabrials-inputs--numbers");
  const seats = page.getByRole("textbox", { name: "Seats" });
  await seats.focus();
  await page.keyboard.press("ArrowUp");
  await expect(seats).toHaveValue("13");
  await page.keyboard.press("Shift+ArrowUp");
  await expect(seats).toHaveValue("23");
  await page.keyboard.press("End");
  await expect(seats).toHaveValue("500");
  await page.keyboard.press("Home");
  await expect(seats).toHaveValue("1");
  const retries = page.getByRole("textbox", { name: "Retries" });
  const group = retries.locator("..");
  await expect(group.getByRole("button", { name: "Decrease" })).toBeDisabled();
  await group.getByRole("button", { name: "Increase" }).click();
  await expect(retries).toHaveValue("1");
  await expect(group.getByRole("button", { name: "Decrease" })).toBeEnabled();
  const timeout = page.getByRole("textbox", { name: "Timeout" });
  expect(await timeout.getAttribute("aria-describedby")).toBeTruthy();
  await expect(page.getByText("ms", { exact: true })).toBeVisible();
});

test("slider: a thumb takes focus, arrows and End move it, a range names both thumbs", async ({ page }) => {
  await open(page, "fabrials-inputs--numbers");
  const volume = page.getByRole("slider", { name: "Volume" });
  await volume.focus();
  await page.keyboard.press("ArrowRight");
  await expect(volume).toHaveAttribute("aria-valuenow", "65");
  await page.keyboard.press("End");
  await expect(volume).toHaveAttribute("aria-valuenow", "100");
  const thumb = page.locator(".fui-slider-thumb").first();
  expect(await thumb.evaluate((element) => getComputedStyle(element).outlineStyle)).toBe("solid");
  await expect(page.getByRole("slider", { name: "Minimum price" })).toHaveAttribute("aria-valuenow", "20");
  const maximum = page.getByRole("slider", { name: "Maximum price" });
  await maximum.focus();
  await page.keyboard.press("PageDown");
  await expect(maximum).toHaveAttribute("aria-valuenow", "70");
  await expect(page.locator(".fui-slider-value").nth(1)).toHaveText("€20 – €70");
  const quality = page.getByRole("slider", { name: "Quality" });
  await quality.focus();
  await page.keyboard.press("ArrowRight");
  await expect(quality).toHaveAttribute("aria-valuenow", "4");
});

test("right to left, with the direction provider: Left raises the value and the thumb sits on the end of the fill", async ({ page }) => {
  await open(page, "fabrials-inputs--numbers");
  const slider = page.getByRole("slider", { name: "مستوى الصوت" });
  await expect(slider).toHaveAttribute("aria-valuenow", "40");
  const root = page.locator(".fui-slider").filter({ has: slider });
  const geometry = async () =>
    root.evaluate((element) => {
      const fill = element.querySelector(".fui-slider-indicator")!.getBoundingClientRect();
      const thumb = element.querySelector(".fui-slider-thumb")!.getBoundingClientRect();
      return { fillStart: fill.left, fillEnd: fill.right, thumbCentre: thumb.left + thumb.width / 2 };
    });
  const before = await geometry();
  expect(Math.abs(before.thumbCentre - before.fillStart)).toBeLessThan(1.5);
  await slider.focus();
  await page.keyboard.press("ArrowLeft");
  await expect(slider).toHaveAttribute("aria-valuenow", "41");
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("ArrowRight");
  await expect(slider).toHaveAttribute("aria-valuenow", "39");
  const after = await geometry();
  expect(after.fillEnd).toBeCloseTo(before.fillEnd, 0);
  expect(Math.abs(after.thumbCentre - after.fillStart)).toBeLessThan(1.5);
});

test("one-time code: typing moves on, Backspace moves back, a paste fills every slot", async ({ page }) => {
  await open(page, "fabrials-inputs--codes");
  const first = page.getByRole("textbox", { name: "Verification code" });
  await first.focus();
  await page.keyboard.type("12");
  await expect(page.getByRole("textbox", { name: "Character 3 of 6" }).first()).toBeFocused();
  await page.keyboard.press("Backspace");
  await expect(page.getByRole("textbox", { name: "Character 2 of 6" }).first()).toBeFocused();
  await first.focus();
  await page.evaluate(() => {
    const data = new DataTransfer();
    data.setData("text/plain", "904 117");
    document.activeElement?.dispatchEvent(new ClipboardEvent("paste", { clipboardData: data, bubbles: true, cancelable: true }));
  });
  const values = await page
    .locator(".fui-input-otp")
    .first()
    .locator("input:not([type=hidden])")
    .evaluateAll((inputs) => inputs.map((input) => (input as HTMLInputElement).value).join(""));
  expect(values).toBe("904117");
});

test("a growing textarea grows with its text and scrolls past its last row", async ({ page }) => {
  await open(page, "fabrials-inputs--text-fields");
  const reply = page.getByRole("textbox", { name: "Reply" });
  const empty = (await reply.boundingBox())!.height;
  await reply.fill("one\ntwo\nthree\nfour");
  const four = (await reply.boundingBox())!.height;
  expect(four).toBeGreaterThan(empty + 20);
  await reply.fill(Array.from({ length: 12 }, (_, line) => `line ${line + 1}`).join("\n"));
  const full = await reply.evaluate((element) => ({ height: element.getBoundingClientRect().height, scrolls: element.scrollHeight > element.clientHeight }));
  expect(full.scrolls).toBe(true);
  expect(full.height).toBeLessThan(empty * 4);
});
