"use client";
import { useRef, useState } from "react";
import { Download, Play, RotateCcw } from "lucide-react";
import { narration } from "@/video/remotion/script";
import timing from "@/video/remotion/timing.json";
import { Button } from "@/components/ui/button";
export function DemoVideo() {
  const video = useRef<HTMLVideoElement>(null);
  const [started, setStarted] = useState(false);
  const [error, setError] = useState(false);
  async function play() {
    setError(false);
    setStarted(true);
    try {
      if (video.current?.error) video.current.load();
      await video.current?.play();
    } catch {
      setError(true);
    }
  }
  return (
    <section
      id="demo-video"
      aria-labelledby="demo-video-title"
      className="scroll-mt-24 border-t py-14"
    >
      <div className="mb-7 flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="text-sm text-muted-foreground">
            Watch it work · {Math.round(timing.durationInFrames / timing.fps)}{" "}
            seconds
          </p>
          <h2
            id="demo-video-title"
            className="mt-3 text-3xl font-medium tracking-tight"
          >
            From a request to a decision.
          </h2>
          <p className="mt-3 text-sm text-muted-foreground">
            An animated walkthrough with Grok narration and original music.
          </p>
        </div>
        <a
          href="/api/demo-media/demo.mp4?v=5&download=1"
          className="inline-flex min-h-10 items-center gap-2 text-sm underline underline-offset-4"
        >
          <Download className="size-4" />
          Download demo
        </a>
      </div>
      <div className="relative overflow-hidden rounded-xl border bg-black">
        <video
          ref={video}
          className="aspect-video w-full"
          controls={started}
          playsInline
          preload="none"
          poster="/api/demo-media/poster.jpg?v=5"
          aria-label="Fabrials UI: compare a coffee setup, understand the recommendation, and review your selection"
          onPlay={() => setStarted(true)}
          onError={() => setError(true)}
        >
          <source src="/api/demo-media/demo.mp4?v=5" type="video/mp4" />
          <track
            kind="captions"
            src="/api/demo-media/transcript.vtt?v=5"
            srcLang="en"
            label="English"
          />
        </video>
        {!started && (
          <button
            onClick={() => void play()}
            aria-label="Play demo video"
            className="absolute inset-0 flex items-center justify-center bg-black/10 transition-colors hover:bg-black/25 focus-visible:outline-4 focus-visible:outline-offset-[-6px] focus-visible:outline-white"
          >
            <span className="flex size-16 items-center justify-center rounded-full border border-white/30 bg-white text-black shadow-xl">
              <Play className="ml-1 size-6 fill-current" />
            </span>
          </button>
        )}
      </div>
      {error && (
        <div role="alert" className="mt-3 flex items-center gap-3 text-sm">
          The video could not load.
          <Button variant="outline" size="sm" onClick={() => void play()}>
            <RotateCcw />
            Retry
          </Button>
        </div>
      )}
      <details className="mt-4 text-sm text-muted-foreground">
        <summary className="w-fit cursor-pointer py-2">
          Read the transcript
        </summary>
        <ol className="mt-3 space-y-2 leading-6">
          {narration.map((scene, index) => (
            <li key={scene.id}>
              {new Date((timing.scenes[index].from / 30) * 1000)
                .toISOString()
                .slice(14, 19)}{" "}
              — {scene.text}
            </li>
          ))}
        </ol>
      </details>
    </section>
  );
}
