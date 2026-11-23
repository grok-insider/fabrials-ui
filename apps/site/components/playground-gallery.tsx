"use client";
import { Children, isValidElement, useSyncExternalStore, type ReactNode } from "react";
import { NativeSelect } from "@fabrials/ui";
import "@/components/playground/playground.css";

type ScenarioGroup = {
  label: string;
  items: readonly [id: string, title: string, description: string][];
};

const scenarioGroups: readonly ScenarioGroup[] = [
  {
    label: "0.12 Instrument & AI",
    items: [
      ["agent-workbench", "Agent & AI runtime", "Working light, tasks, tool calls & streaming"],
      ["instrument-lab", "Stormlight & Dither lab", "Polestones, Bayer canvas, rulers & skeletons"],
    ],
  },
  {
    label: "Shared WebMCP",
    items: [
      ["comparison", "Shopping assistant", "Compare, select and review"],
      ["explorer", "Project explorer", "Search, filter and select"],
      ["reservation", "Reservation flow", "Dates, details and validation"],
      ["console", "MCP workspace", "A real server connection"],
      ["travel", "Travel planner", "Budget and shortlist"],
      ["support", "Support inbox", "Triage and human confirmation"],
      ["onboarding", "Workspace setup", "Prepare, review and complete"],
    ],
  },
];

const scenarios = scenarioGroups.flatMap((g) => g.items);

const scenarioNumbers = new Map(
  scenarios.map(([id], index) => [id, String(index + 1).padStart(2, "0")]),
);

const subscribe = (fn: () => void) => {
  window.addEventListener("hashchange", fn);
  return () => window.removeEventListener("hashchange", fn);
};

export function PlaygroundGallery({ children }: { children: ReactNode }) {
  const hash = useSyncExternalStore(
    subscribe,
    () => location.hash.slice(1),
    () => "agent-workbench",
  );
  const selected = scenarios.some(([id]) => id === hash) ? hash : "agent-workbench";
  const sections = Children.toArray(children);

  function select(id: string) {
    history.pushState(null, "", `#${id}`);
    window.dispatchEvent(new Event("hashchange"));
  }

  return (
    <div className="playground-layout">
      <label className="playground-mobile-select text-sm font-medium">
        Choose a scenario
        <NativeSelect value={selected} onChange={(e) => select(e.target.value)}>
          {scenarioGroups.map((group) => (
            <optgroup key={group.label} label={group.label}>
              {group.items.map(([id, title]) => (
                <option key={id} value={id}>
                  {title}
                </option>
              ))}
            </optgroup>
          ))}
        </NativeSelect>
      </label>

      <nav aria-label="Playground scenarios" className="playground-rail">
        {scenarioGroups.map((group) => (
          <div key={group.label} className="playground-rail-group">
            <p className="playground-rail-label">{group.label}</p>
            <ul className="playground-rail-list">
              {group.items.map(([id, title, description]) => {
                const num = scenarioNumbers.get(id) ?? "00";
                return (
                  <li key={id}>
                    <a
                      href={`#${id}`}
                      aria-current={selected === id ? "page" : undefined}
                      onClick={(e) => {
                        e.preventDefault();
                        select(id);
                      }}
                      className="playground-rail-link"
                    >
                      <span className="playground-rail-title">
                        <span className="playground-rail-num">{num}</span>
                        <span>{title}</span>
                      </span>
                      <span className="playground-rail-desc">{description}</span>
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="playground-stage" key={selected}>
        {sections.find((child) => isValidElement<{ id: string }>(child) && child.props.id === selected)}
        <p className="playground-footnote">
          Switching scenarios starts a fresh sandbox and releases any previously registered WebMCP tools.
        </p>
      </div>
    </div>
  );
}
