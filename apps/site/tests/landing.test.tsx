// @vitest-environment jsdom
import { afterEach, beforeAll, expect, it } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HeroInstrument } from "@/components/landing/hero-instrument";
import { OrdersShowcase } from "@/components/landing/orders-showcase";

beforeAll(() => {
  if (typeof globalThis.ResizeObserver === "undefined") {
    globalThis.ResizeObserver = class ResizeObserver {
      observe() {}
      unobserve() {}
      disconnect() {}
    };
  }
});

afterEach(cleanup);

it("switches surfaces and reporting windows in the hero specimen", async () => {
  const user = userEvent.setup();
  render(<HeroInstrument />);

  expect(screen.getByText("Usage telemetry")).toBeTruthy();
  await user.click(screen.getByRole("button", { name: "30d" }));
  expect(screen.getByText("86%")).toBeTruthy();

  await user.click(screen.getByRole("button", { name: "Agent" }));
  expect(screen.getByText("@fabrials/ai-ui runtime")).toBeTruthy();
  await user.click(screen.getByRole("switch", { name: "Agent working" }));
  expect(screen.getByText(/Completed analysis/)).toBeTruthy();

  await user.click(screen.getByRole("button", { name: "Controls" }));
  expect(screen.getByText("Material & tactile controls")).toBeTruthy();
  expect(screen.getByRole("button", { name: "Deploy" })).toBeTruthy();
});

it("lists all ten canonical Knights Radiant orders and updates the specimen plate", async () => {
  const user = userEvent.setup();
  render(<OrdersShowcase />);

  const list = screen.getByRole("list", { name: "Ten Orders of the Knights Radiant" });
  expect(within(list).getAllByRole("button")).toHaveLength(10);
  expect(screen.getByRole("heading", { name: "Windrunners" })).toBeTruthy();

  await user.click(within(list).getByRole("button", { name: /Bondsmiths/ }));
  expect(screen.getByRole("heading", { name: "Bondsmiths" })).toBeTruthy();
  expect(screen.getByText('<RadiantGlyph order="bondsmith" size={24} colored />')).toBeTruthy();
  expect(screen.getByRole("img", { name: "Bondsmith order glyph" })).toBeTruthy();
});
