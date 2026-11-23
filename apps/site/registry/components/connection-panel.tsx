"use client";
import { useId, useState } from "react";
import { Plug, Unplug } from "lucide-react";
import {
  Alert,
  AlertDescription,
  Badge,
  Button,
  Input,
  Label,
  NativeSelect,
  StatusDot,
} from "@fabrials/ui";
import { BrowserOAuthProvider } from "@/registry/mcp/oauth";
import type { ConnectionOptions } from "@/registry/mcp/client";

export function ConnectionPanel({
  status,
  error,
  protocol,
  onConnect,
  onDisconnect,
  defaultEndpoint = "",
}: {
  status: string;
  error?: string;
  protocol?: string;
  onConnect: (options: ConnectionOptions) => Promise<void>;
  onDisconnect: () => Promise<void>;
  defaultEndpoint?: string;
}) {
  const id = useId();
  const [endpoint, setEndpoint] = useState(defaultEndpoint);
  const [auth, setAuth] = useState("none");
  const [token, setToken] = useState("");
  const [clientId, setClientId] = useState("");
  const [version, setVersion] = useState<"auto" | "current" | "legacy">("auto");
  const [localError, setLocalError] = useState("");
  const connected = status === "connected";
  const busy = status === "connecting";
  const dotTone = connected
    ? "success"
    : busy
      ? "info"
      : status === "error" || Boolean(error || localError)
        ? "danger"
        : "neutral";

  return (
    <form
      className="grid gap-4 rounded-[var(--fui-radius-lg)] border bg-background p-4"
      onSubmit={async (e) => {
        e.preventDefault();
        setLocalError("");
        try {
          const url = new URL(endpoint, location.origin).href;
          const secret = token;
          setToken("");
          await onConnect({
            endpoint: url,
            token: auth === "bearer" ? secret : undefined,
            oauth:
              auth === "oauth"
                ? new BrowserOAuthProvider(url, {
                    clientId: clientId || undefined,
                  })
                : undefined,
            protocol: version,
          });
        } catch (e) {
          setLocalError(e instanceof Error ? e.message : "Connection failed.");
        }
      }}
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--fui-separator)] pb-3">
        <div className="flex items-center gap-2">
          <StatusDot tone={dotTone} pulse={busy || connected} label={status} hideLabel />
          <h3 className="m-0 text-sm font-medium text-foreground">
            Server connection
          </h3>
        </div>
        <Badge
          tone={
            connected
              ? "success"
              : busy
                ? "info"
                : status === "error"
                  ? "danger"
                  : "neutral"
          }
          size="sm"
          role="status"
        >
          {status}
          {protocol && ` · ${protocol}`}
        </Badge>
      </div>

      <div className="grid gap-3 md:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)_minmax(0,1fr)]">
        <div className="grid gap-1.5">
          <Label htmlFor={`${id}-url`}>MCP endpoint</Label>
          <Input
            id={`${id}-url`}
            value={endpoint}
            onChange={(e) => setEndpoint(e.target.value)}
            placeholder="https://your-server.com/mcp"
            required
            disabled={connected || busy}
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor={`${id}-auth`}>Authentication</Label>
          <NativeSelect
            id={`${id}-auth`}
            value={auth}
            onChange={(e) => {
              setAuth(e.target.value);
              setToken("");
            }}
            disabled={connected || busy}
          >
            <option value="none">None</option>
            <option value="bearer">Bearer token</option>
            <option value="oauth">OAuth / PKCE</option>
          </NativeSelect>
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor={`${id}-version`}>Protocol</Label>
          <NativeSelect
            id={`${id}-version`}
            value={version}
            onChange={(e) => setVersion(e.target.value as typeof version)}
            disabled={connected || busy}
          >
            <option value="auto">Auto · prefer latest</option>
            <option value="current">2026-07-28</option>
            <option value="legacy">Legacy handshake</option>
          </NativeSelect>
        </div>
      </div>

      {auth === "bearer" && !connected && (
        <div className="grid max-w-md gap-1.5">
          <Label htmlFor={`${id}-token`}>Token · memory only</Label>
          <Input
            id={`${id}-token`}
            type="password"
            autoComplete="off"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            required
          />
        </div>
      )}

      {auth === "oauth" && !connected && (
        <div className="grid max-w-md gap-1.5">
          <Label htmlFor={`${id}-client`}>Client ID (optional)</Label>
          <Input
            id={`${id}-client`}
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            placeholder="Use discovery by default"
          />
        </div>
      )}

      {(error || localError) && (
        <Alert variant="destructive" role="alert">
          <AlertDescription>{localError || error}</AlertDescription>
        </Alert>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--fui-separator)] pt-3">
        <div className="flex items-center gap-2">
          {connected ? (
            <Button
              variant="outline"
              size="sm"
              type="button"
              onClick={() => {
                setToken("");
                void onDisconnect();
              }}
            >
              <Unplug />
              Disconnect
            </Button>
          ) : (
            <Button type="submit" size="sm" variant="accent" disabled={busy}>
              <Plug />
              {busy ? "Connecting…" : "Connect server"}
            </Button>
          )}
          {busy && (
            <Button
              variant="outline"
              size="sm"
              type="button"
              onClick={() => void onDisconnect()}
            >
              Cancel
            </Button>
          )}
        </div>
        <p className="m-0 font-mono text-[11px] text-muted-foreground">
          Direct connections stay in your browser · CORS required for remote servers
        </p>
      </div>
    </form>
  );
}
