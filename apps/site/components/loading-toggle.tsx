"use client";

import { useId } from "react";
import { Switch } from "@fabrials/ui";

/** The "Loading state" switch beside a preview: shows the same demo as its skeleton. */
export function LoadingToggle({ checked, onCheckedChange }: { checked: boolean; onCheckedChange: (next: boolean) => void }) {
  const id = useId();
  return (
    <span className="docs-loading-toggle">
      <Switch aria-labelledby={id} checked={checked} onCheckedChange={onCheckedChange} />
      <span id={id}>Loading state</span>
    </span>
  );
}
