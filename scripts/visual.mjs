import { spawn } from "node:child_process";
import { once } from "node:events";
import { setTimeout } from "node:timers/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const image =
  "mcr.microsoft.com/playwright:v1.58.2-noble@sha256:6446946a1d9fd62d9ae501312a2d76a43ee688542b21622056a372959b65d63d";
const ready = () =>
  fetch("http://127.0.0.1:6041/index.json", {
    signal: AbortSignal.timeout(1000),
  }).then(
    (response) => response.ok,
    () => false,
  );
let server;
try {
  if (!(await ready())) {
    server = spawn("bun", ["run", "storybook", "--ci"], {
      cwd: root,
      stdio: "ignore",
      detached: true,
    });
    server.on("error", (error) => {
      console.error(error.message);
    });
    const deadline = Date.now() + 60_000;
    while (!(await ready())) {
      if (server.exitCode !== null || Date.now() > deadline)
        throw new Error("Storybook failed to start on localhost:6041");
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
      "--shm-size=512m",
      "--user",
      `${process.getuid()}:${process.getgid()}`,
      "--mount",
      `type=bind,source=${root},target=/work`,
      "--workdir",
      "/work",
      image,
      "node",
      "node_modules/@playwright/test/cli.js",
      "test",
      ...process.argv.slice(2),
    ],
    { stdio: "inherit" },
  );
  const [code] = await once(child, "exit");
  process.exitCode = code ?? 1;
} finally {
  if (server?.pid) process.kill(-server.pid, "SIGTERM");
}
