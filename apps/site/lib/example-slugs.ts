// The catalogue pages that have examples. The examples themselves are client code (components/examples); the server reads
// this list to add the section to a page's contents. tests/examples.test.ts keeps the two in step.
export const exampleSlugs = [
  "agent-thinking",
  "task-list",
  "activity-disclosure",
  "chat-composer",
  "attachments",
  "generation-frame",
  "context-meter",
  "working-light",
  "button",
  "icon-button",
  "toggle-group",
  "kbd",
  "badge",
  "status-dot",
  "alert",
  "state-panel",
  "spinner",
  "toaster",
  "card",
  "stat",
  "meter",
  "table",
  "avatar",
  "field",
  "select",
  "checkbox",
  "switch",
  "radio-group",
  "slider",
  "tabs",
  "accordion",
  "dialog",
  "dropdown-menu",
  "tooltip",
  "item",
] as const;

export function hasExamples(slug: string) {
  return (exampleSlugs as readonly string[]).includes(slug);
}
