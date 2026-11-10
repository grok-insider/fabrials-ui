import type { CSSProperties, ReactNode } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious, Input } from "@fabrials/ui";
import { Block, Frame, Page } from "./story-frame";

const meta = {
  title: "Tests/Carousel",
  parameters: { layout: "fullscreen" },
} satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

const REPORTS = ["Usage report", "Account list", "Sync log", "Invoices", "Audit trail"];
const ARABIC = ["تقرير الاستخدام", "قائمة الحسابات", "سجل المزامنة", "الفواتير"];

// The two keys sit 3rem outside the slides, so the stage leaves them that room on each side (and above and below a column).
const row: CSSProperties = { paddingInline: "3.25rem" };
const column: CSSProperties = { paddingBlock: "3.25rem", inlineSize: "min(100%, 18rem)" };

const slide: CSSProperties = {
  boxSizing: "border-box",
  display: "grid",
  gap: "var(--fui-space-2)",
  alignContent: "center",
  minBlockSize: "7rem",
  padding: "var(--fui-space-4)",
  border: "1px solid var(--border)",
  borderRadius: "var(--fui-radius-lg)",
  background: "var(--background)",
  fontSize: "var(--fui-text-sm)",
};

function Slide({ children }: { children: ReactNode }) {
  return <div style={slide}>{children}</div>;
}

function Bench() {
  return (
    <Page
      description="A row of slides, a column, the row in a right-to-left page, and a slide that holds a field. The arrows of the axis move a slide while the region or one of its keys has focus; keys pressed inside a slide stay there."
      title="Carousel"
    >
      <Block title="A row" description="Left and Right, Home and End. Previous is off on the first slide and Next on the last.">
        <Frame width={560}>
          <div style={row}>
            <Carousel aria-label="Reports">
              <CarouselContent>
                {REPORTS.map((name) => (
                  <CarouselItem key={name}>
                    <Slide>{name}</Slide>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious />
              <CarouselNext />
            </Carousel>
          </div>
        </Frame>
      </Block>
      <Block title="A column" description="Up and Down. The keys sit above and below.">
        <Frame width={560}>
          <div style={column}>
            <Carousel aria-label="Release notes" orientation="vertical">
              <CarouselContent style={{ blockSize: "8rem" }}>
                {["0.12", "0.11", "0.10", "0.9"].map((version) => (
                  <CarouselItem key={version}>
                    <Slide>Release {version}</Slide>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious />
              <CarouselNext />
            </Carousel>
          </div>
        </Frame>
      </Block>
      <Block title="Right to left" description="The first slide is at the right, the keys change sides and their chevrons turn; Left goes on and Right goes back.">
        <Frame dir="rtl" width={560}>
          <div style={row}>
            <Carousel aria-label="التقارير" labels={{ previous: "الشريحة السابقة", next: "الشريحة التالية", slide: (index, count) => `${index} من ${count}` }}>
              <CarouselContent>
                {ARABIC.map((name) => (
                  <CarouselItem key={name}>
                    <Slide>{name}</Slide>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious />
              <CarouselNext />
            </Carousel>
          </div>
        </Frame>
      </Block>
      <Block title="A field in a slide" description="The arrows move the caret in the field, not the slide.">
        <Frame width={560}>
          <div style={row}>
            <Carousel aria-label="Onboarding">
              <CarouselContent>
                <CarouselItem>
                  <Slide>
                    <label htmlFor="carousel-workspace">Name the workspace</label>
                    <Input defaultValue="Harbour" id="carousel-workspace" />
                  </Slide>
                </CarouselItem>
                <CarouselItem>
                  <Slide>Invite the team</Slide>
                </CarouselItem>
                <CarouselItem>
                  <Slide>Connect a mailbox</Slide>
                </CarouselItem>
              </CarouselContent>
              <CarouselPrevious />
              <CarouselNext />
            </Carousel>
          </div>
        </Frame>
      </Block>
    </Page>
  );
}

export const Pieces: Story = { render: () => <Bench /> };
