// The scopes `@fabrials/ai-ui` adds to the words a `LabelsProvider` of `@fabrials/ui` can set. Types only.
import type { ReasoningLabels, SearchLabels } from "./activity";
import type { AgentLabels, ContextMeterLabels, GenerationLabels, TaskListLabels } from "./agent";
import type { AttachmentsLabels } from "./attachments";
import type { MarkdownCalloutLabels } from "./callout";
import type { SourcesLabels } from "./citations";
import type { CodeBlockLabels } from "./code-block";

declare module "@fabrials/ui" {
  interface FabrialsLabels {
    agent?: Partial<AgentLabels>;
    attachments?: Partial<AttachmentsLabels>;
    codeBlock?: Partial<CodeBlockLabels>;
    contextMeter?: Partial<ContextMeterLabels>;
    generation?: Partial<GenerationLabels>;
    markdownCallout?: Partial<MarkdownCalloutLabels>;
    reasoning?: ReasoningLabels;
    search?: Partial<SearchLabels>;
    sources?: Partial<SourcesLabels>;
    taskList?: Partial<TaskListLabels>;
  }
}

export type {
  AgentLabels,
  AttachmentsLabels,
  CodeBlockLabels,
  ContextMeterLabels,
  GenerationLabels,
  SearchLabels,
  SourcesLabels,
};
