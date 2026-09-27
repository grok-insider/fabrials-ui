"use client";
import {
  Children,
  isValidElement,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { NativeSelect } from "@fabrials/ui";
const scenarios = [
  ["comparison", "Shopping assistant", "Compare, select and review"],
  ["explorer", "Project explorer", "Search, filter and select"],
  ["reservation", "Reservation flow", "Dates, details and validation"],
  ["console", "MCP workspace", "A real server connection"],
  ["travel", "Travel planner", "Budget and shortlist"],
  ["support", "Support inbox", "Triage and human confirmation"],
  ["onboarding", "Workspace setup", "Prepare, review and complete"],
];
const subscribe = (fn: () => void) => {
  window.addEventListener("hashchange", fn);
  return () => window.removeEventListener("hashchange", fn);
};
export function PlaygroundGallery({ children }: { children: ReactNode }) {
  const hash = useSyncExternalStore(
    subscribe,
    () => location.hash.slice(1),
    () => "comparison",
  );
  const selected = scenarios.some(([id]) => id === hash) ? hash : "comparison";
  const sections = Children.toArray(children);
  function select(id: string) {
    history.pushState(null, "", `#${id}`);
    window.dispatchEvent(new Event("hashchange"));
  }
  return (
    <div className="grid items-start gap-8 xl:grid-cols-[220px_minmax(0,1fr)]">
      <label className="block space-y-2 text-sm font-medium xl:hidden">
        Choose a scenario
        <NativeSelect
          className="mt-2"
          value={selected}
          onChange={(e) => select(e.target.value)}
        >
          {scenarios.map(([id, title]) => (
            <option key={id} value={id}>
              {title}
            </option>
          ))}
        </NativeSelect>
      </label>
      <nav
        aria-label="Playground scenarios"
        className="hidden gap-2 xl:sticky xl:top-24 xl:grid"
      >
        {scenarios.map(([id, title, description], i) => (
          <a
            key={id}
            href={`#${id}`}
            aria-current={selected === id ? "page" : undefined}
            onClick={(e) => {
              e.preventDefault();
              select(id);
            }}
            className={`rounded-xl border p-3 transition-colors ${selected === id ? "border-[var(--brand)] bg-[var(--brand-soft)] text-foreground" : "bg-card hover:bg-accent"}`}
          >
            <span className="flex items-center gap-2">
              <span className="text-xs tabular-nums text-muted-foreground">
                0{i + 1}
              </span>
              <span className="text-sm font-medium">{title}</span>
            </span>
            <span className="mt-1 block text-xs leading-5">{description}</span>
          </a>
        ))}
      </nav>
      <div className="min-w-0" key={selected}>
        {sections.find(
          (child) =>
            isValidElement<{ id: string }>(child) &&
            child.props.id === selected,
        )}
        <p className="mt-6 text-xs text-muted-foreground">
          Switching scenarios starts a fresh sandbox and releases the previous
          tools.
        </p>
      </div>
    </div>
  );
}
