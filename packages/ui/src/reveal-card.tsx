"use client";

import { useEffect, useId, useRef, useState, type ComponentProps, type ReactNode, type Ref } from "react";
import { hotkeyAllowed, outsideDialog, ratingKey } from "./choice-keys";
import { Kbd } from "./kbd";
import { classes } from "./shared";

export type RevealCardProps = Omit<ComponentProps<"article">, "children"> & {
  /** The question side: always shown. */
  front: ReactNode;
  /** The answer side: shown once revealed, inside a polite live region that is there from the start, so the answer is announced. */
  back: ReactNode;
  /** What follows the answer once it shows: a `RatingBar`, a "Next" button. */
  children?: ReactNode;
  revealed?: boolean;
  defaultRevealed?: boolean;
  onRevealedChange?: (revealed: boolean) => void;
  /** Names the card for a screen reader when focus lands on it ("Card 3 of 20"). */
  label?: string;
  /** The words of the reveal button. */
  revealLabel?: ReactNode;
  /** The key printed beside them. */
  revealKeyLabel?: string;
  /**
   * Space reveals the answer while focus is on the card, on its button or nowhere (the page body), never from a field or
   * another control, and once per press. Default on; turn it off where several cards share a screen.
   */
  shortcuts?: boolean;
  ref?: Ref<HTMLElement>;
};

/**
 * A card with a question and an answer the reader asks for. Nothing flips: the answer rises in under the question, so both
 * stay readable and nothing is hidden from a screen reader by a transform. After a reveal made on the card, focus moves to the
 * card itself (the button that had it is gone); call `focus()` on its ref to bring focus back when the next card comes up.
 */
export function RevealCard({
  className,
  front,
  back,
  children,
  revealed: controlled,
  defaultRevealed = false,
  onRevealedChange,
  label,
  revealLabel = "Show answer",
  revealKeyLabel = "Space",
  shortcuts = true,
  ref,
  ...props
}: RevealCardProps) {
  const [inner, setInner] = useState(defaultRevealed);
  const revealed = controlled ?? inner;
  const card = useRef<HTMLElement | null>(null);
  const button = useRef<HTMLButtonElement | null>(null);
  const focusCard = useRef(false);
  const held = useRef(false);
  const latest = useRef({ revealed, onRevealedChange });
  useEffect(() => {
    latest.current = { revealed, onRevealedChange };
  });

  const reveal = () => {
    if (latest.current.revealed) return;
    focusCard.current = true;
    setInner(true);
    latest.current.onRevealedChange?.(true);
  };

  useEffect(() => {
    if (!revealed || !focusCard.current) return;
    focusCard.current = false;
    card.current?.focus({ preventScroll: true });
  }, [revealed]);

  useEffect(() => {
    if (!shortcuts) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== " " || !hotkeyAllowed(event, { repeat: true })) return;
      const target = event.target instanceof Element ? event.target : null;
      // Space belongs to whatever else has the focus (a link, another button): here it is the card's only from the card,
      // its own button, or the page itself.
      const ours = !target || target === document.body || target === document.documentElement || target === card.current || button.current?.contains(target);
      if (!ours) return;
      if (latest.current.revealed) {
        // The key that revealed is still down: its repeats must not scroll the page under the answer.
        if (event.repeat && held.current) event.preventDefault();
        return;
      }
      event.preventDefault();
      if (event.repeat) return;
      held.current = true;
      reveal();
    };
    const onKeyUp = (event: KeyboardEvent) => {
      if (event.key === " ") held.current = false;
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [shortcuts]);

  return (
    <article
      aria-label={label}
      tabIndex={-1}
      {...props}
      data-slot="reveal-card"
      data-revealed={revealed ? "" : undefined}
      className={classes("fui-reveal-card", className)}
      ref={(node) => {
        card.current = node;
        if (typeof ref === "function") return ref(node);
        if (ref) ref.current = node;
      }}
    >
      <div className="fui-reveal-card-front">{front}</div>
      <div aria-live="polite" className="fui-reveal-card-back">
        {revealed ? <div className="fui-reveal-card-answer fui-rise">{back}</div> : null}
      </div>
      {revealed ? (
        children != null ? (
          <div className="fui-reveal-card-after">{children}</div>
        ) : null
      ) : (
        <button
          aria-keyshortcuts={shortcuts ? "Space" : undefined}
          className="fui-button fui-reveal-card-show"
          data-slot="button"
          data-variant="outline"
          onClick={reveal}
          ref={button}
          type="button"
        >
          <span>{revealLabel}</span>
          {shortcuts ? (
            <Kbd aria-hidden="true" className="fui-reveal-card-key">
              {revealKeyLabel}
            </Kbd>
          ) : null}
        </button>
      )}
    </article>
  );
}

export type RatingOption<Value extends string = string> = {
  value: Value;
  label: ReactNode;
  /** A second line: what the rating means ("In 4 days"). Dropped where the bar is narrow. */
  hint?: ReactNode;
  /** Colours the label's ink; the label still says the rating. */
  tone?: "neutral" | "success" | "warning" | "danger";
  /** The key that gives this rating. Default: its place, 1 to 9. An empty string gives it no key. */
  shortcut?: string;
};

export type RatingBarProps<Value extends string = string> = Omit<ComponentProps<"div">, "children"> & {
  options: readonly RatingOption<Value>[];
  onRate: (value: Value) => void;
  /** The question above the buttons; it names the group. Without it, pass `aria-label`. */
  label?: ReactNode;
  disabled?: boolean;
  /** A rating is being saved: the buttons stay where they are and take no rating. */
  pending?: boolean;
  /** The keys give their rating from anywhere on the page that is not a field. Default on. */
  shortcuts?: boolean;
  /**
   * One rating per card: after the first, the bar takes no other until it is mounted again or `resetKey` changes (pass the
   * card's id), so a second press that lands before the next card is drawn rates nothing. `false` for a rating a person
   * may change.
   */
  once?: boolean;
  resetKey?: unknown;
};

/** The ratings under a revealed card: each a button with its key, its word and what it means. */
export function RatingBar<Value extends string = string>({
  className,
  options,
  onRate,
  label,
  disabled = false,
  pending = false,
  shortcuts = true,
  once = true,
  resetKey,
  ...props
}: RatingBarProps<Value>) {
  const id = useId();
  const root = useRef<HTMLDivElement | null>(null);
  const rated = useRef(false);
  const blocked = disabled || pending;
  const latest = useRef({ options, onRate, blocked, once });
  useEffect(() => {
    latest.current = { options, onRate, blocked, once };
  });
  useEffect(() => {
    rated.current = false;
  }, [resetKey]);

  const rate = (value: Value) => {
    const now = latest.current;
    if (now.blocked || (now.once && rated.current)) return;
    rated.current = true;
    now.onRate(value);
  };

  useEffect(() => {
    if (!shortcuts) return;
    const onKey = (event: KeyboardEvent) => {
      if (!hotkeyAllowed(event) || outsideDialog(event.target, root.current)) return;
      const pressed = event.key.toLowerCase();
      const index = latest.current.options.findIndex((option, at) => ratingKey(at, option.shortcut) === pressed);
      if (index < 0) return;
      event.preventDefault();
      rate(latest.current.options[index]!.value);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [shortcuts]);

  return (
    <div
      aria-labelledby={label != null ? `${id}-label` : undefined}
      role="group"
      {...props}
      data-slot="rating-bar"
      data-pending={pending ? "" : undefined}
      className={classes("fui-rating-bar", className)}
      ref={root}
    >
      {label != null ? (
        <p className="fui-rating-bar-label" id={`${id}-label`}>
          {label}
        </p>
      ) : null}
      <div className="fui-rating-bar-options">
        {options.map((option, index) => {
          const key = ratingKey(index, option.shortcut);
          return (
            <button
              aria-disabled={blocked || undefined}
              aria-keyshortcuts={shortcuts && key ? key.toUpperCase() : undefined}
              className="fui-rating"
              data-tone={option.tone && option.tone !== "neutral" ? option.tone : undefined}
              key={option.value}
              onClick={() => rate(option.value)}
              type="button"
            >
              {shortcuts && key ? (
                <Kbd aria-hidden="true" className="fui-rating-key">
                  {key.toUpperCase()}
                </Kbd>
              ) : null}
              <span className="fui-rating-label">{option.label}</span>
              {option.hint != null ? <span className="fui-rating-hint">{option.hint}</span> : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
