import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button, DitherCanvas, DitherGem, Kbd, Snippet, type DitherFieldFactory } from "@fabrials/ui";
import { gemField } from "@fabrials/ui/dither";
import { accounts, daily, nav, products, senders, stats, week } from "./data";
import "./folio.css";

// Direction B, "Folio": the archive at Kharbranth. Plex Serif as the display
// voice, paper and lamplight neutrals, a margin column for notes, numbers
// said in sentences, dither printed in ink like an engraving.

const meta = {
  title: "Archive/Identity proposals/B Folio",
  parameters: { layout: "fullscreen" },
} satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

const INK = { light: ["background", "#2a2722"], dark: ["background", "#e9e3d6"] };
const STORM_INK = { light: ["background", "#2459b3"], dark: ["background", "#9cc4ff"] };

/** An engraved gem: ink where the stone is dark, paper where it catches light. */
const engraved: DitherFieldFactory = (_theme, { width, height }) => {
  const g = gemField(width, height, 1, 0.46);
  return (u, v) => {
    const b = g(u, v);
    return b <= 0 ? 0 : Math.min(1, 1.05 - b * 0.9);
  };
};
/** A thin catch of Stormlight on the table facet. */
const glint: DitherFieldFactory = (_theme, { width, height }) => {
  const g = gemField(width, height, 1, 0.46);
  return (u, v) => {
    const b = g(u, v);
    return b > 0.78 ? (b - 0.78) * 3.2 : 0;
  };
};

function Plate({ caption }: { caption: string }) {
  return (
    <figure className="fo-plate">
      <div className="fo-plate-art">
        <DitherCanvas ramp={INK} order="ramp" field={engraved} cell={2} />
        <DitherCanvas ramp={STORM_INK} order="ramp" field={glint} cell={2} />
      </div>
      <figcaption>{caption}</figcaption>
    </figure>
  );
}

function Chart() {
  const w = 720;
  const h = 180;
  const max = 260;
  const band = w / daily.length;
  const bar = Math.round(band * 0.5);
  return (
    <svg className="fo-chart" viewBox={`0 0 ${w} ${h + 22}`} role="img" aria-label="Mail received per day, bulk and personal, last 14 days">
      <defs>
        <pattern id="fo-hatch-bulk" width="4" height="4" patternUnits="userSpaceOnUse" className="fo-hatch-bulk">
          <rect width="1.5" height="4" />
        </pattern>
        <pattern id="fo-hatch-personal" width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(45)" className="fo-hatch-personal">
          <rect width="1" height="4" />
        </pattern>
      </defs>
      <line x1={0} x2={w} y1={h + 0.5} y2={h + 0.5} className="base" />
      {daily.map((d, i) => {
        const x = Math.round(i * band + (band - bar) / 2);
        const hb = Math.round((d.bulk / max) * h);
        const hp = Math.round((d.personal / max) * h);
        return (
          <g key={d.day}>
            <rect x={x} y={h - hb} width={bar} height={hb} fill="url(#fo-hatch-bulk)" className="bulk" />
            <rect x={x} y={h - hb - hp} width={bar} height={hp} fill="url(#fo-hatch-personal)" className="personal" />
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
    <div className="fo fo-landing">
      <header className="fo-mast">
        <a className="fo-wordmark" href="#top">
          <DitherGem gem="stormlight" size={18} />
          Fabrials
        </a>
        <nav aria-label="Main">
          <a href="#contents">Products</a>
          <a href="#ledger">Usage AI</a>
          <a href="#top">News</a>
          <a href="#top">Learn</a>
        </nav>
        <div className="fo-mast-end">
          <button type="button" className="fo-search">
            Search <Kbd>Ctrl</Kbd>
            <Kbd>K</Kbd>
          </button>
          <a href="#top">Sign in</a>
        </div>
      </header>
      <div className="fo-running" aria-hidden>
        <span>Tools for agents and coding CLIs</span>
        <span>Thursday, 5 November 2026</span>
      </div>

      <section className="fo-hero" aria-labelledby="fo-title">
        <h1 id="fo-title">Tools for people who work beside AI agents.</h1>
        <aside className="fo-note">
          <span className="fo-note-mark">Note</span>
          Both run on your own machine. Nothing leaves it unless you share a snapshot.
        </aside>
        <div className="fo-lead">
          <p>Spanreed shows what your coding subscriptions cost. Syl lets your agents drive and test real apps.</p>
          <Snippet>curl -fsSL https://fabrials.com/install/spanreed.sh | sh</Snippet>
          <div className="fo-actions">
            <Button>Install Spanreed</Button>
            <a href="#contents">Browse all tools</a>
          </div>
        </div>
        <Plate caption="Plate I. A cut stone that holds Stormlight, printed in two inks at 2 px." />
      </section>

      <section className="fo-section" id="contents" aria-labelledby="fo-contents">
        <div className="fo-margin">
          <span className="fo-section-no">§ 1</span>
        </div>
        <div className="fo-body">
          <h2 id="fo-contents">Contents</h2>
          <ol className="fo-toc">
            {products.map((p) => (
              <li key={p.name}>
                <DitherGem gem={p.gem} size={20} />
                <div className="fo-toc-line">
                  <h3>{p.name}</h3>
                  <span className="fo-leader" aria-hidden />
                  <a href="#contents">{p.link}</a>
                </div>
                <p>
                  {p.line} <span className="fo-meta">{p.runs}.</span>
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="fo-section" id="ledger" aria-labelledby="fo-ledger">
        <div className="fo-margin">
          <span className="fo-section-no">§ 2</span>
          <p className="fo-margin-note">{week.label}. Updated every Monday from shared Spanreed snapshots.</p>
        </div>
        <div className="fo-body">
          <h2 id="fo-ledger">From the week’s ledger</h2>
          <p className="fo-sentence">
            <b>1,284</b> people shared a snapshot this week. Together they priced <b>3.9 million</b> requests, and the median day cost <b>$4.12</b>.
          </p>
          <a href="#ledger">Read week 45</a>
        </div>
      </section>

      <footer className="fo-colophon">
        <span>Colophon. Set in IBM Plex Serif and Sans; plates dithered on the page.</span>
        <span>fabrials.com</span>
      </footer>
    </div>
  );
}

function Workspace() {
  const total = stats[0]!;
  return (
    <div className="fo fo-app">
      <aside className="fo-side" aria-label="Palanaeum">
        <div className="fo-side-title">
          <DitherGem gem="smokestone" size={24} />
          <div>
            <strong>Palanaeum</strong>
            <span>Mail steward</span>
          </div>
        </div>
        <nav aria-label="Sections">
          {nav.map((g) => (
            <div key={g.group} className="fo-nav-group">
              <span>{g.group}</span>
              {g.items.map((item) => (
                <a key={item.label} href="#app" aria-current={"current" in item && item.current ? "page" : undefined}>
                  {item.label}
                  {"count" in item && <small>{item.count}</small>}
                </a>
              ))}
            </div>
          ))}
        </nav>
      </aside>
      <main className="fo-main" id="app">
        <div className="fo-running">
          <span>Mail, overview</span>
          <span className="fo-sync">
            <i aria-hidden /> Synced 2 minutes ago
            <Button variant="outline" size="sm">
              Sync now
            </Button>
          </span>
        </div>

        <header className="fo-page-head">
          <h1>Overview</h1>
          <p>What Palanaeum has indexed from your mailboxes.</p>
        </header>

        <section className="fo-section" aria-labelledby="fo-totals">
          <div className="fo-margin">
            <span className="fo-section-no">§ 1</span>
            <p className="fo-margin-note">Only headers are read. Message bodies stay on the server.</p>
          </div>
          <div className="fo-body">
            <h2 id="fo-totals">In your index</h2>
            <p className="fo-sentence">
              <b>{total.value}</b> messages from 3 accounts. <b>6,102</b> are unread, and <b>19,930</b>, or 69%, are bulk mail from 318 senders.
            </p>
          </div>
        </section>

        <section className="fo-section" aria-labelledby="fo-daily">
          <div className="fo-margin">
            <span className="fo-section-no">§ 2</span>
            <p className="fo-margin-note">Busiest day: Nov 4, 244 messages.</p>
          </div>
          <figure className="fo-body fo-figure">
            <h2 id="fo-daily">Mail received per day</h2>
            <Chart />
            <figcaption>
              Figure 1. The last 14 days. Upright hatching is bulk mail, slanted hatching personal mail.
            </figcaption>
          </figure>
        </section>

        <section className="fo-section" aria-labelledby="fo-senders">
          <div className="fo-margin">
            <span className="fo-section-no">§ 3</span>
            <a className="fo-margin-note" href="#app">
              All 1,206 senders
            </a>
          </div>
          <div className="fo-body">
            <h2 id="fo-senders">Who sends the most bulk mail</h2>
            <table className="fo-table">
              <thead>
                <tr>
                  <th scope="col">Sender</th>
                  <th scope="col" className="num">Messages</th>
                  <th scope="col" className="num">Unread</th>
                  <th scope="col">Last</th>
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
                    <td>{s.unsubscribe}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="fo-section" aria-labelledby="fo-accounts">
          <div className="fo-margin">
            <span className="fo-section-no">§ 4</span>
          </div>
          <div className="fo-body">
            <h2 id="fo-accounts">Accounts</h2>
            <ul className="fo-accounts">
              {accounts.map((a) => (
                <li key={a.address} data-state={a.state}>
                  <strong>{a.name}</strong>
                  <span>
                    {a.address}, {a.provider}
                  </span>
                  <span className="fo-state">
                    {a.state === "error" ? "Needs attention. " : ""}
                    {a.detail}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <footer className="fo-folio">
          <span>Palanaeum 0.1, on this machine</span>
          <span>Overview</span>
        </footer>
      </main>
    </div>
  );
}

export const LandingPage: Story = { name: "Landing", render: () => <Landing /> };
export const WorkspacePage: Story = { name: "Workspace", render: () => <Workspace /> };
