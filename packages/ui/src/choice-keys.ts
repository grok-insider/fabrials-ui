// Internal to the answer pieces (ChoiceGroup, RevealCard, RatingBar); not exported from the package index.
// One set of guards for a key that acts from anywhere on the page. `useHotkeys` replaces the guards once it lands.

export type ChoiceMarkers = "letters" | "numbers" | "none";

const TYPING =
  'input, textarea, select, [contenteditable]:not([contenteditable="false"]), [role="textbox"], [role="combobox"], [role="searchbox"], [role="spinbutton"]';

type Closest = { closest?: (selector: string) => unknown; isContentEditable?: boolean };

/** What the guards read of a key event, so they can be tested without a DOM. */
export type KeyLike = {
  key: string;
  altKey?: boolean;
  ctrlKey?: boolean;
  metaKey?: boolean;
  isComposing?: boolean;
  repeat?: boolean;
  defaultPrevented?: boolean;
  target?: unknown;
};

const closest = (target: unknown, selector: string) => {
  const node = target as Closest | null | undefined;
  return node != null && typeof node.closest === "function" ? node.closest(selector) != null : false;
};

/** A key pressed here is text for a field, not a shortcut. */
export function isTypingTarget(target: unknown): boolean {
  return (target as Closest | null | undefined)?.isContentEditable === true || closest(target, TYPING);
}

/** A part of the page that keeps its keys to itself (`data-hotkeys="off"`): a report form, an embedded editor. */
export function inHotkeysOff(target: unknown): boolean {
  return closest(target, '[data-hotkeys="off"]');
}

/** The key was pressed inside a dialog that does not hold `scope`: the page behind a dialog does not answer to keys. */
export function outsideDialog(target: unknown, scope: unknown): boolean {
  const node = target as { closest?: (selector: string) => { contains?: (other: unknown) => boolean } | null } | null | undefined;
  if (node == null || typeof node.closest !== "function") return false;
  const dialog = node.closest('[role="dialog"], [role="alertdialog"], dialog');
  return dialog != null && !(typeof dialog.contains === "function" && dialog.contains(scope));
}

/**
 * Whether a key pressed anywhere on the page may act as a shortcut: not handled already, no Ctrl, Alt or Meta (Shift is left
 * to the match, so Caps Lock still picks "B"), not while an IME composes, not from a field or an island that opted out, and
 * not a key held down unless `repeat` allows it.
 */
export function hotkeyAllowed(event: KeyLike, { repeat = false }: { repeat?: boolean } = {}): boolean {
  if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey || event.isComposing) return false;
  if (event.repeat && !repeat) return false;
  return !isTypingTarget(event.target) && !inHotkeysOff(event.target);
}

/** What an option shows in its keycap: "A" to "Z", or its number in the reader's digits. Empty when there is none to show. */
export function choiceMarker(index: number, markers: ChoiceMarkers, locale?: Intl.LocalesArgument): string {
  if (!Number.isInteger(index) || index < 0) return "";
  if (markers === "letters") return index < 26 ? String.fromCharCode(65 + index) : "";
  if (markers === "numbers") return locale === undefined ? String(index + 1) : new Intl.NumberFormat(locale, { useGrouping: false }).format(index + 1);
  return "";
}

/** The key that picks an option: "a" to "z" beside letters, "1" to "9" otherwise. Past those, an option has no key. */
export function choiceKey(index: number, markers: ChoiceMarkers): string | undefined {
  if (!Number.isInteger(index) || index < 0) return undefined;
  if (markers === "letters") return index < 26 ? String.fromCharCode(97 + index) : undefined;
  return index < 9 ? String(index + 1) : undefined;
}

/** Whether the key pressed is an option's: its key in either case, or the marker as printed (a digit of another script). */
export function matchesChoiceKey(pressed: string, key: string | undefined, marker?: string): boolean {
  if (!key || pressed.length === 0) return false;
  const lower = pressed.toLowerCase();
  return lower === key || (marker != null && marker.length > 0 && lower === marker.toLowerCase());
}

/** The digit key of a rating: its own `shortcut`, or its place (1 to 9). */
export function ratingKey(index: number, shortcut?: string): string | undefined {
  if (shortcut != null) return shortcut.length > 0 ? shortcut.toLowerCase() : undefined;
  return index >= 0 && index < 9 ? String(index + 1) : undefined;
}
