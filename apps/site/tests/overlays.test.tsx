// @vitest-environment jsdom
// Behaviour of the 0.8 overlay, command and auth pieces: dialogs with a fixed footer, keepMounted, the non-modal Sheet, the
// IME guard, accordion rows, the command launcher and rows, BulkActions kept mounted, AuthLayout order, StatusPopover.
// Markup and CSS hooks are asserted in tests/unit/overlays.test.tsx (bun); this file needs a DOM, so it lives with the site's
// jsdom suite and runs against the built package (bun run build first).
import { afterEach, describe, expect, it, vi } from "vitest";
import { createRef, useState } from "react";
import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
  AuthLayout,
  Badge,
  BulkActions,
  Button,
  CommandOption,
  CommandOptionList,
  CommandTrigger,
  DescriptionDetails,
  DescriptionItem,
  DescriptionList,
  DescriptionTerm,
  Dialog,
  DialogActions,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Input,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  StatusPopover,
} from "@fabrials/ui";

// Base UI keeps page-level markers (inert, scroll lock) while a modal dialog is open; a test that leaves one open would leak them
// into the next test, so every test closes what it opened before the tree is unmounted.
afterEach(async () => {
  for (let round = 0; round < 3 && document.querySelector('[role="dialog"], [role="alertdialog"]'); round += 1) {
    await userEvent.keyboard("{Escape}");
    await act(async () => {});
  }
  cleanup();
  vi.restoreAllMocks();
});

const Simple = ({ children, ...props }: Partial<React.ComponentProps<typeof DialogContent>>) => (
  <DialogContent {...props}>
    <DialogHeader>
      <DialogTitle>Title</DialogTitle>
      <DialogDescription>Description</DialogDescription>
    </DialogHeader>
    {children}
  </DialogContent>
);

describe("Dialog", () => {
  it("does not close on Escape during an IME composition, and closes on a plain Escape", async () => {
    const user = userEvent.setup();
    const changes: boolean[] = [];
    render(
      <Dialog defaultOpen onOpenChange={(open) => changes.push(open)}>
        <Simple>
          <Input aria-label="Text" />
        </Simple>
      </Dialog>,
    );
    const dialog = await screen.findByRole("dialog");
    const input = within(dialog).getByLabelText("Text");
    input.focus();
    fireEvent.keyDown(input, { key: "Escape", isComposing: true });
    await act(async () => {});
    expect(screen.queryByRole("dialog")).toBeTruthy();
    expect(changes).toEqual([]);
    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(changes).toEqual([false]);
  });

  it("guards an alert dialog the same way", async () => {
    render(
      <AlertDialog defaultOpen>
        <AlertDialogContent>
          <AlertDialogTitle>Delete?</AlertDialogTitle>
          <AlertDialogDescription>Sure?</AlertDialogDescription>
          <Button>Ok</Button>
        </AlertDialogContent>
      </AlertDialog>,
    );
    const dialog = await screen.findByRole("alertdialog");
    fireEvent.keyDown(dialog, { key: "Escape", isComposing: true });
    await act(async () => {});
    expect(screen.queryByRole("alertdialog")).toBeTruthy();
  });

  it("close=footer puts Close first in the footer and no X in the corner; DialogActions follow it", async () => {
    const user = userEvent.setup();
    const submitted = vi.fn((event: { preventDefault(): void }) => event.preventDefault());
    render(
      <Dialog defaultOpen>
        <Simple close="footer" closeLabel="Close it">
          <DialogBody>
            <form id="f" onSubmit={submitted}>
              <Input aria-label="Name" />
              <DialogActions>
                <Button type="submit" form="f">
                  Save
                </Button>
              </DialogActions>
            </form>
          </DialogBody>
          <DialogFooter />
        </Simple>
      </Dialog>,
    );
    const dialog = await screen.findByRole("dialog", { name: "Title" });
    expect(dialog.querySelector(".fui-dialog-close")).toBeNull();
    const footer = dialog.querySelector(".fui-dialog-footer") as HTMLElement;
    await waitFor(() => expect(within(footer).getByRole("button", { name: "Save" })).toBeTruthy());
    const names = within(footer).getAllByRole("button").map((button) => button.textContent);
    expect(names).toEqual(["Close it", "Save"]);
    expect(dialog.getAttribute("data-close")).toBe("footer");
    expect(dialog.querySelector(":scope > .fui-dialog-body")).toBeTruthy();
    // Tab order in the dialog: the field, Close, then the action (the footer comes last in the DOM).
    const input = within(dialog).getByLabelText("Name");
    input.focus();
    await user.tab();
    expect(document.activeElement).toBe(within(footer).getByRole("button", { name: "Close it" }));
    await user.tab();
    expect(document.activeElement).toBe(within(footer).getByRole("button", { name: "Save" }));
    await user.keyboard("{Enter}");
    expect(submitted).toHaveBeenCalledTimes(1);
    await user.click(within(footer).getByRole("button", { name: "Close it" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  });

  it("keeps the footer slot while any DialogActions is mounted: removing one leaves the other in the footer", async () => {
    const user = userEvent.setup();
    function Stages() {
      const [both, setBoth] = useState(true);
      return (
        <Dialog defaultOpen>
          <Simple close="footer">
            <DialogBody>
              <DialogActions>
                <Button>First action</Button>
              </DialogActions>
              {both && (
                <DialogActions>
                  <Button>Second action</Button>
                </DialogActions>
              )}
              <Button onClick={() => setBoth(false)}>Drop second</Button>
            </DialogBody>
            <DialogFooter />
          </Simple>
        </Dialog>
      );
    }
    render(<Stages />);
    const dialog = await screen.findByRole("dialog");
    const footer = dialog.querySelector(".fui-dialog-footer") as HTMLElement;
    await waitFor(() => expect(within(footer).getByRole("button", { name: "Second action" })).toBeTruthy());
    expect(within(footer).getByRole("button", { name: "First action" })).toBeTruthy();
    await user.click(within(dialog).getByRole("button", { name: "Drop second" }));
    await waitFor(() => expect(within(footer).queryByRole("button", { name: "Second action" })).toBeNull());
    expect(within(footer).getByRole("button", { name: "First action" })).toBeTruthy();
  });

  it("uses the corner X by default and DialogFooter showCloseButton adds a Close button (shadcn's name)", async () => {
    render(
      <Dialog defaultOpen>
        <Simple>
          <DialogFooter showCloseButton closeLabel="Done" />
        </Simple>
      </Dialog>,
    );
    const dialog = await screen.findByRole("dialog");
    expect(dialog.querySelector(".fui-dialog-close")).toBeTruthy();
    expect(within(dialog).getByRole("button", { name: "Done" })).toBeTruthy();
    expect(dialog.getAttribute("data-close")).toBe("corner");
  });

  it("carries size and padding as attributes", async () => {
    render(
      <Dialog defaultOpen>
        <Simple size="settings" padding="none" />
      </Dialog>,
    );
    const dialog = await screen.findByRole("dialog");
    expect(dialog.getAttribute("data-size")).toBe("settings");
    expect(dialog.getAttribute("data-padding")).toBe("none");
  });
});

describe("keepMounted", () => {
  function KeptDialog() {
    return (
      <Dialog>
        <DialogTrigger render={<Button>Open</Button>} />
        <Simple keepMounted close="footer">
          <Input aria-label="Reply" />
          <DialogFooter />
        </Simple>
      </Dialog>
    );
  }

  it("keeps a dialog in the DOM, hidden, and what was typed is there when it opens again", async () => {
    const user = userEvent.setup();
    render(<KeptDialog />);
    const hidden = document.querySelector<HTMLElement>(".fui-dialog");
    expect(hidden).toBeTruthy();
    expect(hidden!.hasAttribute("hidden")).toBe(true);
    await user.click(screen.getByRole("button", { name: "Open" }));
    const field = await screen.findByLabelText("Reply");
    await user.type(field, "kept text");
    await user.click(screen.getByRole("button", { name: "Close" }));
    await waitFor(() => expect(document.querySelector<HTMLElement>(".fui-dialog")?.hasAttribute("hidden")).toBe(true));
    expect((document.querySelector('input[aria-label="Reply"]') as HTMLInputElement).value).toBe("kept text");
    await user.click(screen.getByRole("button", { name: "Open" }));
    expect((await screen.findByLabelText("Reply") as HTMLInputElement).value).toBe("kept text");
  });

  it("without keepMounted the dialog is not in the DOM while closed", () => {
    render(
      <Dialog>
        <Simple />
      </Dialog>,
    );
    expect(document.querySelector(".fui-dialog")).toBeNull();
  });

  it("keeps a popover and a menu mounted", async () => {
    const user = userEvent.setup();
    render(
      <>
        <Popover>
          <PopoverTrigger render={<Button>Pop</Button>} />
          <PopoverContent keepMounted>
            <Input aria-label="Name" />
          </PopoverContent>
        </Popover>
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button>Menu</Button>} />
          <DropdownMenuContent keepMounted>
            <DropdownMenuItem>Archive</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </>,
    );
    // Base UI hides the positioner (and the popup with it); either way the content is in the DOM, inside a hidden element.
    expect(document.querySelector(".fui-popover")?.closest("[hidden]")).toBeTruthy();
    expect(document.querySelector(".fui-menu")?.closest("[hidden]")).toBeTruthy();
    expect(document.querySelector('input[aria-label="Name"]')).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Pop" }));
    await waitFor(() => expect(document.querySelector(".fui-popover")?.closest("[hidden]")).toBeNull());
  });
});

describe("Sheet", () => {
  function Page({ modal }: { modal?: boolean }) {
    return (
      <>
        <input aria-label="Page field" />
        <Sheet modal={modal}>
          <SheetTrigger render={<Button>Tools</Button>} />
          <SheetContent closeLabel="Close tools">
            <SheetHeader>
              <SheetTitle>Tools</SheetTitle>
              <SheetDescription>Drawer</SheetDescription>
            </SheetHeader>
            <Input aria-label="In the sheet" />
          </SheetContent>
        </Sheet>
      </>
    );
  }

  it("is modal by default: a scrim and no interaction with the page", async () => {
    const user = userEvent.setup();
    render(<Page />);
    await user.click(screen.getByRole("button", { name: "Tools" }));
    const dialog = await screen.findByRole("dialog");
    expect(document.querySelector(".fui-backdrop")).toBeTruthy();
    expect(dialog).toBeTruthy();
    // close it so the page's locks are released before the next test
    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  });

  it("modal={false} has no scrim, is not aria-modal, leaves the page tabbable and ignores an outside press", async () => {
    const user = userEvent.setup();
    render(<Page modal={false} />);
    const trigger = screen.getByRole("button", { name: "Tools" });
    await user.click(trigger);
    const dialog = await screen.findByRole("dialog");
    expect(document.querySelector(".fui-backdrop")).toBeNull();
    expect(dialog.getAttribute("aria-modal")).not.toBe("true");
    // The page is not inert: the field can be typed in while the drawer is open, and the drawer stays open.
    const field = screen.getByLabelText("Page field");
    await user.click(field);
    await user.keyboard("typing");
    expect((field as HTMLInputElement).value).toBe("typing");
    fireEvent.pointerDown(document.body);
    fireEvent.mouseDown(document.body);
    fireEvent.click(document.body);
    await act(async () => {});
    expect(screen.queryByRole("dialog")).toBeTruthy();
    // Escape closes it and focus returns to the trigger.
    const inside = within(dialog).getByLabelText("In the sheet");
    inside.focus();
    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    await waitFor(() => expect(document.activeElement).toBe(trigger));
  });

  it("padding=none removes the sheet's padding", async () => {
    render(
      <Sheet defaultOpen>
        <SheetContent padding="none">
          <SheetTitle>T</SheetTitle>
        </SheetContent>
      </Sheet>,
    );
    expect((await screen.findByRole("dialog")).getAttribute("data-padding")).toBe("none");
  });
});

describe("Accordion rows", () => {
  function Tools({ headingRef }: { headingRef?: React.Ref<HTMLHeadingElement> }) {
    return (
      <Accordion variant="rows" multiple defaultValue={["a"]}>
        <AccordionItem value="a">
          <AccordionTrigger headingLevel={2} headingRef={headingRef} icon={<span data-testid="icon" />} aside={<Badge>3</Badge>}>
            Reminders
          </AccordionTrigger>
          <AccordionContent>
            <Input aria-label="Reminder" />
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="b">
          <AccordionTrigger headingLevel={2} aside={<Badge>12</Badge>}>
            Labels
          </AccordionTrigger>
          <AccordionContent>
            <Input aria-label="Label" />
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    );
  }

  it("names the trigger by the title only, describes it by the aside, and puts the heading at the given level", () => {
    render(<Tools />);
    const trigger = screen.getByRole("button", { name: "Reminders" });
    expect(trigger.getAttribute("aria-describedby")).toBeTruthy();
    expect(document.getElementById(trigger.getAttribute("aria-describedby")!)?.textContent).toBe("3");
    expect(screen.getAllByRole("heading", { level: 2 }).map((heading) => heading.textContent)).toEqual(["Reminders", "Labels"]);
    // the tags and the chevron are outside the trigger
    expect(trigger.textContent).toBe("Reminders");
  });

  it("keeps the body of a closed row mounted and hidden, so what was typed survives", async () => {
    const user = userEvent.setup();
    render(<Tools />);
    const closedBody = document.querySelector<HTMLInputElement>('input[aria-label="Label"]');
    expect(closedBody).toBeTruthy();
    expect(closedBody!.closest("[hidden]")).toBeTruthy();
    const trigger = screen.getByRole("button", { name: "Reminders" });
    await user.type(screen.getByLabelText("Reminder"), "typed");
    await user.click(trigger);
    await waitFor(() => expect(screen.getByLabelText("Reminder", { selector: "input" }).closest("[hidden]")).toBeTruthy());
    await user.click(trigger);
    expect((screen.getByLabelText("Reminder") as HTMLInputElement).value).toBe("typed");
  });

  it("focusing the heading lands on the trigger; Enter and Space toggle", async () => {
    const user = userEvent.setup();
    const heading = createRef<HTMLHeadingElement>();
    render(<Tools headingRef={heading} />);
    act(() => heading.current!.focus());
    const trigger = screen.getByRole("button", { name: "Reminders" });
    expect(document.activeElement).toBe(trigger);
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    await user.keyboard("{Enter}");
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    await user.keyboard(" ");
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
  });

  it("the default variant keeps its markup: the chevron is inside the trigger and the panel unmounts when closed", () => {
    render(
      <Accordion>
        <AccordionItem value="a">
          <AccordionTrigger>Plain</AccordionTrigger>
          <AccordionContent>Body</AccordionContent>
        </AccordionItem>
      </Accordion>,
    );
    const trigger = screen.getByRole("button", { name: "Plain" });
    expect(trigger.querySelector(".fui-accordion-chevron")).toBeTruthy();
    expect(document.querySelector(".fui-accordion-head")).toBeNull();
    expect(screen.queryByText("Body")).toBeNull();
  });
});

describe("CommandTrigger and rows", () => {
  it("is a named button with a constant aria-keyshortcuts and a modifier resolved by the platform", async () => {
    const user = userEvent.setup();
    const open = vi.fn();
    render(<CommandTrigger label="Search or run a command" keys={["mod", "K"]} onClick={open} />);
    const button = screen.getByRole("button", { name: "Search or run a command" });
    expect(button.getAttribute("aria-keyshortcuts")).toBe("Control+K Meta+K");
    expect(button.querySelector(".fui-kbd-group")?.getAttribute("aria-hidden")).toBe("true");
    expect(button.querySelector(".fui-kbd-group")?.textContent).toBe("CtrlK");
    await user.tab();
    expect(document.activeElement).toBe(button);
    await user.keyboard("{Enter}");
    expect(open).toHaveBeenCalledTimes(1);
  });

  it("keeps the accessible name when compact, omits the shortcut when told to, and does not act while disabled", async () => {
    const user = userEvent.setup();
    const open = vi.fn();
    render(
      <>
        <CommandTrigger label="Search" name="Search or run a command" compact shortcut={false} keys={["mod", "K"]} />
        <CommandTrigger label="Disabled" disabled onClick={open} />
      </>,
    );
    const compact = screen.getByRole("button", { name: "Search or run a command" });
    expect(compact.hasAttribute("aria-keyshortcuts")).toBe(false);
    expect(compact.getAttribute("data-compact")).toBe("true");
    await user.click(screen.getByRole("button", { name: "Disabled" }));
    expect(open).not.toHaveBeenCalled();
  });

  it("rows: active sets aria-selected, disabled sets aria-disabled and stays a target that can say why", async () => {
    const user = userEvent.setup();
    const run = vi.fn();
    render(
      <CommandOptionList aria-label="Commands">
        <CommandOption id="one" label="Go to Inbox" group="Navigation" active detail="12 unread" onClick={run} />
        <CommandOption id="two" label="Move to Archive" disabled reason="Select a message first." onClick={run} />
        <CommandOption id="three" label="Compose" icon={<span />} keys={<kbd>C</kbd>} />
      </CommandOptionList>,
    );
    const options = screen.getAllByRole("option");
    expect(options.map((option) => option.getAttribute("aria-selected"))).toEqual(["true", "false", "false"]);
    expect(options[0].getAttribute("data-active")).toBe("true");
    expect(options[1].getAttribute("aria-disabled")).toBe("true");
    expect(options[2].getAttribute("data-icon")).toBe("");
    expect(within(options[1]).getByText("Select a message first.")).toBeTruthy();
    await user.click(options[1]);
    expect(run).toHaveBeenCalledTimes(1);
  });
});

describe("BulkActions keepMounted", () => {
  it("renders nothing at 0 by default, and with keepMounted keeps a status and hidden actions", () => {
    const { rerender, container } = render(<BulkActions count={0}>x</BulkActions>);
    expect(container.querySelector(".fui-bulk-actions")).toBeNull();
    rerender(
      <BulkActions count={0} keepMounted>
        <Button>Archive</Button>
      </BulkActions>,
    );
    const region = container.querySelector(".fui-bulk-actions") as HTMLElement;
    expect(region.getAttribute("data-empty")).toBe("true");
    expect(within(region).getByRole("status").textContent).toBe("0 selected");
    expect((region.querySelector(".fui-actions") as HTMLElement).hidden).toBe(true);
    // the same status node changes text: a live region that existed before announces it
    const status = within(region).getByRole("status");
    rerender(
      <BulkActions count={3} keepMounted>
        <Button>Archive</Button>
      </BulkActions>,
    );
    expect(within(container).getByRole("status")).toBe(status);
    expect(status.textContent).toBe("3 selected");
    expect(region.hasAttribute("data-empty")).toBe(false);
    expect((region.querySelector(".fui-actions") as HTMLElement).hidden).toBe(false);
    expect(screen.getByRole("button", { name: "Archive" })).toBeTruthy();
  });
});

describe("AuthLayout", () => {
  it("puts the corner actions after the card in the DOM, so the first stop is the sign-in action", async () => {
    const user = userEvent.setup();
    render(
      <AuthLayout title="Sign in" actions={<Button variant="ghost">English</Button>} aside={<div>storm</div>}>
        <Button>Sign in</Button>
      </AuthLayout>,
    );
    await user.tab();
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Sign in" }));
    await user.tab();
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "English" }));
    const layout = document.querySelector(".fui-auth") as HTMLElement;
    // the corner closes the landmark, after the card; the aside is outside it
    expect(layout.lastElementChild?.tagName).toBe("MAIN");
    expect(layout.lastElementChild?.lastElementChild?.className).toBe("fui-auth-actions");
    expect(layout.querySelector(":scope > aside")?.textContent).toBe("storm");
    expect(layout.getAttribute("data-align")).toBeNull();
  });

  it("is the page's main landmark, unless as is div", () => {
    const { unmount } = render(
      <AuthLayout title="Sign in" id="main" aria-label="Sign in to Fabrials">
        <Button>Go</Button>
      </AuthLayout>,
    );
    const main = screen.getByRole("main", { name: "Sign in to Fabrials" });
    expect(main.id).toBe("main");
    expect(main.className).toBe("fui-auth-main");
    expect(screen.getByRole("heading", { level: 1 }).closest("main")).toBe(main);
    unmount();
    render(
      <AuthLayout as="div" title="Sign in">
        <Button>Go</Button>
      </AuthLayout>,
    );
    expect(screen.queryByRole("main")).toBeNull();
    expect(document.querySelector(".fui-auth-main")?.tagName).toBe("DIV");
  });

  it("carries an explicit alignment", () => {
    render(
      <AuthLayout title="Sign in" align="start">
        <Button>Go</Button>
      </AuthLayout>,
    );
    expect(document.querySelector(".fui-auth")?.getAttribute("data-align")).toBe("start");
  });
});

describe("StatusPopover", () => {
  it("opens a dialog named by its title from a named trigger, and Escape returns focus to it", async () => {
    const user = userEvent.setup();
    render(
      <StatusPopover title="Permissions" description="Some actions are unavailable." icon={<span />} attention="warning">
        <Button>Refresh</Button>
      </StatusPopover>,
    );
    const trigger = screen.getByRole("button", { name: "Permissions: Some actions are unavailable." });
    expect(trigger.getAttribute("title")).toBe("Some actions are unavailable.");
    expect(document.querySelector(".fui-status-popover")?.getAttribute("data-attention")).toBe("warning");
    await user.click(trigger);
    const dialog = await screen.findByRole("dialog", { name: "Permissions" });
    expect(within(dialog).getByRole("button", { name: "Refresh" })).toBeTruthy();
    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    await waitFor(() => expect(document.activeElement).toBe(trigger));
  });

  it("with a label the name is title and label, and compact keeps that name", () => {
    render(
      <>
        <StatusPopover title="Sync" description="Up to date." icon={<span />} label="Synced" attention />
        <StatusPopover title="Sync" description="Up to date." icon={<span />} label="Later" compact />
      </>,
    );
    // (the visually hidden "Sync: " part loses its trailing space in jsdom, which has no layout: the browser adds it)
    expect(screen.getByRole("button", { name: /^Sync:\s*Synced$/ })).toBeTruthy();
    expect(screen.getByRole("button", { name: /^Sync:\s*Later$/ })).toBeTruthy();
    expect(document.querySelectorAll(".fui-status-popover")[0].getAttribute("data-attention")).toBe("danger");
  });
});

describe("DescriptionList layout auto", () => {
  it("is marked for the container rules", () => {
    render(
      <DescriptionList layout="auto">
        <DescriptionItem>
          <DescriptionTerm>From</DescriptionTerm>
          <DescriptionDetails>Ana</DescriptionDetails>
        </DescriptionItem>
      </DescriptionList>,
    );
    expect(document.querySelector("dl")?.getAttribute("data-layout")).toBe("auto");
  });
});
