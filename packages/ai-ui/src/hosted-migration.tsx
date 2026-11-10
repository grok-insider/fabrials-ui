"use client";
import { PageHeader } from "@fabrials/ui";
import { copyText } from "@fabrials/ui/export";
import {
  Button,
  Input,
  Label,
  NativeCheckbox,
  NativeSelect,
  type HeadingLevel,
} from "@fabrials/ui";

import * as React from "react";
import { MigrationReviewDetails } from "./migration-review";
import type {
  MigrationDirection,
  MigrationInvitation,
  MigrationSessionView,
} from "./contracts";
import {
  accountsClasses,
  accountsReason,
  hostedMigrationLabels,
  type AccountsHeadingLevel,
  type HostedMigrationLabels,
} from "./accounts-labels";
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
  labels,
  locale,
  headingLevel = 1,
  now: fixedNow,
  className,
  ...props
}: React.ComponentProps<"div"> & {
  api: HostedMigrationApi;
  origin: string;
  authorize: (request: MigrationAuthorization) => React.ReactNode;
  /** The host already shows the page title. */
  heading?: boolean;
  labels?: Partial<HostedMigrationLabels>;
  locale?: Intl.LocalesArgument;
  /** The page title. The sections inside it follow; every level looks the same. */
  headingLevel?: AccountsHeadingLevel;
  /** The moment invitations and sessions are compared to. By default the wall clock, one second at a time. */
  now?: number;
}) {
  const text: HostedMigrationLabels = {
    ...hostedMigrationLabels,
    ...labels,
    directions: { ...hostedMigrationLabels.directions, ...labels?.directions },
    sessionDirections: {
      ...hostedMigrationLabels.sessionDirections,
      ...labels?.sessionDirections,
    },
    phases: { ...hostedMigrationLabels.phases, ...labels?.phases },
    reviewLabels: { ...hostedMigrationLabels.reviewLabels, ...labels?.reviewLabels },
  };
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
  const [ticking, setTicking] = React.useState(() => Date.now());
  const now = fixedNow ?? ticking;
  const Section = `h${Math.min(6, headingLevel + 1)}` as "h2";
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
        if (!controller.signal.aborted) setError(accountsReason(error));
      });
    const timer = setInterval(() => setTicking(Date.now()), 1000);
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
      setError(accountsReason(error));
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
    <div {...props} className={accountsClasses("fb-form", className)}>
      {heading ? (
        <PageHeader
          title={text.title}
          description={text.description}
          headingLevel={headingLevel as HeadingLevel}
        />
      ) : null}
      <section className="fb-form" aria-label={text.createRegion}>
        <Label>
          {text.direction}
          <NativeSelect
            value={direction}
            disabled={busy}
            onChange={(event) =>
              setDirection(event.target.value as MigrationDirection)
            }
          >
            <option value="hostedToLocal">{text.directions.hostedToLocal}</option>
            <option value="localToHosted">{text.directions.localToHosted}</option>
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
          {text.create}
        </Button>
        {invitation && (
          <div className="fb-form">
            <p className="fb-muted">
              {text.instructions(formatWhen(invitation.expiresAtMs, locale))}
            </p>
            <Label>
              {text.hostedOrigin}
              <Input readOnly value={origin} />
            </Label>
            <Label>
              {text.sessionId}
              <Input readOnly value={invitation.id} />
            </Label>
            {now < invitation.expiresAtMs ? (
              <Label>
                {text.invitationSecret}
                <Input
                  readOnly
                  type="password"
                  autoComplete="off"
                  value={invitation.secret}
                  onFocus={(event) => event.currentTarget.select()}
                />
              </Label>
            ) : (
              <p role="alert">{text.invitationExpired}</p>
            )}
            {now < invitation.expiresAtMs && (
              <Button
                variant="outline"
                className=""
                disabled={busy}
                onClick={() =>
                  void run(async () => {
                    await copyText(invitation.secret);
                  })
                }
              >
                {text.copySecret}
              </Button>
            )}
            <p className="fb-muted">{text.secretNote}</p>
            <Button
              variant="outline"
              className=""
              disabled={busy}
              onClick={() => void run(async () => open(invitation.id))}
            >
              {text.checkPairing}
            </Button>
            <Button
              variant="outline"
              className=""
              onClick={() => setInvitation(null)}
            >
              {text.hideInvitation}
            </Button>
          </div>
        )}
      </section>
      <section className="fb-form" aria-label={text.sessionsRegion}>
        <div className="fb-row">
          <Section>{text.sessions}</Section>
          <Button variant="outline" disabled={busy} onClick={() => void run(refresh)}>
            {text.refresh}
          </Button>
        </div>
        <p className="fb-muted">{text.receiptsNote}</p>
        {!sessions.length ? <p className="fb-muted">{text.noSessions}</p> : null}
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
                <strong>{text.sessionDirections[session.direction]}</strong>
                <span className="fb-muted">
                  {text.phases[session.phase] ?? session.phase}
                </span>
                <code className="fb-mono" style={{ overflowWrap: "anywhere" }}>{session.id}</code>
              </button>
            ))}
          </div>
        ) : null}
      </section>
      {selected && (
        <section className="fb-form" aria-label={text.selectedRegion}>
          <Section>{text.review}</Section>
          <p style={{ overflowWrap: "anywhere" }}>
            {text.sessionLabel} <code>{selected.id}</code>
            <br />
            {text.localInstallation}{" "}
            <code>{selected.localEnvironment || text.waitingForPairing}</code>
            <br />
            {text.statusLabel} {selected.phase}
          </p>
          {selected.review && (
            <MigrationReviewDetails
              labels={text.reviewLabels}
              review={selected.review}
            />
          )}
          {selected.phase === "paired" && <p>{text.pairedNote}</p>}
          {selected.phase === "reviewing" && (
            <>
              <Label>
                <NativeCheckbox
                  type="checkbox"
                  checked={confirmed}
                  disabled={busy || now >= selected.expiresAtMs}
                  onChange={(event) => setConfirmed(event.target.checked)}
                />{" "}
                {text.confirm}
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
                      throw new Error(text.reviewUnavailable);
                    await migrationApi.approve({
                      id: selected.id,
                      revision: selected.revision,
                    });
                    await open(selected.id);
                    await refresh();
                  })
                }
              >
                {text.approve}
              </Button>
            </>
          )}
          {selected.phase === "approved" && (
            <p role="status">{text.approvedNote}</p>
          )}
          {selected.phase === "completed" && (
            <p role="status">{text.completedNote}</p>
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
              {text.connected(id)}
            </p>
          ))}
          {now >= selected.expiresAtMs && selected.phase !== "completed" && (
            <p role="alert">{text.expiredSession}</p>
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
                  {text.forget}
                </Button>
              ) : (
                <>
                  <p>{text.forgetQuestion}</p>
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
                      {text.forgetYes}
                    </Button>
                    <Button
                      variant="outline"
                      className=""
                      disabled={busy}
                      onClick={() => setForgetting(false)}
                    >
                      {text.forgetNo}
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
              {text.refreshSelected}
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
                  {text.cancel}
                </Button>
              )}
          </div>
        </section>
      )}
      {busy && <p role="status">{text.updating}</p>}
      {error && (
        <p ref={errorRef} tabIndex={-1} className="fb-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

function formatWhen(ms: number, locale?: Intl.LocalesArgument): string {
  return new Intl.DateTimeFormat(locale ?? "en", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(ms);
}
