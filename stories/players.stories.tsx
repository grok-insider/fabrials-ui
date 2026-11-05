import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { AnimatedImage, AudioPlayer, ImageViewer, MediaGrid, VideoPlayer, type ViewerItem } from "@fabrials/ui";
import { Block, Frame, Page } from "./story-frame";
import { PHOTOS, scene } from "./media-fixtures";

const meta = {
  title: "Fabrials/Players",
  parameters: { layout: "fullscreen" },
} satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

// Synthetic media made with ffmpeg (gradients, a sine tone): no people, no third-party footage.
const HARBOUR = new URL("./assets/harbour.webm", import.meta.url).href;
const CAPTIONS = new URL("./assets/harbour.en.vtt", import.meta.url).href;
const LOOP = new URL("./assets/loop.webm", import.meta.url).href;
const GIF = new URL("./assets/loop.gif", import.meta.url).href;
const CHIME = new URL("./assets/chime.webm", import.meta.url).href;
const POSTER = scene({ width: 640, height: 360, sky: ["#0d1b2e", "#3d6e9c"], ground: "#0a1320", sun: "#e9d8a6", label: "Harbour, 0:06" });
const LOOP_POSTER = scene({ width: 320, height: 180, sky: ["#2a1b26", "#9c6f86"], ground: "#170e14", sun: "#f4d8c4", label: "" });

function VideoPage() {
  const [index, setIndex] = useState<number | null>(null);
  const items: ViewerItem[] = [
    { ...PHOTOS[0]!, kind: "image" },
    { src: HARBOUR, alt: "Footage of the harbour at dusk", kind: "video", poster: POSTER, thumb: POSTER },
    { ...PHOTOS[2]!, kind: "image" },
  ];
  return (
    <Page
      title="Video"
      description="Our controls over the browser's video: a seek bar that shows what is loaded, the clock, volume, speed, captions and full screen. Space or K, J and L, the arrows, M, F and C work while it has focus; the bar rests while it plays."
    >
      <Block title="A video with captions">
        <Frame width={720}>
          <VideoPlayer src={HARBOUR} poster={POSTER} label="The harbour at dusk" width={640} height={360} tracks={[{ src: CAPTIONS, srcLang: "en", label: "English" }]} />
        </Frame>
      </Block>
      <Block
        title="Narrow, and a file that does not play"
        description="Below 36 rem the seek bar and the clock take the top row and the keys go under them; before the first play only the play key shows. A failed file says why and offers the file itself."
      >
        <div className="catalogue-row" style={{ alignItems: "start" }}>
          <Frame width={320}>
            <VideoPlayer src={HARBOUR} poster={POSTER} label="The harbour, small" width={640} height={360} />
          </Frame>
          <Frame width={320}>
            <VideoPlayer src="/does-not-exist.webm" label="A missing video" width={640} height={360} />
          </Frame>
        </div>
      </Block>
      <Block title="In the viewer" description="A video item opens in the player; its keys win while it has focus, the viewer's arrows still move between items.">
        <Frame width={560}>
          <MediaGrid items={items.map((item) => ({ src: item.thumb ?? item.src, alt: item.alt, kind: item.kind }))} onOpen={setIndex} />
        </Frame>
      </Block>
      <ImageViewer
        items={items}
        index={index}
        onIndexChange={setIndex}
        onClose={() => setIndex(null)}
        label="Harbour"
        renderMedia={(item) => <VideoPlayer key={item.src} src={item.src} poster={item.poster} label={item.alt} width={640} height={360} autoPlay className="catalogue-viewer-video" />}
      />
    </Page>
  );
}

function SoundAndAnimationPage() {
  return (
    <Page
      title="Sound and animation"
      description="A recording in one row, and animations that move only while on screen, with the tab in front and motion allowed, with a pause button that always works."
    >
      <Block title="Audio">
        <Frame width={520}>
          <div className="catalogue-stack">
            <AudioPlayer src={CHIME} label="Three-note chime" title="Three-note chime · 0:05" />
            <AudioPlayer src="/does-not-exist.webm" label="A missing recording" title="Voice note" />
          </div>
        </Frame>
      </Block>
      <Block title="Animations" description="Under reduced motion they start still; pressing play keeps one moving until it leaves the screen.">
        <div className="catalogue-grid">
          <AnimatedImage src={LOOP} poster={LOOP_POSTER} alt="Colour drifting across a dusk sky" type="video" width={320} height={180} />
          <AnimatedImage src={GIF} alt="Green copper light rippling" type="image" width={240} height={135} />
        </div>
      </Block>
    </Page>
  );
}

export const Video: Story = { render: () => <VideoPage /> };
export const SoundAndAnimation: Story = { render: () => <SoundAndAnimationPage /> };
