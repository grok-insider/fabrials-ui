// @vitest-environment jsdom
import { afterEach, expect, it } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Kbd, KbdGroup } from "@/components/ui/kbd";

afterEach(cleanup);

it("opens a shimmed submenu from the keyboard", async () => {
  const user = userEvent.setup();
  render(
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="outline" />}>Move to</DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem>Inbox</DropdownMenuItem>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>Project</DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuItem>Spanreed</DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
      </DropdownMenuContent>
    </DropdownMenu>,
  );
  await user.click(screen.getByRole("button", { name: "Move to" }));
  const project = await screen.findByRole("menuitem", { name: "Project" });
  project.focus();
  await user.keyboard("{ArrowRight}");
  await waitFor(() => expect(screen.getByRole("menuitem", { name: "Spanreed" })).toBeTruthy());
});

it("groups keys with shadcn's names", () => {
  render(
    <KbdGroup>
      <Kbd>Ctrl</Kbd>
      <Kbd>K</Kbd>
    </KbdGroup>,
  );
  expect(screen.getByText("Ctrl").parentElement?.className).toBe("fui-kbd-group");
});
