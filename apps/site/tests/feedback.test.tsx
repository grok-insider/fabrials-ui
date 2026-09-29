// @vitest-environment jsdom
// Behaviour of the 0.8 feedback and text pieces: ConfirmDialog focus, useConfirm, deterministic RelativeTime,
// the hydration-safe modifier key and the inline Alert. Markup and CSS hooks are asserted in tests/unit/feedback.test.tsx (bun);
// this file needs a DOM, so it lives with the site's jsdom suite and runs against the built package (bun run build first).
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useState, type ReactNode } from "react";
import { renderToString } from "react-dom/server";
import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  Alert,
  AlertAction,
  AlertDescription,
  AlertTitle,
  Button,
  IconButton,
  ConfirmActionButton,
  ConfirmDialog,
  ConfirmProvider,
  Kbd,
  KbdGroup,
  RelativeTime,
  StatePanel,
  useConfirm,
  useModifierKey,
  type ConfirmFunction,
  type ConfirmOutcome,
} from "@fabrials/ui";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe("StatePanel", () => {
  it("announces an error as an alert with its heading level, and a stale state as a status", () => {
    render(
      <>
        <StatePanel state="error" size="sm" variant="inline" headingLevel={3} title="Folders failed" description="Try again." actions={<Button>Retry</Button>} />
        <StatePanel state="stale" title="Out of date" />
      </>,
    );
    const alert = screen.getByRole("alert");
    expect(alert.getAttribute("data-size")).toBe("sm");
    expect(alert.querySelector("h3")?.textContent).toBe("Folders failed");
    expect(screen.getByRole("button", { name: "Retry" })).toBeTruthy();
    expect(screen.getAllByRole("status")).toHaveLength(1);
  });

  it("takes a ref and tabIndex so a host can move focus to it", () => {
    function Host() {
      return <StatePanel state="empty" title="Nothing yet" tabIndex={-1} ref={(node) => node?.focus()} />;
    }
    render(<Host />);
    expect(document.activeElement).toBe(screen.getByRole("status"));
  });
});

describe("ConfirmDialog finalFocus", () => {
  function Removable({ onFocusOutcome }: { onFocusOutcome: (outcome: ConfirmOutcome) => void }) {
    const [removed, setRemoved] = useState(false);
    const [open, setOpen] = useState(false);
    return (
      <div>
        {removed ? null : <button type="button" onClick={() => setOpen(true)}>Delete contact</button>}
        <div id="result" tabIndex={-1}>{removed ? "Deleted" : "Kept"}</div>
        <ConfirmDialog
          open={open}
          onOpenChange={setOpen}
          title="Delete contact?"
          description="It cannot be undone."
          confirmLabel="Delete"
          destructive
          onConfirm={() => setRemoved(true)}
          finalFocus={(_closeType, outcome) => {
            onFocusOutcome(outcome);
            return outcome === "confirmed" ? document.getElementById("result") : undefined;
          }}
        />
      </div>
    );
  }

  it("moves focus to the named element after a confirmed action removed the trigger", async () => {
    const user = userEvent.setup();
    const seen = vi.fn();
    render(<Removable onFocusOutcome={seen} />);
    await user.click(screen.getByRole("button", { name: "Delete contact" }));
    const dialog = await screen.findByRole("alertdialog", { name: "Delete contact?" });
    expect(dialog).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Delete" }));
    await waitFor(() => expect(document.activeElement).toBe(document.getElementById("result")));
    expect(seen).toHaveBeenLastCalledWith("confirmed");
  });

  it("returns to the trigger after Cancel and after Escape, and reports the dismissal", async () => {
    const user = userEvent.setup();
    const seen = vi.fn();
    render(<Removable onFocusOutcome={seen} />);
    const trigger = screen.getByRole("button", { name: "Delete contact" });
    await user.click(trigger);
    await screen.findByRole("alertdialog");
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    await waitFor(() => expect(document.activeElement).toBe(trigger));
    expect(seen).toHaveBeenLastCalledWith("dismissed");
    await user.click(trigger);
    await screen.findByRole("alertdialog");
    await user.keyboard("{Escape}");
    await waitFor(() => expect(document.activeElement).toBe(trigger));
    expect(seen).toHaveBeenLastCalledWith("dismissed");
  });

  it("is passed through ConfirmActionButton as a ref", async () => {
    const user = userEvent.setup();
    const target = { current: null as HTMLElement | null };
    render(
      <div>
        <ConfirmActionButton title="Archive?" confirmLabel="Archive" finalFocus={target} onConfirm={() => undefined}>Archive</ConfirmActionButton>
        <button type="button" ref={(node) => { target.current = node; }}>Elsewhere</button>
      </div>,
    );
    await user.click(screen.getByRole("button", { name: "Archive" }));
    await screen.findByRole("alertdialog");
    expect(screen.queryByText("It cannot be undone.")).toBeNull();
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    await waitFor(() => expect(document.activeElement).toBe(screen.getByRole("button", { name: "Elsewhere" })));
  });
});

describe("useConfirm", () => {
  function Asker({ options, onAnswer }: { options?: Parameters<ConfirmFunction>[0]; onAnswer: (value: boolean) => void }) {
    const confirm = useConfirm();
    return (
      <button type="button" onClick={() => void confirm(options ?? { title: "Delete draft?", description: "It cannot be undone.", confirmLabel: "Delete", destructive: true }).then(onAnswer)}>
        Ask
      </button>
    );
  }

  it("resolves true on Confirm, and focus returns to the control that asked", async () => {
    const user = userEvent.setup();
    const answers: boolean[] = [];
    render(<ConfirmProvider><Asker onAnswer={(value) => answers.push(value)} /></ConfirmProvider>);
    const ask = screen.getByRole("button", { name: "Ask" });
    await user.click(ask);
    expect(await screen.findByRole("alertdialog", { name: "Delete draft?" })).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Delete" }));
    await waitFor(() => expect(answers).toEqual([true]));
    await waitFor(() => expect(document.activeElement).toBe(ask));
  });

  it("resolves false on Escape and on Cancel, and Cancel is where focus starts", async () => {
    const user = userEvent.setup();
    const answers: boolean[] = [];
    render(<ConfirmProvider><Asker onAnswer={(value) => answers.push(value)} /></ConfirmProvider>);
    await user.click(screen.getByRole("button", { name: "Ask" }));
    await screen.findByRole("alertdialog");
    await user.keyboard("{Escape}");
    await waitFor(() => expect(answers).toEqual([false]));
    await user.click(screen.getByRole("button", { name: "Ask" }));
    await screen.findByRole("alertdialog");
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    await waitFor(() => expect(answers).toEqual([false, false]));
  });

  it("settles each question exactly once and asks the next one after the first", async () => {
    const user = userEvent.setup();
    const answers: string[] = [];
    const outcomes: string[] = [];
    function Two() {
      const confirm = useConfirm();
      return (
        <button
          type="button"
          onClick={() => {
            void confirm({ title: "First?", confirmLabel: "Yes first" }).then((value) => answers.push(`first:${value}`));
            void confirm({
              title: "Second?",
              confirmLabel: "Yes second",
              finalFocus: (_closeType, outcome) => {
                outcomes.push(outcome);
                return null;
              },
            }).then((value) => answers.push(`second:${value}`));
          }}
        >
          Ask two
        </button>
      );
    }
    render(<ConfirmProvider><Two /></ConfirmProvider>);
    await user.click(screen.getByRole("button", { name: "Ask two" }));
    await screen.findByRole("alertdialog", { name: "First?" });
    await user.click(screen.getByRole("button", { name: "Yes first" }));
    await screen.findByRole("alertdialog", { name: "Second?" });
    expect(answers).toEqual(["first:true"]);
    // The next question is a fresh dialog: focus starts on Cancel, so a stray Enter or a second press cannot confirm it.
    await waitFor(() => expect(document.activeElement).toBe(screen.getByRole("button", { name: "Cancel" })));
    await user.keyboard("{Enter}");
    await waitFor(() => expect(answers).toEqual(["first:true", "second:false"]));
    expect(outcomes).toEqual(["dismissed"]);
  });

  it("keeps one function identity, and pending questions settle false when the provider unmounts", async () => {
    const user = userEvent.setup();
    const seen: ConfirmFunction[] = [];
    const answers: boolean[] = [];
    function Probe() {
      const confirm = useConfirm();
      seen.push(confirm);
      const [, bump] = useState(0);
      return (
        <>
          <button type="button" onClick={() => bump((value) => value + 1)}>Rerender</button>
          <button type="button" onClick={() => void confirm({ title: "Leave?" }).then((value) => answers.push(value))}>Ask</button>
        </>
      );
    }
    const { unmount } = render(<ConfirmProvider><Probe /></ConfirmProvider>);
    await user.click(screen.getByRole("button", { name: "Rerender" }));
    expect(new Set(seen).size).toBe(1);
    await user.click(screen.getByRole("button", { name: "Ask" }));
    await screen.findByRole("alertdialog");
    unmount();
    await waitFor(() => expect(answers).toEqual([false]));
  });

  it("is window.confirm without a provider, and shows no dialog", async () => {
    const user = userEvent.setup();
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);
    const answers: boolean[] = [];
    render(<Asker onAnswer={(value) => answers.push(value)} />);
    await user.click(screen.getByRole("button", { name: "Ask" }));
    await waitFor(() => expect(answers).toEqual([true]));
    expect(confirmSpy).toHaveBeenCalledWith("Delete draft?\n\nIt cannot be undone.");
    expect(screen.queryByRole("alertdialog")).toBeNull();
  });
});

describe("IconButton shortcut sequence", () => {
  it("shows a sequence as keys with a word between them and sets no aria-keyshortcuts", async () => {
    const user = userEvent.setup();
    render(<IconButton label="Go to inbox" shortcut={{ keys: ["g", "i"], sequence: true }}><svg aria-hidden="true" /></IconButton>);
    const button = screen.getByRole("button", { name: "Go to inbox" });
    expect(button.hasAttribute("aria-keyshortcuts")).toBe(false);
    await user.tab();
    await waitFor(() => expect(document.querySelector(".fui-tooltip")).not.toBeNull());
    const tip = document.querySelector<HTMLElement>(".fui-tooltip")!;
    expect(tip.querySelector(".fui-kbd-group")?.getAttribute("data-sequence")).toBe("true");
    expect(tip.querySelector(".fui-kbd-separator")?.textContent).toBe("then");
    expect(tip.querySelectorAll("kbd.fui-kbd")).toHaveLength(2);
  });
});

describe("RelativeTime deterministic mode", () => {
  const date = "2026-09-29T23:41:00Z";
  const format = { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" } as const;

  /** Server-render in one zone, hydrate in another; returns every hydration problem React reported (console.error and reportError). */
  function hydrateAcrossZones(tree: ReactNode, serverZone: string, clientZone: string) {
    const problems: string[] = [];
    vi.spyOn(console, "error").mockImplementation((...args) => void problems.push(String(args[0])));
    const onError = (event: ErrorEvent) => {
      problems.push(String(event.message));
      event.preventDefault();
    };
    window.addEventListener("error", onError);
    const original = process.env.TZ;
    try {
      process.env.TZ = serverZone;
      const html = renderToString(tree);
      process.env.TZ = clientZone;
      const container = document.body.appendChild(document.createElement("div"));
      container.innerHTML = html;
      render(tree, { container, hydrate: true });
    } finally {
      window.removeEventListener("error", onError);
      if (original === undefined) delete process.env.TZ;
      else process.env.TZ = original;
    }
    return problems;
  }

  it("hydrates a fixed zone without a warning, even when the browser's zone differs from the server's", () => {
    const problems = hydrateAcrossZones(
      <RelativeTime date={date} timeZone="Europe/Madrid" absoluteFormat={format} />,
      "Asia/Tokyo",
      "America/Los_Angeles",
    );
    expect(problems).toEqual([]);
    expect(screen.getByText(/Sep\w* 30, 1:41 AM/)).toBeTruthy();
    expect(document.querySelector("time")?.getAttribute("title")).toMatch(/1:41:00 AM (GMT\+2|CEST)/);
  });

  it("control: without a timeZone the same hydration does differ between zones (why the prop exists)", () => {
    const problems = hydrateAcrossZones(<RelativeTime date={date} absoluteFormat={format} />, "Asia/Tokyo", "America/Los_Angeles");
    expect(problems.join("\n")).toMatch(/[Hh]ydration/);
  });

  it("runs no timer when the format is absolute or the clock is a fixed number, and ticks a live one", () => {
    vi.useFakeTimers();
    const timers = vi.spyOn(window, "setTimeout");
    render(
      <>
        <RelativeTime date={date} timeZone="UTC" absoluteFormat={format} />
        <RelativeTime date={date} now={Date.parse("2026-09-30T00:41:00Z")} />
      </>,
    );
    const during = timers.mock.calls.filter(([, delay]) => typeof delay === "number" && delay >= 5000);
    expect(during).toHaveLength(0);
    cleanup();
    render(<RelativeTime date={date} />);
    expect(timers.mock.calls.some(([, delay]) => typeof delay === "number" && delay >= 5000)).toBe(true);
  });

  it("reads a clock function at every tick without restarting when its identity changes", () => {
    vi.useFakeTimers();
    let instant = Date.parse("2026-09-29T23:41:30Z");
    const first = () => instant;
    const { rerender } = render(<RelativeTime date={date} now={first} />);
    expect(screen.getByText("now")).toBeTruthy();
    rerender(<RelativeTime date={date} now={() => instant} />);
    instant = Date.parse("2026-09-29T23:52:00Z");
    act(() => {
      vi.advanceTimersByTime(30_000);
    });
    expect(screen.getByText("11 minutes ago")).toBeTruthy();
  });
});

describe("Kbd modifier", () => {
  beforeEach(() => {
    Object.defineProperty(window.navigator, "platform", { value: "MacIntel", configurable: true });
  });
  afterEach(() => {
    Reflect.deleteProperty(window.navigator, "platform");
  });

  it("hydrates as Ctrl and becomes the command key on Apple after mount, with no warning", async () => {
    const errors = vi.spyOn(console, "error").mockImplementation(() => undefined);
    function Hint() {
      const key = useModifierKey();
      return (
        <p>
          <Kbd mod data-testid="mod" />
          <span data-testid="hook">{key}</span>
        </p>
      );
    }
    const tree: ReactNode = <Hint />;
    const container = document.body.appendChild(document.createElement("div"));
    container.innerHTML = renderToString(tree);
    expect(container.querySelector("[data-testid=mod]")?.textContent).toBe("Ctrl");
    render(tree, { container, hydrate: true });
    await waitFor(() => expect(screen.getByTestId("mod").textContent).toBe("⌘"));
    expect(screen.getByTestId("hook").textContent).toBe("⌘");
    expect(errors).not.toHaveBeenCalled();
  });

  it("stays Ctrl on other platforms", () => {
    Object.defineProperty(window.navigator, "platform", { value: "Linux x86_64", configurable: true });
    render(<KbdGroup><Kbd mod /><Kbd>K</Kbd></KbdGroup>);
    expect(document.querySelectorAll("kbd.fui-kbd")[0]?.textContent).toBe("Ctrl");
  });

  it("reads a sequence as keys with the word between them", () => {
    render(<KbdGroup sequence separator="luego" aria-label="G luego I"><Kbd>g</Kbd><Kbd>i</Kbd></KbdGroup>);
    expect(document.querySelector("kbd.fui-kbd-group")?.textContent).toBe("gluegoi");
  });
});

describe("Alert inline", () => {
  it("keeps the source order (title, description, action) so Tab reaches the action once, and reads as a status", async () => {
    const user = userEvent.setup();
    render(
      <>
        <button type="button">Before</button>
        <Alert layout="inline" variant="warning">
          <svg aria-hidden="true" />
          <AlertTitle>Offline</AlertTitle>
          <AlertDescription>Changes wait for the connection.</AlertDescription>
          <AlertAction><Button size="sm" variant="outline">Retry now</Button></AlertAction>
        </Alert>
      </>,
    );
    const status = screen.getByRole("status");
    expect(status.textContent).toBe("OfflineChanges wait for the connection.Retry now");
    expect(status.firstElementChild?.className).toBe("fui-alert-body");
    screen.getByRole("button", { name: "Before" }).focus();
    await user.tab();
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Retry now" }));
  });
});
