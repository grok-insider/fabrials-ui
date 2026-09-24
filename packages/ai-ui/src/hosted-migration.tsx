"use client";
import { PageHeader } from "@fabrials/ui";
import {
  Button,
  Input,
  Label,
  NativeCheckbox,
  NativeSelect,
} from "@fabrials/ui";

import * as React from "react";
import { MigrationReviewDetails } from "./migration-review";
import type {
  MigrationDirection,
  MigrationInvitation,
  MigrationSessionView,
} from "./contracts";
export interface HostedMigrationApi {
  sessions(): Promise<{ sessions: MigrationSessionView[] }>;
  create(request: {
    direction: MigrationDirection;
  }): Promise<MigrationInvitation>;
  status(request: { id: string }): Promise<MigrationSessionView>;
  approve(request: { id: string; revision: string }): Promise<unknown>;
  authorizations(request: { id: string }): Promise<string[]>;
  forget(request: { id: string }): Promise<unknown>;
  cancel(request: { id: string }): Promise<unknown>;
}
export type MigrationAuthorization = {
  provider: "grok" | "nous" | "codex";
  alias: string;
  migrationId: string;
  sourceId: string;
  onConnected: () => Promise<void>;
};

export function HostedMigration({
  api: migrationApi,
  origin,
  authorize,
  heading = true,
}: {
  api: HostedMigrationApi;
  origin: string;
  authorize: (request: MigrationAuthorization) => React.ReactNode;
  /** The host already shows the page title. */
  heading?: boolean;
}) {
  const [authorized, setAuthorized] = React.useState<string[]>([]);
  const [direction, setDirection] =
    React.useState<MigrationDirection>("hostedToLocal");
  const [invitation, setInvitation] =
    React.useState<MigrationInvitation | null>(null);
  const [sessions, setSessions] = React.useState<MigrationSessionView[]>([]);
  const [selected, setSelected] = React.useState<MigrationSessionView | null>(
    null,
  );
  const [forgetting, setForgetting] = React.useState(false);
  const [confirmed, setConfirmed] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const errorRef = React.useRef<HTMLParagraphElement>(null);
  React.useEffect(() => {
    if (error) errorRef.current?.focus();
  }, [error]);
  const [now, setNow] = React.useState(() => Date.now());
  async function refresh() {
    const data = await migrationApi.sessions();
    setSessions(data.sessions);
  }
  React.useEffect(() => {
    const controller = new AbortController();
    migrationApi
      .sessions()
      .then((data) => setSessions(data.sessions))
      .catch((error) => {
        if (!controller.signal.aborted) setError(String(error));
      });
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => {
      controller.abort();
      clearInterval(timer);
    };
  }, [migrationApi]);
  async function run(action: () => Promise<void>) {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      await action();
    } catch (error) {
      setError(String(error));
    } finally {
      setBusy(false);
    }
  }
  async function open(id: string) {
    const view = await migrationApi.status({ id });
    setSessions((current) =>
      current.map((session) => (session.id === view.id ? view : session)),
    );
    setAuthorized([]);
    setSelected(view);
    setConfirmed(false);
    setForgetting(false);
    if (view.phase === "completed" && view.direction === "localToHosted")
      setAuthorized(await migrationApi.authorizations({ id }));
    if (view.phase !== "pairing") setInvitation(null);
  }
  return (
    <div className="fb-form">
      {heading ? (
        <PageHeader
          title="Account migration"
          description="Pair Spanreed with this relay. Review the destination and the selected accounts before you approve a transfer."
        />
      ) : null}
      <section className="fb-form" aria-label="Create migration invitation">
        <Label>
          Direction
          <NativeSelect
            value={direction}
            disabled={busy}
            onChange={(event) =>
              setDirection(event.target.value as MigrationDirection)
            }
          >
            <option value="hostedToLocal">ai-relay → Spanreed</option>
            <option value="localToHosted">Spanreed → ai-relay</option>
          </NativeSelect>
        </Label>
        <Button
          variant="outline"
          className=""
          disabled={busy}
          onClick={() =>
            void run(async () => {
              const result = await migrationApi.create({ direction });
              setInvitation(result);
              setSelected(null);
              setConfirmed(false);
              await refresh();
            })
          }
        >
          Create invitation
        </Button>
        {invitation && (
          <div className="fb-form">
            <p className="fb-muted">
              Enter these details in Spanreed, on Account migration. The invitation
              expires {formatWhen(invitation.expiresAtMs)}. The secret stays on this page until you leave it.
            </p>
            <Label>
              Hosted origin
              <Input readOnly value={origin} />
            </Label>
            <Label>
              Session ID
              <Input readOnly value={invitation.id} />
            </Label>
            {now < invitation.expiresAtMs ? (
              <Label>
                Invitation secret
                <Input
                  readOnly
                  type="password"
                  autoComplete="off"
                  value={invitation.secret}
                  onFocus={(event) => event.currentTarget.select()}
                />
              </Label>
            ) : (
              <p role="alert">Invitation expired. Create another invitation.</p>
            )}
            {now < invitation.expiresAtMs && (
              <Button
                variant="outline"
                className=""
                disabled={busy}
                onClick={() =>
                  void run(async () => {
                    await navigator.clipboard.writeText(invitation.secret);
                  })
                }
              >
                Copy invitation secret
              </Button>
            )}
            <p className="fb-muted">
              The secret is shown only in this page session. Copy it into
              Spanreed before closing this page.
            </p>
            <Button
              variant="outline"
              className=""
              disabled={busy}
              onClick={() => void run(async () => open(invitation.id))}
            >
              Check pairing
            </Button>
            <Button
              variant="outline"
              className=""
              onClick={() => setInvitation(null)}
            >
              Hide invitation
            </Button>
          </div>
        )}
      </section>
      <section className="fb-form" aria-label="Migration sessions">
        <div className="fb-row">
          <h2>Sessions</h2>
          <Button variant="outline" disabled={busy} onClick={() => void run(refresh)}>
            Refresh sessions
          </Button>
        </div>
        <p className="fb-muted">Completed receipts stay available for 30 days after the transfer window closes.</p>
        {!sessions.length ? <p className="fb-muted">No migration sessions yet. Create an invitation to start one.</p> : null}
        {sessions.length ? (
          <div className="fb-log">
            {sessions.map((session) => (
              <button
                className="fb-log-button"
                disabled={busy}
                key={session.id}
                onClick={() => void run(async () => open(session.id))}
                type="button"
              >
                <strong>{directionLabel(session.direction)}</strong>
                <span className="fb-muted">{phaseLabel(session.phase)}</span>
                <code className="fb-mono" style={{ overflowWrap: "anywhere" }}>{session.id}</code>
              </button>
            ))}
          </div>
        ) : null}
      </section>
      {selected && (
        <section className="fb-form" aria-label="Selected migration">
          <h2>Review transfer</h2>
          <p style={{ overflowWrap: "anywhere" }}>
            Session: <code>{selected.id}</code>
            <br />
            Local installation:{" "}
            <code>{selected.localEnvironment || "Waiting for pairing"}</code>
            <br />
            Status: {selected.phase}
          </p>
          {selected.review && (
            <MigrationReviewDetails review={selected.review} />
          )}
          {selected.phase === "paired" && (
            <p>
              Select accounts and create a review in Spanreed, then refresh this
              session.
            </p>
          )}
          {selected.phase === "reviewing" && (
            <>
              <Label>
                <NativeCheckbox
                  type="checkbox"
                  checked={confirmed}
                  disabled={busy || now >= selected.expiresAtMs}
                  onChange={(event) => setConfirmed(event.target.checked)}
                />{" "}
                I recognize this installation and approve the exact accounts and
                destination above.
              </Label>
              <Button
                className=" "
                disabled={
                  busy ||
                  !confirmed ||
                  !selected.revision ||
                  now >= selected.expiresAtMs
                }
                onClick={() =>
                  void run(async () => {
                    if (!selected.revision)
                      throw new Error(
                        "Review unavailable. Refresh this session.",
                      );
                    await migrationApi.approve({
                      id: selected.id,
                      revision: selected.revision,
                    });
                    await open(selected.id);
                    await refresh();
                  })
                }
              >
                Approve review
              </Button>
            </>
          )}
          {selected.phase === "approved" && (
            <p role="status">
              Approved. Confirm and execute the transfer in Spanreed.
            </p>
          )}
          {selected.phase === "completed" && (
            <p role="status">
              API-key transfer completed. OAuth entries require independent
              authorization in the destination.
            </p>
          )}
          {selected.phase === "completed" &&
            selected.direction === "localToHosted" &&
            selected.review?.items
              .filter(
                (item) =>
                  item.action === "authorizeOAuth" &&
                  !authorized.includes(`${item.provider}/${item.targetAlias}`),
              )
              .map(
                (item) =>
                  (item.provider === "grok" ||
                    item.provider === "nous" ||
                    item.provider === "codex") && (
                    <div key={`${selected.id}/${item.sourceId}`}>
                      {authorize({
                        provider: item.provider,
                        alias: item.targetAlias,
                        migrationId: selected.id,
                        sourceId: item.sourceId,
                        onConnected: async () => {
                          setAuthorized(
                            await migrationApi.authorizations({
                              id: selected.id,
                            }),
                          );
                        },
                      })}
                    </div>
                  ),
              )}
          {authorized.map((id) => (
            <p role="status" key={id}>
              Connected {id} with a new hosted authorization.
            </p>
          ))}
          {now >= selected.expiresAtMs && selected.phase !== "completed" && (
            <p role="alert">This session expired.</p>
          )}
          {selected.phase === "completed" && (
            <div className="fb-form">
              {!forgetting ? (
                <Button
                  variant="outline"
                  className=""
                  disabled={busy}
                  onClick={() => setForgetting(true)}
                >
                  Forget receipt
                </Button>
              ) : (
                <>
                  <p>
                    Remove this migration receipt from ai-relay? Imported
                    accounts remain connected. The reviewed aliases will no
                    longer be available here for pending OAuth logins.
                  </p>
                  <div className="fb-row">
                    <Button
                      variant="outline"
                      className=""
                      disabled={busy}
                      onClick={() =>
                        void run(async () => {
                          await migrationApi.forget({ id: selected.id });
                          setSelected(null);
                          setForgetting(false);
                          await refresh();
                        })
                      }
                    >
                      Forget this receipt
                    </Button>
                    <Button
                      variant="outline"
                      className=""
                      disabled={busy}
                      onClick={() => setForgetting(false)}
                    >
                      Keep receipt
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}
          <div className="fb-row">
            <Button
              variant="outline"
              className=""
              disabled={busy}
              onClick={() => void run(async () => open(selected.id))}
            >
              Refresh selected session
            </Button>
            {selected.phase !== "completed" &&
              selected.phase !== "cancelled" && (
                <Button
                  variant="outline"
                  className=""
                  disabled={busy || now >= selected.expiresAtMs}
                  onClick={() =>
                    void run(async () => {
                      await migrationApi.cancel({ id: selected.id });
                      setInvitation(null);
                      setSelected(null);
                      setConfirmed(false);
                      await refresh();
                    })
                  }
                >
                  Cancel migration
                </Button>
              )}
          </div>
        </section>
      )}
      {busy && <p role="status">Updating migration…</p>}
      {error && (
        <p ref={errorRef} tabIndex={-1} className="fb-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

function directionLabel(direction: MigrationDirection): string {
  return direction === "hostedToLocal" ? "ai-relay to Spanreed" : "Spanreed to ai-relay";
}

function phaseLabel(phase: string): string {
  const labels: Record<string, string> = {
    pairing: "Waiting to pair",
    paired: "Paired",
    reviewing: "Ready to review",
    approved: "Approved",
    completed: "Completed",
    cancelled: "Cancelled",
  };
  return labels[phase] ?? phase;
}

function formatWhen(ms: number): string {
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(ms);
}
