"use client";
// Origin: Fabrials, 0.10, assimilated from X Tracker's player (custom controls over the browser's video element, the keys
// people know from YouTube, one video playing at a time, controls that rest while it plays) and its GIF rules.

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  useSyncExternalStore,
  type ComponentProps,
  type CSSProperties,
  type KeyboardEvent,
  type ReactNode,
  type RefObject,
} from "react";
import { Captions, Gauge, Maximize2, Minimize2, Pause, PictureInPicture2, Play, RotateCcw, Volume2, VolumeX } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuLabel, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuTrigger } from "./menu";
import { IconButton } from "./icon-button";
import { bufferedEnd, clamp, formatClock, keyAction, mayAnimate, playbackProblem, SPEEDS, spokenClock, stepSpeed, type PlayerAction } from "./media-logic";
import { PixelSpinner } from "./pixel-spinner";
import { classes } from "./shared";
import { Slider } from "./slider";
import { claimSound, releaseSound } from "./sound-bus";

export type PlayerLabels = {
  play: string;
  pause: string;
  replay: string;
  seek: string;
  volume: string;
  mute: string;
  unmute: string;
  speed: string;
  normalSpeed: string;
  captions: string;
  fullscreen: string;
  exitFullscreen: string;
  pictureInPicture: string;
  openFile: string;
  problems: { network: string; decode: string; source: string; other: string };
};

const LABELS: PlayerLabels = {
  play: "Play",
  pause: "Pause",
  replay: "Play again",
  seek: "Seek",
  volume: "Volume",
  mute: "Mute",
  unmute: "Unmute",
  speed: "Speed",
  normalSpeed: "Normal",
  captions: "Captions",
  fullscreen: "Full screen",
  exitFullscreen: "Exit full screen",
  pictureInPicture: "Picture in picture",
  openFile: "Open the file",
  problems: {
    network: "The download of the video was cut.",
    decode: "This browser cannot decode the video.",
    source: "The video is gone or its format cannot be played here.",
    other: "The video could not be played.",
  },
};

const AUDIO_PROBLEMS: PlayerLabels["problems"] = {
  network: "The download of the recording was cut.",
  decode: "This browser cannot decode the recording.",
  source: "The recording is gone or its format cannot be played here.",
  other: "The recording could not be played.",
};

const IDLE_MS = 2500;
// One video plays at a time: starting one pauses the one before, through the sound bus it shares with clips, the recorder and
// the reader. Muted loops (animations) are part of the page, not videos.
// The volume people chose stays for the next player in this page.
const preference = { volume: 1, muted: false };

const noSubscription = () => () => {};
const pipSupported = () => typeof document !== "undefined" && "pictureInPictureEnabled" in document && !!document.pictureInPictureEnabled;
const reducedMotion = () => typeof window !== "undefined" && !!window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

type MediaState = {
  playing: boolean;
  started: boolean;
  ended: boolean;
  time: number;
  duration: number;
  buffered: number;
  volume: number;
  muted: boolean;
  rate: number;
  waiting: boolean;
  error: number | null;
  captions: boolean;
};

/** What the element says is what the controls show: one place for the state, the element. */
function useMedia(media: RefObject<HTMLMediaElement | null>, options: { exclusive: boolean }) {
  const [state, setState] = useState<MediaState>({
    playing: false,
    started: false,
    ended: false,
    time: 0,
    duration: 0,
    buffered: 0,
    volume: preference.volume,
    muted: preference.muted,
    rate: 1,
    waiting: false,
    error: null,
    captions: false,
  });
  useEffect(() => {
    const element = media.current;
    if (!element) return;
    const sync = () =>
      setState((now) => ({
        ...now,
        time: element.currentTime,
        duration: Number.isFinite(element.duration) ? element.duration : 0,
        buffered: bufferedEnd(element.buffered, element.currentTime),
        volume: element.volume,
        muted: element.muted,
        rate: element.playbackRate,
        captions: Array.from((element as HTMLVideoElement).textTracks ?? []).some((track) => track.mode === "showing"),
      }));
    const on = (name: string, listener: () => void) => {
      element.addEventListener(name, listener);
      return () => element.removeEventListener(name, listener);
    };
    const offs = [
      ...["loadedmetadata", "durationchange", "timeupdate", "progress", "seeked", "volumechange", "ratechange"].map((name) => on(name, sync)),
      on("play", () => {
        if (options.exclusive) claimSound(element, () => element.pause());
        setState((now) => ({ ...now, playing: true, started: true, ended: false, error: null }));
      }),
      on("pause", () => {
        releaseSound(element);
        setState((now) => ({ ...now, playing: false }));
      }),
      on("ended", () => setState((now) => ({ ...now, playing: false, ended: true }))),
      on("waiting", () => setState((now) => ({ ...now, waiting: true }))),
      on("playing", () => setState((now) => ({ ...now, waiting: false }))),
      on("canplay", () => setState((now) => ({ ...now, waiting: false }))),
      on("error", () => setState((now) => ({ ...now, error: element.error?.code ?? 0, waiting: false }))),
    ];
    sync();
    return () => {
      for (const off of offs) off();
      releaseSound(element);
    };
  }, [media, options.exclusive]);
  return state;
}

function useActions(media: RefObject<HTMLMediaElement | null>, host: RefObject<HTMLElement | null>) {
  return useCallback(
    (action: PlayerAction) => {
      const element = media.current;
      if (!element) return;
      const known = Number.isFinite(element.duration);
      switch (action.type) {
        case "toggle":
          if (element.paused || element.ended) void element.play().catch(() => {});
          else element.pause();
          return;
        case "seek":
          if (known) element.currentTime = clamp(element.currentTime + action.by, 0, element.duration);
          return;
        case "seekTo":
          if (known) element.currentTime = (element.duration * action.percent) / 100;
          return;
        case "volume":
          element.volume = clamp(element.volume + action.by, 0, 1);
          element.muted = element.volume === 0;
          preference.volume = element.volume;
          preference.muted = element.muted;
          return;
        case "mute":
          element.muted = !element.muted;
          preference.muted = element.muted;
          return;
        case "speed":
          element.playbackRate = stepSpeed(element.playbackRate, action.direction);
          return;
        case "captions": {
          const tracks = Array.from((element as HTMLVideoElement).textTracks ?? []).filter((track) => track.kind === "captions" || track.kind === "subtitles");
          const on = tracks.some((track) => track.mode === "showing");
          tracks.forEach((track, index) => (track.mode = !on && index === 0 ? "showing" : "hidden"));
          element.dispatchEvent(new Event("volumechange"));
          return;
        }
        case "fullscreen": {
          const frame = host.current;
          if (document.fullscreenElement) void document.exitFullscreen().catch(() => {});
          else if (frame?.requestFullscreen) void frame.requestFullscreen().catch(() => {});
          else (element as HTMLVideoElement & { webkitEnterFullscreen?: () => void }).webkitEnterFullscreen?.();
          return;
        }
      }
    },
    [media, host],
  );
}

/** The seek bar, the clock and the volume: shared by the video and the audio player. */
function Transport({
  state,
  media,
  run,
  text,
  idPrefix,
}: {
  state: MediaState;
  media: RefObject<HTMLMediaElement | null>;
  run: (action: PlayerAction) => void;
  text: PlayerLabels;
  idPrefix: string;
}) {
  const progress = state.duration ? (state.buffered / state.duration) * 100 : 0;
  return (
    <>
      <span className="fui-player-seek" style={{ "--fui-player-buffered": `${progress}%` } as CSSProperties}>
        <Slider
          aria-label={text.seek}
          min={0}
          max={Math.max(state.duration, 1)}
          step={1}
          largeStep={10}
          value={Math.min(state.time, state.duration || 0)}
          disabled={!state.duration}
          getAriaValueText={(_, value) => `${spokenClock(value)} / ${spokenClock(state.duration)}`}
          onValueChange={(value) => {
            const element = media.current;
            if (element && typeof value === "number") element.currentTime = value;
          }}
        />
      </span>
      <span className="fui-player-clock" id={`${idPrefix}-clock`}>
        {formatClock(state.time)} / {formatClock(state.duration)}
      </span>
      <IconButton
        size="icon-sm"
        label={state.muted || state.volume === 0 ? text.unmute : text.mute}
        tooltip={false}
        className="fui-player-mute"
        onClick={() => run({ type: "mute" })}
      >
        {state.muted || state.volume === 0 ? <VolumeX aria-hidden="true" /> : <Volume2 aria-hidden="true" />}
      </IconButton>
      <span className="fui-player-volume">
        <Slider
          aria-label={text.volume}
          min={0}
          max={1}
          step={0.05}
          value={state.muted ? 0 : state.volume}
          getAriaValueText={(_, value) => `${Math.round(value * 100)}%`}
          onValueChange={(value) => {
            const element = media.current;
            if (!element || typeof value !== "number") return;
            element.volume = value;
            element.muted = value === 0;
            preference.volume = value;
            preference.muted = element.muted;
          }}
        />
      </span>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <IconButton
              size="icon-sm"
              label={`${text.speed}: ${state.rate === 1 ? text.normalSpeed : `${state.rate}×`}`}
              tooltip={false}
              className="fui-player-speed"
            />
          }
        >
          {state.rate === 1 ? <Gauge aria-hidden="true" /> : <span className="fui-player-rate">{state.rate}×</span>}
        </DropdownMenuTrigger>
        <DropdownMenuContent side="top" align="end" className="fui-player-menu">
          <DropdownMenuRadioGroup
            value={String(state.rate)}
            onValueChange={(value) => {
              const element = media.current;
              if (element) element.playbackRate = Number(value);
            }}
          >
            <DropdownMenuLabel>{text.speed}</DropdownMenuLabel>
            {SPEEDS.map((speed) => (
              <DropdownMenuRadioItem key={speed} value={String(speed)}>
                {speed === 1 ? text.normalSpeed : `${speed}×`}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}

function usePlayerKeys(run: (action: PlayerAction) => void, audio: boolean) {
  return (event: KeyboardEvent<HTMLElement>) => {
    if (!event.currentTarget.contains(event.target as Node)) return;
    const target = event.target as HTMLElement;
    // A focused button, menu or slider keeps its own keys; the frame is the player's.
    if (target.closest("button, a, [role=slider], [role=menu], [role^=menuitem]") || event.ctrlKey || event.metaKey || event.altKey) return;
    const action = keyAction(event.key, { audio });
    if (!action) return;
    event.preventDefault();
    event.stopPropagation();
    run(action);
  };
}

export type VideoTrack = { src: string; srcLang: string; label: string; kind?: "captions" | "subtitles"; default?: boolean };

export type VideoPlayerProps = Omit<ComponentProps<"video">, "controls" | "children" | "className" | "style"> & {
  src: string;
  /** The video's name for assistive technology (its title, or what it shows). */
  label: string;
  poster?: string;
  /** Captions and subtitles (WebVTT). C turns the first on and off. */
  tracks?: VideoTrack[];
  /** Start playing when it mounts (a viewer opened by a click), unless the person asked for less motion. */
  autoPlay?: boolean;
  labels?: Partial<PlayerLabels>;
  className?: string;
  style?: CSSProperties;
};

/**
 * A video with our controls over the browser's element: play, a seek bar that shows what is loaded, the clock, volume,
 * speed, captions, picture in picture and full screen. Space or K, J and L, the arrows, M, F, C, < and >, Home, End and
 * the digits work while the player has focus. One video plays at a time, and the controls rest while it plays.
 */
export function VideoPlayer({ src, label, poster, tracks, autoPlay = false, labels, className, style, width, height, ...props }: VideoPlayerProps) {
  const text = { ...LABELS, ...labels, problems: { ...LABELS.problems, ...labels?.problems } };
  const id = useId();
  const host = useRef<HTMLDivElement | null>(null);
  const video = useRef<HTMLVideoElement | null>(null);
  const state = useMedia(video, { exclusive: true });
  const run = useActions(video, host);
  const keys = usePlayerKeys(run, false);
  const [awake, setAwake] = useState(true);
  const [fullscreen, setFullscreen] = useState(false);
  const idle = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const canPip = useSyncExternalStore(noSubscription, pipSupported, () => false);
  const wake = useCallback(() => {
    setAwake(true);
    clearTimeout(idle.current);
    idle.current = setTimeout(() => setAwake(false), IDLE_MS);
  }, []);
  useEffect(() => () => clearTimeout(idle.current), []);
  useEffect(() => {
    const element = video.current;
    if (!element) return;
    element.volume = preference.volume;
    element.muted = preference.muted;
    if (autoPlay && !reducedMotion()) void element.play().catch(() => {});
    const change = () => setFullscreen(document.fullscreenElement === host.current);
    document.addEventListener("fullscreenchange", change);
    return () => document.removeEventListener("fullscreenchange", change);
  }, [autoPlay]);
  const ratio = width && height ? Number(width) / Number(height) : 16 / 9;
  const resting = state.playing && !awake;
  const problem = state.error !== null ? playbackProblem(state.error, text.problems) : null;
  return (
    <div
      ref={host}
      role="group"
      aria-label={label}
      aria-roledescription="video player"
      tabIndex={0}
      className={classes("dark", "fui-player", "fui-video-player", className)}
      data-theme="dark"
      style={{ ...style, "--fui-aspect-ratio": String(clamp(ratio, 0.5, 2.4)) } as CSSProperties}
      data-playing={state.playing ? "" : undefined}
      data-resting={resting ? "" : undefined}
      data-fullscreen={fullscreen ? "" : undefined}
      data-state={problem ? "error" : state.waiting ? "waiting" : state.ended ? "ended" : state.started ? "started" : "idle"}
      onKeyDown={(event) => {
        wake();
        keys(event);
      }}
      onPointerMove={wake}
      onFocus={wake}
    >
      <video
        {...props}
        ref={video}
        src={src}
        poster={poster}
        width={width}
        height={height}
        playsInline
        preload={props.preload ?? "metadata"}
        className="fui-video-player-video"
        onClick={() => run({ type: "toggle" })}
        onDoubleClick={() => run({ type: "fullscreen" })}
      >
        {tracks?.map((track) => (
          <track key={track.src} src={track.src} srcLang={track.srcLang} label={track.label} kind={track.kind ?? "captions"} default={track.default} />
        ))}
      </video>
      {state.waiting ? (
        <span className="fui-player-waiting" aria-hidden="true">
          <PixelSpinner />
        </span>
      ) : null}
      {problem ? (
        <div className="fui-player-problem" role="alert">
          <p>{problem}</p>
          <a href={src} target="_blank" rel="noreferrer">
            {text.openFile}
          </a>
        </div>
      ) : !state.started ? (
        <button type="button" className="fui-player-start" aria-label={text.play} onClick={() => run({ type: "toggle" })}>
          <Play aria-hidden="true" />
        </button>
      ) : null}
      {problem ? null : (
        <div className="fui-player-bar">
          <IconButton size="icon-sm" label={state.ended ? text.replay : state.playing ? text.pause : text.play} tooltip={false} onClick={() => run({ type: "toggle" })}>
            {state.ended ? <RotateCcw aria-hidden="true" /> : state.playing ? <Pause aria-hidden="true" /> : <Play aria-hidden="true" />}
          </IconButton>
          <Transport state={state} media={video} run={run} text={text} idPrefix={id} />
          {tracks?.length ? (
            <IconButton size="icon-sm" label={text.captions} tooltip={false} aria-pressed={state.captions} onClick={() => run({ type: "captions" })}>
              <Captions aria-hidden="true" />
            </IconButton>
          ) : null}
          {canPip ? (
            <IconButton
              size="icon-sm"
              label={text.pictureInPicture}
              tooltip={false}
              className="fui-player-pip"
              onClick={() => {
                const element = video.current;
                if (!element) return;
                if (document.pictureInPictureElement) void document.exitPictureInPicture().catch(() => {});
                else void element.requestPictureInPicture?.().catch(() => {});
              }}
            >
              <PictureInPicture2 aria-hidden="true" />
            </IconButton>
          ) : null}
          <IconButton size="icon-sm" label={fullscreen ? text.exitFullscreen : text.fullscreen} tooltip={false} onClick={() => run({ type: "fullscreen" })}>
            {fullscreen ? <Minimize2 aria-hidden="true" /> : <Maximize2 aria-hidden="true" />}
          </IconButton>
        </div>
      )}
    </div>
  );
}

export type AudioPlayerProps = Omit<ComponentProps<"audio">, "controls" | "children" | "className" | "style" | "title"> & {
  src: string;
  /** The recording's name. */
  label: string;
  /** A line above the controls: a title, a speaker, a date. */
  title?: ReactNode;
  labels?: Partial<PlayerLabels>;
  className?: string;
  style?: CSSProperties;
};

/** A recording in one row: play, the seek bar with what is loaded, the clock, volume and speed. The same keys as the video. */
export function AudioPlayer({ src, label, title, labels, className, style, ...props }: AudioPlayerProps) {
  const text = { ...LABELS, ...labels, problems: { ...AUDIO_PROBLEMS, ...labels?.problems } };
  const id = useId();
  const host = useRef<HTMLDivElement | null>(null);
  const audio = useRef<HTMLAudioElement | null>(null);
  const state = useMedia(audio, { exclusive: true });
  const run = useActions(audio, host);
  const keys = usePlayerKeys(run, true);
  useEffect(() => {
    const element = audio.current;
    if (!element) return;
    element.volume = preference.volume;
    element.muted = preference.muted;
  }, []);
  const problem = state.error !== null ? playbackProblem(state.error, text.problems) : null;
  return (
    <div
      ref={host}
      role="group"
      aria-label={label}
      aria-roledescription="audio player"
      tabIndex={0}
      className={classes("fui-player", "fui-audio-player", className)}
      style={style}
      data-playing={state.playing ? "" : undefined}
      data-state={problem ? "error" : state.waiting ? "waiting" : state.ended ? "ended" : state.started ? "started" : "idle"}
      onKeyDown={keys}
    >
      <audio {...props} ref={audio} src={src} preload={props.preload ?? "metadata"} />
      {title ? <div className="fui-audio-player-title">{title}</div> : null}
      {problem ? (
        <p className="fui-player-problem-inline" role="alert">
          {problem}
        </p>
      ) : (
        <div className="fui-player-bar">
          <IconButton size="icon-sm" label={state.ended ? text.replay : state.playing ? text.pause : text.play} tooltip={false} onClick={() => run({ type: "toggle" })}>
            {state.waiting ? <PixelSpinner /> : state.ended ? <RotateCcw aria-hidden="true" /> : state.playing ? <Pause aria-hidden="true" /> : <Play aria-hidden="true" />}
          </IconButton>
          <Transport state={state} media={audio} run={run} text={text} idPrefix={id} />
        </div>
      )}
    </div>
  );
}

export type AnimatedImageProps = {
  src: string;
  alt: string;
  /** `video`: an MP4 or WebM that loops without sound (how most sites send a GIF). `image`: a GIF, APNG or animated WebP. */
  type?: "image" | "video";
  /** A still frame for the paused state. Without one, a GIF's first frame is drawn. */
  poster?: string;
  width?: number;
  height?: number;
  /** The corner tag ("GIF"). `null` hides it. */
  badge?: ReactNode | null;
  playLabel?: string;
  pauseLabel?: string;
  className?: string;
  style?: CSSProperties;
};

/**
 * An animation that moves only while at least half of it is on screen, the tab is in front and motion is allowed, with a
 * pause button that always works (WCAG 2.2.2). Under reduced motion it starts still; a person who presses play gets it
 * until it leaves the screen.
 */
export function AnimatedImage({
  src,
  alt,
  type = "video",
  poster,
  width,
  height,
  badge = "GIF",
  playLabel = "Play animation",
  pauseLabel = "Pause animation",
  className,
  style,
}: AnimatedImageProps) {
  const host = useRef<HTMLDivElement | null>(null);
  const video = useRef<HTMLVideoElement | null>(null);
  const still = useRef<HTMLCanvasElement | null>(null);
  const [moving, setMoving] = useState(false);
  const [drawn, setDrawn] = useState(false);
  const userPaused = useRef(false);
  const userPlayed = useRef(false);
  const visible = useRef(0);

  const apply = useCallback((on: boolean) => {
    setMoving(on);
    const element = video.current;
    if (!element) return;
    if (on && element.paused) void element.play().catch(() => setMoving(false));
    else if (!on && !element.paused) element.pause();
  }, []);

  useEffect(() => {
    const node = host.current;
    if (!node) return;
    const query = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    const evaluate = () => {
      if (visible.current < 0.5) {
        userPaused.current = false;
        userPlayed.current = false;
      }
      const may = mayAnimate({ visibleRatio: visible.current, tabHidden: document.hidden, reducedMotion: !!query?.matches && !userPlayed.current });
      apply(may && !userPaused.current);
    };
    const seen =
      typeof IntersectionObserver === "undefined"
        ? null
        : new IntersectionObserver(
            (entries) => {
              visible.current = entries.at(-1)?.intersectionRatio ?? 0;
              evaluate();
            },
            { threshold: [0, 0.25, 0.5, 0.75, 1] },
          );
    seen?.observe(node);
    document.addEventListener("visibilitychange", evaluate);
    query?.addEventListener?.("change", evaluate);
    return () => {
      seen?.disconnect();
      document.removeEventListener("visibilitychange", evaluate);
      query?.removeEventListener?.("change", evaluate);
    };
  }, [apply]);

  // A GIF without a poster: its first frame, drawn once it loads (a canvas draws an animated image's first frame).
  const drawFirstFrame = (image: HTMLImageElement) => {
    const canvas = still.current;
    if (!canvas || poster || drawn) return;
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    try {
      canvas.getContext("2d")?.drawImage(image, 0, 0);
      setDrawn(true);
    } catch {
      // A cross-origin image without CORS still draws (the canvas is only tainted); anything else keeps the image.
    }
  };

  const ratio = width && height ? `${width} / ${height}` : undefined;
  return (
    <div
      ref={host}
      className={classes("fui-animated-image", className)}
      style={{ ...style, "--fui-aspect-ratio": ratio } as CSSProperties}
      data-moving={moving ? "" : undefined}
      data-type={type}
    >
      <span className="fui-animated-image-frame" role="img" aria-label={alt}>
        {type === "video" ? (
          <video ref={video} src={src} poster={poster} muted loop playsInline preload="metadata" aria-hidden="true" width={width} height={height} className="fui-animated-image-media" />
        ) : (
          <>
            <img
              src={src}
              alt=""
              width={width}
              height={height}
              className="fui-animated-image-media"
              data-hidden={!moving && (poster || drawn) ? "" : undefined}
              onLoad={(event) => drawFirstFrame(event.currentTarget)}
            />
            {poster ? (
              <img src={poster} alt="" className="fui-animated-image-still" data-hidden={moving ? "" : undefined} />
            ) : (
              <canvas ref={still} aria-hidden="true" className="fui-animated-image-still" data-hidden={moving || !drawn ? "" : undefined} />
            )}
          </>
        )}
      </span>
      {badge !== null ? (
        <span className="fui-animated-image-badge" aria-hidden="true">
          {badge}
        </span>
      ) : null}
      <IconButton
        size="icon-sm"
        label={moving ? pauseLabel : playLabel}
        tooltip={false}
        className="fui-animated-image-toggle"
        onClick={() => {
          if (moving) {
            userPaused.current = true;
            userPlayed.current = false;
            apply(false);
          } else {
            userPaused.current = false;
            userPlayed.current = true;
            apply(true);
          }
        }}
      >
        {moving ? <Pause aria-hidden="true" /> : <Play aria-hidden="true" />}
      </IconButton>
    </div>
  );
}
