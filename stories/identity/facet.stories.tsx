import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button, DitherCanvas, DitherGem, DitherScene, Kbd, Snippet, type DitherFieldFactory, type GemName } from "@fabrials/ui";
import { fbm, gemRamp } from "@fabrials/ui/dither";
import { accounts, daily, nav, products, senders, stats, week } from "./data";
import "./facet.css";

// Direction C, "Facet": the cut of a gem as the shape language. Bevelled
// corners on containers and the primary action, a pixel glyph set of our own,
// the product's gem as ambient dithered light at the top of its shell, and a
// faint lattice of beads (Shadesmar) where the page is empty.

const meta = {
  title: "Archive/Identity proposals/C Facet",
  parameters: { layout: "fullscreen" },
} satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

// 9×9 pixel glyphs, symmetric and angular. "#" is a lit pixel.
const GLYPHS = {
  overview: ["....#....", "...#.#...", "..#...#..", ".#..#..#.", "#..###..#", ".#..#..#.", "..#...#..", "...#.#...", "....#...."],
  senders: ["#.......#", ".#.....#.", "..#...#..", "...#.#...", "....#....", "...#.#...", "..#...#..", ".#.....#.", "#########"],
  cleanup: ["....#....", "....#....", "..#####..", "....#....", "#...#...#", ".#.....#.", "..#...#..", "...#.#...", "....#...."],
  accounts: ["...###...", "..#...#..", "..#...#..", "...###...", "....#....", ".#######.", "#...#...#", "#.......#", "#########"],
  rules: ["#########", "#.......#", "#.#####.#", "#.......#", "#.#####.#", "#.......#", "#.###...#", "#.......#", "#########"],
  index: ["....#....", "...###...", "..#####..", ".#######.", "#########", ".#######.", "..#####..", "...###...", "....#...."],
  daily: ["#........", "#.....#..", "#...#.#..", "#.#.#.#..", "#.#.#.#.#", "#.#.#.#.#", "#.#.#.#.#", "#.#.#.#.#", "#########"],
  week: ["#.#.#.#.#", ".........", "#.......#", ".........", "#...#...#", ".........", "#.......#", ".........", "#.#.#.#.#"],
} as const;
type GlyphName = keyof typeof GLYPHS;

function Glyph({ name, size = 18 }: { name: GlyphName; size?: number }) {
  return (
    <svg className="fa-glyph" width={size} height={size} viewBox="0 0 9 9" aria-hidden shapeRendering="crispEdges">
      {GLYPHS[name].flatMap((row, y) => [...row].map((c, x) => (c === "#" ? <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} /> : null)))}
    </svg>
  );
}

/** Ambient light of the product gem, entering from a top corner; dithered, never a gradient. */
function gemLight(seed: number, from: "left" | "right" = "left"): DitherFieldFactory {
  return (_theme, { width, height }) => {
    const aspect = width / Math.max(1, height);
    return (x, v) => {
      const u = from === "left" ? x : 1 - x;
      const d = Math.hypot(u * aspect * 0.55, v * 1.1);
      const fall = Math.max(0, 1 - d);
      const cloud = fbm(u * aspect * 1.6, v * 1.6, seed);
      return Math.min(0.92, Math.pow(fall, 1.6) * (0.35 + cloud * 0.9));
    };
  };
}

function GemLight({ gem, seed = 5, from = "left" }: { gem: GemName; seed?: number; from?: "left" | "right" }) {
  return (
    <div className="fa-gemlight" data-from={from} aria-hidden>
      <DitherCanvas ramp={gemRamp(gem)} order="ramp" field={gemLight(seed, from)} cell={3} paintKey={gem} />
    </div>
  );
}

function FacetBar({ share, label }: { share: number; label: string }) {
  const n = 24;
  const lit = Math.round(share * n);
  return (
    <span className="fa-facetbar" role="img" aria-label={label}>
      {Array.from({ length: n }, (_, i) => (
        <i key={i} data-lit={i < lit ? "" : undefined} />
      ))}
    </span>
  );
}

function Chart() {
  const w = 720;
  const h = 200;
  const max = 260;
  const band = w / daily.length;
  const bar = Math.round(band * 0.58);
  const cut = 6;
  return (
    <svg className="fa-chart" viewBox={`0 0 ${w} ${h + 22}`} role="img" aria-label="Mail received per day, bulk and personal, last 14 days">
      {[100, 200].map((v) => (
        <line key={v} x1={0} x2={w} y1={h - (v / max) * h} y2={h - (v / max) * h} className="grid" />
      ))}
      {daily.map((d, i) => {
        const x = Math.round(i * band + (band - bar) / 2);
        const hb = Math.round((d.bulk / max) * h);
        const hp = Math.round((d.personal / max) * h);
        const top = h - hb - hp - 2;
        return (
          <g key={d.day}>
            <rect x={x} y={h - hb} width={bar} height={hb} className="bulk" />
            <polygon points={`${x},${top + hp} ${x},${top + cut} ${x + cut},${top} ${x + bar - cut},${top} ${x + bar},${top + cut} ${x + bar},${top + hp}`} className="personal" />
            {i % 3 === 0 && (
              <text x={x} y={h + 16} className="axis">
                {d.day}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

function Landing() {
  return (
    <div className="fa fa-landing">
      <header className="fa-top">
        <a className="fa-lockup" href="#top">
          <DitherGem gem="stormlight" size={22} />
          Fabrials
        </a>
        <nav aria-label="Main">
          <a href="#tools">Products</a>
          <a href="#week">Usage AI</a>
          <a href="#top">News</a>
          <a href="#top">Learn</a>
        </nav>
        <div className="fa-top-end">
          <button type="button" className="fa-search">
            Search <Kbd>Ctrl</Kbd>
            <Kbd>K</Kbd>
          </button>
          <a href="#top">Sign in</a>
        </div>
      </header>

      <section className="fa-hero" aria-labelledby="fa-title">
        <DitherScene seed={11} />
        <div className="fa-hero-gem" aria-hidden>
          <DitherGem gem="stormlight" size={360} cell={4} reveal={1400} />
        </div>
        <div className="fa-hero-copy">
          <h1 id="fa-title">Tools for people who work beside AI agents.</h1>
          <p>Spanreed shows what your coding subscriptions cost. Syl lets your agents drive and test real apps. Both run on your own machine.</p>
          <div className="fa-actions">
            <Button className="fa-cut">Install Spanreed</Button>
            <a href="#tools">Browse all tools</a>
          </div>
        </div>
      </section>

      <section className="fa-section" id="tools" aria-labelledby="fa-tools">
        <h2 id="fa-tools">
          <Glyph name="index" /> Everything on fabrials.com
        </h2>
        <ul className="fa-index">
          {products.map((p) => (
            <li key={p.name} data-gem={p.gem}>
              <DitherGem gem={p.gem} size={32} />
              <h3>{p.name}</h3>
              <p>{p.line}</p>
              <span className="fa-meta">{p.runs}</span>
              <a href="#tools">{p.link}</a>
            </li>
          ))}
        </ul>
      </section>

      <section className="fa-section fa-week" id="week" aria-labelledby="fa-week">
        <div className="fa-panel fa-cut-lg">
          <GemLight gem="heliodor" seed={9} from="right" />
          <div className="fa-panel-body">
            <h2 id="fa-week">
              <Glyph name="week" /> Usage AI, this week
            </h2>
            <p>{week.label}. Anonymous totals from Spanreed users who share a snapshot.</p>
            <dl className="fa-figures">
              {week.totals.map((t) => (
                <div key={t.label}>
                  <dt>{t.label}</dt>
                  <dd>
                    {t.value}
                    {t.unit}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
        <div className="fa-install">
          <h2>Start with Spanreed</h2>
          <Snippet>curl -fsSL https://fabrials.com/install/spanreed.sh | sh</Snippet>
          <p>On Windows, use the installer on the Spanreed page.</p>
        </div>
      </section>

      <footer className="fa-foot">
        <span>Fabrials. Tools for agents and coding CLIs.</span>
        <span className="fa-gems" aria-label="Product gems">
          {products.map((p) => (
            <DitherGem key={p.name} gem={p.gem} size={14} />
          ))}
        </span>
      </footer>
    </div>
  );
}

const navGlyph: Record<string, GlyphName> = { Overview: "overview", Senders: "senders", Cleanup: "cleanup", Accounts: "accounts", Rules: "rules" };

function Workspace({ gem }: { gem: GemName }) {
  return (
    <div className="fa fa-app" data-gem={gem}>
      <aside className="fa-side" aria-label="Palanaeum">
        <GemLight gem={gem} />
        <div className="fa-side-lockup">
          <DitherGem gem={gem} size={32} />
          <div>
            <strong>Palanaeum</strong>
            <span>Mail steward</span>
          </div>
        </div>
        <nav aria-label="Sections">
          {nav.map((g) => (
            <div key={g.group} className="fa-nav-group">
              <span>{g.group}</span>
              {g.items.map((item) => (
                <a key={item.label} href="#app" aria-current={"current" in item && item.current ? "page" : undefined}>
                  <Glyph name={navGlyph[item.label] ?? "overview"} size={14} />
                  {item.label}
                  {"count" in item && <small>{item.count}</small>}
                </a>
              ))}
            </div>
          ))}
        </nav>
      </aside>

      <main className="fa-main" id="app">
        <div className="fa-bar">
          <span className="fa-crumbs">
            Mail <span aria-hidden>/</span> <strong>Overview</strong>
          </span>
          <span className="fa-sync">
            <i aria-hidden /> Synced 2 minutes ago
          </span>
          <Button size="sm" className="fa-cut">
            Sync now
          </Button>
        </div>

        <header className="fa-page-head">
          <h1>Overview</h1>
          <p>What Palanaeum has indexed from your mailboxes. Only headers are read; message bodies stay on the server.</p>
        </header>

        <section className="fa-panel fa-cut-lg fa-stats" aria-label="Totals">
          {stats.map((s) => (
            <div key={s.label} className="fa-stat">
              <span>{s.label}</span>
              <strong>{s.value}</strong>
              <FacetBar share={s.share} label={`${s.label}: ${s.note}`} />
              <small>{s.note}</small>
            </div>
          ))}
        </section>

        <div className="fa-row">
          <section className="fa-panel fa-cut-lg" aria-labelledby="fa-daily">
            <div className="fa-panel-head">
              <h2 id="fa-daily">
                <Glyph name="daily" size={14} /> Mail received per day
              </h2>
              <ul className="fa-legend">
                <li>
                  <i data-series="bulk" aria-hidden /> Bulk
                </li>
                <li>
                  <i data-series="personal" aria-hidden /> Personal
                </li>
              </ul>
            </div>
            <Chart />
          </section>

          <section className="fa-panel fa-cut-lg fa-accounts" aria-labelledby="fa-acc">
            <div className="fa-panel-head">
              <h2 id="fa-acc">
                <Glyph name="accounts" size={14} /> Accounts
              </h2>
              <a href="#app">Manage</a>
            </div>
            <ul>
              {accounts.map((a) => (
                <li key={a.address} data-state={a.state}>
                  <i aria-hidden />
                  <div>
                    <strong>{a.name}</strong>
                    <span>
                      {a.address}, {a.provider}
                    </span>
                    <span className="fa-acc-detail">{a.detail}</span>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <section className="fa-panel fa-cut-lg" aria-labelledby="fa-senders">
          <div className="fa-panel-head">
            <h2 id="fa-senders">
              <Glyph name="senders" size={14} /> Who sends the most bulk mail
            </h2>
            <a href="#app">All senders</a>
          </div>
          <table className="fa-table">
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
                    <span>{s.address}</span>
                  </td>
                  <td className="num">{s.messages.toLocaleString("en")}</td>
                  <td className="num">{s.unread.toLocaleString("en")}</td>
                  <td>{s.last}</td>
                  <td>
                    <span className="fa-tag">{s.unsubscribe}</span>
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
export const WorkspacePage: Story = { name: "Workspace", render: () => <Workspace gem="smokestone" /> };
export const WorkspaceEmerald: Story = { name: "Workspace, emerald gem", render: () => <Workspace gem="emerald" /> };
