"use client";

import { useState } from "react";
import {
  CardCaption,
  CopyButton,
  DescriptionDetails,
  DescriptionItem,
  DescriptionList,
  DescriptionTerm,
  DitherGem,
  RADIANT_ORDERS,
  RADIANT_ORDER_MAP,
  RadiantGlyph,
  type RadiantOrder,
} from "@fabrials/ui";

const HOUSE_ROLE: Record<RadiantOrder, string> = {
  windrunner: "Syl — GUI, terminal, phone & browser automation",
  skybreaker: "News & guides — structured verification streams",
  dustbringer: "Spanreed — model usage capture & tray telemetry",
  edgedancer: "Wyndle — quiet page pruning & summaries",
  truthwatcher: "X Tracker — public signal & account monitoring",
  lightweaver: "Lightweave — desktop media & playback client",
  elsecaller: "Fabrials UI & Urithiru — shared system architecture",
  willshaper: "ai.fabrials.com — multi-provider model relay",
  stoneward: "Foundation — dependable core primitives & tokens",
  bondsmith: "fabrials.com & Radiant — shared home & private chat",
};

export function OrdersShowcase() {
  const [selected, setSelected] = useState<RadiantOrder>("windrunner");
  const current = RADIANT_ORDER_MAP[selected];
  const usageSnippet = `<RadiantGlyph order="${current.order}" size={24} colored />`;

  return (
    <div className="orders-layout">
      <ul className="orders-grid" aria-label="Ten Orders of the Knights Radiant">
        {RADIANT_ORDERS.map((item) => {
          const active = item.order === selected;
          return (
            <li key={item.order}>
              <button
                type="button"
                className="order-button"
                aria-pressed={active}
                onClick={() => setSelected(item.order)}
              >
                <span className="order-button-glyph">
                  <RadiantGlyph order={item.order} size={26} colored />
                </span>
                <span className="order-button-text">
                  <span className="order-button-title">
                    <span className="order-button-num">{String(item.number).padStart(2, "0")}</span>
                    <span>{item.plural}</span>
                  </span>
                  <span className="order-button-sub">
                    {item.gem} · {item.surges[0]} &amp; {item.surges[1]}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      <article className="order-specimen" aria-live="polite">
        <div className="order-specimen-stage">
          <div className="order-specimen-mark">
            <div className="order-specimen-well">
              <RadiantGlyph order={current.order} size={78} colored title={`${current.name} order glyph`} />
            </div>
            <div className="grid gap-1.5">
              <p className="landing-label-voice">
                Order {String(current.number).padStart(2, "0")} · Herald {current.herald}
              </p>
              <h3 className="font-display text-2xl leading-none font-semibold text-foreground">{current.plural}</h3>
              <div className="flex items-center gap-2 pt-1 text-xs text-muted-foreground">
                <DitherGem gem={current.gem} size={18} />
                <span className="capitalize">{current.gem}</span>
                <span>·</span>
                <code className="font-mono text-[11px]">data-gem=&quot;{current.gem}&quot;</code>
              </div>
            </div>
          </div>

          <div className="order-specimen-scales" aria-label="Optical scale verification">
            {[16, 20, 28, 40].map((size) => (
              <div key={size} className="order-specimen-scale-item">
                <RadiantGlyph order={current.order} size={size} />
                <span aria-hidden="true">{size}px</span>
              </div>
            ))}
          </div>
        </div>

        <div className="order-specimen-body">
          <DescriptionList layout="grid">
            <DescriptionItem>
              <DescriptionTerm>Surges</DescriptionTerm>
              <DescriptionDetails>
                {current.surges[0]} &amp; {current.surges[1]}
              </DescriptionDetails>
            </DescriptionItem>
            <DescriptionItem>
              <DescriptionTerm>Glyph geometry</DescriptionTerm>
              <DescriptionDetails>{current.motif}</DescriptionDetails>
            </DescriptionItem>
            <DescriptionItem>
              <DescriptionTerm>House role</DescriptionTerm>
              <DescriptionDetails>{HOUSE_ROLE[current.order]}</DescriptionDetails>
            </DescriptionItem>
          </DescriptionList>

          <div className="order-specimen-code">
            <code>{usageSnippet}</code>
            <CopyButton value={usageSnippet} label="Copy RadiantGlyph snippet" />
          </div>
        </div>

        <CardCaption>
          <span>Fig. 2 — Canonical 64×64 Vorin bilateral symmetry</span>
          <span>10 polestones · Pure SVG</span>
        </CardCaption>
      </article>
    </div>
  );
}
