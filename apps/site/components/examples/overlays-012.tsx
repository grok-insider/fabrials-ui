"use client";

// The ways of using what 0.12 added to the overlays and the media: the new parts of the combobox, the close key of a
// popover, a viewer wired for a whole page, and a gallery. Packages only, synthetic data, nothing running by itself.
import { useState } from "react";
import {
  Button,
  Combobox,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxCollection,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxGroup,
  ComboboxInput,
  ComboboxItem,
  ComboboxLabel,
  ComboboxList,
  ComboboxValue,
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
  ImageViewerGroup,
  ImageViewerProvider,
  MediaGrid,
  Popover,
  PopoverClose,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
  ZoomableImage,
  useImageViewer,
  type MediaGridItem,
} from "@fabrials/ui";
import type { ExampleSet } from "./types";

const background = {
  display: "grid",
  gap: "var(--fui-space-3)",
  inlineSize: "min(100%, 28rem)",
} as const;
const muted = { margin: 0, color: "var(--muted-foreground)" } as const;

/* ---------------------------------------------------------------- popover */

function RangePopover() {
  const [range, setRange] = useState("7 days");
  return (
    <Popover>
      <PopoverTrigger render={<Button variant="outline" />}>Range: {range}</PopoverTrigger>
      <PopoverContent>
        <PopoverHeader>
          <PopoverTitle>Range</PopoverTitle>
        </PopoverHeader>
        <div
          style={{
            ...background,
            gap: "var(--fui-space-1)",
            paddingBlockEnd: "var(--fui-space-2)",
          }}
        >
          {["24 hours", "7 days", "30 days"].map((one) => (
            <Button key={one} onClick={() => setRange(one)} size="sm" variant={one === range ? "secondary" : "ghost"}>
              {one}
            </Button>
          ))}
        </div>
        <PopoverClose />
      </PopoverContent>
    </Popover>
  );
}

export const popoverExamples: ExampleSet = {
  examples: [
    {
      id: "close",
      title: "A panel with its own close key",
      description:
        "`PopoverClose` is the corner key a dialog has: a ghost X named Close, which stays in the corner while the popover scrolls. Put it last in `PopoverContent`, so focus lands on the content first, and a `PopoverHeader` leaves it room.",
      code: `<Popover>
  <PopoverTrigger render={<Button variant="outline" />}>Range: {range}</PopoverTrigger>
  <PopoverContent>
    <PopoverHeader>
      <PopoverTitle>Range</PopoverTitle>
    </PopoverHeader>
    {choices.map((one) => (
      <Button key={one} size="sm" onClick={() => setRange(one)}>
        {one}
      </Button>
    ))}
    <PopoverClose />
  </PopoverContent>
</Popover>`,
      render: () => <RangePopover />,
      align: "start",
    },
    {
      id: "room",
      title: "Never taller than the room it has",
      description:
        "A popover is never taller than the space Base UI measured for it (`max-block-size: var(--available-height)`) and scrolls inside. Before, a tall one ran off a short window. Here the list is long enough to scroll.",
      code: `<Popover>
  <PopoverTrigger render={<Button variant="outline" />}>Long list</PopoverTrigger>
  <PopoverContent>
    <PopoverHeader>
      <PopoverTitle>Workspaces</PopoverTitle>
    </PopoverHeader>
    …twelve rows…
    <PopoverClose />
  </PopoverContent>
</Popover>`,
      render: () => (
        <Popover>
          <PopoverTrigger render={<Button variant="outline" />}>A long panel</PopoverTrigger>
          <PopoverContent>
            <PopoverHeader>
              <PopoverTitle>Workspaces</PopoverTitle>
            </PopoverHeader>
            <div
              style={{
                display: "grid",
                gap: "var(--fui-space-2)",
                paddingBlockEnd: "var(--fui-space-3)",
              }}
            >
              {Array.from({ length: 12 }, (_, index) => (
                <p key={index} style={muted}>
                  Workspace {index + 1} · three keys
                </p>
              ))}
            </div>
            <PopoverClose />
          </PopoverContent>
        </Popover>
      ),
      align: "start",
    },
  ],
};

/* ---------------------------------------------------------------- hover card */

export const hoverCardExamples: ExampleSet = {
  examples: [
    {
      id: "preview",
      title: "A preview, reachable from the keyboard",
      description:
        "A hover card opens on hover and on focus. Its content scrolls inside the room measured for it, so a long preview in a short window stays on the screen instead of running off it.",
      code: `<HoverCard>
  <HoverCardTrigger render={<Button variant="outline" />}>North workspace</HoverCardTrigger>
  <HoverCardContent>
    <p>Nine keys, last synced at 11:42.</p>
  </HoverCardContent>
</HoverCard>`,
      render: () => (
        <HoverCard>
          <HoverCardTrigger render={<Button variant="outline" />}>North workspace</HoverCardTrigger>
          <HoverCardContent>
            <p style={muted}>Nine keys, last synced at 11:42. Synthetic data.</p>
          </HoverCardContent>
        </HoverCard>
      ),
      align: "start",
    },
  ],
};

/* ---------------------------------------------------------------- combobox */

const WORKSPACES = ["North", "South", "East", "West", "Harbour", "Orchard"];
const OWNERS = [
  { group: "Design", items: ["Ada Rivera", "Bea Sol"] },
  { group: "Engineering", items: ["Cai Ito", "Dana Reyes"] },
];
const TAGS = ["Reading", "Speaking", "Writing", "Listening"];

export const comboboxExamples: ExampleSet = {
  examples: [
    {
      id: "single",
      title: "One value, written with the flat parts",
      description:
        "`Combobox` is the root and `ComboboxInput`, `ComboboxContent` and `ComboboxList` are the field, the portal and the options. `ComboboxEmpty` is the sentence for no matches, and it stays mounted so it is read when it appears.",
      code: `<Combobox items={WORKSPACES}>
  <ComboboxInput id="workspace" placeholder="Choose a workspace" showClear />
  <ComboboxContent>
    <ComboboxEmpty>No workspace matches.</ComboboxEmpty>
    <ComboboxList>
      {(item: string) => (
        <ComboboxItem key={item} value={item}>
          {item}
        </ComboboxItem>
      )}
    </ComboboxList>
  </ComboboxContent>
</Combobox>`,
      render: () => (
        <div style={{ width: "min(100%, 20rem)" }}>
          <Combobox items={WORKSPACES}>
            <ComboboxInput id="workspace-single" placeholder="Choose a workspace" showClear />
            <ComboboxContent>
              <ComboboxEmpty>No workspace matches.</ComboboxEmpty>
              <ComboboxList>
                {(item: string) => (
                  <ComboboxItem key={item} value={item}>
                    {item}
                  </ComboboxItem>
                )}
              </ComboboxList>
            </ComboboxContent>
          </Combobox>
        </div>
      ),
      align: "start",
    },
    {
      id: "multiple",
      title: "Several values, as chips",
      description:
        "With `multiple`, choosing a row ticks it and keeps the list open. `ComboboxChips` is both the field and the anchor of the list, `ComboboxChip` carries its own remove key (named after the value), and `ComboboxValue` is the same values as text.",
      code: `<Combobox items={TAGS} multiple defaultValue={["Reading"]}>
  <ComboboxChips>
    <ComboboxValue />
    <ComboboxChipsInput placeholder="Add a skill" aria-label="Skills" />
  </ComboboxChips>
  <ComboboxContent>
    <ComboboxList>
      {(item: string) => (
        <ComboboxItem key={item} value={item}>
          {item}
        </ComboboxItem>
      )}
    </ComboboxList>
  </ComboboxContent>
</Combobox>`,
      render: () => (
        <div style={{ width: "min(100%, 22rem)" }}>
          <Combobox defaultValue={["Reading"]} items={TAGS} multiple>
            <ComboboxChips>
              <ComboboxValue />
              <ComboboxChipsInput aria-label="Skills" placeholder="Add a skill" />
            </ComboboxChips>
            <ComboboxContent>
              <ComboboxList>
                {(item: string) => (
                  <ComboboxItem key={item} value={item}>
                    {item}
                  </ComboboxItem>
                )}
              </ComboboxList>
            </ComboboxContent>
          </Combobox>
        </div>
      ),
      align: "start",
    },
    {
      id: "grouped",
      title: "A grouped list, and an empty one",
      description:
        "With grouped items, `ComboboxGroup` holds a `ComboboxLabel` and a `ComboboxCollection` of rows. The empty sentence is a polite region that is there before the first keystroke, so type something that matches nothing to hear it read.",
      code: `<Combobox items={OWNERS}>
  <ComboboxInput placeholder="Find a person" />
  <ComboboxContent>
    <ComboboxEmpty>No one matches.</ComboboxEmpty>
    <ComboboxList>
      {(group: OwnerGroup) => (
        <ComboboxGroup key={group.group} items={group.items}>
          <ComboboxLabel>{group.group}</ComboboxLabel>
          <ComboboxCollection>
            {(item: string) => (
              <ComboboxItem key={item} value={item}>
                {item}
              </ComboboxItem>
            )}
          </ComboboxCollection>
        </ComboboxGroup>
      )}
    </ComboboxList>
  </ComboboxContent>
</Combobox>`,
      render: () => (
        <div style={{ width: "min(100%, 20rem)" }}>
          <Combobox items={OWNERS}>
            <ComboboxInput id="person" placeholder="Find a person" />
            <ComboboxContent>
              <ComboboxEmpty>No one matches.</ComboboxEmpty>
              <ComboboxList>
                {(group: { group: string; items: string[] }) => (
                  <ComboboxGroup items={group.items} key={group.group}>
                    <ComboboxLabel>{group.group}</ComboboxLabel>
                    <ComboboxCollection>
                      {(item: string) => (
                        <ComboboxItem key={item} value={item}>
                          {item}
                        </ComboboxItem>
                      )}
                    </ComboboxCollection>
                  </ComboboxGroup>
                )}
              </ComboboxList>
            </ComboboxContent>
          </Combobox>
        </div>
      ),
      align: "start",
    },
  ],
};

/* ---------------------------------------------------------------- the viewer and the gallery */

function tile(hue: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="200"><rect width="320" height="200" fill="${hue}"/><circle cx="240" cy="60" r="34" fill="#ffffff" fill-opacity="0.35"/></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

const HARBOUR: MediaGridItem[] = [
  { src: tile("#2459b3"), alt: "The harbour at dawn" },
  {
    src: tile("#2f6f63"),
    alt: "A moored boat",
    caption: "Moored at the north quay",
  },
  { src: tile("#7a6a3a"), alt: "Rope on the pier" },
  { src: tile("#5a4a72"), alt: "The lighthouse", caption: "Lighthouse, 06:10" },
  { src: tile("#3d4a5c"), alt: "Gulls over the water" },
  { src: tile("#8a5a3a"), alt: "The market street" },
];

function OpenFromButton() {
  const viewer = useImageViewer();
  return (
    <Button disabled={!viewer} onClick={() => viewer?.open(HARBOUR, 2)} size="sm" variant="outline">
      Open the third picture
    </Button>
  );
}

export const imageViewerExamples: ExampleSet = {
  examples: [
    {
      id: "provider",
      title: "One viewer for the page",
      description:
        "`ImageViewerProvider` renders one viewer for everything below it and `useImageViewer` opens it from anywhere: `open(items, index)`. It is `null` outside a provider, so a piece can leave its control out instead of drawing one that does nothing.",
      code: `<ImageViewerProvider label="Photos">
  <ImageViewerGroup name="harbour">
    {photos.map((photo) => (
      <ZoomableImage key={photo.src} src={photo.src} alt={photo.alt} ratio="4 / 3" />
    ))}
  </ImageViewerGroup>
  <OpenFromButton />
</ImageViewerProvider>`,
      render: () => (
        <ImageViewerProvider label="Photos">
          <div style={{ ...background, inlineSize: "min(100%, 34rem)" }}>
            <ImageViewerGroup name="harbour">
              <div
                style={{
                  display: "grid",
                  gap: "var(--fui-space-2)",
                  gridTemplateColumns: "repeat(3, 1fr)",
                }}
              >
                {HARBOUR.slice(0, 3).map((photo) => (
                  <ZoomableImage alt={photo.alt} key={photo.src} ratio="4 / 3" src={photo.src} />
                ))}
              </div>
            </ImageViewerGroup>
            <OpenFromButton />
          </div>
        </ImageViewerProvider>
      ),
      align: "start",
    },
    {
      id: "gallery",
      title: "A gallery, its captions and its credits",
      description:
        '`ImageViewerGroup` makes the pictures of one message page into each other, and each `ZoomableImage` takes the credit and the download name the viewer shows. A tap of a finger on a fitted picture drags it down to close; with `zoomOn="double"` one tap shows and hides the bars, as a phone gallery does.',
      code: `<ImageViewerProvider compact dragToClose>
  <ImageViewerGroup name="market">
    {photos.map((photo) => (
      <ZoomableImage
        key={photo.src}
        src={photo.src}
        full={photo.full}
        alt={photo.alt}
        credit="Ada Rivera"
        sourceUrl="https://example.com/market"
        downloadName={\`harbour-\${photo.id}.png\`}
      />
    ))}
  </ImageViewerGroup>
</ImageViewerProvider>`,
      render: () => (
        <ImageViewerProvider compact dragToClose label="Harbour">
          <div style={{ inlineSize: "min(100%, 34rem)" }}>
            <ImageViewerGroup name="market">
              <MediaGrid items={HARBOUR.slice(0, 5)} layout="gallery" openWith="viewer" />
            </ImageViewerGroup>
          </div>
        </ImageViewerProvider>
      ),
      align: "start",
    },
  ],
};

export const mediaGridExamples: ExampleSet = {
  examples: [
    {
      id: "gallery",
      title: "Up to eight, with a lead tile",
      description:
        '`layout="gallery"` draws up to eight tiles: one, two or three in a row; four as two by two; five around a large lead one; six as three by two; seven and eight in four columns. Under 30rem of its own width it uses two columns.',
      code: `<MediaGrid items={photos} layout="gallery" caption="Photos of the harbour" />`,
      render: () => (
        <div style={{ inlineSize: "min(100%, 34rem)" }}>
          <MediaGrid caption="Photos of the harbour" items={HARBOUR} layout="gallery" />
        </div>
      ),
      align: "start",
    },
    {
      id: "captions",
      title: "Captions, a footer and broken tiles",
      description:
        "A tile's `caption` sits over its foot, on a scrim, under the pointer and on keyboard focus and always on a touch screen; `footer` is the figcaption under the grid. `hideBroken` takes a picture that failed out of the grid, the count and the viewer's set instead of leaving a hole, and `empty` is what is left when every tile failed.",
      code: `<ImageViewerProvider compact label="Harbour">
  <MediaGrid
    items={photos}
    layout="gallery"
    caption="Photos of the harbour"
    footer="Photographed on 4 November."
    hideBroken
    openWith="viewer"
  />
</ImageViewerProvider>`,
      render: () => (
        <ImageViewerProvider compact label="Harbour">
          <div style={{ inlineSize: "min(100%, 34rem)" }}>
            <MediaGrid
              caption="Photos of the harbour"
              footer="Photographed on 4 November."
              hideBroken
              items={HARBOUR.slice(0, 5)}
              layout="gallery"
              openWith="viewer"
            />
          </div>
        </ImageViewerProvider>
      ),
      align: "start",
    },
  ],
};
