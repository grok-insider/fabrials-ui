// One sound at a time on a page. Whatever starts making sound (a clip, a player, a reader) or taking it (the microphone)
// claims the bus, and whatever held it is asked to stop: a clip left playing would be recorded as the speaker's own words,
// and two voices at once are heard as neither. Plain functions and no React, so anything can join.

type Holder = { owner: object; stop: () => void };

let holder: Holder | null = null;

/**
 * Takes the sound: whoever held it is stopped first, then `owner` holds it. `stop` is how this owner goes quiet when the
 * next one claims; it is not called when the owner releases on its own.
 */
export function claimSound(owner: object, stop: () => void): void {
  silenceAll(owner);
  holder = { owner, stop };
}

/** Gives the sound back when `owner` has gone quiet by itself (a clip ended, a player paused). Nothing happens if another owner holds it. */
export function releaseSound(owner: object): void {
  if (holder?.owner === owner) holder = null;
}

/** Stops whoever holds the sound, unless it is `except`. */
export function silenceAll(except?: object): void {
  const current = holder;
  if (!current || current.owner === except) return;
  holder = null;
  current.stop();
}

/** Whether `owner` holds the sound now. */
export function holdsSound(owner: object): boolean {
  return holder?.owner === owner;
}
