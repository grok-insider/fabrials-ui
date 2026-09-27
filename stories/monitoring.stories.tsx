import type { Meta, StoryObj } from "@storybook/react-vite";
import { AtSign, Eye, Trash2, UserPlus } from "lucide-react";
import {
  ActivityStrip,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  DitherCanvas,
  NavTab,
  NavTabs,
  PageHeader,
  RelativeTime,
  SectionHeader,
  Stat,
  StatGroup,
  StatusDot,
  Timeline,
  TimelineItem,
} from "@fabrials/ui";
import { seeded } from "@fabrials/ui/dither";

const meta = {
  title: "Fabrials/Monitoring",
  parameters: { layout: "fullscreen" },
} satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

const random = seeded(4);
const days = Array.from({ length: 90 }, (_, i) => ({
  label: `Day ${i + 1}`,
  value: random() < 0.25 ? 0 : Math.round(random() * random() * 12),
}));
const hours = Array.from({ length: 24 }, (_, h) => ({
  label: `${String(h).padStart(2, "0")}:00 UTC`,
  value: Math.round(8 * Math.exp(-(((h - 15) / 4) ** 2)) + (h > 20 ? 2 : 0)),
}));

/** A radar-like field: faint rings from the top-right corner and a glow along the bottom. */
const telemetry = () => (u: number, v: number) => {
  const d = Math.hypot(u - 1.05, (v + 0.1) * 0.6);
  const rings = 0.5 + 0.5 * Math.cos(d * 60);
  return Math.min(1, 0.08 + 0.35 * Math.pow(v, 3) + 0.18 * rings * Math.exp(-d * 2.2));
};

const RAMP = {
  dark: ["#070b0a", "#0b1311", "#10201b", "#173027", "#214236"],
  light: ["#dfe8e4", "#e8efec", "#f0f5f3", "#f6f9f8", "#fbfdfc"],
};

const ago = (minutes: number) => new Date(Date.now() - minutes * 60_000);

function MonitoringGallery() {
  return (
    <main className="catalogue">
      <PageHeader
        title="Monitoring"
        description="Pieces for live dashboards: a static dithered backdrop, activity strips, an event timeline, relative times and link tabs."
      />
      <section className="catalogue-stack" aria-label="Dither canvas">
        <SectionHeader title="Dither canvas" />
        <div style={{ position: "relative", isolation: "isolate", minHeight: 220, borderRadius: 16, overflow: "hidden", padding: 24 }}>
          <DitherCanvas ramp={RAMP} field={telemetry} stars={{ density: 1.2, reach: 0.7 }} />
          <Card style={{ maxWidth: 360 }}>
            <CardHeader>
              <CardTitle>Painted once</CardTitle>
              <CardDescription>Repainted only on resize or theme change. Content sits on a panel above it.</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>
      <section className="catalogue-stack" aria-label="Stats and activity">
        <SectionHeader title="Activity strip" />
        <StatGroup>
          <Stat label="Posts, 24 h" value="18" delta="+6" trend="up" sparkline={days.slice(-14).map((d) => d.value)} />
          <Stat label="Live events, 24 h" value="42" hint="stream connected" />
        </StatGroup>
        <ActivityStrip caption="Posts per day, last 90 days" cells={days} startLabel="90 days ago" endLabel="today" />
        <ActivityStrip caption="Posts by hour of day" cells={hours} size="lg" startLabel="00:00" endLabel="23:00" />
        <ActivityStrip
          caption="Worker health, last 30 checks"
          size="sm"
          cells={Array.from({ length: 30 }, (_, i) => ({ label: `Check ${i + 1}`, value: 1, tone: i === 21 ? "danger" : "success" }))}
        />
      </section>
      <section className="catalogue-stack" aria-label="Timeline">
        <SectionHeader title="Timeline" actions={<StatusDot tone="success" label="Live" pulse />} />
        <Timeline>
          <TimelineItem icon={<Eye aria-hidden />} tone="info" title="@fixture posted" time={<RelativeTime date={ago(0.2)} />} fresh>
            A new post arrived through the live stream.
          </TimelineItem>
          <TimelineItem icon={<Trash2 aria-hidden />} tone="danger" title="@fixture deleted a post" time={<RelativeTime date={ago(12)} />}>
            The copy we kept stays visible and flagged.
          </TimelineItem>
          <TimelineItem icon={<AtSign aria-hidden />} tone="warning" title="@fixture changed handle" time={<RelativeTime date={ago(180)} />}>
            @old_fixture → @fixture
          </TimelineItem>
          <TimelineItem icon={<UserPlus aria-hidden />} tone="success" title="@fixture followed @someone" time={<RelativeTime date={ago(60 * 30)} />} />
        </Timeline>
      </section>
      <section className="catalogue-stack" aria-label="Navigation tabs">
        <SectionHeader title="Nav tabs" />
        <NavTabs label="Account sections">
          <NavTab href="#feed" current count={128}>
            Feed
          </NavTab>
          <NavTab href="#media" count={16}>
            Media
          </NavTab>
          <NavTab href="#live">Live</NavTab>
          <NavTab href="#costs">Costs</NavTab>
        </NavTabs>
        <CardContent style={{ padding: 0 }}>
          <p style={{ fontSize: 14 }}>
            Relative times: <RelativeTime date={ago(3)} /> · <RelativeTime date={ago(60 * 26)} locale="es" /> ·{" "}
            <RelativeTime date="2026-08-01T12:00:00Z" />
          </p>
        </CardContent>
      </section>
    </main>
  );
}

export const Gallery: Story = { render: () => <MonitoringGallery /> };
