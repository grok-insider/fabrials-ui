// @vitest-environment jsdom
import { beforeEach, it, expect } from "vitest";
import { BrowserOAuthProvider } from "@/registry/mcp/oauth";
beforeEach(() => sessionStorage.clear());
it("keeps tokens out of persistent browser storage and isolates issuers", () => {
  const p = new BrowserOAuthProvider("https://mcp.example");
  p.saveTokens(
    { access_token: "secret-a", token_type: "bearer" },
    { issuer: "https://issuer-a" },
  );
  p.saveTokens(
    { access_token: "secret-b", token_type: "bearer" },
    { issuer: "https://issuer-b" },
  );
  expect(p.tokens({ issuer: "https://issuer-a" })?.access_token).toBe(
    "secret-a",
  );
  expect(p.tokens()?.access_token).toBe("secret-b");
  expect(JSON.stringify(sessionStorage)).not.toContain("secret");
  p.invalidateCredentials("all");
  expect(p.tokens()).toBeUndefined();
});
it("validates state and clears transient verifier after callback", () => {
  const p = new BrowserOAuthProvider("https://mcp.example");
  p.saveCodeVerifier("pkce-value");
  expect(BrowserOAuthProvider.readPending()?.verifier).toBe("pkce-value");
  const resumed = new BrowserOAuthProvider("https://mcp.example", {
    resume: true,
  });
  expect(() =>
    resumed.validateCallback(
      new URLSearchParams({ code: "code", state: "wrong" }),
    ),
  ).toThrow("state");
  expect(() =>
    resumed.validateCallback(
      new URLSearchParams({ error: "access_denied", state: resumed.state() }),
    ),
  ).toThrow("declined");
  expect(() =>
    resumed.validateCallback(
      new URLSearchParams({ code: "code", state: resumed.state() }),
    ),
  ).not.toThrow();
  resumed.complete();
  expect(sessionStorage.length).toBe(0);
});
it("rejects expired redirect sessions", () => {
  const p = new BrowserOAuthProvider("https://mcp.example");
  p.saveCodeVerifier("verifier");
  const key = sessionStorage.key(0)!;
  const saved = JSON.parse(sessionStorage.getItem(key)!);
  saved.createdAt = Date.now() - 601_000;
  sessionStorage.setItem(key, JSON.stringify(saved));
  expect(BrowserOAuthProvider.readPending()).toBeUndefined();
  expect(sessionStorage.length).toBe(0);
});
