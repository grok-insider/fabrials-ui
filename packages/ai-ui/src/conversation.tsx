"use client";
// Origin: Fabrials, 0.12. The behaviour of Radiant's conversation: it stays at the end while an answer arrives, lets go the
// moment the reader scrolls away, and keeps a rail of the reader's own messages. Written here, with no dependency.

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ComponentProps,
  type CSSProperties,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
  type Ref,
  type RefCallback,
} from "react";
import { Button, Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@fabrials/ui";
import {
  CHECKPOINT_LABELS,
  END_THRESHOLD,
  SCROLL_BUTTON_LABELS,
  activeCheckpoint,
  chaseStep,
  checkpointLabel,
  conversationStep,
  distanceToEnd,
  dragsAway,
  endOf,
  initialLock,
  jumpTarget,
  markerSlot,
  overflows,
  railLimit,
  readingLine,
  rovingTarget,
  scrollButtonName,
  scrollsAway,
  type ConversationAnchor,
  type ConversationCheckpointsLabels,
  type ConversationMetrics,
  type ConversationScrollButtonLabels,
  type JumpAlign,
  type LockEvent,
} from "./conversation-logic";

const useIsomorphicLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

function join(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

function assignRef<T>(ref: Ref<T> | undefined, value: T | null) {
  if (typeof ref === "function") ref(value);
  else if (ref) (ref as { current: T | null }).current = value;
}

function motionAllowed() {
  return typeof window !== "undefined" && typeof window.matchMedia === "function" && !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** Whether something between `target` and the conversation would take a scroll toward its start itself (a tall code block). */
function scrollsInside(target: EventTarget | null, scroller: HTMLElement) {
  for (let node = target instanceof Element ? target : null; node && node !== scroller; node = node.parentElement) {
    if (node.scrollTop > 0 && node.scrollHeight > node.clientHeight + 1) {
      const overflow = getComputedStyle(node).overflowY;
      if (overflow === "auto" || overflow === "scroll") return true;
    }
  }
  return false;
}

export type ConversationScrollOptions = {
  /** `smooth` (default) eases there unless the reader asked for reduced motion; `instant` jumps. */
  behavior?: "smooth" | "instant";
};

export type ConversationMessageScrollOptions = ConversationScrollOptions & {
  /** Which edge of the viewport the message is brought to. Default `start`. */
  align?: JumpAlign;
  /** The air left between the message and that edge, in px. Default 16. */
  offset?: number;
};

export type ConversationActions = {
  /** Goes to the end and follows it again. */
  scrollToEnd: (options?: ConversationScrollOptions) => void;
  /** Brings a message into view, by its element or its `id`, and stops following the end. */
  scrollToMessage: (target: string | Element, options?: ConversationMessageScrollOptions) => void;
};

type Snapshot = { atEnd: boolean; locked: boolean; unread: number; hasNew: boolean; overflowing: boolean };
type CheckpointOptions = { id?: string; label?: string };
type Chase = { kind: "end" | "jump"; target: (metrics: ConversationMetrics) => number; at: number };

const UNMEASURED: ConversationMetrics = { scrollTop: 0, scrollHeight: 0, clientHeight: 0 };

/**
 * Everything that happens between renders: the lock, the observers, our own scrolls. One per `Conversation`; React only
 * hears from it when what it shows (at the end, unread, overflowing) changes.
 */
function createEngine(initial: { anchor: ConversationAnchor; threshold: number }) {
  let options = initial;
  let root: HTMLElement | null = null;
  let scroller: HTMLElement | null = null;
  let column: HTMLElement | null = null;
  let state = initialLock({ ...options, metrics: UNMEASURED });
  const server: Snapshot = { atEnd: true, locked: initial.anchor === "end", unread: 0, hasNew: false, overflowing: false };
  let snapshot = server;
  let frame = 0;
  let scrolled = false;
  let chase: Chase | null = null;
  let touchY: number | null = null;
  let footer: number | null = null;
  let version = 0;
  const subscribers = new Set<() => void>();
  const watchers = new Set<() => void>();
  const checkpoints = new Map<HTMLElement, CheckpointOptions>();

  const read = (): ConversationMetrics =>
    scroller ? { scrollTop: scroller.scrollTop, scrollHeight: scroller.scrollHeight, clientHeight: scroller.clientHeight } : UNMEASURED;

  function publish() {
    const next: Snapshot = { atEnd: state.atEnd, locked: state.locked, unread: state.unread, hasNew: state.hasNew, overflowing: overflows(read()) };
    const same = (Object.keys(next) as Array<keyof Snapshot>).every((key) => next[key] === snapshot[key]);
    if (!same) snapshot = next;
    if (!same) for (const notify of subscribers) notify();
    for (const watch of watchers) watch();
  }

  /** Our own scroll. The lock is told where the view went, so the scroll event that follows is not taken for the reader's. */
  function place(top: number) {
    if (!scroller) return false;
    const before = scroller.scrollTop;
    scroller.scrollTop = top;
    const after = scroller.scrollTop;
    const changed = Math.abs(after - before) >= 0.01;
    state = conversationStep(state, { type: "moved", top: after, changed }).state;
    return changed;
  }

  function dispatch(event: LockEvent) {
    if (!scroller) return;
    const step = conversationStep(state, event);
    state = step.state;
    if (chase && step.user && (chase.kind === "jump" || !state.locked)) chase = null;
    // An eased scroll to the end already follows an end that moves: it is not cut short by the growth it is chasing.
    if (step.scroll === "end" && chase?.kind !== "end") {
      chase = null;
      place(endOf(read()));
    }
    publish();
  }

  const request = () => {
    if (!frame) frame = requestAnimationFrame(tick);
  };

  // One read of the scroll position per frame, however many scroll events arrived, then one step of a scroll of ours.
  function tick(now: number) {
    frame = 0;
    if (!scroller) return;
    if (scrolled) {
      scrolled = false;
      dispatch({ type: "scroll", metrics: read() });
    }
    if (!chase) return;
    const metrics = read();
    const target = chase.target(metrics);
    const next = chaseStep(metrics.scrollTop, target, Math.min(64, Math.max(0, now - chase.at)));
    chase.at = now;
    const moved = place(next);
    if (!moved || Math.abs(target - scroller.scrollTop) <= 0.5) chase = null;
    else request();
    dispatch({ type: "scroll", metrics: read() });
  }

  function start(kind: Chase["kind"], target: Chase["target"], behavior: "smooth" | "instant") {
    if (behavior === "smooth" && motionAllowed()) {
      chase = { kind, target, at: performance.now() };
      request();
      return true;
    }
    chase = null;
    return false;
  }

  function scrollToEnd({ behavior = "smooth" }: ConversationScrollOptions = {}) {
    if (!scroller) return;
    start("end", endOf, behavior);
    dispatch({ type: "stick" });
  }

  function find(id: string): Element | null {
    for (const [element, checkpoint] of checkpoints) if (checkpoint.id === id) return element;
    return typeof document === "undefined" ? null : document.getElementById(id);
  }

  function scrollToMessage(target: string | Element, { behavior = "smooth", align = "start", offset = 16 }: ConversationMessageScrollOptions = {}) {
    const node = scroller;
    const element = typeof target === "string" ? find(target) : target;
    if (!node || !element || !node.contains(element)) return;
    const goal = (metrics: ConversationMetrics) => {
      const box = element.getBoundingClientRect();
      const start = box.top - node.getBoundingClientRect().top - node.clientTop + metrics.scrollTop;
      return jumpTarget({ start, size: box.height, metrics, align, offset });
    };
    dispatch({ type: "leave" });
    if (start("jump", goal, behavior)) return;
    place(goal(read()));
    dispatch({ type: "scroll", metrics: read() });
  }

  const onScroll = () => {
    scrolled = true;
    request();
  };
  // The three ways a reader starts to leave that are known before the scroll they cause: said at once, so growth that
  // lands in the same frame does not pull the view back under their hand.
  const leave = (target: EventTarget | null) => {
    if (!scroller || !state.locked || scrollsInside(target, scroller)) return;
    dispatch({ type: "intent", metrics: read() });
  };
  const onWheel = (event: WheelEvent) => {
    if (event.deltaY < 0 && !event.ctrlKey) leave(event.target);
  };
  const onTouchStart = (event: TouchEvent) => {
    touchY = event.touches.length === 1 ? event.touches[0]!.clientY : null;
  };
  const onTouchMove = (event: TouchEvent) => {
    const touch = event.touches[0];
    if (touchY !== null && touch && dragsAway(touchY, touch.clientY)) leave(event.target);
  };
  const onKeyDown = (event: globalThis.KeyboardEvent) => {
    // Only when the log itself has focus: then the key scrolls it. Inside it, the key may belong to a widget.
    if (event.target !== scroller || event.altKey || event.ctrlKey || event.metaKey) return;
    if (scrollsAway(event.key, event.shiftKey)) leave(null);
  };
  const onSelection = () => {
    if (!scroller) return;
    const selection = document.getSelection();
    const active = Boolean(selection && !selection.isCollapsed && selection.anchorNode && scroller.contains(selection.anchorNode));
    if (active !== state.selecting) dispatch({ type: "select", active, metrics: read() });
  };

  function attach(nextScroller: HTMLElement, nextColumn: HTMLElement) {
    scroller = nextScroller;
    column = nextColumn;
    // Before the first paint and with no animation: an eased scroll from the top is outrun by content that keeps rendering.
    if (options.anchor === "end") nextScroller.scrollTop = nextScroller.scrollHeight;
    state = initialLock({ ...options, metrics: read(), items: nextColumn.childElementCount });
    // The browser may clamp what we set by a rounding pixel: the scroll that follows is ours, not a hand pulling away.
    if (options.anchor === "end") state = { ...state, expected: nextScroller.scrollTop };
    const observer =
      typeof ResizeObserver === "undefined"
        ? null
        : new ResizeObserver((entries) => {
            const grew = entries.some((entry) => entry.target === column);
            if (entries.some((entry) => entry.target === scroller)) dispatch({ type: "resize", metrics: read() });
            if (grew && column) dispatch({ type: "grow", metrics: read(), items: column.childElementCount });
          });
    observer?.observe(nextScroller);
    observer?.observe(nextColumn);
    const passive = { passive: true } as const;
    nextScroller.addEventListener("scroll", onScroll, passive);
    nextScroller.addEventListener("wheel", onWheel, passive);
    nextScroller.addEventListener("touchstart", onTouchStart, passive);
    nextScroller.addEventListener("touchmove", onTouchMove, passive);
    nextScroller.addEventListener("keydown", onKeyDown);
    document.addEventListener("selectionchange", onSelection);
    version += 1;
    publish();
    return () => {
      observer?.disconnect();
      nextScroller.removeEventListener("scroll", onScroll);
      nextScroller.removeEventListener("wheel", onWheel);
      nextScroller.removeEventListener("touchstart", onTouchStart);
      nextScroller.removeEventListener("touchmove", onTouchMove);
      nextScroller.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("selectionchange", onSelection);
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
      chase = null;
      scrolled = false;
      if (scroller === nextScroller) {
        scroller = null;
        column = null;
        version += 1;
        for (const notify of subscribers) notify();
      }
    };
  }

  const applyFooter = () => {
    if (!root) return;
    if (footer === null) root.style.removeProperty("--fui-conversation-footer-size");
    else root.style.setProperty("--fui-conversation-footer-size", `${footer}px`);
  };

  return {
    attach,
    scrollToEnd,
    scrollToMessage,
    read,
    configure(next: { anchor: ConversationAnchor; threshold: number }) {
      options = next;
      if (scroller) dispatch({ type: "configure", ...next, metrics: read() });
    },
    setRoot(node: HTMLElement | null) {
      root = node;
      applyFooter();
    },
    setFooter(size: number | null) {
      footer = size;
      applyFooter();
    },
    focusLog() {
      scroller?.focus({ preventScroll: true });
    },
    scroller: () => scroller,
    column: () => column,
    /** Changes when the elements attach or detach and when a checkpoint registers or leaves. */
    version: () => version,
    subscribe(notify: () => void) {
      subscribers.add(notify);
      return () => {
        subscribers.delete(notify);
      };
    },
    /** Called after every frame that read or moved the scroll position, and after every change of size. */
    watch(callback: () => void) {
      watchers.add(callback);
      return () => {
        watchers.delete(callback);
      };
    },
    getSnapshot: () => snapshot,
    getServerSnapshot: () => server,
    register(element: HTMLElement, checkpoint: CheckpointOptions) {
      checkpoints.set(element, checkpoint);
      version += 1;
      for (const notify of subscribers) notify();
      return () => {
        if (checkpoints.get(element) !== checkpoint) return;
        checkpoints.delete(element);
        version += 1;
        for (const notify of subscribers) notify();
      };
    },
    checkpoints: () => checkpoints,
  };
}

type Engine = ReturnType<typeof createEngine>;

const EngineContext = createContext<Engine | null>(null);

function useEngine(part: string): Engine {
  const engine = useContext(EngineContext);
  if (!engine) throw new Error(`${part} must be rendered inside <Conversation>.`);
  return engine;
}

function useSnapshot(engine: Engine) {
  return useSyncExternalStore(engine.subscribe, engine.getSnapshot, engine.getServerSnapshot);
}

export type ConversationProps = ComponentProps<"div"> & {
  /**
   * `end` (default) opens at the latest message and follows it while the reader stays there. `start` is an ordinary
   * scroller for a transcript read from the top; the jump key and the rail still work.
   */
  anchor?: ConversationAnchor;
  /**
   * Any value that changes when the reader sends a message: the conversation jumps to the end and follows it again, even
   * if they had scrolled away.
   */
  stickKey?: unknown;
  /** How near the end still counts as being there, in px. Default 48. */
  threshold?: number;
  /** Receives `scrollToEnd` and `scrollToMessage`. */
  actionsRef?: Ref<ConversationActions>;
};

/**
 * A conversation that fills its parent: a positioned column holding `ConversationContent` (the log that scrolls), and
 * around it the jump key, the rail of the reader's messages and the composer's dock. Give the parent a height.
 */
export function Conversation({ anchor = "end", stickKey, threshold = END_THRESHOLD, actionsRef, className, ref, ...props }: ConversationProps) {
  const [engine] = useState(() => createEngine({ anchor, threshold }));
  useIsomorphicLayoutEffect(() => engine.configure({ anchor, threshold }), [engine, anchor, threshold]);
  const stuck = useRef(stickKey);
  // A layout effect: the message that was just sent is in the page, and the jump happens before it is painted.
  useIsomorphicLayoutEffect(() => {
    if (Object.is(stuck.current, stickKey)) return;
    stuck.current = stickKey;
    engine.scrollToEnd({ behavior: "instant" });
  }, [engine, stickKey]);
  useImperativeHandle(actionsRef, () => ({ scrollToEnd: engine.scrollToEnd, scrollToMessage: engine.scrollToMessage }), [engine]);
  const setRoot = useCallback(
    (node: HTMLDivElement | null) => {
      engine.setRoot(node);
      assignRef(ref, node);
    },
    [engine, ref],
  );
  return (
    <EngineContext.Provider value={engine}>
      <div className={join("fui-conversation", className)} data-anchor={anchor} data-slot="conversation" ref={setRoot} {...props} />
    </EngineContext.Provider>
  );
}

export type ConversationContentProps = Omit<ComponentProps<"div">, "aria-live"> & {
  /** The log's name. Default "Conversation". */
  label?: string;
  /**
   * `off` (default): new content is not read out. A streaming answer would be read token by token; announce a finished
   * answer from the host instead. `polite` hands every addition to the screen reader.
   */
  live?: "off" | "polite";
  /**
   * The reading measure: an answer is as wide as its text up to `--fui-chat-measure` (52rem) and takes the whole column
   * for a table, code, a figure or display maths; the reader's bubble is at most 80% of it.
   */
  measure?: boolean;
  /** With `measure`: `start` (default) keeps the column at the start edge; `center` is for a product that centres its chat. */
  align?: "start" | "center";
  /** A class for the column that holds the messages (the root is the scroll container). */
  columnClassName?: string;
};

/**
 * The log: the part that scrolls. It opens at the end, stays there while its content grows, and lets go when the reader
 * scrolls away. A tab stop only while it overflows, so the keyboard can scroll it.
 */
export function ConversationContent({
  label = "Conversation",
  live = "off",
  measure = false,
  align = "start",
  className,
  columnClassName,
  children,
  ref,
  ...props
}: ConversationContentProps) {
  const engine = useEngine("ConversationContent");
  const { overflowing } = useSnapshot(engine);
  const scroller = useRef<HTMLDivElement | null>(null);
  const column = useRef<HTMLDivElement | null>(null);
  useIsomorphicLayoutEffect(() => {
    if (scroller.current && column.current) return engine.attach(scroller.current, column.current);
  }, [engine]);
  const setScroller = useCallback(
    (node: HTMLDivElement | null) => {
      scroller.current = node;
      assignRef(ref, node);
    },
    [ref],
  );
  return (
    <div
      aria-label={props["aria-labelledby"] ? undefined : label}
      aria-live={live}
      className={join("fui-conversation-content", className)}
      data-align={measure && align === "center" ? "center" : undefined}
      data-measure={measure || undefined}
      data-slot="conversation-content"
      role="log"
      tabIndex={overflowing ? 0 : undefined}
      {...props}
      ref={setScroller}
    >
      <div className={join("fui-conversation-column", columnClassName)} ref={column}>
        {children}
      </div>
    </div>
  );
}

/** What a conversation is doing, and the two ways to move it. Inside `Conversation` only. */
export function useConversation(): ConversationActions & {
  /** Within the threshold of the end. */
  atEnd: boolean;
  /** Following the end as content arrives. */
  locked: boolean;
  /** Messages that arrived while the reader was away from the end (children added to the column). */
  unread: number;
  /** Anything arrived while they were away, a whole message or more of an answer. */
  hasNew: boolean;
} {
  const engine = useEngine("useConversation");
  const { atEnd, locked, unread, hasNew } = useSnapshot(engine);
  return useMemo(
    () => ({ atEnd, locked, unread, hasNew, scrollToEnd: engine.scrollToEnd, scrollToMessage: engine.scrollToMessage }),
    [engine, atEnd, locked, unread, hasNew],
  );
}

function ArrowDownIcon() {
  return (
    <svg aria-hidden="true" fill="none" height="16" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="16">
      <path d="M12 5v14M6 13l6 6 6-6" />
    </svg>
  );
}

export type ConversationScrollButtonProps = Omit<ComponentProps<typeof Button>, "aria-label"> & {
  /** Where the key sits along the end edge: in the middle (default) or at the inline end. */
  align?: "center" | "end";
  labels?: Partial<ConversationScrollButtonLabels>;
  /** How it gets there. Default `smooth` (instant under reduced motion). */
  behavior?: ConversationScrollOptions["behavior"];
  /** The count shown on the key. Default: the conversation's own count of what arrived; `false` shows none. */
  unread?: number | false;
  /** A tooltip repeats the name for sighted people (default); `false` leaves it out. */
  tooltip?: boolean;
};

/**
 * The key that goes back to the latest message. It is there only while the reader is away from the end, and says in its
 * name what arrived meanwhile. A press leaves focus where it was; pressed from the keyboard, focus goes to the log.
 */
export function ConversationScrollButton({
  align = "center",
  labels,
  behavior,
  unread: unreadProp,
  tooltip = true,
  className,
  children,
  onClick,
  onMouseDown,
  ...props
}: ConversationScrollButtonProps) {
  const engine = useEngine("ConversationScrollButton");
  const snapshot = useSnapshot(engine);
  const text = { ...SCROLL_BUTTON_LABELS, ...labels };
  const unread = unreadProp === false ? 0 : (unreadProp ?? snapshot.unread);
  const hasNew = unreadProp === false ? false : snapshot.hasNew;
  const name = scrollButtonName(text, unread, hasNew);
  const visible = !snapshot.atEnd;
  const press = (event: MouseEvent<HTMLButtonElement>) => {
    (onClick as ((event: MouseEvent<HTMLButtonElement>) => void) | undefined)?.(event);
    if (event.defaultPrevented) return;
    const held = document.activeElement === event.currentTarget;
    engine.scrollToEnd({ behavior });
    // The key is about to go: focus that was on it would fall to the page.
    if (held) engine.focusLog();
  };
  const button = (
    <Button
      aria-label={name}
      className={join("fui-conversation-jump", className)}
      data-align={align}
      data-slot="conversation-scroll-button"
      data-visible={visible || undefined}
      onClick={press}
      // A pointer press does not take focus from the composer.
      onMouseDown={(event: MouseEvent<HTMLButtonElement>) => {
        (onMouseDown as ((event: MouseEvent<HTMLButtonElement>) => void) | undefined)?.(event);
        event.preventDefault();
      }}
      size="icon"
      type="button"
      variant="outline"
      {...props}
    >
      {children ?? <ArrowDownIcon />}
      {unread > 0 ? (
        <span aria-hidden="true" className="fui-conversation-jump-count">
          {unread > 99 ? "99+" : unread}
        </span>
      ) : hasNew ? (
        <span aria-hidden="true" className="fui-conversation-jump-dot" />
      ) : null}
    </Button>
  );
  if (!tooltip) return button;
  return (
    <Tooltip>
      <TooltipTrigger render={button} />
      <TooltipContent>{name}</TooltipContent>
    </Tooltip>
  );
}

/**
 * Makes an element a checkpoint of the rail: put the returned ref on it. `label` is the preview (default: the element's
 * text); `id` lets `scrollToMessage(id)` find it. Outside a `Conversation` the ref does nothing.
 */
export function useConversationCheckpoint({ id, label }: { id?: string; label?: string } = {}): RefCallback<HTMLElement> {
  const engine = useContext(EngineContext);
  return useCallback(
    (node: HTMLElement | null) => {
      if (!node || !engine) return;
      return engine.register(node, { id, label });
    },
    [engine, id, label],
  );
}

export type ConversationCheckpointProps = ComponentProps<"div"> & {
  /** The preview shown beside its marker. Default: the text inside. */
  label?: string;
};

/** A wrapper that makes what it holds a checkpoint of the rail. */
export function ConversationCheckpoint({ label, id, ref, ...props }: ConversationCheckpointProps) {
  const register = useConversationCheckpoint({ id, label });
  const setNode = useCallback(
    (node: HTMLDivElement | null) => {
      const release = register(node);
      assignRef(ref, node);
      return () => {
        if (typeof release === "function") release();
        assignRef(ref, null);
      };
    },
    [register, ref],
  );
  return <div data-slot="conversation-checkpoint" id={id} ref={setNode} {...props} />;
}

type Checkpoint = { key: number; element: HTMLElement; label: string };

const keys = new WeakMap<Element, number>();
let nextKey = 0;
function keyOf(element: Element) {
  let key = keys.get(element);
  if (key === undefined) keys.set(element, (key = nextKey++));
  return key;
}

function textOf(element: HTMLElement) {
  // A ChatMessage holds its actions and its time beside the body: the preview is the body's words only.
  const body = element.querySelector<HTMLElement>(":scope > .fui-chat-message-body") ?? element;
  return checkpointLabel(body.textContent ?? "");
}

export type ConversationCheckpointsProps = Omit<ComponentProps<"div">, "children"> & {
  /**
   * Elements inside the log that are checkpoints without registering. Default `[data-role="user"]`, which a
   * `ChatMessage from="user"` carries; `null` leaves only `ConversationCheckpoint` and `useConversationCheckpoint`.
   */
  selector?: string | null;
  labels?: Partial<ConversationCheckpointsLabels>;
  /** How a press gets to its message. Default `smooth` (instant under reduced motion). */
  behavior?: ConversationScrollOptions["behavior"];
  /** The air left above the message a marker brings to the top, in px. Default 16. */
  offset?: number;
};

/**
 * The rail of the reader's own messages: one small marker each, on the end side of the conversation. The marker of the
 * message being read is current; a press brings its message to the top. One tab stop, the arrow keys between markers, and
 * a preview of the message on hover and on focus. Hidden with fewer than two checkpoints, in a narrow conversation and on
 * touch screens.
 */
export function ConversationCheckpoints({
  selector = '[data-role="user"]',
  labels,
  behavior,
  offset,
  className,
  style,
  onKeyDown,
  ...props
}: ConversationCheckpointsProps) {
  const engine = useEngine("ConversationCheckpoints");
  const version = useSyncExternalStore(engine.subscribe, engine.version, () => 0);
  const text = { ...CHECKPOINT_LABELS, ...labels };
  const [checkpoints, setCheckpoints] = useState<Checkpoint[]>([]);
  const [active, setActive] = useState(-1);
  const [viewport, setViewport] = useState(0);
  const [focused, setFocused] = useState<number | null>(null);
  const rail = useRef<HTMLDivElement | null>(null);

  // The list: what registered itself and what the selector finds, in the order of the page. Rebuilt at most once a frame
  // when the log's children change; a message's words are read again only when something inside it changed.
  useEffect(() => {
    void version;
    const column = engine.column();
    if (!column) {
      setCheckpoints([]);
      return;
    }
    const words = new WeakMap<HTMLElement, string>();
    let known = new Set<HTMLElement>();
    const rebuild = () => {
      const registered = engine.checkpoints();
      const found = new Set<HTMLElement>(selector ? column.querySelectorAll<HTMLElement>(selector) : []);
      for (const element of registered.keys()) if (column.contains(element)) found.add(element);
      const elements = [...found].sort((a, b) => (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1));
      known = found;
      const next = elements.map((element) => {
        const given = registered.get(element)?.label;
        let label = given ?? words.get(element);
        if (label === undefined) words.set(element, (label = textOf(element)));
        return { key: keyOf(element), element, label };
      });
      setCheckpoints((previous) =>
        previous.length === next.length && previous.every((item, index) => item.element === next[index]!.element && item.label === next[index]!.label)
          ? previous
          : next,
      );
    };
    let scheduled = 0;
    const observer = new MutationObserver((records) => {
      for (const record of records) {
        for (let node: Node | null = record.target; node && node !== column; node = node.parentNode) {
          if (known.has(node as HTMLElement)) words.delete(node as HTMLElement);
        }
      }
      if (!scheduled)
        scheduled = requestAnimationFrame(() => {
          scheduled = 0;
          rebuild();
        });
    });
    rebuild();
    observer.observe(column, { childList: true, subtree: true, characterData: true });
    return () => {
      observer.disconnect();
      if (scheduled) cancelAnimationFrame(scheduled);
    };
  }, [engine, selector, version]);

  // Which one is being read, from the frames the conversation already reads its scroll position in.
  useEffect(() => {
    const update = () => {
      const scroller = engine.scroller();
      if (!scroller) return;
      const metrics = engine.read();
      const top = scroller.getBoundingClientRect().top + scroller.clientTop;
      setViewport(metrics.clientHeight);
      setActive(
        activeCheckpoint(
          checkpoints.length,
          (index) => checkpoints[index]!.element.getBoundingClientRect().top - top,
          readingLine(metrics.clientHeight),
          overflows(metrics) && distanceToEnd(metrics) <= 4,
        ),
      );
    };
    update();
    return engine.watch(update);
  }, [engine, checkpoints]);

  // A long rail scrolls inside its limit: the current marker stays in it.
  useEffect(() => {
    const node = rail.current;
    const marker = node?.children[active] as HTMLElement | undefined;
    if (!node || !marker) return;
    if (marker.offsetTop < node.scrollTop) node.scrollTop = marker.offsetTop;
    else if (marker.offsetTop + marker.offsetHeight > node.scrollTop + node.clientHeight) node.scrollTop = marker.offsetTop + marker.offsetHeight - node.clientHeight;
  }, [active, checkpoints.length]);

  if (checkpoints.length < 2) return null;

  const count = checkpoints.length;
  const stop = focused !== null && focused < count ? focused : Math.max(0, active);
  const move = (event: KeyboardEvent<HTMLDivElement>) => {
    (onKeyDown as ((event: KeyboardEvent<HTMLDivElement>) => void) | undefined)?.(event);
    if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return;
    const index = Number((event.target as HTMLElement).closest<HTMLElement>("[data-index]")?.dataset.index ?? -1);
    const next = index < 0 ? null : rovingTarget(event.key, index, count);
    if (next === null) return;
    event.preventDefault();
    (event.currentTarget.children[next] as HTMLElement | undefined)?.focus();
  };

  return (
    <TooltipProvider closeDelay={0} delay={120} timeout={300}>
      <div
        aria-label={text.rail}
        aria-orientation="vertical"
        className={join("fui-conversation-rail", className)}
        data-slot="conversation-checkpoints"
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) setFocused(null);
        }}
        onKeyDown={move}
        ref={rail}
        role="toolbar"
        style={{ "--fui-conversation-slot": `${markerSlot(count, viewport)}px`, maxBlockSize: viewport ? `${railLimit(viewport)}px` : undefined, ...style } as CSSProperties}
        {...props}
      >
        {checkpoints.map((checkpoint, index) => (
          <Tooltip key={checkpoint.key}>
            <TooltipTrigger
              render={
                <button
                  aria-current={index === active ? "true" : undefined}
                  aria-label={text.jump(index + 1, count, checkpoint.label)}
                  className="fui-conversation-marker"
                  data-index={index}
                  onClick={() => engine.scrollToMessage(checkpoint.element, { behavior, offset })}
                  onFocus={() => setFocused(index)}
                  tabIndex={index === stop ? 0 : -1}
                  type="button"
                />
              }
            >
              <span aria-hidden="true" className="fui-conversation-marker-tick" />
            </TooltipTrigger>
            <TooltipContent className="fui-conversation-preview" side="inline-start" sideOffset={8}>
              <span className="fui-conversation-preview-position">{text.position(index + 1, count)}</span>
              {checkpoint.label ? (
                <span className="fui-conversation-preview-text" dir="auto">
                  {checkpoint.label}
                </span>
              ) : null}
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </TooltipProvider>
  );
}

export type ConversationEmptyProps = Omit<ComponentProps<"div">, "title"> & {
  /** Default "No messages yet". A paragraph, not a heading: the page decides its outline. */
  title?: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
};

/** What a conversation shows before its first message, centred in it. Render it in place of `ConversationContent`. */
export function ConversationEmpty({ title = "No messages yet", description, icon, className, children, ...props }: ConversationEmptyProps) {
  return (
    <div className={join("fui-conversation-empty", className)} data-slot="conversation-empty" {...props}>
      {children ?? (
        <>
          {icon ? <div className="fui-conversation-empty-icon">{icon}</div> : null}
          <p className="fui-conversation-empty-title">{title}</p>
          {description ? <p className="fui-conversation-empty-description">{description}</p> : null}
        </>
      )}
    </div>
  );
}

export type ConversationFooterProps = ComponentProps<"div"> & {
  /** The last lines of the log fade out above the dock (default). `false` ends them at a hard edge. */
  fade?: boolean;
};

/**
 * The composer's dock at the end of the conversation, clear of the device's safe area. Its height is published on the
 * conversation as `--fui-conversation-footer-size`, which the jump key and the rail stand on.
 */
export function ConversationFooter({ fade = true, className, ref, ...props }: ConversationFooterProps) {
  const engine = useEngine("ConversationFooter");
  const node = useRef<HTMLDivElement | null>(null);
  useIsomorphicLayoutEffect(() => {
    const element = node.current;
    if (!element) return;
    const measure = () => engine.setFooter(element.offsetHeight);
    measure();
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(measure);
    observer?.observe(element);
    return () => {
      observer?.disconnect();
      engine.setFooter(null);
    };
  }, [engine]);
  const setNode = useCallback(
    (element: HTMLDivElement | null) => {
      node.current = element;
      assignRef(ref, element);
    },
    [ref],
  );
  return <div className={join("fui-conversation-footer", className)} data-fade={fade || undefined} data-slot="conversation-footer" ref={setNode} {...props} />;
}
