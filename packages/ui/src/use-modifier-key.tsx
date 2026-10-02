"use client";
// Origin: Fabrials, 0.8 (promoted from Open Email's ui/use-modifier-key.ts).

import { useSyncExternalStore } from "react";

export type ModifierKey = "Ctrl" | "⌘";

const noSubscription = () => () => {};

/**
 * Whether a platform string names an Apple device. Case-insensitive on purpose: `navigator.platform` says "MacIntel" but
 * Chromium's `userAgentData.platform` says "macOS", which a case-sensitive `/Mac/` does not match (the hint stayed «Ctrl»
 * on Chrome and Edge for Mac).
 */
export function isApplePlatform(platform: string): boolean {
  return /mac|iphone|ipad|ipod/i.test(platform);
}

function onApplePlatform() {
  const nav = navigator as Navigator & { userAgentData?: { platform?: string } };
  return isApplePlatform(nav.userAgentData?.platform || nav.platform || "");
}

/**
 * The name of the main modifier key as this device prints it. It is "Ctrl" on the server and on the first client render
 * and becomes "⌘" on Apple platforms right after hydration, so the markup never mismatches. Use it for the label of a
 * shortcut; the shortcut itself should test `event.ctrlKey || event.metaKey`.
 */
export function useModifierKey(): ModifierKey {
  return useSyncExternalStore(noSubscription, () => (onApplePlatform() ? "⌘" : "Ctrl"), () => "Ctrl");
}

/** The modifier as text: what `<Kbd mod />` renders. */
export function ModifierKeyText() {
  return <>{useModifierKey()}</>;
}
