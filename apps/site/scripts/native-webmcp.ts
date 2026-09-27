import { chromium } from "playwright-core";
import assert from "node:assert/strict";
const executablePath = process.env.CHROME_BIN;
if (!executablePath)
  throw new Error(
    "Set CHROME_BIN to the actual Chrome binary (not a desktop launcher).",
  );
const browser = await chromium.launch({
  executablePath,
  headless: true,
  args: ["--enable-features=WebMCPTesting", "--enable-blink-features=WebMCP"],
});
type NativeTool = { name: string };
type NativeModelContext = {
  getTools: () => Promise<NativeTool[]>;
  executeTool: (tool: NativeTool, args: string) => Promise<unknown>;
};
try {
  const page = await browser.newPage();
  const origin = process.env.TEST_ORIGIN ?? "http://localhost:3210";
  await page.goto(origin);
  assert.equal(
    await page.getByRole("button", { name: "Manual", exact: true }).count(),
    0,
  );
  assert.equal(await page.locator("video").count(), 0);
  await page.goto(`${origin}/playground#comparison`);
  await page.waitForFunction(async () =>
    (
      await (
        document as unknown as { modelContext: NativeModelContext }
      ).modelContext.getTools()
    ).some((t) => t.name === "compare_coffee_machines"),
  );
  const execute = async (name: string, args: Record<string, unknown>) =>
    page.evaluate(
      async ({ name, args }) => {
        const context = (
          document as unknown as { modelContext: NativeModelContext }
        ).modelContext;
        let tool = (await context.getTools()).find((t) => t.name === name);
        // React StrictMode can abort the first registration while the native
        // discovery promise resolves. Wait for registration only; never replay execution.
        const deadline = Date.now() + 3000;
        while (!tool && Date.now() < deadline) {
          await new Promise((resolve) => setTimeout(resolve, 30));
          tool = (await context.getTools()).find((t) => t.name === name);
        }
        if (!tool) throw new Error(`Missing native tool ${name}`);
        return context.executeTool(tool, JSON.stringify(args));
      },
      { name, args },
    );
  await execute("compare_coffee_machines", { maxWidth: 32, fitting: "58 mm" });
  await page
    .getByText("Studio Dual fits your setup.", { exact: true })
    .waitFor();
  await execute("set_coffee_cart", { productId: "studio" });
  await page.waitForFunction(async () =>
    (
      await (
        document as unknown as { modelContext: NativeModelContext }
      ).modelContext.getTools()
    ).some((t) => t.name === "set_coffee_filter"),
  );
  await execute("set_coffee_filter", { included: true });
  await page.getByText("€1,314", { exact: true }).waitFor();
  await page.getByRole("button", { name: /Filter added/ }).click();
  assert.equal(await page.getByText("€1,314", { exact: true }).count(), 0);
  await execute("review_coffee_cart", {});
  await page.getByRole("dialog").waitFor();
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  await execute("set_coffee_cart", { productId: "" });
  await page.waitForFunction(
    async () =>
      !(
        await (
          document as unknown as { modelContext: NativeModelContext }
        ).modelContext.getTools()
      ).some((t) => t.name === "set_coffee_filter"),
  );
  console.log(
    "Native coffee comparison, conditional cart tools, human correction and review passed.",
  );
  await page.goto(`${origin}/playground#travel`);
  await execute("find_quiet_stays", { budget: 180 });
  await page
    .locator("#travel")
    .getByRole("status")
    .filter({ hasText: "1 quiet stays" })
    .waitFor();
  await execute("shortlist_stay", { id: "canal" });
  await page
    .locator("#travel")
    .getByRole("status")
    .filter({ hasText: "Canal House" })
    .waitFor();
  await page.goto(`${origin}/playground#support`);
  await execute("filter_support_queue", { priority: "High" });
  assert.equal(
    await page.locator("#support").getByText("Invoice address update").count(),
    0,
  );
  await execute("prepare_ticket_resolution", { id: "SUP-104" });
  await page.getByRole("dialog").waitFor();
  await page
    .getByRole("button", { name: "Resolve ticket", exact: true })
    .click();
  await page
    .locator("#support")
    .getByRole("status")
    .filter({ hasText: "1 resolved" })
    .waitFor();
  await page.goto(`${origin}/playground#onboarding`);
  await execute("prepare_workspace", { name: "Field ops", size: "11–50" });
  await page
    .locator("#onboarding")
    .getByRole("button", { name: "Complete", exact: true })
    .click();
  await page
    .locator("#onboarding")
    .getByRole("status")
    .filter({ hasText: "11–50" })
    .waitFor();
  console.log(
    "Native travel, support review and workspace preparation passed.",
  );
  await page.goto(
    `${process.env.TEST_ORIGIN ?? "http://localhost:3210"}/playground#explorer`,
  );
  await page
    .locator("#explorer")
    .getByText("WebMCP available", { exact: true })
    .waitFor();
  const result = await page.evaluate(async () => {
    const context = (
      document as unknown as { modelContext: NativeModelContext }
    ).modelContext;
    const tools = await context.getTools();
    const filter = tools.find((t) => t.name === "filter_projects");
    if (!filter) throw new Error("Native registration missing.");
    const result = await context.executeTool(
      filter,
      JSON.stringify({ query: "", category: "Browser" }),
    );
    return { names: tools.map((t) => t.name), result };
  });
  await page.waitForFunction(
    () => document.querySelectorAll("#explorer tbody tr").length === 2,
  );
  assert.equal(await page.locator("#explorer tbody tr").count(), 2);
  await page.getByRole("link", { name: "Documentation", exact: true }).click();
  await page
    .getByRole("heading", { name: "Introduction", exact: true })
    .waitFor();
  await page.waitForFunction(
    async () =>
      (
        await (
          document as unknown as { modelContext: NativeModelContext }
        ).modelContext.getTools()
      ).length === 0,
  );
  const remaining = await page.evaluate(async () =>
    (
      await (
        document as unknown as { modelContext: NativeModelContext }
      ).modelContext.getTools()
    ).map((t) => t.name),
  );
  assert.equal(
    remaining.length,
    0,
    "Native tools must unregister on client navigation.",
  );
  await page
    .getByRole("link", { name: "Agent-ready form", exact: true })
    .first()
    .click();
  await page
    .getByRole("textbox", { name: "Project name", exact: true })
    .waitFor();
  const declarative = await page.evaluate(async () => {
    const context = (
      document as unknown as { modelContext: NativeModelContext }
    ).modelContext;
    const tools = await context.getTools();
    return tools.map((t) => t.name);
  });
  assert.ok(
    declarative.includes("find_project"),
    "Declarative form must register natively.",
  );
  await page.evaluate(async () => {
    const context = (
      document as unknown as { modelContext: NativeModelContext }
    ).modelContext;
    const tool = (await context.getTools()).find(
      (t) => t.name === "find_project",
    )!;
    (window as unknown as { nativeCall: Promise<unknown> }).nativeCall =
      context.executeTool(tool, JSON.stringify({ query: "WebMCP" }));
  });
  await page.waitForFunction(
    () =>
      (document.querySelector("input[name=query]") as HTMLInputElement)
        ?.value === "WebMCP",
  );
  await page.getByRole("button", { name: "Find project", exact: true }).click();
  const formResult = await page.evaluate(
    () => (window as unknown as { nativeCall: Promise<unknown> }).nativeCall,
  );
  assert.ok(JSON.stringify(formResult).includes("WebMCP"));
  console.log(
    JSON.stringify(
      {
        browser: browser.version(),
        nativeRegistration: result.names,
        nativeExecution: result.result,
        unregisteredAfterNavigation: remaining.length,
        declarativeForm: declarative,
        formResponse: formResult,
      },
      null,
      2,
    ),
  );
} finally {
  await browser.close();
}
