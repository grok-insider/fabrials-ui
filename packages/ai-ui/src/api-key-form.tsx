"use client";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  Input,
  Label,
  NativeSelect,
} from "@fabrials/ui";

import * as React from "react";

export interface ApiKeyEnrollment {
  provider: string;
  alias: string;
  key: string;
}
export function ApiKeyFields({
  provider,
  alias,
  secret,
  onProviderChange,
  onAliasChange,
  onSecretChange,
  pending = false,
  lockedIdentity = false,
  providers = [
    { id: "openai", label: "OpenAI API" },
    { id: "nous", label: "Nous API" },
  ],
}: {
  provider: string;
  alias: string;
  secret?: string;
  onProviderChange: (value: string) => void;
  onAliasChange: (value: string) => void;
  onSecretChange?: (value: string) => void;
  pending?: boolean;
  lockedIdentity?: boolean;
  providers?: readonly { id: string; label: string }[];
}) {
  return (
    <div className="fb-form">
      <Label>
        Provider
        <NativeSelect
          name="provider"
          value={provider}
          disabled={pending || lockedIdentity}
          onChange={(event) => onProviderChange(event.target.value)}
        >
          {providers.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label}
            </option>
          ))}
        </NativeSelect>
      </Label>
      <Label>
        Account name
        <Input
          name="alias"
          required
          pattern="[A-Za-z0-9_-]+"
          maxLength={40}
          autoComplete="off"
          value={alias}
          disabled={pending || lockedIdentity}
          onChange={(event) => onAliasChange(event.target.value)}
        />
      </Label>
      <Label>
        API key
        <Input
          name="api_key"
          type="password"
          required
          maxLength={8192}
          autoComplete="off"
          autoCapitalize="none"
          spellCheck={false}
          value={secret}
          disabled={pending}
          onChange={
            onSecretChange
              ? (event) => onSecretChange(event.target.value)
              : undefined
          }
        />
      </Label>
    </div>
  );
}

export function ApiKeyForm({
  onSave,
  accounts,
}: {
  onSave: (input: ApiKeyEnrollment) => Promise<void>;
  accounts?: readonly { provider: string; alias: string }[];
}) {
  const [provider, setProvider] = React.useState("openai");
  const [alias, setAlias] = React.useState("");
  const [key, setKey] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [saved, setSaved] = React.useState<{
    provider: string;
    alias: string;
  } | null>(null);
  const showSaved =
    saved &&
    (!accounts ||
      accounts.some(
        (account) =>
          account.provider === saved.provider && account.alias === saved.alias,
      ));
  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    setSaved(null);
    try {
      await onSave({ provider, alias: alias.trim(), key: key.trim() });
      setKey("");
      setSaved({ provider, alias: alias.trim() });
    } catch (error) {
      setError(String(error));
    } finally {
      setBusy(false);
    }
  }
  return (
    <Card className="fb-card-layout">
      <CardHeader>
        <h2>Connect with an API key</h2>
        <p className="fb-muted">
          Use an existing provider key. Requests use that provider’s API
          billing.
        </p>
      </CardHeader>
      <CardContent className="fb-content-layout">
        <form className="fb-form" onSubmit={(event) => void save(event)}>
          <ApiKeyFields
            provider={provider}
            alias={alias}
            secret={key}
            pending={busy}
            onProviderChange={(value) => {
              setProvider(value);
              setKey("");
              setSaved(null);
            }}
            onAliasChange={(value) => {
              setAlias(value);
              setSaved(null);
            }}
            onSecretChange={(value) => {
              setKey(value);
              setSaved(null);
            }}
          />
          <Button className=" " type="submit" disabled={busy}>
            {busy ? "Saving…" : "Save API key"}
          </Button>
          {error && (
            <p className="fb-error" role="alert">
              {error}
            </p>
          )}
          {showSaved && (
            <p role="status">
              Saved {saved.provider}/{saved.alias}. The key has not been
              verified with the provider.
            </p>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
