"use client";

import { useId, type ComponentProps, type ReactNode } from "react";
import { classes } from "./shared";

export type SettingsSectionProps = Omit<ComponentProps<"section">, "title"> & {
  title: ReactNode;
  description?: ReactNode;
  status?: ReactNode;
  headingLevel?: 2 | 3 | 4;
};

export function SettingsSection({
  id,
  title,
  description,
  status,
  headingLevel = 2,
  className,
  children,
  ...props
}: SettingsSectionProps) {
  const generated = useId();
  const headingId = `${id ?? generated}-heading`;
  const descriptionId = description ? `${id ?? generated}-description` : undefined;
  const Heading = `h${headingLevel}` as "h2" | "h3" | "h4";
  return (
    <section
      id={id}
      aria-labelledby={headingId}
      aria-describedby={descriptionId}
      className={classes("fui-settings-section", className)}
      {...props}
    >
      <div className="fui-settings-section-intro">
        <div className="fui-settings-section-heading">
          <Heading id={headingId} className="fui-settings-section-title">
            {title}
          </Heading>
          {status}
        </div>
        {description ? (
          <p id={descriptionId} className="fui-settings-section-description">
            {description}
          </p>
        ) : null}
      </div>
      <div className="fui-settings-section-body">{children}</div>
    </section>
  );
}
