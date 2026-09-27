"use client";
import { useId, useState } from "react";
import { Plug, Unplug } from "lucide-react";
import { Badge, Button, Input, Label, NativeSelect } from "@fabrials/ui";
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
  return (
    <form
      className="space-y-4"
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
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-medium">Server connection</h3>
        <Badge variant="outline" role="status">
          {status}
          {protocol && ` · ${protocol}`}
        </Badge>
      </div>
      <div className="space-y-1.5">
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
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
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
        <div className="space-y-1.5">
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
        <div className="space-y-1.5">
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
        <div className="space-y-1.5">
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
        <p role="alert" className="text-sm text-destructive">
          {localError || error}
        </p>
      )}
      <div className="flex gap-2">
        {connected ? (
          <Button
            variant="outline"
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
          <Button type="submit" disabled={busy}>
            <Plug />
            {busy ? "Connecting…" : "Connect server"}
          </Button>
        )}
        {busy && (
          <Button
            variant="outline"
            type="button"
            onClick={() => void onDisconnect()}
          >
            Cancel
          </Button>
        )}
      </div>
      <p className="text-xs leading-relaxed text-muted-foreground">
        Direct connections stay in your browser. The endpoint must allow CORS.
        Use the optional server connector for private credentials.
      </p>
    </form>
  );
}
