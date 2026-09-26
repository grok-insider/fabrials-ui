import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  MOON_VARIANTS,
  MoonPhase,
  PageHeader,
  SectionHeader,
  Starfield,
  lunarPhase,
  lunarPhaseName,
} from "@fabrials/ui";

const meta = {
  title: "Fabrials/Effects",
  parameters: { layout: "fullscreen" },
} satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

const phases = [0, 0.125, 0.25, 0.375, 0.5, 0.625, 0.75, 0.875];
const today = lunarPhase(new Date("2026-09-26T12:00:00Z"));

function EffectsGallery() {
  return (
    <main className="catalogue">
      <PageHeader
        title="Effects"
        description="Decorative effects for sign-in and landing surfaces. They are exceptions to the no-motion rule and stop under reduced motion."
      />
      <section className="catalogue-stack" aria-label="Moon phase">
        <SectionHeader title="Moon phase" />
        <div
          style={{
            position: "relative",
            display: "grid",
            placeItems: "center",
            minHeight: 280,
            borderRadius: 16,
            background: "oklch(0.16 0.01 260)",
            overflow: "hidden",
          }}
        >
          <Starfield />
          <MoonPhase animate label="Moon cycling through its phases" size={144} />
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
          {phases.map((phase) => (
            <figure key={phase} style={{ margin: 0, display: "grid", justifyItems: "center", gap: 8 }}>
              <MoonPhase halo={false} label={lunarPhaseName(phase)} phase={phase} size={56} />
              <figcaption style={{ fontSize: 12 }}>{lunarPhaseName(phase)}</figcaption>
            </figure>
          ))}
        </div>
        <SectionHeader title="Moon types" />
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 24,
            padding: 24,
            borderRadius: 16,
            background: "oklch(0.16 0.01 260)",
            color: "oklch(0.9 0 0)",
          }}
        >
          {MOON_VARIANTS.map((variant) => (
            <figure key={variant.id} style={{ margin: 0, display: "grid", justifyItems: "center", gap: 8 }}>
              <MoonPhase
                label={variant.label}
                phase={variant.appearsAt === "crescent" ? 0.1 : 0.5}
                size={72}
                variant={variant.id}
              />
              <figcaption style={{ fontSize: 12 }}>
                {variant.label} · {variant.rarity}
              </figcaption>
            </figure>
          ))}
        </div>
        <p style={{ fontSize: 14 }}>
          26 Sep 2026: {lunarPhaseName(today)} ({Math.round(today * 100)}% through the cycle)
        </p>
      </section>
    </main>
  );
}

export const Gallery: Story = { render: () => <EffectsGallery /> };
