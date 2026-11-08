"use client";

import type { ExampleSet } from "./types";
import { agentThinkingExamples } from "./agent-thinking";
import { taskListExamples } from "./task-list";
import { activityExamples } from "./activity";
import { attachmentsExamples, composerExamples } from "./composer";
import { generationExamples } from "./generation-frame";
import { contextMeterExamples, workingLightExamples } from "./context-meter";
import { buttonExamples, iconButtonExamples, kbdExamples, toggleGroupExamples } from "./actions";
import { alertExamples, badgeExamples, spinnerExamples, statePanelExamples, statusDotExamples, toasterExamples } from "./status";
import { avatarExamples, cardExamples, meterExamples, statExamples, tableExamples } from "./data";
import { progressExamples } from "./progress";
import { scrollAreaExamples } from "./scroll-area";
import { avatarGroupExamples } from "./avatar-group";
import { checkboxExamples, fieldExamples, radioGroupExamples, selectExamples, sliderExamples, switchExamples } from "./forms";
import { accordionExamples, dialogExamples, dropdownMenuExamples, itemExamples, tabsExamples, tooltipExamples } from "./structure";

/** Examples by catalogue slug. `lib/example-slugs.ts` lists the same keys for the server; a test keeps them equal. */
export const exampleSets: Record<string, ExampleSet> = {
  "agent-thinking": agentThinkingExamples,
  "task-list": taskListExamples,
  "activity-disclosure": activityExamples,
  "chat-composer": composerExamples,
  attachments: attachmentsExamples,
  "generation-frame": generationExamples,
  "context-meter": contextMeterExamples,
  "working-light": workingLightExamples,
  button: buttonExamples,
  "icon-button": iconButtonExamples,
  "toggle-group": toggleGroupExamples,
  kbd: kbdExamples,
  badge: badgeExamples,
  "status-dot": statusDotExamples,
  alert: alertExamples,
  "state-panel": statePanelExamples,
  spinner: spinnerExamples,
  toaster: toasterExamples,
  card: cardExamples,
  stat: statExamples,
  meter: meterExamples,
  progress: progressExamples,
  "scroll-area": scrollAreaExamples,
  "avatar-group": avatarGroupExamples,
  table: tableExamples,
  avatar: avatarExamples,
  field: fieldExamples,
  select: selectExamples,
  checkbox: checkboxExamples,
  switch: switchExamples,
  "radio-group": radioGroupExamples,
  slider: sliderExamples,
  tabs: tabsExamples,
  accordion: accordionExamples,
  dialog: dialogExamples,
  "dropdown-menu": dropdownMenuExamples,
  tooltip: tooltipExamples,
  item: itemExamples,
};

export type { Example, ExampleSet } from "./types";
