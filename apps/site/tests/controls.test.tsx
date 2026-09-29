// @vitest-environment jsdom
// Keyboard and behaviour of the 0.8 controls: IconButton, Toolbar, FileInput, Disclosure and the native choices.
// The markup and class hooks are asserted in tests/unit/controls.test.tsx (bun); this file needs a DOM, so it lives
// with the site's jsdom suite and runs against the built package.
import { afterEach, describe, expect, it, vi } from "vitest";
import { useState } from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  Disclosure,
  DisclosurePanel,
  DisclosureSummary,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  FieldSet,
  FileInput,
  IconButton,
  NativeCheckbox,
  NativeRadio,
  NativeRadioGroup,
  ThemeSwitcher,
  Toolbar,
  ToolbarButton,
  ToolbarGroup,
  ToolbarSeparator,
} from "@fabrials/ui";

afterEach(cleanup);

const icon = <svg aria-hidden="true" width="16" height="16" />;
// Base UI's tooltip popup has no role; it is the only .fui-tooltip in the document.
const tooltip = () => document.querySelector<HTMLElement>(".fui-tooltip");
const openTooltip = () => waitFor(() => expect(tooltip()).not.toBeNull()).then(() => tooltip()!);

describe("IconButton", () => {
  it("is named by aria-label, shows its tooltip on keyboard focus and closes it with Escape", async () => {
    const user = userEvent.setup();
    render(<IconButton label="Rename" shortcut={["⌘", "K"]}>{icon}</IconButton>);
    const button = screen.getByRole("button", { name: "Rename" });
    expect(button.getAttribute("aria-keyshortcuts")).toBe("Meta+K");
    expect(button.hasAttribute("title")).toBe(false);
    await user.tab();
    expect(document.activeElement).toBe(button);
    const tip = await openTooltip();
    expect(tip.textContent).toContain("Rename");
    expect(tip.querySelectorAll("kbd.fui-kbd").length).toBe(2);
    await user.keyboard("{Escape}");
    await waitFor(() => expect(tooltip()).toBeNull());
  });

  it("keeps a text-node name (no aria-label) for toolbars that read textContent", () => {
    render(<IconButton label="Archive" textName tooltip={false}>{icon}</IconButton>);
    const button = screen.getByRole("button", { name: "Archive" });
    expect(button.textContent).toBe("Archive");
    expect(button.hasAttribute("aria-label")).toBe(false);
  });

  it("renders as a Base UI trigger: Enter opens the menu and the tooltip wrapper survives disabling", async () => {
    const user = userEvent.setup();
    const { rerender } = render(
      <DropdownMenu>
        <DropdownMenuTrigger render={<IconButton label="More actions">{icon}</IconButton>} />
        <DropdownMenuContent>
          <DropdownMenuItem>Archive</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>,
    );
    await user.tab();
    await openTooltip();
    await user.keyboard("{Enter}");
    expect(await screen.findByRole("menuitem", { name: "Archive" })).toBeTruthy();
    await user.keyboard("{Escape}");
    const before = screen.getByRole("button", { name: "More actions" });
    rerender(
      <DropdownMenu>
        <DropdownMenuTrigger disabled render={<IconButton label="More actions">{icon}</IconButton>} />
        <DropdownMenuContent>
          <DropdownMenuItem>Archive</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>,
    );
    expect(screen.getByRole("button", { name: "More actions" })).toBe(before);
  });
});

describe("Toolbar", () => {
  function Bar({ children }: { children?: React.ReactNode }) {
    return (
      <>
        <button type="button">Before</button>
        <Toolbar aria-label="Message actions">
          <ToolbarGroup aria-label="Reply">
            <ToolbarButton label="Reply">{icon}</ToolbarButton>
            <ToolbarButton label="Reply all">{icon}</ToolbarButton>
          </ToolbarGroup>
          <ToolbarSeparator />
          {children}
          <ToolbarButton label="Archive">{icon}</ToolbarButton>
          <ToolbarButton label="Trash">{icon}</ToolbarButton>
        </Toolbar>
        <button type="button">After</button>
      </>
    );
  }

  it("is one tab stop with roving arrows, Home and End, and a labelled group", async () => {
    const user = userEvent.setup();
    render(<Bar />);
    expect(screen.getByRole("toolbar", { name: "Message actions" }).getAttribute("aria-orientation")).toBe("horizontal");
    expect(screen.getByRole("group", { name: "Reply" })).toBeTruthy();
    expect(screen.getByRole("separator")).toBeTruthy();
    screen.getByRole("button", { name: "Before" }).focus();
    await user.tab();
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Reply" }));
    await user.keyboard("{ArrowRight}");
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Reply all" }));
    await user.keyboard("{ArrowRight}{ArrowRight}");
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Trash" }));
    await user.keyboard("{ArrowRight}");
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Reply" }));
    await user.keyboard("{End}");
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Trash" }));
    await user.keyboard("{Home}");
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Reply" }));
    await user.keyboard("{ArrowLeft}");
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Trash" }));
    // One Tab leaves; Shift+Tab comes back to the item that was current.
    await user.tab();
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "After" }));
    await user.tab({ shift: true });
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Trash" }));
  });

  it("names its buttons with a text node and shows the name in a tooltip on focus", async () => {
    const user = userEvent.setup();
    render(<Bar />);
    expect(screen.getByRole("button", { name: "Archive" }).textContent).toBe("Archive");
    screen.getByRole("button", { name: "Before" }).focus();
    await user.tab();
    expect((await openTooltip()).textContent).toBe("Reply");
  });

  it("keeps a disabled button in the arrow order, with aria-disabled and no click", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(
      <Toolbar aria-label="Actions">
        <ToolbarButton label="One">{icon}</ToolbarButton>
        <ToolbarButton label="Two" disabled onClick={onClick}>{icon}</ToolbarButton>
        <ToolbarButton label="Three">{icon}</ToolbarButton>
      </Toolbar>,
    );
    const two = screen.getByRole("button", { name: "Two" });
    expect(two.getAttribute("aria-disabled")).toBe("true");
    expect(two.hasAttribute("disabled")).toBe(false);
    await user.tab();
    await user.keyboard("{ArrowRight}");
    expect(document.activeElement).toBe(two);
    await user.keyboard("{Enter}");
    await user.click(two);
    expect(onClick).not.toHaveBeenCalled();
    await user.keyboard("{ArrowRight}");
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Three" }));
  });

  it("skips an item that CSS has taken out of the layout, so the tab stop is never lost to it", async () => {
    const user = userEvent.setup();
    render(
      <Toolbar aria-label="Actions">
        <ToolbarButton label="First">{icon}</ToolbarButton>
        <ToolbarButton label="Low" tier="low" style={{ display: "none" }}>{icon}</ToolbarButton>
        <ToolbarButton label="Last">{icon}</ToolbarButton>
      </Toolbar>,
    );
    // Its name is not computed while it is display: none, so it is found by its text.
    const low = screen.getByText("Low").closest("button")!;
    await waitFor(() => expect(low.hasAttribute("disabled")).toBe(true));
    await user.tab();
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "First" }));
    await user.keyboard("{ArrowRight}");
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Last" }));
  });

  it("moves with the arrows the orientation names", async () => {
    const user = userEvent.setup();
    render(
      <Toolbar aria-label="Tools" orientation="vertical">
        <ToolbarButton label="Up">{icon}</ToolbarButton>
        <ToolbarButton label="Down">{icon}</ToolbarButton>
      </Toolbar>,
    );
    expect(screen.getByRole("toolbar").getAttribute("aria-orientation")).toBe("vertical");
    await user.tab();
    await user.keyboard("{ArrowDown}");
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Down" }));
  });

  it("renders a ToolbarButton as a menu trigger inside the roving order", async () => {
    const user = userEvent.setup();
    render(
      <Toolbar aria-label="Actions">
        <ToolbarButton label="Reply">{icon}</ToolbarButton>
        <DropdownMenu>
          <DropdownMenuTrigger render={<ToolbarButton label="More actions">{icon}</ToolbarButton>} />
          <DropdownMenuContent>
            <DropdownMenuItem>Forward</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </Toolbar>,
    );
    await user.tab();
    await user.keyboard("{ArrowRight}");
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "More actions" }));
    await user.keyboard("{Enter}");
    expect(await screen.findByRole("menuitem", { name: "Forward" })).toBeTruthy();
  });
});

describe("FileInput", () => {
  it("is reached by Tab on its real input, reports the files and shows their name", async () => {
    const user = userEvent.setup();
    const onFilesChange = vi.fn();
    const onChange = vi.fn();
    render(<FileInput label="Choose a file" name="attachment" onFilesChange={onFilesChange} onChange={onChange} buttonClassName="composer-attach" description="PDF only" />);
    expect(document.querySelector("label.composer-attach")).not.toBeNull();
    await user.tab();
    const input = document.querySelector<HTMLInputElement>('input[type="file"]')!;
    expect(document.activeElement).toBe(input);
    expect(screen.getByLabelText("Choose a file")).toBe(input);
    const file = new File(["x"], "report.pdf", { type: "application/pdf" });
    await user.upload(input, file);
    expect(onFilesChange).toHaveBeenCalledWith([file]);
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(screen.getByText("report.pdf")).toBeTruthy();
    expect(input.getAttribute("aria-describedby")!.split(" ").length).toBe(2);
  });

  it("clears the picker so the same file can be chosen again, and returns focus to it", async () => {
    const user = userEvent.setup();
    const onClear = vi.fn();
    const onFilesChange = vi.fn();
    render(<FileInput label="Choose a file" onFilesChange={onFilesChange} onClear={onClear} clearLabel="Remove attachment" />);
    const input = document.querySelector<HTMLInputElement>('input[type="file"]')!;
    const file = new File(["x"], "same.txt", { type: "text/plain" });
    await user.upload(input, file);
    await user.click(screen.getByRole("button", { name: "Remove attachment" }));
    expect(onClear).toHaveBeenCalledTimes(1);
    expect(input.files?.length).toBe(0);
    expect(screen.queryByText("same.txt")).toBeNull();
    expect(screen.queryByRole("button", { name: "Remove attachment" })).toBeNull();
    expect(document.activeElement).toBe(input);
    await user.upload(input, file);
    expect(onFilesChange).toHaveBeenCalledTimes(2);
  });

  it("marks the input invalid with its error, and a controlled name wins over the chosen one", () => {
    render(<FileInput label="Choose a file" fileName="Uploaded: invoice.pdf" error="The file is too large" />);
    const input = document.querySelector<HTMLInputElement>('input[type="file"]')!;
    expect(input.getAttribute("aria-invalid")).toBe("true");
    expect(screen.getByRole("alert").textContent).toBe("The file is too large");
    expect(screen.getByText("Uploaded: invoice.pdf")).toBeTruthy();
  });

  it("is disabled as a whole", () => {
    render(<FileInput label="Choose a file" disabled fileName="a.txt" onClear={() => undefined} />);
    expect(document.querySelector<HTMLInputElement>('input[type="file"]')!.disabled).toBe(true);
    expect((screen.getByRole("button", { name: "Remove file" }) as HTMLButtonElement).disabled).toBe(true);
  });
});

describe("Disclosure", () => {
  it("opens and closes from its summary, keeps the panel mounted and reads the count as part of the name", async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();
    render(
      <Disclosure onToggle={onToggle}>
        <DisclosureSummary count="12">Conversation</DisclosureSummary>
        <DisclosurePanel>Thread</DisclosurePanel>
      </Disclosure>,
    );
    const details = document.querySelector("details")!;
    const summary = screen.getByText("Conversation").closest("summary")!;
    expect(summary.textContent).toBe("Conversation12");
    expect(screen.getByText("Thread")).toBeTruthy();
    expect(details.open).toBe(false);
    await user.tab();
    expect(document.activeElement).toBe(summary);
    await user.click(summary);
    expect(details.open).toBe(true);
    await user.click(summary);
    expect(details.open).toBe(false);
  });

  it("opens itself when a field inside fails validation, unless told not to", () => {
    render(
      <>
        <Disclosure data-testid="auto">
          <DisclosureSummary>Advanced</DisclosureSummary>
          <input aria-label="Keyword" required />
        </Disclosure>
        <Disclosure data-testid="off" revealInvalid={false}>
          <DisclosureSummary>Other</DisclosureSummary>
          <input aria-label="Other keyword" required />
        </Disclosure>
      </>,
    );
    fireEvent.invalid(screen.getByLabelText("Keyword", { selector: "input" }));
    fireEvent.invalid(screen.getByLabelText("Other keyword", { selector: "input" }));
    expect((screen.getByTestId("auto") as HTMLDetailsElement).open).toBe(true);
    expect((screen.getByTestId("off") as HTMLDetailsElement).open).toBe(false);
  });
});

describe("native choices", () => {
  it("keeps a checkbox mixed after a click when the host's state does not change, and merges the ref", async () => {
    const user = userEvent.setup();
    const ref = { current: null as HTMLInputElement | null };
    render(<NativeCheckbox ref={ref} label="Select page" indeterminate checked={false} onChange={() => undefined} />);
    const box = screen.getByRole("checkbox", { name: "Select page" }) as HTMLInputElement;
    expect(ref.current).toBe(box);
    expect(box.indeterminate).toBe(true);
    await user.click(box);
    await waitFor(() => expect(box.indeterminate).toBe(true));
  });

  it("follows the prop: mixed while some are ticked, plain once the host says so", async () => {
    const user = userEvent.setup();
    function Host() {
      const [state, setState] = useState<"mixed" | "all">("mixed");
      return <NativeCheckbox label="All" indeterminate={state === "mixed"} checked={state === "all"} onChange={() => setState("all")} />;
    }
    render(<Host />);
    const box = screen.getByRole("checkbox", { name: "All" }) as HTMLInputElement;
    expect(box.indeterminate).toBe(true);
    await user.click(box);
    await waitFor(() => expect(box.indeterminate).toBe(false));
    expect(box.checked).toBe(true);
  });

  it("a radio group is a fieldset with a legend; a disabled fieldset disables every native radio", () => {
    render(
      <NativeRadioGroup legend="Label colour" disabled>
        <NativeRadio name="colour" value="red" label="Red" defaultChecked />
        <NativeRadio name="colour" value="blue" label="Blue" />
      </NativeRadioGroup>,
    );
    const group = screen.getByRole("group", { name: "Label colour" });
    expect(group.tagName).toBe("FIELDSET");
    for (const radio of screen.getAllByRole("radio")) expect((radio as HTMLInputElement).matches(":disabled")).toBe(true);
    expect((screen.getByRole("radio", { name: "Red" }) as HTMLInputElement).checked).toBe(true);
  });

  it("changes the checked radio by name on click, as one group", async () => {
    const user = userEvent.setup();
    render(
      <FieldSet>
        <NativeRadio name="c" value="red" label="Red" defaultChecked />
        <NativeRadio name="c" value="blue" label="Blue" />
      </FieldSet>,
    );
    await user.click(screen.getByRole("radio", { name: "Blue" }));
    expect((screen.getByRole("radio", { name: "Red" }) as HTMLInputElement).checked).toBe(false);
    expect((screen.getByRole("radio", { name: "Blue" }) as HTMLInputElement).checked).toBe(true);
  });
});

describe("ThemeSwitcher and toggle sizes", () => {
  it("keeps its arrow-key order at every size", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<ThemeSwitcher size="lg" value="system" onValueChange={onValueChange} />);
    expect(screen.getByRole("group", { name: "Theme" }).getAttribute("data-size")).toBe("lg");
    await user.tab();
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "System" }));
    await user.keyboard("{ArrowRight}");
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Light" }));
    await user.keyboard("{Enter}");
    expect(onValueChange).toHaveBeenCalledWith("light");
  });
});
