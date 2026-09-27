# Fabrials UI film

66 seconds · 1920×1080 · 30 fps · H.264 + stereo AAC.

A continuous coffee setup story: request, comparison, visible evidence, compatible filter, manual correction and human review. React/SVG illustrations and the registry Comparison component are shared with the live demo. Frame-driven Remotion animation illustrates the guided scenario; the separate native-browser check executes the actual registered tools.

All Remotion packages are pinned to **4.0.521**, the latest release verified at production. English narration uses Grok voice **eve** through **https://ai.fabrials.com/v1/tts**. The instrumental bed is an original deterministic synthesizer composition. No stock music or screenshots are used.

## Reproduce

Use Bun 1.4.2, Node 22+, FFmpeg and an actual Chrome executable.

```sh
bun install --frozen-lockfile
# Supply AI_RELAY_VIRTUAL_KEY securely through the environment.
bun run video:voice
bun run video:music
CHROME_BIN=/path/to/chrome bun run video:render
bun run video:studio
```

Voice requests are fingerprint-cached under ignored artifacts/remotion-public/. Narration generation updates video/remotion/timing.json; scene lengths follow actual audio durations. Rendering copies the bundled font, regenerates sentence captions, and writes MP4/poster/VTT to artifacts/remotion-film/. Captions use Grok character timestamps, mapped back to the original narration; rendering fails if the alignment cannot be matched. PREVIEW_FRAMES=90,510,810,1100,1500,1800 renders review frames.

The composition mixes voice with a quiet instrumental bed and fades the music at the boundaries. The player requires a click, exposes audio controls, offers captions and includes the full transcript.

## Publish

bun run video:publish uses runtime S3_* credentials, PUTs and HEAD-verifies the public assets in bucket apps, prefix videos/fabrials-ui/v4/. PUBLISH_SOURCES=1 also preserves generated narration, character alignments and score under source/; these are not exposed by the public media route.

Preserve Content-Encoding: identity and Cache-Control: no-transform so proxies retain media lengths and seeking. Bump both prefix and player version when replacing a published film.

## Brand pronunciation

Fabrials uses the explicit IPA replacement `/ˈfæbriəlz/` (FAB-ree-uhlz), replacing the old split spelling. This is an adopted brand reading, not a claim of one canonical Stormlight pronunciation. Research and reference analysis: [demo-refinement.md](../docs/demo-refinement.md). Grok Eve receives IPA through the relay; the displayed spelling remains Fabrials.

Motion refinement: interaction targets and event ordering live in motion.ts. Cursor movement uses smooth acceleration/deceleration with stationary dwell during each click; click feedback runs once from the event frame. Machine selection flies into the cart before the row settles, the filter and total interpolate together, and an empty cart shows a placeholder instead of a misleading zero/review action. Motion tests protect cursor targeting and event order.
