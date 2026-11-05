import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import * as ui from "@fabrials/ui";
import { coveredPrimitives, shadcnSnapshot, shimSource } from "@/lib/shims";

describe("shims", () => {
  it("ship only for primitives @fabrials/ui covers completely, and stay up to date", () => {
    const covered = coveredPrimitives(Object.keys(ui));
    expect(covered.length).toBeGreaterThanOrEqual(28);
    for (const { name, names } of covered) {
      expect(readFileSync(`registry/shims/${name}.tsx`, "utf8")).toBe(shimSource(name, names));
      for (const exported of names) expect(ui, `${name} needs ${exported}`).toHaveProperty(exported);
    }
    expect(Object.keys(shadcnSnapshot.items).length).toBeGreaterThan(50);
  });
});

describe("published registry", () => {
  it("is committed exactly as the build produces it", () => {
    execFileSync("bun", ["scripts/build-registry.ts", "--check"], { stdio: "pipe" });
    execFileSync("bun", ["scripts/generate-shims.ts", "--check"], { stdio: "pipe" });
  }, 60_000);

  it("publishes only Fabrials entries and shims, never another library's components", () => {
    const index = JSON.parse(readFileSync("public/registry.json", "utf8")) as { items: { name: string; meta: { source: string; license: string } }[] };
    expect(index.items.length).toBeGreaterThan(40);
    for (const item of index.items) {
      expect(["fabrials", "shim"], item.name).toContain(item.meta.source);
      expect(item.meta.license, item.name).toBe("MIT");
    }
    expect(existsSync("registry/external")).toBe(false);
    expect(existsSync("upstreams")).toBe(false);
  });

  it("gives the setup entries the Highstorm palette from the design system tokens", () => {
    const init = JSON.parse(readFileSync("public/r/init.json", "utf8"));
    const styles = JSON.parse(readFileSync("public/r/styles.json", "utf8"));
    expect(init.type).toBe("registry:base");
    expect(init.config).toMatchObject({ style: "base-nova", registries: { "@fabrials": "https://ui.fabrials.com/r/{name}.json" } });
    expect(init.cssVars.theme["font-sans"]).toBe("var(--fui-font-sans)");
    expect(init.cssVars.dark.background).toMatch(/^oklch\(/);
    expect(init.cssVars.light.radius).toBe("0.375rem");
    expect(Object.keys(styles.css)).toContain('@import "@fabrials/ui/tokens.css"');
    expect(styles.dependencies[0]).toMatch(/^@fabrials\/ui@\^0\.\d+\.\d+$/);
  });
});
