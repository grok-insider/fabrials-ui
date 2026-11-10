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
import { imageExamples } from "./image";
import { sourceTallyExamples } from "./source-tally";
import { chatMessageExamples } from "./chat-message";
import { codeBlockExamples } from "./code-block";
import { scrambleTextExamples, shimmerTextExamples } from "./text";
import { checkboxExamples, fieldExamples, radioGroupExamples, selectExamples, sliderExamples, switchExamples } from "./forms";
import { accordionExamples, dialogExamples, dropdownMenuExamples, itemExamples, tabsExamples, tooltipExamples } from "./structure";
import { localTimeExamples } from "./foundations";
import { countdownExamples, inlineConfirmExamples } from "./states";
import { choiceGroupExamples, revealCardExamples, stepControlsExamples } from "./answers";
import { clipButtonExamples, recorderPanelExamples } from "./sound";

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
  image: imageExamples,
  "source-tally": sourceTallyExamples,
  "chat-message": chatMessageExamples,
  "code-block": codeBlockExamples,
  "scramble-text": scrambleTextExamples,
  "shimmer-text": shimmerTextExamples,
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
  "local-time": localTimeExamples,
  "inline-confirm": inlineConfirmExamples,
  countdown: countdownExamples,
  "choice-group": choiceGroupExamples,
  "reveal-card": revealCardExamples,
  "step-controls": stepControlsExamples,
  "clip-button": clipButtonExamples,
  "recorder-panel": recorderPanelExamples,
};

export type { Example, ExampleSet } from "./types";
