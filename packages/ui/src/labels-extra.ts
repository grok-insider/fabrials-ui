// The words 0.12 adds to what a `LabelsProvider` can set, for the components of this package that gained one. Types only:
// the defaults live beside each component. `@fabrials/ai-ui` adds its own scopes in its own `labels.ts`.
import type { AlertLabels } from "./alert";
import type { CountLabels } from "./count";
import type { ColorRampLabels } from "./chart";
import type { FieldLabels } from "./field-parts";

declare module "@fabrials/ui" {
  interface FabrialsLabels {
    alert?: Partial<AlertLabels>;
    colorRamp?: Partial<ColorRampLabels>;
    count?: Partial<CountLabels>;
    field?: Partial<FieldLabels>;
  }
}

export type { AlertLabels, ColorRampLabels, CountLabels, FieldLabels };
