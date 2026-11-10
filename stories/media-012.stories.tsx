import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  ImageViewer,
  ImageViewerGroup,
  ImageViewerProvider,
  MediaGrid,
  ZoomableImage,
  type MediaGridItem,
  type ViewerItem,
} from "@fabrials/ui";
import { Block, Frame, Page } from "./story-frame";
import { PHOTOS, scene } from "./media-fixtures";

const meta = {
  title: "Tests/Media 0.12",
  parameters: { layout: "fullscreen" },
} satisfies Meta;
export default meta;
type Story = StoryObj;

const CAPTIONS = [
  "Harbour at dusk",
  "Orchard, north side",
  "Quarry lake",
  "Field office panorama",
  "Night shift, first light",
  "Verdigris roofs",
  "The east pier",
  "The yard at noon",
];

// Two more synthetic scenes, so a gallery can hold eight different pictures.
const EXTRA = [
  { src: scene({ width: 2200, height: 1400, sky: ["#1a2434", "#7a93b8"], ground: "#101620", sun: "#f2e6c8", label: "East pier, low tide" }), alt: "The east pier at low tide" },
  { src: scene({ width: 1700, height: 1700, sky: ["#241a12", "#b59262"], ground: "#140f08", sun: "#f7efe0", label: "The yard at noon" }), alt: "The yard at noon" },
];

const ALL = [...PHOTOS.slice(0, 6), ...EXTRA];

const pictures = (count: number): MediaGridItem[] =>
  ALL.slice(0, count).map((photo, index) => ({ ...photo, caption: CAPTIONS[index], credit: index % 2 ? "Ada Rivera" : "The station archive" }));

// A broken picture: the data URL decodes to nothing.
const BROKEN = "data:image/png;base64,AAAA";

const PHOTOGRAPHS = PHOTOS.map((photo, index) => ({
  ...photo,
  caption: index === 0 ? "The harbour from the east pier, synthetic." : undefined,
  credit: index === 0 ? "Photo: Ada Rivera" : undefined,
  sourceUrl: index === 0 ? "https://unsplash.com/" : undefined,
  sourceLabel: index === 0 ? "unsplash.com" : undefined,
  downloadName: index === 0 ? "harbour-at-dusk.svg" : undefined,
}));

function PiecesPage() {
  return (
    <Page
      title="Media, 0.12"
      description="A gallery of one to eight pictures, with a line over each tile and a line of sources under them; a picture that opens the viewer from wherever it is and pages with the pictures of its group; a tile whose picture fails dropped from the grid and from the viewer's set; and the same in a right-to-left page."
    >
      <Block
        title="Galleries"
        description="One to eight tiles: three in a row, four as two by two, five around a large lead tile, six as three by two, seven and eight in four columns. In a narrow container there are two columns, and an odd count lets the first tile span them both."
      >
        <div className="catalogue-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 30rem), 1fr))", alignItems: "start" }}>
          {[1, 2, 3, 4, 5, 6, 7, 8].map((count) => (
            <Frame key={count} width={720}>
              <MediaGrid
                layout="gallery"
                items={pictures(count)}
                caption={`${count} ${count === 1 ? "picture" : "pictures"}`}
                footer={count === 8 ? "Photos: Ada Rivera, The station archive" : undefined}
              />
            </Frame>
          ))}
        </div>
      </Block>
      <Block title="A picture that fails" description="With hideBroken the tile leaves the grid and the viewer's set: five tiles become four, and the count of the set follows.">
        <ImageViewerProvider label="Results">
          <Frame width={720}>
            <MediaGrid
              layout="gallery"
              hideBroken
              openWith="viewer"
              items={[{ ...PHOTOS[0]!, caption: "Harbour, kept" }, { src: BROKEN, alt: "A picture that is gone", caption: "Gone" }, { ...PHOTOS[1]!, caption: "Orchard, kept" }]}
              footer="One result was no longer available and was dropped."
            />
          </Frame>
        </ImageViewerProvider>
      </Block>
      <Block title="A group of pictures that open the viewer" description="Every ZoomableImage in the group opens the one viewer at its own place, with the others beside it; outside a provider it is a plain picture, not a control that does nothing.">
        <ImageViewerProvider label="Photos">
          <ImageViewerGroup name="message-1">
            <div className="catalogue-row" style={{ alignItems: "start" }}>
              {PHOTOS.slice(0, 3).map((photo, index) => (
                <Frame key={photo.src} width={260}>
                  <ZoomableImage src={photo.src} alt={photo.alt} caption={CAPTIONS[index]} ratio="4 / 3" />
                </Frame>
              ))}
            </div>
          </ImageViewerGroup>
        </ImageViewerProvider>
      </Block>
      <Block title="A picture with no provider" description="The same picture outside a provider: a frame, and nothing to press.">
        <Frame width={260}>
          <ZoomableImage src={PHOTOS[4]!.src} alt={PHOTOS[4]!.alt} ratio="4 / 3" />
        </Frame>
      </Block>
      <Block title="Right to left">
        <Frame width={420} dir="rtl">
          <MediaGrid layout="gallery" items={pictures(5)} caption="صور الميناء" footer="الصور: أدا ريفيرا" />
        </Frame>
      </Block>
    </Page>
  );
}

function ViewerPage({ remote = false }: { remote?: boolean }) {
  const [index, setIndex] = useState<number | null>(0);
  const sources = remote
    ? ["/media/held.svg", "/media/photo-2.svg", "/media/photo-3.svg", "/media/photo-4.svg"]
    : PHOTOGRAPHS.map((photo) => photo.src);
  const items: ViewerItem[] = PHOTOGRAPHS.map((photo, position) => ({ ...photo, src: sources[position] ?? photo.src, thumb: photo.src }));
  return (
    <Page title="Viewer" description="Open on a picture with a credit, its source and the small copy under it while the full one arrives.">
      <ImageViewer items={items} index={index} onIndexChange={setIndex} onClose={() => setIndex(null)} label="Photos" compact actions={["download", "copy"]} />
    </Page>
  );
}

function DoubleClickPage() {
  const [index, setIndex] = useState<number | null>(0);
  return (
    <Page title="Viewer, two clicks" description="A double click or a double tap zooms around the point pressed; a single one does nothing on a mouse and shows or hides the bars on a touch screen.">
      <ImageViewer items={PHOTOGRAPHS} index={index} onIndexChange={setIndex} onClose={() => setIndex(null)} label="Photos" zoomOn="double" />
    </Page>
  );
}

export const Pieces: Story = { render: () => <PiecesPage /> };
export const Viewer: Story = { render: () => <ViewerPage /> };
export const ViewerRemote: Story = { render: () => <ViewerPage remote /> };
export const DoubleClick: Story = { render: () => <DoubleClickPage /> };
