"use client";
import { useEffect, useRef, useState } from "react";
import { BrowserOAuthProvider } from "@/registry/mcp/oauth";
import { MCPProvider, useMCPClient } from "@/registry/mcp/provider";
import { MCPDashboardContent } from "@/registry/components/mcp-dashboard";
import {
  Alert,
  AlertDescription,
  AlertTitle,
  PageHeader,
} from "@fabrials/ui";
function Callback() {
  const started = useRef(false);
  const [error, setError] = useState("");
  const mcp = useMCPClient();
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    void (async () => {
      let provider: BrowserOAuthProvider | undefined;
      try {
        const pending = BrowserOAuthProvider.readPending();
        if (!pending)
          throw new Error(
            "Authorization session expired. Start a new connection.",
          );
        provider = new BrowserOAuthProvider(pending.endpoint, { resume: true });
        const params = new URLSearchParams(location.search);
        provider.validateCallback(params);
        history.replaceState({}, "", location.pathname);
        await mcp.connect(
          { endpoint: pending.endpoint, oauth: provider },
          params,
        );
      } catch (e) {
        setError(e instanceof Error ? e.message : "Authorization failed.");
        history.replaceState({}, "", location.pathname);
      } finally {
        provider?.complete();
      }
    })();
  }, [mcp]);
  return (
    <main id="main-content" className="w-full max-w-4xl px-(--fui-page-padding) py-14">
      <PageHeader
        title="Your MCP connection"
        description="Authorization returns to this console. Tokens remain in this tab until you disconnect or leave."
      />
      {error ? (
        <Alert variant="destructive" role="alert">
          <AlertTitle>Authorization failed</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : (
        <MCPDashboardContent />
      )}
    </main>
  );
}
export default function Page() {
  return (
    <MCPProvider>
      <Callback />
    </MCPProvider>
  );
}
