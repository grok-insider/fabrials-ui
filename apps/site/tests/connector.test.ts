import { it, expect, vi } from "vitest";
import {
  createConnector,
  isPublicAddress,
  resolveDestination,
} from "@/registry/server/connector";
it("blocks loopback, private, link-local, mapped and reserved addresses", () => {
  for (const ip of [
    "127.0.0.1",
    "10.0.0.1",
    "169.254.169.254",
    "192.168.1.1",
    "::1",
    "fc00::1",
    "::ffff:127.0.0.1",
    "0.0.0.0",
    "224.0.0.1",
  ])
    expect(isPublicAddress(ip), ip).toBe(false);
  expect(isPublicAddress("1.1.1.1")).toBe(true);
});
it("rejects non-HTTPS configured destinations", async () => {
  await expect(resolveDestination("http://example.com")).rejects.toThrow(
    "HTTPS",
  );
});
it("requires origin, authenticated user and configured destination before lookup", async () => {
  const auth = vi.fn(async () => null);
  const connector = createConnector({
    destinations: {},
    allowedOrigins: ["https://app.example"],
    authenticate: auth,
  });
  expect(
    (
      await connector(
        new Request("https://app.example/api", { method: "POST" }),
        "anything",
      )
    ).status,
  ).toBe(403);
  expect(auth).not.toHaveBeenCalled();
  expect(
    (
      await connector(
        new Request("https://app.example/api", {
          method: "POST",
          headers: { Origin: "https://app.example" },
        }),
        "anything",
      )
    ).status,
  ).toBe(401);
  const accepted = createConnector({
    destinations: {},
    allowedOrigins: ["https://app.example"],
    authenticate: async () => ({ id: "user" }),
  });
  expect(
    (
      await accepted(
        new Request("https://app.example/api", {
          method: "POST",
          headers: { Origin: "https://app.example" },
        }),
        "anything",
      )
    ).status,
  ).toBe(404);
});
