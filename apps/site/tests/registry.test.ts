import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import * as ui from "@fabrials/ui";
import { checkConformance } from "@/lib/conformance";
import { loadExternal, visibleExternal } from "@/lib/external";
import { classifyLicenseText, copyrightNotice, npmLicense, spdxExpressionAllowed } from "@/lib/license";
import { coveredPrimitives, shadcnSnapshot, shimSource } from "@/lib/shims";
import {
  classifyRegistryDependency,
  cssText,
  dependenciesOf,
  materializedPath,
  primitivesOf,
  publishExternalItem,
  rewriteImports,
  withNotice,
} from "@/lib/upstreams";

const MIT = `MIT License

Copyright (c) 2024 Example Maintainers

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY.`;

describe("license gate", () => {
  it("accepts the permissive licenses and reads the copyright line", () => {
    expect(classifyLicenseText(MIT)).toBe("MIT");
    expect(copyrightNotice(MIT)).toBe("Copyright (c) 2024 Example Maintainers");
    expect(
      classifyLicenseText(
        "Copyright (c) 2020 A\n\nPermission to use, copy, modify, and/or distribute this software for any purpose with or without fee is hereby granted, provided that the above copyright notice and this permission notice appear in all copies.",
      ),
    ).toBe("ISC");
    expect(
      classifyLicenseText(
        "Apache License, Version 2.0, January 2004\nTERMS AND CONDITIONS FOR USE, REPRODUCTION, AND DISTRIBUTION\n...",
      ),
    ).toBe("Apache-2.0");
    expect(
      classifyLicenseText(
        "Redistribution and use in source and binary forms, with or without modification, are permitted provided that... Neither the name of the copyright holder...",
      ),
    ).toBe("BSD-3-Clause");
  });

  it("rejects copyleft, source-available and MIT with extra terms", () => {
    expect(classifyLicenseText("GNU GENERAL PUBLIC LICENSE\nVersion 3, 29 June 2007")).toBeNull();
    expect(classifyLicenseText("GNU AFFERO GENERAL PUBLIC LICENSE Version 3")).toBeNull();
    expect(classifyLicenseText(`${MIT}\n\n"Commons Clause" License Condition v1.0\nThe Software is provided to you by the Licensor...`)).toBeNull();
    expect(classifyLicenseText(`${MIT}\nYou may not resell the components as a UI kit.`)).toBeNull();
    expect(classifyLicenseText("All rights reserved.")).toBeNull();
    expect(classifyLicenseText("")).toBeNull();
  });

  it("evaluates npm license expressions strictly", () => {
    expect(spdxExpressionAllowed("MIT")).toBe(true);
    expect(spdxExpressionAllowed("(MIT OR GPL-3.0)")).toBe(true);
    expect(spdxExpressionAllowed("MIT AND ISC")).toBe(true);
    expect(spdxExpressionAllowed("MIT AND GPL-3.0")).toBe(false);
    expect(spdxExpressionAllowed("GPL-2.0 WITH Classpath-exception-2.0")).toBe(false);
    expect(spdxExpressionAllowed("SEE LICENSE IN LICENSE.md")).toBe(false);
    expect(spdxExpressionAllowed("")).toBe(false);
    expect(npmLicense({ type: "ISC" })).toBe("ISC");
    expect(npmLicense([{ type: "MIT" }, { type: "Apache-2.0" }])).toBe("(MIT OR Apache-2.0)");
    expect(npmLicense(undefined)).toBeNull();
  });
});

describe("conformance", () => {
  it("names what departs from DESIGN.md and stays quiet for token-only code", () => {
    const loud = checkConformance({
      sources: ['<div className="bg-blue-500 animate-spin bg-gradient-to-r shadow-[0_0_20px] text-[#ff0055]" />'],
      css: { "@keyframes x": { to: { opacity: "1" } } },
      cssVars: { theme: { "animate-x": "x 2s infinite" }, light: { background: "white" } },
    }).map((finding) => finding.check);
    expect(loud).toEqual([
      "literal-colours",
      "continuous-motion",
      "ignores-reduced-motion",
      "gradients",
      "glow",
      "overrides-theme",
    ]);
    const calm = checkConformance({
      sources: ['<div className="bg-background text-muted-foreground motion-reduce:transition-none transition-colors" />'],
    });
    expect(calm).toEqual([]);
  });
});

describe("license notices", () => {
  it("go after the imports, where the shadcn CLI keeps them", () => {
    const notice = "/* N */\n";
    expect(withNotice('import { a } from "a"\nimport {\n  b,\n} from "b"\n\nexport const x = 1\n', notice)).toBe(
      'import { a } from "a"\nimport {\n  b,\n} from "b"\n\n/* N */\nexport const x = 1\n',
    );
    expect(withNotice('"use client";\n\nimport { a } from "a";\nconst y = import("z");\n', notice)).toBe(
      '"use client";\n\nimport { a } from "a";\n\n/* N */\nconst y = import("z");\n',
    );
    expect(withNotice('export { A } from "@fabrials/ui";\n', notice)).toBe('export { A } from "@fabrials/ui";\n\n/* N */\n');
    expect(withNotice("const z = 1\n", notice)).toBe("/* N */\nconst z = 1\n");
  });
});

describe("aggregator transforms", () => {
  const upstream = { name: "magicui", registry: "https://magicui.design/r/{name}.json" };

  it("tells the upstream's own components from shadcn primitives and other registries", () => {
    expect(classifyRegistryDependency("https://magicui.design/r/marquee.json", upstream)).toEqual({ kind: "same", name: "marquee" });
    expect(classifyRegistryDependency("@magicui/marquee", upstream)).toEqual({ kind: "same", name: "marquee" });
    expect(classifyRegistryDependency("button", upstream)).toEqual({ kind: "shadcn", name: "button" });
    expect(classifyRegistryDependency("https://example.com/r/x.json", upstream).kind).toBe("foreign");
    expect(classifyRegistryDependency("@acme/x", upstream).kind).toBe("foreign");
  });

  it("finds the packages and primitives a file really uses", () => {
    const raw = {
      name: "x",
      type: "registry:ui",
      dependencies: ["motion@^12"],
      files: [
        {
          path: "registry/magicui/x.tsx",
          type: "registry:ui",
          content: 'import { a } from "@radix-ui/react-accordion/dist";\nimport { cn } from "@/lib/utils";\nimport { Button } from "@/components/ui/button";\nimport React from "react";',
        },
      ],
    };
    expect(dependenciesOf(raw)).toEqual([
      { name: "@radix-ui/react-accordion", spec: "latest", declared: false },
      { name: "motion", spec: "^12", declared: true },
    ]);
    expect(primitivesOf(raw)).toEqual(["button"]);
  });

  it("installs files and imports where the shadcn CLI would", () => {
    expect(materializedPath({ path: "registry/magicui/marquee.tsx", type: "registry:ui", content: "" })).toBe("marquee.tsx");
    expect(materializedPath({ path: "index.tsx", type: "registry:ui", target: "components/kibo-ui/kanban/index.tsx", content: "" })).toBe(
      "kanban/index.tsx",
    );
    expect(rewriteImports('import { M } from "@/registry/magicui/marquee";\nimport { B } from "@/components/ui/button";', "magicui")).toBe(
      'import { M } from "@/components/external/magicui/marquee";\nimport { B } from "@/components/ui/button";',
    );
    expect(rewriteImports('import { K } from "@/components/kibo-ui/kanban";', "kibo")).toBe('import { K } from "@/components/external/kibo/kanban";');
    expect(cssText({ "@keyframes m": { from: { transform: "x" } } })).toBe("@keyframes m {\n  from {\n    transform: x;\n  }\n}");
  });
});

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
  const libraries = loadExternal();

  it("republishes only snapshots that still pass the offline gate", () => {
    expect(libraries.map((library) => library.snapshot.name)).toEqual(["kibo", "magicui"]);
    for (const { snapshot } of libraries) expect(["MIT", "Apache-2.0", "ISC", "BSD-2-Clause", "BSD-3-Clause", "0BSD"]).toContain(snapshot.license.spdx);
    expect(visibleExternal(libraries).length).toBe(9);
  });

  it("keeps the license notice at the top of every copied file and routes primitives to shims", () => {
    const { snapshot, licenseText, items } = libraries.find((library) => library.snapshot.name === "magicui")!;
    const tree = items.find((entry) => entry.item.name === "file-tree")!;
    const published = publishExternalItem(tree.raw, tree.item, snapshot, licenseText, {
      origin: "https://ui.fabrials.com",
      shims: new Set(["button", "scroll-area"]),
    });
    expect(published.name).toBe("magicui-file-tree");
    // After the imports: shadcn drops comments above the first import on install.
    expect(published.files[0]!.content).toMatch(/^"use client"\n\nimport React,[\s\S]*from "@\/components\/ui\/scroll-area"\n\n\/\*\n \* File Tree from Magic UI/);
    expect(published.files[0]!.content).toContain("Permission is hereby granted");
    expect(published.registryDependencies).toEqual(["https://ui.fabrials.com/r/button.json", "https://ui.fabrials.com/r/scroll-area.json"]);
    expect(published.meta).toMatchObject({ source: "external", license: "MIT", library: "magicui" });
  });

  it("is committed exactly as the build produces it", () => {
    execFileSync("bun", ["scripts/build-registry.ts", "--check"], { stdio: "pipe" });
    execFileSync("bun", ["scripts/generate-external.ts", "--check"], { stdio: "pipe" });
    execFileSync("bun", ["scripts/generate-shims.ts", "--check"], { stdio: "pipe" });
  }, 60_000);

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
