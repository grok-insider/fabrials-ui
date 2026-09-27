"use client";

import type { ComponentProps, ReactNode } from "react";
import type { Tone } from "./display";
import { classes } from "./shared";

export function Timeline({ className, ...props }: ComponentProps<"ol">) {
  return <ol data-slot="timeline" className={classes("fui-timeline", className)} {...props} />;
}

export type TimelineItemProps = Omit<ComponentProps<"li">, "title"> & {
  /** A small icon or avatar for the marker. */
  icon?: ReactNode;
  tone?: Tone;
  title: ReactNode;
  /** Usually a RelativeTime. */
  time?: ReactNode;
  /** Controls at the end of the header row. */
  actions?: ReactNode;
  /** Arrived since the list was first shown: highlighted once, never looping. */
  fresh?: boolean;
};

/**
 * One event in a vertical feed: a marker on a rail, a header with the time,
 * and optional detail. Tone colours the marker; the title carries the meaning.
 */
export function TimelineItem({ icon, tone = "neutral", title, time, actions, fresh = false, children, className, ...props }: TimelineItemProps) {
  return (
    <li data-slot="timeline-item" data-tone={tone} data-fresh={fresh || undefined} className={classes("fui-timeline-item", className)} {...props}>
      <span className="fui-timeline-marker" aria-hidden>
        {icon ?? <span className="fui-timeline-dot" />}
      </span>
      <div className="fui-timeline-body">
        <div className="fui-timeline-header">
          <span className="fui-timeline-title">{title}</span>
          {time ? <span className="fui-timeline-time">{time}</span> : null}
          {actions ? <span className="fui-timeline-actions">{actions}</span> : null}
        </div>
        {children ? <div className="fui-timeline-content">{children}</div> : null}
      </div>
    </li>
  );
}
