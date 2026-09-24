import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  FabrialsGem,
  PageHeader,
  ProductLockup,
  SectionHeader,
  type GemName,
} from "@fabrials/ui";

const meta = {
  title: "Fabrials/Brand",
  parameters: { layout: "fullscreen" },
} satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

const surfaces = [
  ["Canvas", "--background"],
  ["Surface", "--card"],
  ["Overlay", "--popover"],
  ["Sunken", "--muted"],
  ["Hover", "--accent"],
  ["Navigation", "--sidebar"],
  ["Hairline", "--border"],
  ["Control boundary", "--fui-control-border"],
] as const;

const inks = [
  ["Text", "--foreground"],
  ["Secondary text", "--muted-foreground"],
  ["Primary action", "--primary"],
  ["Stormlight", "--brand"],
  ["Stormlight text", "--brand-ink"],
  ["Success", "--fui-success-ink"],
  ["Warning", "--fui-warning-ink"],
  ["Danger", "--fui-danger-ink"],
] as const;

const charts = ["--chart-1", "--chart-2", "--chart-3", "--chart-4", "--chart-5", "--chart-6"];

const products: Array<{ product: string; tagline: string; gem: GemName }> = [
  { product: "Fabrials", tagline: "fabrials.com", gem: "heliodor" },
  { product: "ai-relay", tagline: "Operator console", gem: "sapphire" },
  { product: "Spanreed", tagline: "Usage on this machine", gem: "ruby" },
  { product: "Open Email", tagline: "by Fabrials", gem: "emerald" },
  { product: "Fabrials UI", tagline: "ui.fabrials.com", gem: "zircon" },
  { product: "Grok Insider", tagline: "Puck's workshop", gem: "smokestone" },
  { product: "Radiant", tagline: "Default family light", gem: "stormlight" },
  { product: "Reserved", tagline: "Future product", gem: "amethyst" },
];

const typeScale = [
  ["Display", "--fui-text-display", "Instruments that sit next to agents"],
  ["Page title", "--fui-text-title", "Accounts"],
  ["Section title", "--fui-text-xl", "Usage by model"],
  ["Card title", "--fui-text-lg", "Proxy keys"],
  ["Lead", "--fui-text-md", "Manage provider accounts and resolve authorization issues."],
  ["Body", "--fui-text-sm", "Provider secrets are never returned by the dashboard."],
  ["Metadata", "--fui-text-xs", "Updated 4 minutes ago · 12 requests"],
] as const;

function Swatch({ label, token }: { label: string; token: string }) {
  return (
    <figure className="catalogue-swatch">
      <span className="catalogue-swatch-chip" style={{ background: `var(${token})` }} />
      <figcaption>
        <strong>{label}</strong>
        <code>{token}</code>
      </figcaption>
    </figure>
  );
}

function TokensDemo() {
  return (
    <main className="catalogue">
      <PageHeader
        title="Tokens"
        description="Stone and graphite carry the screen; Stormlight marks interaction; each product's gem signs its mark. Switch the toolbar theme to compare."
      />
      <section aria-labelledby="tokens-surfaces" className="catalogue-stack">
        <SectionHeader title={<span id="tokens-surfaces">Surfaces</span>} />
        <div className="catalogue-swatches">
          {surfaces.map(([label, token]) => (
            <Swatch key={token} label={label} token={token} />
          ))}
        </div>
      </section>
      <section aria-labelledby="tokens-inks" className="catalogue-stack">
        <SectionHeader
          title={<span id="tokens-inks">Ink and state</span>}
          description="Every text color reaches 4.5:1 on every surface above, in both themes."
        />
        <div className="catalogue-swatches">
          {inks.map(([label, token]) => (
            <Swatch key={token} label={label} token={token} />
          ))}
        </div>
      </section>
      <section aria-labelledby="tokens-charts" className="catalogue-stack">
        <SectionHeader
          title={<span id="tokens-charts">Data series</span>}
          description="Categorical, muted, and at least 3:1 on the card surface."
        />
        <div className="catalogue-series">
          {charts.map((token, index) => (
            <span key={token} className="catalogue-series-bar" style={{ background: `var(${token})`, height: `${40 + index * 9}%` }}>
              <span className="fui-sr-only">{token}</span>
            </span>
          ))}
        </div>
      </section>
      <section aria-labelledby="tokens-type" className="catalogue-stack">
        <SectionHeader
          title={<span id="tokens-type">Type</span>}
          description="IBM Plex Sans for interface text, Plex Mono for code and identifiers, Plex Serif for editorial display."
        />
        <div className="catalogue-type">
          {typeScale.map(([label, token, sample]) => (
            <div key={token} className="catalogue-type-row">
              <span className="catalogue-type-meta">
                {label}
                <code>{token}</code>
              </span>
              <span style={{ fontSize: `var(${token})`, lineHeight: 1.2, fontWeight: token === "--fui-text-sm" || token === "--fui-text-xs" || token === "--fui-text-md" ? 400 : 600, letterSpacing: token === "--fui-text-display" ? "var(--fui-tracking-tighter)" : undefined }}>
                {sample}
              </span>
            </div>
          ))}
          <div className="catalogue-type-row">
            <span className="catalogue-type-meta">
              Mono
              <code>--fui-font-mono</code>
            </span>
            <span style={{ fontFamily: "var(--fui-font-mono)" }}>relay_7f3a · sk-…a91c · 127.0.0.1:18736</span>
          </div>
          <div className="catalogue-type-row">
            <span className="catalogue-type-meta">
              Serif
              <code>--fui-font-serif</code>
            </span>
            <span style={{ fontFamily: "var(--fui-font-serif)", fontSize: "var(--fui-text-2xl)", lineHeight: 1.2 }}>
              A quieter kind of inbox.
            </span>
          </div>
        </div>
      </section>
      <section aria-labelledby="tokens-shape" className="catalogue-stack">
        <SectionHeader
          title={<span id="tokens-shape">Shape and elevation</span>}
          description="Interactive 8 px, containers 12 px, overlays 16 px, passive labels as pills."
        />
        <div className="catalogue-shapes">
          {[
            ["Control", "--fui-radius-md", "--fui-shadow-xs"],
            ["Card", "--fui-radius-lg", "--fui-shadow-sm"],
            ["Menu", "--fui-radius-lg", "--fui-shadow-md"],
            ["Dialog", "--fui-radius-xl", "--fui-shadow-lg"],
          ].map(([label, radius, shadow]) => (
            <div key={label} className="catalogue-shape" style={{ borderRadius: `var(${radius})`, boxShadow: `var(${shadow})` }}>
              <strong>{label}</strong>
              <code>{radius}</code>
              <code>{shadow}</code>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

function LockupsDemo() {
  return (
    <main className="catalogue">
      <PageHeader
        title="Product lockups"
        description="One frame, one light, a gem per product. The gem colors only the mark, never status or interaction."
      />
      <section aria-label="Lockups" className="catalogue-lockups">
        {products.map((item) => (
          <div key={item.product} className="catalogue-lockup">
            <ProductLockup product={item.product} tagline={item.tagline} gem={item.gem} size="lg" />
            <span className="catalogue-table-meta">
              {item.gem} · <code>data-gem="{item.gem}"</code>
            </span>
          </div>
        ))}
      </section>
      <section aria-label="Gem sizes" className="catalogue-row catalogue-panel">
        {[16, 20, 24, 32, 48].map((size) => (
          <FabrialsGem key={size} size={size} gem="stormlight" title={`Stormlight gem at ${size} pixels`} />
        ))}
      </section>
    </main>
  );
}

export const Tokens: Story = { render: () => <TokensDemo /> };
export const Lockups: Story = { render: () => <LockupsDemo /> };
