"use client";

import { useEffect, useId, useRef, type CSSProperties } from "react";
import {
  MOON_CX as CX,
  MOON_CY as CY,
  MOON_R as R,
  MOON_VARIANTS,
  moonFrame,
  moonVariant,
  moonVariantCaption,
  pickMoonVariant,
  type MoonVariant,
  type MoonVariantId,
} from "./moon-math";
import { classes } from "./shared";

const REVEAL_MS = 1200;

export type MoonPhaseProps = {
  phase?: number;
  animate?: boolean;
  cycleMs?: number;
  size?: number | string;
  halo?: boolean;
  variant?: MoonVariantId | "random";
  caption?: boolean;
  onVariantChange?: (variant: MoonVariant) => void;
  label?: string;
  className?: string;
  style?: CSSProperties;
};

export function MoonPhase({
  phase = 0.5,
  animate = false,
  cycleMs = 16000,
  size = 128,
  halo = true,
  variant = "regular",
  caption = false,
  onVariantChange,
  label,
  className,
  style,
}: MoonPhaseProps) {
  const uid = useId().replace(/:/g, "");
  const groupRef = useRef<SVGGElement>(null);
  const shadowRef = useRef<SVGPathElement>(null);
  const glowOuterRef = useRef<SVGPathElement>(null);
  const glowInnerRef = useRef<SVGPathElement>(null);
  const tintRef = useRef<SVGCircleElement>(null);
  const ringRef = useRef<SVGCircleElement>(null);
  const captionRef = useRef<HTMLSpanElement>(null);
  const onVariantChangeRef = useRef(onVariantChange);

  useEffect(() => {
    onVariantChangeRef.current = onVariantChange;
  }, [onVariantChange]);

  useEffect(() => {
    const fixed = variant === "random" ? null : moonVariant(variant);
    let current = fixed ?? pickMoonVariant();

    const announce = () => {
      if (captionRef.current) captionRef.current.textContent = moonVariantCaption(current);
      onVariantChangeRef.current?.(current);
    };

    const draw = (value: number, reveal: number) => {
      const frame = moonFrame(value, current, reveal);
      groupRef.current?.setAttribute("transform", frame.transform);
      shadowRef.current?.setAttribute("d", frame.shadowPath);
      if (shadowRef.current) shadowRef.current.style.fillOpacity = String(frame.shadowOpacity);
      for (const [ref, opacity] of [
        [glowOuterRef, frame.glowOuterOpacity],
        [glowInnerRef, frame.glowInnerOpacity],
      ] as const) {
        ref.current?.setAttribute("d", frame.litPath);
        ref.current?.setAttribute("fill", frame.glowColor);
        ref.current?.setAttribute("opacity", String(opacity));
      }
      tintRef.current?.setAttribute("fill", frame.tint);
      tintRef.current?.setAttribute("opacity", String(frame.tintOpacity));
      ringRef.current?.setAttribute("opacity", String(frame.ringOpacity));
      if (captionRef.current) captionRef.current.style.opacity = String(frame.captionOpacity);
    };

    announce();
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    let raf = 0;
    let start: number | null = null;
    let cycle: number | null = null;
    const revealMs = fixed ? 0 : REVEAL_MS;

    const tick = (now: number) => {
      start ??= now;
      const elapsed = now - start;
      const value = phase + elapsed / cycleMs;
      const index = Math.floor(value);
      if (!fixed && cycle !== null && index !== cycle) {
        current = pickMoonVariant();
        announce();
      }
      cycle = index;
      draw(value, revealMs ? Math.min(1, elapsed / revealMs) : 1);
      raf = requestAnimationFrame(tick);
    };

    const sync = () => {
      cancelAnimationFrame(raf);
      start = null;
      cycle = null;
      if (animate && !reduce.matches) raf = requestAnimationFrame(tick);
      else draw(phase, 1);
    };

    sync();
    reduce.addEventListener("change", sync);
    return () => {
      cancelAnimationFrame(raf);
      reduce.removeEventListener("change", sync);
    };
  }, [animate, cycleMs, phase, variant]);

  const initialVariant = variant === "random" ? MOON_VARIANTS[0] : moonVariant(variant);
  const initial = moonFrame(phase, initialVariant);
  const id = (name: string) => `fui-moon-${name}-${uid}`;
  const dimension = typeof size === "number" ? `${size}px` : size;

  return (
    <span
      aria-hidden={label ? undefined : true}
      aria-label={label}
      className={classes("fui-moon-phase", className)}
      role={label ? "img" : undefined}
      style={style}
    >
      <span className="fui-moon-phase-box" style={{ width: dimension, height: dimension }}>
        <svg className="fui-moon-phase-art" viewBox="0 0 512 512">
          <defs>
            <radialGradient id={id("face")} cx="0.38" cy="0.34" r="0.78">
              <stop offset="0" stopColor="#FBFCFF" />
              <stop offset="0.55" stopColor="#DCE3EF" />
              <stop offset="1" stopColor="#A9B5CC" />
            </radialGradient>
            <radialGradient id={id("crater")} cx="0.4" cy="0.4" r="0.6">
              <stop offset="0" stopColor="#8A97B2" stopOpacity="0.9" />
              <stop offset="1" stopColor="#8A97B2" stopOpacity="0.35" />
            </radialGradient>
            <filter id={id("soft")} x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="6" />
            </filter>
            <filter id={id("edge")} x="-10%" y="-10%" width="120%" height="120%">
              <feGaussianBlur stdDeviation="4" />
            </filter>
            <filter id={id("glow-outer")} x="-80%" y="-80%" width="260%" height="260%">
              <feGaussianBlur stdDeviation="58" />
            </filter>
            <filter id={id("glow-inner")} x="-40%" y="-40%" width="180%" height="180%">
              <feGaussianBlur stdDeviation="18" />
            </filter>
            <filter id={id("ring")} x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" />
            </filter>
            <clipPath id={id("disc")}>
              <circle cx={CX} cy={CY} r={R} />
            </clipPath>
            <clipPath id={id("shadow-clip")}>
              <circle cx={CX} cy={CY} r={R + 1} />
            </clipPath>
          </defs>
          <circle
            ref={ringRef}
            className="fui-moon-phase-ring"
            cx={CX}
            cy={CY}
            fill="none"
            filter={`url(#${id("ring")})`}
            opacity={initial.ringOpacity}
            r={238}
          />
          <g ref={groupRef} transform={initial.transform}>
            {halo ? (
              <>
                <path
                  ref={glowOuterRef}
                  d={initial.litPath}
                  fill={initial.glowColor}
                  filter={`url(#${id("glow-outer")})`}
                  opacity={initial.glowOuterOpacity}
                />
                <path
                  ref={glowInnerRef}
                  d={initial.litPath}
                  fill={initial.glowColor}
                  filter={`url(#${id("glow-inner")})`}
                  opacity={initial.glowInnerOpacity}
                />
              </>
            ) : null}
            <circle cx={CX} cy={CY} r={R} fill={`url(#${id("face")})`} />
            <g clipPath={`url(#${id("disc")})`}>
              <g fill="#8A97B2" fillOpacity="0.45" filter={`url(#${id("soft")})`}>
                <ellipse cx="200" cy="200" rx="58" ry="44" transform="rotate(-20 200 200)" />
                <ellipse cx="292" cy="176" rx="42" ry="30" transform="rotate(15 292 176)" />
                <ellipse cx="236" cy="290" rx="70" ry="40" transform="rotate(25 236 290)" />
                <ellipse cx="320" cy="262" rx="30" ry="24" />
                <ellipse cx="166" cy="304" rx="26" ry="20" />
              </g>
              <g stroke="#F4F7FD" strokeOpacity="0.7" strokeWidth="3">
                <circle cx="300" cy="352" r="22" fill={`url(#${id("crater")})`} />
                <circle cx="352" cy="214" r="13" fill={`url(#${id("crater")})`} />
                <circle cx="150" cy="232" r="11" fill={`url(#${id("crater")})`} />
                <circle cx="262" cy="232" r="8" fill={`url(#${id("crater")})`} />
                <circle cx="210" cy="370" r="9" fill={`url(#${id("crater")})`} />
              </g>
              <circle
                cx={CX}
                cy={CY}
                r={R}
                fill="none"
                stroke="#6F7C99"
                strokeOpacity="0.45"
                strokeWidth="34"
                transform="translate(14 14)"
                filter={`url(#${id("soft")})`}
              />
              <circle
                ref={tintRef}
                className="fui-moon-phase-tint"
                cx={CX}
                cy={CY}
                fill={initial.tint}
                opacity={initial.tintOpacity}
                r={R}
              />
            </g>
            <circle cx={CX} cy={CY} r={R - 1} fill="none" stroke="#E9EEF8" strokeOpacity="0.8" strokeWidth="3" />
            <g clipPath={`url(#${id("shadow-clip")})`}>
              <path
                ref={shadowRef}
                className="fui-moon-phase-shadow"
                d={initial.shadowPath}
                filter={`url(#${id("edge")})`}
                style={{ fillOpacity: initial.shadowOpacity }}
              />
            </g>
          </g>
        </svg>
      </span>
      {caption ? (
        <span ref={captionRef} aria-hidden className="fui-moon-phase-caption" style={{ opacity: initial.captionOpacity }}>
          {moonVariantCaption(initialVariant)}
        </span>
      ) : null}
    </span>
  );
}

export type StarfieldProps = {
  twinkle?: boolean;
  className?: string;
};

export function Starfield({ twinkle = true, className }: StarfieldProps) {
  return (
    <span aria-hidden className={classes("fui-starfield", className)}>
      <span className="fui-starfield-near" />
      <span className={classes("fui-starfield-far", twinkle && "fui-starfield-twinkle")} />
    </span>
  );
}
