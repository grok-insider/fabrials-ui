// Origin: Fabrials, 0.12 (from the key handlers of Radiant's lesson screens). No directive: pure matching, tested without a DOM.

/** What the matcher reads of a `KeyboardEvent`. */
export type HotkeyEvent = {
  key: string;
  code?: string;
  ctrlKey?: boolean;
  metaKey?: boolean;
  altKey?: boolean;
  shiftKey?: boolean;
  getModifierState?: (key: string) => boolean;
};

export type ParsedHotkey = {
  /** The key in lower case: a character ("k", "1", "?", " ") or a `KeyboardEvent.key` name ("enter", "arrowleft"). */
  key: string;
  /** Ctrl or ⌘, whichever the device has. */
  mod: boolean;
  ctrl: boolean;
  meta: boolean;
  alt: boolean;
  shift: boolean;
};

const KEY_ALIASES: Record<string, string> = {
  space: " ",
  spacebar: " ",
  esc: "escape",
  plus: "+",
  return: "enter",
  del: "delete",
  up: "arrowup",
  down: "arrowdown",
  left: "arrowleft",
  right: "arrowright",
};

const MODIFIERS: Record<string, keyof Omit<ParsedHotkey, "key">> = {
  mod: "mod",
  ctrl: "ctrl",
  control: "ctrl",
  meta: "meta",
  cmd: "meta",
  command: "meta",
  alt: "alt",
  option: "alt",
  shift: "shift",
};

const parsed = new Map<string, ParsedHotkey>();

/** "mod+k", "shift+?", "Space", "ArrowLeft", "1": modifiers joined with "+", the key last. Case does not matter. */
export function parseHotkey(combo: string): ParsedHotkey {
  const known = parsed.get(combo);
  if (known) return known;
  const hotkey: ParsedHotkey = { key: "", mod: false, ctrl: false, meta: false, alt: false, shift: false };
  // The key may be "+" itself ("shift++"), so it is whatever follows the last separator.
  const text = combo.trim();
  const cut = text.endsWith("+") ? text.length - 2 : text.lastIndexOf("+");
  const key = (cut < 0 ? text : text.slice(cut + 1)).trim().toLowerCase();
  hotkey.key = KEY_ALIASES[key] ?? key;
  for (const part of cut < 0 ? [] : text.slice(0, cut).split("+")) {
    const modifier = MODIFIERS[part.trim().toLowerCase()];
    if (modifier) hotkey[modifier] = true;
  }
  parsed.set(combo, hotkey);
  return hotkey;
}

const LETTER = /^[a-z]$/;
const DIGIT = /^[0-9]$/;

/**
 * Whether a key press is this hotkey. A modifier the hotkey does not list is a different key press: "1" does not answer
 * Ctrl+1. Shift is compared only where it does not change the character (letters and named keys); a digit or a symbol is
 * the character the layout produced, however it was reached ("1" is Shift+& on a French keyboard, "?" is Shift+/ on a US
 * one). A letter also matches its physical key when the layout types another script ("mod+k" on a Cyrillic layout).
 */
export function matchHotkey(event: HotkeyEvent, combo: string): boolean {
  const hotkey = parseHotkey(combo);
  if (!hotkey.key) return false;
  const pressed = event.key.toLowerCase();
  const letter = LETTER.test(hotkey.key);
  const digit = DIGIT.test(hotkey.key);
  const character = hotkey.key.length === 1 && hotkey.key !== " ";
  // AltGr reports Ctrl and Alt on Windows; the character it types is the key, not a chord.
  const altGraph = character && !letter && event.getModifierState?.("AltGraph") === true;
  const ctrl = !altGraph && event.ctrlKey === true;
  const alt = !altGraph && event.altKey === true;
  const meta = event.metaKey === true;
  const shift = event.shiftKey === true;

  if (hotkey.mod ? !(ctrl || meta) : ctrl !== hotkey.ctrl || meta !== hotkey.meta) return false;
  if (alt !== hotkey.alt) return false;

  if (letter) {
    if (shift !== hotkey.shift) return false;
    if (pressed === hotkey.key) return true;
    return pressed.length === 1 && !LETTER.test(pressed) && event.code === `Key${hotkey.key.toUpperCase()}`;
  }
  if (digit) {
    if (!hotkey.shift) return pressed === hotkey.key;
    return shift && (pressed === hotkey.key || event.code === `Digit${hotkey.key}`);
  }
  if (character) return pressed === hotkey.key;
  return shift === hotkey.shift && pressed === hotkey.key;
}

type ElementLike = { closest?: (selector: string) => unknown; isContentEditable?: boolean };

const TYPING_FIELDS =
  'input:not([type="button"], [type="submit"], [type="reset"], [type="checkbox"], [type="file"], [type="image"], [type="color"]), textarea, select, [role="textbox"], [role="combobox"], [role="searchbox"], [role="spinbutton"]';
const EDITABLE = '[contenteditable]:not([contenteditable="false"])';

/**
 * Whether a key press is meant for a field (then it is typing, not a shortcut): a text input, a textarea, a select, an
 * editable region or one of the ARIA text roles. Radios and sliders count too, since the arrows and digits are theirs; a
 * checkbox and a button-like input do not. Shaped, not `instanceof`, so it runs where there is no DOM.
 */
export function isTypingTarget(target: unknown): boolean {
  const element = target as ElementLike | null | undefined;
  if (!element || typeof element.closest !== "function") return false;
  if (element.closest(TYPING_FIELDS) != null) return true;
  return typeof element.isContentEditable === "boolean" ? element.isContentEditable : element.closest(EDITABLE) != null;
}

/** The controls that answer Enter and Space themselves: the default of `useHotkeys`' `ignoreOnControls`. */
export const HOTKEY_CONTROLS =
  'a[href], area[href], button, summary, input:is([type="button"], [type="submit"], [type="reset"], [type="checkbox"], [type="file"], [type="image"], [type="color"]), [role="button"], [role="link"], [role="checkbox"], [role="radio"], [role="switch"], [role="tab"], [role="menuitem"], [role="menuitemcheckbox"], [role="menuitemradio"], [role="option"], [role="treeitem"]';

/** Whether a key press came from a control that uses Enter and Space itself (or from inside one). */
export function isControlTarget(target: unknown, selector: string = HOTKEY_CONTROLS): boolean {
  const element = target as ElementLike | null | undefined;
  return !!element && typeof element.closest === "function" && element.closest(selector) != null;
}

const ARIA_KEYS: Record<string, string> = { " ": "Space", "+": "Plus" };

/** A hotkey in the syntax of `aria-keyshortcuts`: "mod+k" is "Control+K Meta+K", "shift+?" is "Shift+?". */
export function ariaKeyshortcuts(combo: string): string {
  const hotkey = parseHotkey(combo);
  if (!hotkey.key) return "";
  const key = ARIA_KEYS[hotkey.key] ?? (hotkey.key.length === 1 ? hotkey.key.toUpperCase() : named(hotkey.key));
  const rest = [hotkey.alt && "Alt", hotkey.shift && "Shift"].filter((part): part is string => !!part);
  const chord = (first: string[]) => [...first, ...rest, key].join("+");
  if (hotkey.mod) return `${chord(["Control"])} ${chord(["Meta"])}`;
  return chord([hotkey.ctrl && "Control", hotkey.meta && "Meta"].filter((part): part is string => !!part));
}

const KEY_NAMES: Record<string, string> = {
  arrowup: "ArrowUp",
  arrowdown: "ArrowDown",
  arrowleft: "ArrowLeft",
  arrowright: "ArrowRight",
  pageup: "PageUp",
  pagedown: "PageDown",
};

/** A named key in the spelling of `KeyboardEvent.key`: "arrowleft" is "ArrowLeft", "escape" is "Escape". */
function named(key: string): string {
  return KEY_NAMES[key] ?? key.charAt(0).toUpperCase() + key.slice(1);
}
