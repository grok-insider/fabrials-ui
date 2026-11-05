import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button, DitherGem, DitherScene, Kbd, Snippet } from "@fabrials/ui";
import { accounts, daily, nav, products, senders, stats, week } from "./data";
import "./instrument.css";
import "./palettes.css";

type Palette = "obsidian" | "ember" | "deep" | undefined;

// Direction A, "Instrument": Fabrials as calibrated devices. Visible
// construction (grid guides, corner marks, rulers), Plex Mono as a second
// voice for readouts and captions, data drawn in dither, square plates.

const meta = {
  title: "Identity proposals/A Instrument",
  parameters: { layout: "fullscreen" },
} satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

function Marks() {
  return (
    <>
      <i className="in-mark" data-at="tl" aria-hidden />
      <i className="in-mark" data-at="tr" aria-hidden />
      <i className="in-mark" data-at="bl" aria-hidden />
      <i className="in-mark" data-at="br" aria-hidden />
    </>
  );
}

function Ruler({ share, ticks = 40, label }: { share: number; ticks?: number; label: string }) {
  const filled = Math.round(share * ticks);
  return (
    <svg className="in-ruler" viewBox={`0 0 ${ticks * 4} 10`} preserveAspectRatio="none" role="img" aria-label={label}>
      {Array.from({ length: ticks + 1 }, (_, i) => (
        <rect key={i} x={i * 4} y={i % 10 === 0 ? 0 : i % 5 === 0 ? 3 : 5} width={1} height={i % 10 === 0 ? 10 : i % 5 === 0 ? 7 : 5} className={i <= filled ? "on" : "off"} />
      ))}
      <rect x={Math.min(filled * 4, ticks * 4 - 1)} y={0} width={1.5} height={10} className="at" />
    </svg>
  );
}

/** 2 px dither fills: the density says the series, the colour says which one is first. */
function DitherDefs({ id }: { id: string }) {
  return (
    <defs>
      <pattern id={`${id}-brand`} width="4" height="4" patternUnits="userSpaceOnUse" className="in-pat-brand">
        <rect width="2" height="2" />
        <rect x="2" y="2" width="2" height="2" />
        <rect x="2" width="2" height="2" />
      </pattern>
      <pattern id={`${id}-ink`} width="4" height="4" patternUnits="userSpaceOnUse" className="in-pat-ink">
        <rect width="2" height="2" />
        <rect x="2" y="2" width="2" height="2" />
      </pattern>
    </defs>
  );
}

function DailyChart() {
  const max = 260;
  const w = 720;
  const h = 220;
  const band = (w - 36) / daily.length;
  const bar = Math.floor(band * 0.56 / 4) * 4;
  const y = (v: number) => Math.round((h * v) / max / 2) * 2;
  return (
    <svg className="in-chart" viewBox={`0 0 ${w} ${h + 24}`} role="img" aria-label="Mail received per day, bulk and personal, last 14 days">
      <DitherDefs id="in-d" />
      {[0, 100, 200].map((v) => (
        <g key={v}>
          <line x1={32} x2={w} y1={h - y(v) + 0.5} y2={h - y(v) + 0.5} className="grid" />
          <text x={0} y={h - y(v) + 3} className="axis">{v}</text>
        </g>
      ))}
      {daily.map((d, i) => {
        const x = Math.round(36 + i * band + (band - bar) / 2);
        const hb = y(d.bulk);
        const hp = y(d.personal);
        return (
          <g key={d.day}>
            <rect x={x} y={h - hb} width={bar} height={hb} fill="url(#in-d-brand)" className="bulk" />
            <rect x={x} y={h - hb - hp - 2} width={bar} height={hp} fill="url(#in-d-ink)" className="personal" />
            {i % 2 === 0 && <text x={x} y={h + 18} className="axis">{d.day}</text>}
          </g>
        );
      })}
    </svg>
  );
}

function Header() {
  return (
    <header className="in-top">
      <a className="in-lockup" href="#top">
        <DitherGem gem="stormlight" size={20} />
        <span>Fabrials</span>
      </a>
      <nav aria-label="Main">
        <a href="#tools">Products</a>
        <a href="#week">Usage AI</a>
        <a href="#top">News</a>
        <a href="#top">Learn</a>
      </nav>
      <div className="in-top-end">
        <button type="button" className="in-search">
          Search <Kbd>Ctrl</Kbd>
          <Kbd>K</Kbd>
        </button>
        <a href="#top">Sign in</a>
      </div>
    </header>
  );
}

function Landing({ palette }: { palette?: Palette }) {
  const peak = Math.max(...week.days);
  return (
    <div className="in in-landing" id="top" data-palette={palette}>
      <Header />
      <section className="in-hero" aria-labelledby="in-hero-title">
        <div className="in-guides" aria-hidden>
          {Array.from({ length: 12 }, (_, i) => (
            <span key={i} />
          ))}
        </div>
        <div className="in-hero-copy">
          <h1 id="in-hero-title">Tools for people who work beside AI agents.</h1>
          <p>Spanreed shows what your coding subscriptions cost. Syl lets your agents drive and test real apps. Both run on your own machine.</p>
          <Snippet>curl -fsSL https://fabrials.com/install/spanreed.sh | sh</Snippet>
          <div className="in-actions">
            <Button>Install Spanreed</Button>
            <a href="#tools">Browse all tools</a>
          </div>
        </div>
        <figure className="in-plate in-hero-plate">
          <Marks />
          <div className="in-plate-ruler" aria-hidden>
            {[0, 120, 240, 360, 480].map((n) => (
              <span key={n}>{n}</span>
            ))}
          </div>
          <div className="in-scene">
            <DitherScene variant="full" seed={7} />
          </div>
          <figcaption>
            <span>Fig. 1. A storm front, ordered dither, 3 px dots.</span>
            <span>8×8 Bayer</span>
          </figcaption>
        </figure>
      </section>

      <section className="in-section" id="tools" aria-labelledby="in-tools">
        <div className="in-section-head">
          <h2 id="in-tools">Everything on fabrials.com</h2>
          <span className="in-readout">5 tools, 2 run on your machine</span>
        </div>
        <div className="in-spec" role="table" aria-label="Fabrials tools">
          <div className="in-spec-row in-spec-head" role="row">
            <span role="columnheader">Tool</span>
            <span role="columnheader">What it does</span>
            <span role="columnheader">Runs on</span>
            <span role="columnheader">Release</span>
            <span role="columnheader">
              <span className="fui-sr-only">Link</span>
            </span>
          </div>
          {products.map((p) => (
            <div className="in-spec-row" role="row" key={p.name}>
              <span role="cell" className="in-spec-name">
                <DitherGem gem={p.gem} size={28} />
                {p.name}
              </span>
              <span role="cell">{p.line}</span>
              <span role="cell" className="in-mono">{p.runs}</span>
              <span role="cell" className="in-mono">{p.state}</span>
              <span role="cell">
                <a href="#tools">{p.link}</a>
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="in-section in-week" id="week" aria-labelledby="in-week">
        <div>
          <div className="in-section-head">
            <h2 id="in-week">Usage AI, this week</h2>
            <span className="in-readout">{week.label}. Updated every Monday.</span>
          </div>
          <dl className="in-readouts">
            {week.totals.map((t) => (
              <div key={t.label}>
                <dt>{t.label}</dt>
                <dd>
                  {t.value}
                  {t.unit && <small>{t.unit}</small>}
                </dd>
              </div>
            ))}
          </dl>
        </div>
        <figure className="in-plate">
          <Marks />
          <svg className="in-week-chart" viewBox="0 0 280 140" role="img" aria-label="Requests per day this week, peak on Friday">
            <DitherDefs id="in-w" />
            {week.days.map((v, i) => {
              const hgt = Math.round((v / peak) * 104 / 2) * 2;
              return (
                <g key={i}>
                  <rect x={8 + i * 38} y={112 - hgt} width={28} height={hgt} fill={v === peak ? "url(#in-w-brand)" : "url(#in-w-ink)"} className={v === peak ? "bulk" : "personal"} />
                  <text x={8 + i * 38} y={130} className="axis">{"MTWTFSS"[i]}</text>
                </g>
              );
            })}
          </svg>
          <figcaption>
            <span>Requests per day, thousands.</span>
            <span>Peak 649k</span>
          </figcaption>
        </figure>
      </section>

      <footer className="in-foot">
        <span>Fabrials. Tools for agents and coding CLIs.</span>
        <span className="in-mono">Set in IBM Plex. Light dithered at 3 px.</span>
      </footer>
    </div>
  );
}

function Workspace({ palette }: { palette?: Palette }) {
  return (
    <div className="in in-app" data-gem="smokestone" data-palette={palette}>
      <aside className="in-side" aria-label="Palanaeum">
        <div className="in-side-lockup">
          <DitherGem gem="smokestone" size={28} />
          <div>
            <strong>Palanaeum</strong>
            <span className="in-mono">mail steward, local</span>
          </div>
        </div>
        <nav aria-label="Sections">
          {nav.map((g) => (
            <div key={g.group} className="in-nav-group">
              <span className="in-readout">{g.group}</span>
              {g.items.map((item) => (
                <a key={item.label} href="#app" aria-current={"current" in item && item.current ? "page" : undefined}>
                  {item.label}
                  {"count" in item && <span className="in-mono">{item.count}</span>}
                </a>
              ))}
            </div>
          ))}
        </nav>
        <div className="in-side-readout">
          <span className="in-readout">Header index</span>
          <strong>412 MB of 2 GB</strong>
          <Ruler share={0.2} ticks={30} label="Header index uses 412 MB of 2 GB" />
        </div>
      </aside>

      <main className="in-main" id="app">
        <div className="in-bar">
          <span className="in-crumbs">
            Mail <span aria-hidden>/</span> <strong>Overview</strong>
          </span>
          <span className="in-sync">
            <i aria-hidden /> Last sync 14:32 UTC, 2 minutes ago
          </span>
          <Button variant="outline" size="sm">
            Sync now
          </Button>
        </div>

        <div className="in-page-head">
          <h1>Overview</h1>
          <p>What Palanaeum has indexed from your mailboxes. Only headers are read; message bodies stay on the server.</p>
        </div>

        <section className="in-plate in-stats" aria-label="Totals">
          <Marks />
          {stats.map((s) => (
            <div key={s.label} className="in-stat">
              <span className="in-readout">{s.label}</span>
              <strong>{s.value}</strong>
              <span className="in-stat-note">{s.note}</span>
              <Ruler share={s.share} label={`${s.label}: ${s.note}`} />
            </div>
          ))}
        </section>

        <div className="in-row">
          <figure className="in-plate in-chart-plate">
            <Marks />
            <div className="in-plate-head">
              <h2>Mail received per day</h2>
              <ul className="in-legend">
                <li>
                  <i data-series="bulk" aria-hidden /> Bulk
                </li>
                <li>
                  <i data-series="personal" aria-hidden /> Personal
                </li>
              </ul>
            </div>
            <DailyChart />
            <figcaption>
              <span>Last 14 days, local time.</span>
              <span>Peak 244 on Nov 4</span>
            </figcaption>
          </figure>

          <section className="in-plate in-accounts" aria-labelledby="in-acc">
            <Marks />
            <div className="in-plate-head">
              <h2 id="in-acc">Accounts</h2>
              <a href="#app">Manage</a>
            </div>
            <ul>
              {accounts.map((a) => (
                <li key={a.address} data-state={a.state}>
                  <i aria-hidden />
                  <div>
                    <strong>{a.name}</strong>
                    <span className="in-mono">{a.address}</span>
                    <span className="in-acc-detail">{a.detail}</span>
                  </div>
                  <span className="in-mono">{a.provider}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <section className="in-plate in-table-plate" aria-labelledby="in-senders">
          <Marks />
          <div className="in-plate-head">
            <h2 id="in-senders">Who sends the most bulk mail</h2>
            <a href="#app">All senders</a>
          </div>
          <table className="in-table">
            <thead>
              <tr>
                <th scope="col">Sender</th>
                <th scope="col" className="num">Messages</th>
                <th scope="col" className="num">Unread</th>
                <th scope="col">Last message</th>
                <th scope="col">Unsubscribe</th>
              </tr>
            </thead>
            <tbody>
              {senders.map((s) => (
                <tr key={s.address}>
                  <td>
                    <strong>{s.name}</strong>
                    <span className="in-mono">{s.address}</span>
                  </td>
                  <td className="num">{s.messages.toLocaleString("en")}</td>
                  <td className="num">{s.unread.toLocaleString("en")}</td>
                  <td>{s.last}</td>
                  <td>
                    <span className="in-tag" data-kind={s.unsubscribe === "None" ? "none" : "ok"}>
                      {s.unsubscribe}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </main>
    </div>
  );
}

export const LandingPage: Story = { name: "Landing", render: () => <Landing /> };
export const WorkspacePage: Story = { name: "Workspace", render: () => <Workspace /> };
export const LandingObsidian: Story = { name: "Landing, Obsidian", render: () => <Landing palette="obsidian" /> };
export const WorkspaceObsidian: Story = { name: "Workspace, Obsidian", render: () => <Workspace palette="obsidian" /> };
export const LandingEmber: Story = { name: "Landing, Ember ink", render: () => <Landing palette="ember" /> };
export const WorkspaceEmber: Story = { name: "Workspace, Ember ink", render: () => <Workspace palette="ember" /> };
export const LandingDeep: Story = { name: "Landing, Deep Stormwall", render: () => <Landing palette="deep" /> };
export const WorkspaceDeep: Story = { name: "Workspace, Deep Stormwall", render: () => <Workspace palette="deep" /> };
