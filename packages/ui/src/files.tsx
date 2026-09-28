"use client";

import { createContext, useContext, useState, type ComponentProps, type CSSProperties, type ReactNode } from "react";
import { ChevronRight, File as FileIcon, Folder as FolderIcon, FolderOpen, GitFork, Star } from "lucide-react";
import { classes } from "./shared";

const Depth = createContext(0);

/** A file tree: what a command creates, what a package contains. Folders open and close. */
export function Files({ className, children, ...props }: ComponentProps<"ul">) {
  return (
    <div data-slot="files" className={classes("fui-files", className)}>
      <ul role="list" {...props}>
        {children}
      </ul>
    </div>
  );
}

export function Folder({
  name,
  defaultOpen = false,
  note,
  children,
}: {
  name: string;
  defaultOpen?: boolean;
  /** A short remark after the name, such as "new" or "generated". */
  note?: ReactNode;
  children?: ReactNode;
}) {
  const depth = useContext(Depth);
  const [open, setOpen] = useState(defaultOpen);
  const Icon = open ? FolderOpen : FolderIcon;
  return (
    <li className="fui-files-item" style={{ "--fui-files-depth": depth } as CSSProperties}>
      <button type="button" className="fui-files-row" aria-expanded={open} onClick={() => setOpen(!open)}>
        <ChevronRight aria-hidden size={14} className="fui-files-chevron" />
        <Icon aria-hidden size={15} className="fui-files-icon" />
        <span className="fui-files-name">{name}</span>
        {note ? <span className="fui-files-note">{note}</span> : null}
      </button>
      {open && children ? (
        <Depth.Provider value={depth + 1}>
          <ul role="list">{children}</ul>
        </Depth.Provider>
      ) : null}
    </li>
  );
}

export function File({
  name,
  icon,
  note,
  highlighted = false,
}: {
  name: string;
  icon?: ReactNode;
  note?: ReactNode;
  /** Marks the file the text is about. */
  highlighted?: boolean;
}) {
  const depth = useContext(Depth);
  return (
    <li className="fui-files-item" style={{ "--fui-files-depth": depth } as CSSProperties}>
      <span className="fui-files-row" data-highlighted={highlighted || undefined}>
        <span className="fui-files-chevron" aria-hidden />
        {icon ?? <FileIcon aria-hidden size={15} className="fui-files-icon" />}
        <span className="fui-files-name">{name}</span>
        {note ? <span className="fui-files-note">{note}</span> : null}
      </span>
    </li>
  );
}

const compact = new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 });

function GitHubMark() {
  return (
    <svg aria-hidden viewBox="0 0 16 16" width="14" height="14" fill="currentColor">
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82a7.65 7.65 0 0 1 4 0c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
    </svg>
  );
}

/**
 * A repository as a compact link: owner/name, stars and forks. Presentational:
 * the host fetches the numbers (and caches them); unknown counts are omitted,
 * never shown as zero.
 */
export function RepoInfo({
  owner,
  repo,
  href,
  stars,
  forks,
  description,
  className,
  ...props
}: Omit<ComponentProps<"a">, "children" | "href"> & {
  owner: string;
  repo: string;
  href?: string;
  stars?: number | null;
  forks?: number | null;
  description?: ReactNode;
}) {
  const known = (value?: number | null): value is number => typeof value === "number" && Number.isFinite(value) && value >= 0;
  return (
    <a
      data-slot="repo-info"
      href={href ?? `https://github.com/${owner}/${repo}`}
      target="_blank"
      rel="noreferrer noopener"
      className={classes("fui-repo-info", className)}
      {...props}
    >
      <span className="fui-repo-info-name">
        <GitHubMark />
        <span>
          {owner}/<strong>{repo}</strong>
        </span>
      </span>
      {description ? <span className="fui-repo-info-description">{description}</span> : null}
      {known(stars) || known(forks) ? (
        <span className="fui-repo-info-stats">
          {known(stars) ? (
            <span aria-label={`${stars} stars`}>
              <Star aria-hidden size={12} /> {compact.format(stars)}
            </span>
          ) : null}
          {known(forks) ? (
            <span aria-label={`${forks} forks`}>
              <GitFork aria-hidden size={12} /> {compact.format(forks)}
            </span>
          ) : null}
        </span>
      ) : null}
    </a>
  );
}
