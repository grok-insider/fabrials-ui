// @vitest-environment jsdom
import { afterEach, expect, it, vi } from "vitest";
import { cleanup, render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CodeBlock } from "@/components/code-block";
import { GitHubLink } from "@/components/github-link";
import { DemoVideo } from "@/components/demo-video";
import { GET } from "@/app/api/github/route";
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});
it("copies the original command and announces success", async () => {
  const user = userEvent.setup();
  const write = vi.spyOn(navigator.clipboard, "writeText").mockResolvedValue();
  const command =
    "bunx shadcn@latest add https://ui.fabrials.com/r/webmcp-provider.json";
  render(<CodeBlock code={command} variant="command" />);
  await user.click(screen.getByRole("button", { name: "Copy Terminal" }));
  expect(write).toHaveBeenCalledWith(command);
  expect(screen.getByRole("status").textContent).toBe("Copied to clipboard");
});
it("shows clipboard failures and permits retry", async () => {
  const user = userEvent.setup();
  const write = vi
    .spyOn(navigator.clipboard, "writeText")
    .mockRejectedValueOnce(new Error())
    .mockResolvedValue();
  render(<CodeBlock code="bun install" variant="command" />);
  await user.click(screen.getByRole("button", { name: "Copy Terminal" }));
  expect(screen.getByRole("status").textContent).toContain("Select");
  await user.click(screen.getByRole("button", { name: "Copy Terminal" }));
  expect(write).toHaveBeenCalledTimes(2);
  expect(screen.getByRole("status").textContent).toContain("Copied");
});
it("preserves zero stars and falls back without a fabricated count", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue(Response.json({ stargazers_count: 0 })),
  );
  const response = await GET();
  expect(await response.json()).toEqual({ stars: 0 });
  expect(response.headers.get("cache-control")).toContain("3600");
  vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error()));
  expect(await (await GET()).json()).toEqual({ stars: null });
});
it("renders an accessible GitHub link with the real zero count", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue(Response.json({ stars: 0 })),
  );
  render(<GitHubLink />);
  expect(
    await screen.findByRole("link", { name: "GitHub repository · 0 stars" }),
  ).toBeTruthy();
});

it("loads video only on demand and offers a recoverable playback failure", async () => {
  const user = userEvent.setup();
  const play = vi
    .spyOn(HTMLMediaElement.prototype, "play")
    .mockRejectedValueOnce(new Error("offline"))
    .mockResolvedValue();
  render(<DemoVideo />);
  const video = document.querySelector("video")!;
  expect(video.preload).toBe("none");
  expect(play).not.toHaveBeenCalled();
  await user.click(screen.getByRole("button", { name: "Play demo video" }));
  expect(screen.getByRole("alert")).toBeTruthy();
  await user.click(screen.getByRole("button", { name: "Retry" }));
  expect(play).toHaveBeenCalledTimes(2);
  expect(screen.queryByRole("alert")).toBeNull();
  expect(video.controls).toBe(true);
  fireEvent.error(video);
  expect(screen.getByRole("alert")).toBeTruthy();
});
