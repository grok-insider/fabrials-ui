// @vitest-environment jsdom
import { afterEach, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ArgumentsForm } from "@/registry/components/arguments-form";
import { ResultView } from "@/registry/components/result-view";
import { ConfirmationDialog } from "@/registry/components/confirmation-dialog";
afterEach(cleanup);
it("validates a composed schema through the JSON editor", async () => {
  const submit = vi.fn();
  render(
    <ArgumentsForm
      schema={{
        type: "object",
        properties: { ids: { type: "array", items: { type: "integer" } } },
        required: ["ids"],
      }}
      onSubmit={submit}
    />,
  );
  await userEvent.clear(screen.getByRole("textbox"));
  await userEvent.paste('{"ids":[1,2]}');
  await userEvent.click(screen.getByRole("button", { name: "Run tool" }));
  expect(submit).toHaveBeenCalledWith({ ids: [1, 2] });
});
it("renders server HTML as text and blocks javascript links", () => {
  render(
    <ResultView
      result={{
        content: [
          { type: "text", text: "<img src=x onerror=alert(1)>" },
          { type: "resource_link", uri: "javascript:alert(1)", name: "unsafe" },
        ],
      }}
    />,
  );
  expect(screen.getByText("<img src=x onerror=alert(1)>")).toBeTruthy();
  expect(document.querySelector("img")).toBeNull();
  expect(document.querySelector("a")).toBeNull();
});
it("does not run a confirmation action when cancelled", async () => {
  const action = vi.fn();
  const change = vi.fn();
  render(
    <ConfirmationDialog
      open
      onOpenChange={change}
      title="Apply changes?"
      description="This would modify the example."
      onConfirm={action}
    />,
  );
  await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
  expect(action).not.toHaveBeenCalled();
  expect(change).toHaveBeenCalledWith(false);
});
it("falls back safely when an upstream schema has malformed fields", () => {
  render(
    <ArgumentsForm
      schema={
        {
          type: "object",
          properties: { broken: null },
        } as unknown as import("@/registry/mcp/types").JsonSchema
      }
      onSubmit={() => {}}
    />,
  );
  expect(
    screen.getByRole("textbox", { name: "Arguments · JSON" }),
  ).toBeTruthy();
});
