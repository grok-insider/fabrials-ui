"use client";

import { useEffect, useState } from "react";
import { AspectRatio, Card, CardContent, CardDescription, CardHeader, CardTitle, Image } from "@fabrials/ui";
import type { ExampleSet } from "./types";
import { HARBOUR, ORCHARD_SCENE, QUARRY, scene } from "./fixtures";
import { ReplayButton } from "./replay";

const BROKEN = "data:image/png;base64,iVBORw0KGgo=";

function Post() {
  return (
    <Card style={{ width: "min(100%, 30rem)" }}>
      <CardContent style={{ display: "grid", gap: "var(--fui-space-4)" }}>
        <Image alt="Dark hills under a pale sun over the harbour" caption="The harbour at dusk. Synthetic." ratio="16 / 9" src={HARBOUR} />
        <CardHeader style={{ padding: 0 }}>
          <CardTitle>Field notes from the east pier</CardTitle>
          <CardDescription>Three weeks of tide readings, and the light at the end of each day.</CardDescription>
        </CardHeader>
      </CardContent>
    </Card>
  );
}

function LateArrival() {
  const [run, setRun] = useState(0);
  const [src, setSrc] = useState<string | undefined>(undefined);
  useEffect(() => {
    setSrc(undefined);
    const timer = window.setTimeout(() => setSrc(scene({ ...ORCHARD_SCENE, copy: run })), 900);
    return () => window.clearTimeout(timer);
  }, [run]);
  return (
    <div style={{ display: "grid", gap: "var(--fui-space-3)", width: "min(100%, 22rem)", justifyItems: "start" }}>
      <Image alt="Orchard terraces at first light" key={run} ratio="16 / 10" src={src} style={{ width: "100%" }} />
      <ReplayButton label="Load it again" onClick={() => setRun((value) => value + 1)} />
    </div>
  );
}

const pair = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(10rem, 1fr))", gap: "var(--fui-space-4)", width: "min(100%, 26rem)" } as const;

export const imageExamples: ExampleSet = {
  preview: () => <Post />,
  previewCode: `import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Image,
} from "@fabrials/ui";

export function Post({
  post,
}: {
  post: {
    title: string;
    summary: string;
    image: string;
    alt: string;
    caption: string;
  };
}) {
  return (
    <Card>
      <CardContent className="grid gap-4">
        <Image
          src={post.image}
          alt={post.alt}
          ratio="16 / 9"
          caption={post.caption}
        />
        <CardHeader className="p-0">
          <CardTitle>{post.title}</CardTitle>
          <CardDescription>{post.summary}</CardDescription>
        </CardHeader>
      </CardContent>
    </Card>
  );
}`,
  examples: [
    {
      id: "shape",
      title: "A frame that keeps its shape",
      description:
        "`ratio` (or the picture's `width` and `height`) sets the frame's shape before the picture arrives, so nothing moves when it does. `fit=\"cover\"`, the default, fills the frame and crops; `fit=\"contain\"` shows all of the picture on the plate.",
      code: `<Image src={photo} alt="A quarry lake" ratio="4 / 3" />
<Image src={photo} alt="A quarry lake" ratio="4 / 3" fit="contain" />`,
      render: () => (
        <div style={pair}>
          <Image alt="A quarry lake under a low sun" caption="cover" ratio="4 / 3" src={QUARRY} />
          <Image alt="A quarry lake under a low sun" caption="contain" fit="contain" ratio="4 / 3" src={QUARRY} />
        </div>
      ),
    },
    {
      id: "late",
      title: "When it arrives late",
      description:
        "Until the picture arrives the frame holds its place on a quiet plate. One that arrives after the view is shown comes in through a 2 px dither in four steps; a picture already in the cache just shows, and under reduced motion every picture just shows.",
      code: `<Image src={photo} alt="Orchard terraces at first light" ratio="16 / 10" />`,
      render: () => <LateArrival />,
      align: "start",
    },
    {
      id: "fails",
      title: "When it fails",
      description:
        "A picture that cannot load leaves its alt text in the frame, with a mark, so the reader knows what is missing; `fallback` says something of your own. This is why every picture needs its `alt`; `alt=\"\"` is only for decoration.",
      code: `<Image src={missing} alt="The site plan, floor two" ratio="4 / 3" />
<Image src={missing} alt="" ratio="4 / 3" fallback="Not available offline" />`,
      render: () => (
        <div style={pair}>
          <Image alt="The site plan, floor two" ratio="4 / 3" src={BROKEN} />
          <Image alt="" fallback="Not available offline" ratio="4 / 3" src={BROKEN} />
        </div>
      ),
    },
    {
      id: "aspect-ratio",
      title: "Any content in a fixed shape",
      description:
        "`AspectRatio` (shadcn's name) keeps whatever it holds in a box of one shape: a banner, an embed, a canvas. For a picture, `Image` does the same and adds the arrival and the failure.",
      code: `<AspectRatio ratio={3}>
  <img src={banner} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
</AspectRatio>`,
      render: () => (
        <div style={{ width: "min(100%, 26rem)" }}>
          <AspectRatio ratio={3} style={{ borderRadius: "var(--fui-radius-md)" }}>
            <img alt="" src={HARBOUR} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "50% 72%", display: "block" }} />
          </AspectRatio>
        </div>
      ),
    },
  ],
};
