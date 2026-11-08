import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  AspectRatio,
  Avatar,
  AvatarBadge,
  AvatarFallback,
  AvatarGroup,
  AvatarImage,
  avatarInitials,
  Image,
  ImageViewer,
  MediaGrid,
} from "@fabrials/ui";
import { Block, Frame, Page } from "./story-frame";
import { PHOTOS, PORTRAIT } from "./media-fixtures";

const meta = {
  title: "Tests/Media",
  parameters: { layout: "fullscreen" },
} satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

const TEAM = ["Ana Lopez", "Kai Nakamura", "Priya Shah", "Tom Adeyemi", "Lena Fischer", "Omar Haddad"];

function PeoplePage() {
  return (
    <Page title="People" description="Avatars in five sizes with initials on a colour of their own, a presence badge that is never the only signal, and groups cut out of the surface under them that fold the rest into a count.">
      <Block title="Sizes">
        <div className="catalogue-row">
          {(["xs", "sm", "md", "lg", "xl"] as const).map((size) => (
            <Avatar key={size} size={size}>
              <AvatarFallback>{avatarInitials("Ana Lopez")}</AvatarFallback>
            </Avatar>
          ))}
          <Avatar size="xl">
            <AvatarImage src={PORTRAIT} alt="Kai Nakamura" />
            <AvatarFallback>KN</AvatarFallback>
          </Avatar>
        </div>
      </Block>
      <Block title="Presence and counts" description="The badge says its status to assistive technology; write it next to the name as well.">
        <div className="catalogue-row">
          <Avatar size="lg">
            <AvatarFallback>AL</AvatarFallback>
            <AvatarBadge tone="success" label="Online" />
          </Avatar>
          <Avatar size="lg">
            <AvatarFallback>KN</AvatarFallback>
            <AvatarBadge tone="warning" label="Away" />
          </Avatar>
          <Avatar size="lg">
            <AvatarFallback>PS</AvatarFallback>
            <AvatarBadge tone="danger" label="Busy" />
          </Avatar>
          <Avatar size="lg">
            <AvatarFallback>TA</AvatarFallback>
            <AvatarBadge tone="neutral" label="Offline" />
          </Avatar>
          <Avatar size="lg">
            <AvatarImage src={PORTRAIT} alt="Kai Nakamura" />
            <AvatarFallback>KN</AvatarFallback>
            <AvatarBadge tone="info" label="3 unread">
              3
            </AvatarBadge>
          </Avatar>
        </div>
      </Block>
      <Block title="Groups">
        <div className="catalogue-stack">
          <AvatarGroup max={3} aria-label={`Shared with ${TEAM.join(", ")}`}>
            {TEAM.map((name) => (
              <Avatar key={name}>
                <AvatarFallback>{avatarInitials(name)}</AvatarFallback>
              </Avatar>
            ))}
          </AvatarGroup>
          <AvatarGroup size="sm">
            {TEAM.slice(0, 4).map((name) => (
              <Avatar key={name} size="sm">
                <AvatarFallback>{avatarInitials(name)}</AvatarFallback>
              </Avatar>
            ))}
          </AvatarGroup>
          <AvatarGroup max={4}>
            <Avatar size="lg">
              <AvatarImage src={PORTRAIT} alt="Kai Nakamura" />
              <AvatarFallback>KN</AvatarFallback>
            </Avatar>
            {TEAM.map((name) => (
              <Avatar key={name} size="lg">
                <AvatarFallback>{avatarInitials(name)}</AvatarFallback>
              </Avatar>
            ))}
          </AvatarGroup>
        </div>
      </Block>
    </Page>
  );
}

function ImagesPage() {
  const [open, setOpen] = useState<number | null>(null);
  const [gallery, setGallery] = useState<typeof PHOTOS>(PHOTOS);
  const show = (items: typeof PHOTOS) => (index: number) => {
    setGallery(items);
    setOpen(index);
  };
  return (
    <Page title="Images" description="Frames that keep their shape while an image loads, a dither when it arrives late, the alt text when it fails, and the mosaic a post shows. Any tile opens the viewer.">
      <Block title="Frames">
        <div className="catalogue-grid">
          <Image src={PHOTOS[0]!.src} alt={PHOTOS[0]!.alt} ratio="16 / 9" caption="Cover: fills the frame and crops." />
          <Image src={PHOTOS[1]!.src} alt={PHOTOS[1]!.alt} ratio="16 / 9" fit="contain" caption="Contain: all of it, on the plate." />
          <Image src="/does-not-exist.jpg" alt="The night shift roster" ratio="16 / 9" caption="Failed: the alt text stands in." />
        </div>
      </Block>
      <Block title="Aspect ratio">
        <Frame width={420}>
          <AspectRatio ratio={4 / 3} className="catalogue-aspect">
            <span>4 / 3</span>
          </AspectRatio>
        </Frame>
      </Block>
      <Block title="Mosaics" description="One wide, two side by side, one tall and two stacked, four in a square; past four, the last tile says how many more.">
        <div className="catalogue-grid">
          {[1, 2, 3, 4].map((count) => (
            <MediaGrid key={count} items={PHOTOS.slice(0, count)} onOpen={show(PHOTOS.slice(0, count))} />
          ))}
          <MediaGrid items={[...PHOTOS.slice(0, 3), { ...PHOTOS[3]!, kind: "gif" as const }, ...PHOTOS.slice(4)]} onOpen={show(PHOTOS)} />
        </div>
      </Block>
      <ImageViewer items={gallery} index={open} onIndexChange={setOpen} onClose={() => setOpen(null)} label="Photos" />
    </Page>
  );
}

function ViewerPage() {
  const [index, setIndex] = useState<number | null>(0);
  return (
    <Page
      title="Viewer"
      description="A dark stage in both themes. The wheel or a pinch zooms around the pointer; click, Z or the key for the real size and back, + and − to step, 0 to fit. Zoomed, drag or the arrows to look around; fitted, the arrows or a swipe move between items."
    >
      <ImageViewer
        items={PHOTOS.map((photo, position) => ({ ...photo, caption: position === 0 ? "The harbour from the east pier, synthetic." : undefined }))}
        index={index}
        onIndexChange={setIndex}
        onClose={() => setIndex(null)}
        label="Photos"
      />
    </Page>
  );
}

export const People: Story = { render: () => <PeoplePage /> };
export const Images: Story = { render: () => <ImagesPage /> };
export const Viewer: Story = { render: () => <ViewerPage /> };
