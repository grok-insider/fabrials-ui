import { randomBytes, randomUUID } from "node:crypto";
export type DemoCommand = {
  id: string;
  name: string;
  args: Record<string, unknown>;
};
type Pending = {
  command: DemoCommand;
  delivered: boolean;
  settle: (result: unknown, error?: string) => void;
};
type Session = {
  owner: string;
  client: string;
  expires: number;
  heartbeat: number;
  jobs: Map<string, Pending>;
  wake?: () => void;
};
const lifetime = 30 * 60_000;
/** Ephemeral capabilities, never persisted. One Node replica; a restart revokes all sessions. */
export class DemoSessions {
  private sessions = new Set<Session>();
  private sweep() {
    for (const s of this.sessions)
      if (s.expires < Date.now() || Date.now() - s.heartbeat > 45_000)
        this.close(s);
  }
  create() {
    this.sweep();
    if (this.sessions.size >= 100)
      throw Error("Demo is busy. Try again shortly.");
    const s: Session = {
      owner: randomBytes(32).toString("hex"),
      client: randomBytes(32).toString("hex"),
      expires: Date.now() + lifetime,
      heartbeat: Date.now(),
      jobs: new Map(),
    };
    this.sessions.add(s);
    return { owner: s.owner, token: s.client, expiresAt: s.expires };
  }
  find(token: string, role: "owner" | "client") {
    this.sweep();
    return [...this.sessions].find((s) => s[role] === token);
  }
  close(s: Session) {
    this.sessions.delete(s);
    for (const job of [...s.jobs.values()])
      job.settle(
        null,
        "Session disconnected. No automatic retry; inspect the visible state before repeating an action.",
      );
    s.wake?.();
  }
  async poll(s: Session, signal: AbortSignal) {
    s.heartbeat = Date.now();
    if (s.wake) throw Error("A listener is already connected.");
    const next = () => [...s.jobs.values()].find((j) => !j.delivered);
    if (!next())
      await new Promise<void>((resolve) => {
        const finish = () => {
          clearTimeout(timer);
          signal.removeEventListener("abort", finish);
          s.wake = undefined;
          resolve();
        };
        const timer = setTimeout(finish, 20_000);
        s.wake = finish;
        if (signal.aborted) finish();
        else signal.addEventListener("abort", finish, { once: true });
      });
    signal.throwIfAborted();
    s.heartbeat = Date.now();
    const job = next();
    if (job) job.delivered = true;
    return job?.command ?? null;
  }
  call(s: Session, name: string, args: Record<string, unknown>) {
    if (!this.sessions.has(s)) return Promise.reject(Error("Session expired."));
    if (s.jobs.size >= 8)
      return Promise.reject(Error("Too many pending actions."));
    return new Promise<unknown>((resolve, reject) => {
      const id = randomUUID();
      const timer = setTimeout(
        () =>
          settle(
            null,
            "Browser did not confirm the action. It may have run; inspect the visible state before trying again.",
          ),
        15_000,
      );
      const settle = (result: unknown, error?: string) => {
        clearTimeout(timer);
        s.jobs.delete(id);
        if (error) reject(Error(error));
        else resolve(result);
      };
      s.jobs.set(id, { command: { id, name, args }, delivered: false, settle });
      s.wake?.();
    });
  }
  reply(s: Session, id: string, result: unknown, error?: string) {
    const job = s.jobs.get(id);
    if (!job?.delivered) return false;
    job.settle(result, error);
    return true;
  }
}
const globalState = globalThis as typeof globalThis & {
  fabrialsDemoSessions?: DemoSessions;
};
export const demoSessions = (globalState.fabrialsDemoSessions ??=
  new DemoSessions());
export function bearer(request: Request) {
  return (
    /^Bearer ([a-f0-9]{64})$/.exec(
      request.headers.get("authorization") || "",
    )?.[1] ?? ""
  );
}
export function allowedOrigin(request: Request) {
  const origin = request.headers.get("origin");
  return (
    !origin ||
    origin === "https://ui.fabrials.com" ||
    (process.env.NODE_ENV !== "production" &&
      ["http://localhost:3210", "http://127.0.0.1:3210"].includes(origin))
  );
}
export function privateJson(data: unknown, status = 200) {
  return Response.json(data, {
    status,
    headers: { "Cache-Control": "no-store", "Referrer-Policy": "no-referrer" },
  });
}
export async function smallJson(request: Request) {
  const reader = request.body?.getReader();
  if (!reader) throw Error("Missing body");
  let text = "";
  let bytes = 0;
  const decoder = new TextDecoder();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    bytes += value.length;
    if (bytes > 16_384) {
      await reader.cancel();
      throw Error("Body too large");
    }
    text += decoder.decode(value, { stream: true });
  }
  return JSON.parse(text + decoder.decode());
}
