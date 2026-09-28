// Runs the skeleton suite (playwright.loading.config.ts) in the pinned Playwright
// image against a production build of this checkout's site, served on the host.
//
//   bun run test:loading:container                     all engines
//   bun run test:loading:container --project=webkit    one engine; any Playwright argument works
//
// LOADING_PORT (default 3211) picks the port. A server already on it is reused
// only when it serves this checkout's current build. LOADING_SKIP_BUILD=1 serves
// the existing apps/site/.next instead of building packages and site first.
import { spawn, spawnSync } from "node:child_process";
import { once } from "node:events";
import { existsSync, readFileSync } from "node:fs";
import { setTimeout } from "node:timers/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const site = resolve(root, "apps/site");
const image =
  "mcr.microsoft.com/playwright:v1.58.2-noble@sha256:6446946a1d9fd62d9ae501312a2d76a43ee688542b21622056a372959b65d63d";
const port = process.env.LOADING_PORT ?? "3211";
const url = `http://127.0.0.1:${port}`;
const buildId = () => {
  const file = resolve(site, ".next/BUILD_ID");
  return existsSync(file) ? readFileSync(file, "utf8").trim() : null;
};
const probe = (path) =>
  fetch(`${url}${path}`, { signal: AbortSignal.timeout(2000) }).then(
    (response) => response.ok,
    () => false,
  );
const answering = () => probe("/api/health");
const servesThisBuild = async () => {
  const id = buildId();
  return id !== null && (await probe(`/_next/static/${id}/_buildManifest.js`)) && (await probe("/components"));
};
const run = (command, args, cwd = root) => {
  const result = spawnSync(command, args, { cwd, stdio: "inherit" });
  if (result.status !== 0) throw new Error(`${command} ${args.join(" ")} failed`);
};

let server;
try {
  if (await answering()) {
    if (!(await servesThisBuild()))
      throw new Error(`Port ${port} serves something other than this checkout's current build; stop it or set LOADING_PORT`);
    console.log(`Reusing the site already served on ${url}`);
  } else {
    if (!process.env.LOADING_SKIP_BUILD) {
      run("bun", ["run", "build"]);
      run("bun", ["run", "--cwd", "apps/site", "build"]);
    }
    server = spawn(resolve(site, "node_modules/.bin/next"), ["start", "-p", port], {
      cwd: site,
      stdio: "ignore",
      detached: true,
    });
    server.on("error", (error) => console.error(error.message));
    const deadline = Date.now() + 60_000;
    while (!(await servesThisBuild())) {
      if (server.exitCode !== null || Date.now() > deadline) throw new Error(`The site failed to start on ${url}`);
      await setTimeout(250);
    }
  }
  const child = spawn(
    "docker",
    [
      "run",
      "--rm",
      "--network",
      "host",
      "--shm-size=2g",
      "--user",
      `${process.getuid()}:${process.getgid()}`,
      "--mount",
      `type=bind,source=${root},target=/work`,
      "--workdir",
      "/work",
      "--env",
      "LOADING_EXTERNAL=1",
      "--env",
      `LOADING_PORT=${port}`,
      // LOADING_WORKERS, LOADING_DEBUG and the like, and CI, reach the suite unchanged.
      ...Object.keys(process.env)
        .filter((key) => (key.startsWith("LOADING_") && !["LOADING_EXTERNAL", "LOADING_PORT"].includes(key)) || key === "CI")
        .flatMap((key) => ["--env", `${key}=${process.env[key]}`]),
      image,
      "node",
      "node_modules/@playwright/test/cli.js",
      "test",
      "--config",
      "playwright.loading.config.ts",
      ...process.argv.slice(2),
    ],
    { stdio: "inherit" },
  );
  const [code] = await once(child, "exit");
  process.exitCode = code ?? 1;
} finally {
  if (server?.pid) process.kill(-server.pid, "SIGTERM");
}
