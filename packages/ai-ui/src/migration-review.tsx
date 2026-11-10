import * as React from "react";
import type { MigrationReview } from "./contracts";
import {
  accountsClasses,
  migrationReviewLabels,
  type MigrationReviewLabels,
} from "./accounts-labels";

export function MigrationReviewDetails({
  review,
  labels,
  className,
  ["aria-label"]: ariaLabel,
  ...props
}: React.ComponentProps<"section"> & {
  review: MigrationReview;
  labels?: Partial<MigrationReviewLabels>;
}) {
  const text = { ...migrationReviewLabels, ...labels };
  return (
    <section
      {...props}
      aria-label={ariaLabel ?? text.region}
      className={accountsClasses("fb-form", className)}
    >
      <p>
        <strong>{text.from}</strong> <code>{review.sourceEnvironment}</code>
        <br />
        <strong>{text.to}</strong> <code>{review.destinationEnvironment}</code>
      </p>
      <ul>
        {review.items.map((item) => (
          <li key={item.sourceId} style={{ overflowWrap: "anywhere" }}>
            <strong>{item.sourceId}</strong> →{" "}
            <strong>
              {item.provider}/{item.targetAlias}
            </strong>
            <p className="fb-muted">
              {item.action === "copyApiKey" ? text.copyApiKey : text.authorizeOAuth}
            </p>
          </li>
        ))}
      </ul>
      <p className="fb-muted">{text.note}</p>
    </section>
  );
}
