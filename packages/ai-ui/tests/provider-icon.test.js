import { expect, test } from "bun:test";
import { providerBrand } from "../src/provider-icon";
import { providerIcons } from "../src/provider-icon-data";

test("opencode go uses the opencode mark", () => {
  expect(providerBrand("opencode-go")).toBe("opencode");
  expect(providerBrand("OpenCode-Go")).toBe("opencode");
  expect(providerBrand("opencode")).toBe("opencode");
  expect(providerIcons.opencode).toContain('fill="#F1ECEC"');
  expect(providerIcons.opencode).toContain('fill="#5A5858"');
});

test("known providers keep their marks", () => {
  expect(providerBrand("grok")).toBe("grok");
  expect(providerBrand("xai")).toBe("grok");
  expect(providerBrand("codex")).toBe("openai");
  expect(providerBrand("nous")).toBe("nousresearch");
  expect(providerBrand("mystery")).toBe(null);
});
