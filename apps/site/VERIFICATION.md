# Verification — 2026-09-06

- Bun migration: Bun 1.4.2 frozen installation, TypeScript 7.0.2 checks, ESLint 10.10.0, 20 Vitest tests and production build pass. `bun outdated` reports no pending direct dependency updates. Undici is 8.10.2. Microsoft’s TypeScript 6 API alias and ESLint’s official compatibility utility preserve tooling integration without disabling checks.
- Clean registry consumers using Bun and TypeScript 7 install and build in both Vite and Next.js. The Next.js fixture includes the updated optional Node connector.

- Production at https://ui.fabrials.com: healthy HTTPS service, 19 registry items, native Chrome tool/form flows and a real MCP 2026-07-28 discovery/call round trip passed. Clean Vite and Next.js consumers installed and built from the public registry.

- TypeScript and ESLint pass; Next.js production build renders all documentation routes.
- 20 tests cover current/legacy MCP, discovery, tool execution, resource/prompt reading, additional input, progress, cancellation, subscriptions, WebMCP lifecycle, schema validation, OAuth transient state/issuer partitioning, connector destination guards and component behavior.
- Registry entries install through the real shadcn CLI into clean Vite and Next.js projects. Both consumers typecheck and build, including the optional Node connector in Next.js.
- Native WebMCP verified in Chrome 152.0.7977.75 with WebMCPTesting enabled in a temporary profile: tool registration, native execution updating visible rows, unregistration after client navigation, declarative registration and manual form submission returning a native tool result.
- Daily Chrome without WebMCP: manual controls and explicitly labeled simulator work. Remote console negotiates MCP 2026-07-28; elicitation opens a focused dialog and resumes with the supplied answer.
- Mobile examples at 390px have no document overflow. Lighthouse navigation audit: accessibility 100, SEO 100, agentic browsing 100. The daily profile injected Dark Reader attributes before hydration, causing the development-mode console warning; a clean native session is used to distinguish extension effects from application errors.
- OAuth storage/state/error cases are automated; live authorization depends on each target server's OAuth registration and CORS configuration. No third-party account authorization was performed as part of these tests.

Reproduce native testing with `CHROME_BIN=/path/to/actual/chrome bun run test:native`. This launches and closes a temporary browser; do not point it at a wrapper that opens your daily profile.

Reproduce consumer installation with a local dev server running and `bun run test:registry`, or set `REGISTRY_ORIGIN=https://ui.fabrials.com` to check the published registry.

## UI polish and video — 2026-09-06

- Phase 1 (`910e584`): real GitHub stars (including zero), resilient API/cache fallback, responsive command wrapping and exact clipboard copy. Verified at 390/768/1440 px; 24 tests and build passed.
- Phase 2 (`e93ca97`): explicit manual/simulator/native results, repeat-call feedback, complete reset and accessible shadcn selection. 27 tests, production build and native Chrome flows passed.
- Phase 3: on-demand player with retry, captions/transcript and download; S3 allowlisted streaming with HEAD and byte ranges. 32 tests and production build passed. Clean Bun registry consumers build in Next.js and Vite. Real production-mode playback and seeking to 55 seconds passed without page errors. The rclone partial-response status is normalized to HTTP 206.
- Video capture assertions verify actual manual filters, repeated simulations, native Chrome execution and MCP results. Final MP4: 70 seconds, 1920×1080, 30 fps, H.264, no audio. MP4/poster/VTT PUT and HEAD checks passed on house S3; reproducible sources live in `video/` and `scripts/record-demo.ts`.

- Production proxy handling: media responses use identity encoding and `no-transform` so Traefik/Cloudflare preserve Content-Length and byte-range seeking. The player uses revisioned media URLs to bypass earlier compressed cache entries.

## Remotion replacement · 2026-09-06

- Supersedes the silent capture-based film above; the old recording script has been removed.
- Remotion 4.0.521, six React/SVG scenes, frame-driven transitions and UI actions, Grok Eve narration generated through ai.fabrials.com, original synthesized music.
- Inspected all six scene previews and loaded the composition in Remotion Studio. Final media: 1920×1080 H.264 at 30 fps, stereo 48 kHz AAC, 64.128 seconds including encoder padding, 9,237,490 bytes.
- FFmpeg measured the final mix at -18.76 LUFS integrated and -3.74 dBTP (no clipping). Audio perceptual listening was unavailable in this agent environment; loudness and stream checks are technical validation.
- TypeScript/ESLint, all 34 tests and the production registry/site build pass. Timeline tests ensure speech fits every scene; captions contain all narration sentences.
- Final assets and generated audio sources were PUT/HEAD verified in house S3, apps/videos/fabrials-ui/v2/. Public player version bumped to v=3; byte-range/no-transform behavior preserved.
- Published commit d06fb29 through Coolify deployment oph3ibgmudpaxllddhjlhyl8 (finished). Public Chrome playback: duration 64.128 s, unmuted volume 1, audio decoded; seek to 55.5 s succeeds without errors. Public Range response: 206, bytes 0-1023/9237490, Content-Length 1024.
- Public registry installation and production builds passed in fresh Vite and Next.js projects after publication.

## Task-focused refinement · 2026-09-07

- Analyzed the requested espresso reference: cloned vincanger/webmcp-espresso-store to /tmp/webmcp-espresso-store, read its tool/compatibility/comparison flows, retrieved the YouTube transcript and inspected the 16:10–17:30 demonstration clip. Findings in docs/demo-refinement.md.
- Added an original fictional coffee setup example and reusable registry Comparison: evidence highlighting, responsive mobile cards, shared manual/simulated/native actions, conditional cart tools, compatible filter, manual correction and human review. No payment or real order is made.
- Native Chrome 152 test executes comparison, selection, conditional filter and review tools; manual removal updates the same total. Clearing the cart unregisters conditional tools. Existing explorer, declarative form and route-unmount checks also pass.
- TypeScript/ESLint, 36 tests, registry/site production build, and fresh Vite/Next.js registry installs/builds pass (including Comparison). Automated axe WCAG A/AA checks of the new example pass in light and dark themes after transitions settle. Mobile 390 px has no page overflow; Escape dismisses the review dialog.
- Remotion 4.0.521 reverified as latest. Film uses the actual Comparison component, same product data and original SVG illustrations across a continuous task; inspected six previews and loaded updated composition in Studio.
- Grok Eve through ai.fabrials.com receives /ˈfæbriəlz/ for Fabrials, replacing the earlier split respelling. This is an adopted FAB-ree-uhlz reading, not a claim of one canonical literary pronunciation. Generated character alignment contains the requested IPA. Captions use returned alignment and fail generation on text mismatch. Perceptual listening remains unavailable in this agent environment.
- Published commit 10b7fd4 via Coolify dibgwffvpm9vz17gihs1fem8 (finished). Final film: 65.685333 s, 6,668,247 bytes, 1080p H.264 / stereo AAC. Final audio uses the same checked mix (-18.24 LUFS, -3.88 dBTP).
- Public v=4 media responds 206 to Range, bytes 0-1023/6668247, Content-Length 1024. Chrome decodes audio unmuted and seeks to 55.5 s successfully. Public task UI passes light/dark axe checks, mobile layout and keyboard review. Native coffee/explorer/declarative/navigation checks and fresh public registry installs/builds pass on the deployed release.
- All public film assets plus six narration clips, six alignment files and the original score were PUT/HEAD verified under apps/videos/fabrials-ui/v3/ in house S3.

## Motion refinement · 2026-09-07

- Cursor paths now decelerate onto actual controls and hold through each click. Click feedback is a single frame-driven pulse.
- The selected machine travels from its product image into the cart; the cart row enters with a damped spring, and accessory color/total changes ease together. Empty selection shows a dash and an inactive selection prompt instead of €0 and a review action.
- Reviewed an animated 10.5-second selection clip and sequential frames across the product transfer. TypeScript/ESLint, 38 tests, production registry/site build and diff checks pass.
- Final Remotion film: 65.685333 seconds, 1920×1080 H.264, 48 kHz AAC, 5,295,871 bytes. Existing Grok narration and music retained. Assets and audio/alignment sources PUT/HEAD verified in apps/videos/fabrials-ui/v4/. Player revision v=5.
- Published commit 14d362a through Coolify lqjfzmwgirxsmleliwrok9jp (finished). Public v=5 Range response: 206, bytes 0-1023/5295871, Content-Length 1024. Chrome plays unmuted with decoded audio and no media error; seeking to 55.5 seconds succeeds. All 20 published registry items match the built local registry.

## Component catalog and examples · 2026-09-07

- Added /components as the actual destination of desktop/mobile Components navigation: 20 searchable entries, category sections, descriptions, result count and empty/reset state. Inspired by the shadcn component index, while preserving Fabrials typography and tokens.
- Expanded documentation layout to 1600 px, added breadcrumbs and desktop section navigation, and replaced the conspicuous sidebar scrollbar with a thin theme-aware track.
- Comparison documentation now previews a controlled plan comparison with optional evidence highlighting. Added minimal usage and composition guidance. The complete shopping flow is linked under Examples, alongside project exploration, reservations and an MCP workspace, with a gallery and component cross-links.
- Fixed mobile Comparison spacing when no visual is supplied and made MDX code blocks keyboard-scrollable.
- TypeScript/ESLint, 38 tests, production site/registry build, and fresh Vite/Next.js registry installation/builds pass. Visual and axe WCAG A/AA checks pass at 1440 and 390 px in light/dark for /components, /docs/comparison and /examples, without horizontal page overflow. Repeated theme QA in an extension-free browser after detecting Dark Reader in the daily profile.
- Browser interaction checks pass: filtered search, empty/reset, component navigation, highlight/reset, source tab, and the linked shopping recommendation. No page errors in these flows.
- Published b8b4a71 through Coolify svbty9b0i7y6cow8qyo3htzo (finished). The same responsive/light/dark accessibility and interaction suite passes on https://ui.fabrials.com. Fresh Vite and Next.js consumers install and build from the public registry successfully.

## Live narrated landing demo and per-visitor MCP · 2026-09-07

- Landing CoffeeDemo now has Automatic and Manual modes. Automatic uses the film's timing/captions and real controlled comparison/cart state, with play/pause, seek, restart, mute, optional action following and inline human-review preview. Controls remain accessible while following the page. Taking over stops the audio and preserves the current selection; returning to Automatic resets the tour.
- Added a temporary remote MCP connection to the visitor's actual browser state. Separate random owner/client capabilities stay in memory, fixed allowlisted coffee tools, 30-minute lifetime, idle expiry, bounded queue/session count, origin checks, small bodies and explicit no-replay timeout behavior. The deployment uses one Node process; multi-replica hosting requires a shared transient broker. Unmount/disconnect revokes the session. Native WebMCP remains available.
- Original MP4, poster, transcript, voices and music preserved. Only the new demo-audio.m4a object was PUT/HEAD verified in house S3. 1,568,073 bytes; 65.685333 s. AAC stream hashes match the original MP4 exactly (31731fb8f2723987adff476e89d828e3b56306241e780160f03fde8434e15002), with no recoding. Render workflow now extracts this soundtrack too.
- TypeScript/ESLint, 44 tests, production registry/site build and native Chrome coffee/explorer/declarative/navigation tests pass. Official SDK current and legacy clients pass bridge protocol tests; isolation, revocation, idle expiry, at-most-once delivery and timeout handling are covered.
- Real Chrome test: decoded unmuted audio; pause; forward/backward seeking; cart/filter/review timing; detached audio stops on manual handoff. External current MCP client discovers five tools, reads the actual cart, compares/selects Atelier, adds a filter, sees a manual removal and opens human review. Disconnect invalidates the token (401).
- Visual and axe WCAG A/AA checks pass for Automatic/Manual at 1440/390 px in light/dark in an isolated Chrome context without Dark Reader. No page overflow. Forced audio failure still allows manual handoff. Public guide: /docs/interactive-demo.
- Published e87f108 via Coolify ehxtthgznk2pi58vrvctnxso (finished). Production Chrome passes the complete audio/seek/manual-handoff and external MCP mutation/review/revocation flow. Both modes pass public light/dark desktop/mobile axe checks and the forced-media-failure fallback. Original MP4 remains 5,295,871 bytes; soundtrack is 1,568,073 bytes; both public endpoints return valid 206 byte ranges. All 20 public registry entries match the local build.

## Automatic tour, full-width pages and Fumadocs · 2026-09-07

- Replaced the landing mode selector with one narrated automatic tour: six seekable chapters, playback controls, subtitles and a responsive comparison/selection stage. Removed the landing video player; original film and soundtrack assets remain available unchanged.
- Added travel shortlisting, support resolution with human confirmation and workspace onboarding to the four existing examples. Their native WebMCP tools share the same state as the human controls.
- Home and examples use the available page width. Documentation and the component catalog now use Fumadocs 16.15.8 with full-width pages, sidebar, heading navigation, search, mobile navigation and persistent theme.
- TypeScript/ESLint, all 47 tests, production site/registry build and fresh Vite/Next.js registry installs/builds pass. Native Chrome 152 checks cover the existing examples and all three new workflows, including tool cleanup on navigation.
- Browser checks pass for narration playback, pause, seeking and chapter reset. Home, component catalog, component docs, installation guide and examples pass axe WCAG A/AA in light/dark at 1440/390 px with no horizontal page overflow. Fumadocs search/navigation, mobile sidebar, empty search, Escape and theme persistence pass. Inspected full-width desktop and compact mobile layouts.
- Published 1c43ebf through Coolify aqbruq5jysmjboeiruybsrkc (finished). The complete responsive/light/dark accessibility suite, tour playback/seek/chapters, Fumadocs mobile navigation/search/theme checks and native WebMCP workflows pass on https://ui.fabrials.com. Fresh Vite and Next.js consumers install/build from the public registry successfully. Guide-body search finds the deployed MDX content. Preserved film and audio return 206 ranges with unchanged sizes (5,295,871 and 1,568,073 bytes).

## Interactive playground and floating tour activity · 2026-09-07

- Renamed Examples to /playground across navigation, docs, catalog and generated llms.txt. /examples permanently redirects and preserves query/hash navigation. Seven scenarios now use a compact desktop selector and a mobile select; only the current scenario mounts, and switching/reset releases its previous tools and state.
- Six browser scenarios expose the registry ArgumentsForm and ExecutionLog in a local tool runner. Editable inputs execute the same handlers as native WebMCP and update the actual interface; conditional tools follow live state. The seventh scenario retains the real remote MCP dashboard. Each sandbox can be reset.
- Removed the landing chapter rail and replaced the selection sidebar with a floating, collapsible MCP activity card. It illustrates tool names, arguments, results, previous actions and a human correction, synchronized to the existing narration and seek position. It explicitly identifies illustrated calls; the playground performs actual local calls.
- TypeScript/ESLint, 49 tests, production site/registry build and fresh Vite/Next.js registry installs/builds pass. Native Chrome 152 verifies coffee, travel, support, workspace and explorer tools plus declarative form and route cleanup.
- Browser interaction checks pass: old-route/hash redirect, scenario switching and Back, mobile selector, editable tool inputs, live shortlist/cart updates, human confirmation/correction, conditional tools and reset. Tour audio/seek/backwards reset and collapse pass. All seven scenarios and landing pass axe WCAG A/AA at 1440/390 px in light/dark without horizontal overflow. Desktop/mobile visuals reviewed in isolated daily Chrome; removed obsolete mobile CSS that hid the new panel icons.
- Published 914684f through Coolify scrw0cmrailaielgio7spo7r (finished). Production passes the full playground/tour browser suite, all seven scenario light/dark desktop/mobile axe checks, native WebMCP workflows and fresh public registry installs/builds in Vite and Next.js. Real MCP dashboard connects and resets back to disconnected. No browser runtime errors. /examples returns 308 with query preserved; browser hash navigation and generated public guide point to /playground. Inspected the published panel at the filter cue.

## Landing typing, soundtrack ending and review card · 2026-09-07

- The request types from the tour clock over 5.2 seconds, preserving layout and supporting pause, backwards seek and restart. Screen readers receive the complete sentence; reduced-motion mode displays it immediately.
- Landing now uses its own 52.466667-second AAC asset with a 550 ms fade after the final-decision sentence. The promotional outro starts at 52.966667 s and is excluded from the actual landing media file. Original social film and full soundtrack remain unchanged. New cut PUT/HEAD verified at apps/videos/fabrials-ui/landing-v1/landing-audio.m4a, 1,279,641 bytes. Added reproducible preparation command and integrated it into video rendering.
- Tool cards lead with readable actions/results and expandable technical details. Review presents Studio Dual, price and removed optional filter; the empty JSON object is replaced with an explanation of the current-selection input.
- TypeScript/ESLint, 52 tests, production site/registry build and fresh Vite/Next.js registry installs/builds pass. Chrome verifies progressive typing, pause/seek/restart, reduced motion, review details, actual 52.466667 s media duration, automatic ending and replay. Landing passes desktop/mobile light/dark axe WCAG A/AA with no overflow.
- Published dcbd08f via Coolify wxyamclzglrndwmqo4vpmzo2 (finished). Production Chrome passes typing, pause/rewind, reduced motion, review details, actual 52.466667-second ending/replay and desktop/mobile light/dark accessibility checks. New landing media serves valid 206 byte ranges. Original full soundtrack and current v=5 social film retain their sizes and 206 behavior. All 20 public registry items match the locally smoke-tested build.

## Request typing aligned to narration · 2026-09-07

- Request typing and its caret now begin at the caption-aligned “Two flat whites.” cue (10.02 s), keeping the existing 5.2-second typing duration. The cue is read from narration captions. Updated timeline test confirms no text at 10 s, progressive text at 12.5 s, completion at 15.3 s and reset.
- TypeScript/ESLint, 52 tests and production site/registry build pass. All 20 published registry items match the unchanged local registry.
- Typing cue d478bf6 published via Coolify 9f3qxdhyogfiblhptdubdbva (finished). Production Chrome verifies no early typing, progression after the narration cue, pause/seek/replay, audio ending and responsive/reduced-motion behavior.

## Shared header and browser setup documentation · 2026-09-07

- SiteHeader now stays mounted in the root frame for landing, docs and components. Fumadocs retains its sidebar/search/TOC with an offset below the shared header and a mobile-only docs toolbar; duplicate brand, global links and theme controls are removed from its shell.
- Reviewed WebMCP and installation guides. Both show the experimental status, copyable chrome://flags/#enable-webmcp-testing address, Enabled/relaunch steps and the official Chrome reference. Clarified native browser activation versus local simulation and remote MCP. Installation separates browser integration from the remote dashboard; WebMCP includes its install command and troubleshooting.
- MDX code blocks now use the existing copyable CodeBlock UI. TypeScript/ESLint, 52 tests and production site/registry build pass. Browser tests verify the same header DOM node and window sentinel across landing/docs/guide/catalog/home navigation, clipboard contents, mobile sidebar/search and zero runtime errors. Both guides, Comparison and catalog pass full-body light/dark axe at 1440/390 px without overflow. All 20 published registry items match the unchanged local build.
- Published ea4c6b7 through Coolify muikmuevcblqumjmdlbsfyef (finished). The full shared-header browser suite passes on https://ui.fabrials.com: persistent header/window across client navigation, guide and flag copying, mobile sidebar/search and full-body light/dark desktop/mobile accessibility on both guides, Comparison and catalog. No browser runtime errors.
