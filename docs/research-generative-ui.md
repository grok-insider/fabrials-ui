# Generative UI in chat: what exists in November 2026, and what it means for a design system

Research report for the owner of Fabrials UI · 2026-11-10. Every claim comes from a source I read this session; dates are the source's own unless stated.

## 1. Summary

- Three levels recur: **static** (tool call, fixed view), **declarative** (the model composes a tree from a catalog the host owns), **open-ended** (the model writes HTML/CSS/JS that runs in a sandbox).
- The frame is OpenUI's, not mine: *The State of Generative UI in 2026* (2026-06-10) names these three and adds an independent axis for transport (AG-UI into your app, MCP Apps into someone else's host).
- OpenAI's **Intelligent UI** is officially "a library of native, streamable components, along with a compiler". Third-party reverse engineering says the model writes a JS-bearing markup language that the server compiles and a sandboxed worker applies to native components: declarative-with-code, plus an iframe escape hatch.
- None of it is offered to developers — no spec, no components, no API. The API changelog for launch day only updated the `chat-latest` snapshot.
- What developers have today: ChatKit widgets (server-authored JSON), MCP Apps (a predeclared HTML app in a sandboxed iframe), A2UI 1.0 (JSON over a flat component tree), json-render (JSON Patch over a flat element tree), OpenUI Lang (a line-oriented DSL), AI SDK tool parts (part → component).
- At the declarative level **the catalog is the design system**: it is read by a compiler as a schema and by a model as a prompt. A2UI 1.0 deleted theme properties for this reason; json-render generates its prompt from Zod.
- Fabrials covers most of what these catalogs define and is richer in places (answer choices with feedback, steps, countdown, marked text, recorder, spreadsheet, an accessible chart). It is missing the boring half: `Text`, `Heading`, and layout primitives.
- **Finding, with reasons:** for a system whose value is tokens, RTL, forced colors, keyboard behaviour and hydration-exact rendering, the declarative level is the only one where the house rules can be *enforced* rather than hoped for. Static already exists in Radiant; open-ended puts an unthemed, unlabelled iframe in an accessible page.
- Declarative is also where the engineering is most credible (A2UI's validation and accessibility defaults, json-render's expressions and repair, OpenUI's wire economy).
- The cost is unmeasured: no source publishes validity rates for these formats across models. What exists is vendors measuring token counts or their own model, and reverse-engineering counts.

## 2. What OpenAI ships (Intelligent UI)

**Official** (*GPT‑6 and Intelligent UI for everyone*, 2026-10-07):

- It is trained behaviour: "We've trained GPT‑6 to compose responses using text, visuals and interactive elements".
- Mechanism: "We built a library of native, streamable components, along with a compiler that processes the interface as the model generates it"; the compiler makes it appear progressively "without waiting for the entire response to be complete".
- Training evaluated generated interfaces "for clarity, usefulness, and completeness", and the post concedes "there's still work ahead to improve the model's design judgment".
- Scope: ChatGPT's Chat tab, web and mobile; Plus/Pro/Business/Enterprise first, Free/Go the next day; GPT‑6 Sol or Luna. Work and Codex unchanged.
- It names outcomes (buttons, forms, charts, calculators, a game), never a syntax, schema, JavaScript, iframe or developer surface.

**Inferred, and unverified.** The deep write-up is *How ChatGPT Intelligent UI works* (Thesys/OpenUI, 2026-10-08); the teapawt article of the same day is a shorter version that points to it as the fuller one, so there is one investigation, not two.

- The model writes **DIL**: Markdown, JSX-like tags, `{@body …}` statements, `{expression}`, `{#if}`/`{#each}`, handlers, `GenUI` actions.
- The server **compiles** each partial response into a JS program plus a constants/data document (`model_dil_v2`): it repairs half-written output, closes open tags, moves text into a constants table, keys each `useState`, and drops properties that fail the catalog schema (`unknown_prop`, `invalid_literal`).
- The client runs the program in a hidden iframe (`allow-scripts`, CSP `default-src 'none'`) that starts a **Web Worker**; the worker strips network, timers, messaging and dynamic eval, freezes globals, evaluates with `new Function`, and quarantines a hang. A React-style reconciler emits `CREATE`/`SET`/`PLACE` operations applied to native components; handlers cross as `fn#1`.
- **Streaming** is JSON-patch SSE; the server recompiles everything every few hundred ms rather than incrementally.
- Catalog: ~70 components in the client registry (39 seen in captures), design tokens, and composite components written in DIL and shipped prebuilt. Local interaction runs in the worker with no model call; actions leave through `GenUI` (`issueNewTurn`, `copy`, `openUrl`). `AppBlock` is HTML/CSS/JS in a visible iframe on `*.web-sandbox.oaiusercontent.com` ("Skybridge") with theme variables injected.

Their measurements of the seams matter more than the architecture: state resets on reload; **the model never sees interface state** (only the text sent by `issueNewTurn`); follow-ups regenerate rather than edit; in one 6,341-character response the resent programs were **83% of ~275 KB of patches**; one click produced **158 operations, 4 effective**; a logic error silently turned $6,930 into $256,410; layouts used fixed columns and no breakpoints; compiler diagnostics did not stop the model repeating a bad prop. Median update 230 ms, full recompile ~290 ms.

**Third parties get nothing of this.** I found no OpenAI developer documentation, changelog entry, schema or component library for Intelligent UI. The adjacent developer surfaces are ChatKit widgets and plugins (MCP Apps plus `window.openai`). CopilotKit's launch post says it plainly ("There is no API to bring it into your own product", 2026-10-09); the primary evidence is the changelog.

## 3. The formats, side by side

| | Who writes the UI | What crosses the wire | Who draws it | Streaming granularity | Local interactivity, no model call | Actions back to the agent | Styling owner | Executes model / third-party code? | Steward, licence | Maturity (2026-11-10) | React renderer, dependencies |
|---|---|---|---|---|---|---|---|---|---|---|---|
| **Intelligent UI** | Model (DIL) | Raw DIL, compiled JS, constants, `appData`, Markdown fallback | ChatGPT's components via worker operations | Per chunk, ~230 ms; whole program resent | Yes: keyed hook state in a worker | `GenUI.issueNewTurn` (+copy/openUrl) | OpenAI's catalog and tokens; some raw CSS | Yes: model JS in a locked worker; `AppBlock` iframe | OpenAI, proprietary, undocumented | In ChatGPT; no developer surface | None published |
| **ChatKit widgets** | Your server (or Agent Builder) | JSON `WidgetRoot` + `WidgetNode` with `ActionConfig` | ChatKit's renderer | Widget held server-side; `Text`/`Markdown` can stream | Form state only | `onAction` payload or form submit | ChatKit theme + per-node colours/radius | No | OpenAI, proprietary SDK | GA; Agent Builder backend shuts down 2026-11-30 | n/a |
| **A2UI 1.0** | Model, compiled from a catalog | JSON envelopes: `createSurface`, `updateComponents`, `updateDataModel`, `deleteSurface`, function RPC | Your renderer, native widgets | Per message; placeholders for missing children | Yes: two-way binding into a data model | `action` with resolved context; `callAgentFunction` | Yours; v1.0 removed theme props | No (function allowlists) | `a2ui-project`, Apache-2.0 | v1.0 current (updated 2026-06-08) | `@a2ui/react` 0.15.0, 5 deps; catalog components are custom elements from `@a2ui/web_core` |
| **json-render** | Model, Zod catalog | JSONL of RFC 6902 patches on `{root, elements}` | Your registry | Line by line | Yes: `$state`, `$bindState`, `$cond`, `$template`, `$computed`, `watch` | Named actions with params and optional `confirm` | Yours | No | Vercel Labs, Apache-2.0 | 0.22.0 (~2026-11-04), 36 shadcn components | `@json-render/react`; `zod` is the only core dep; 20+ renderers |
| **OpenUI Lang** | Model writes `id = Component(args)` | Line-oriented DSL program | Your components via `<Renderer/>` | Statement by statement; forward refs render skeletons | Yes: `$variables`, a library of `@functions`, `@Set` | `@ToAssistant` builds a message | Yours | No | Thesys, MIT | Open standard + hosted Gateway | `<Renderer/>` (React, Vue, Svelte, RN, email) |
| **MCP Apps** | Usually the server author, ahead of time | `ui://` resource (`text/html;profile=mcp-app`) + CSP/permissions | The host, sandboxed iframe | App-defined (receives streamed tool input) | Yes, in the app's own JS | `tools/call`, `ui/message`, `ui/update-model-context` | App CSS, nudged by host CSS variables | Third-party (not model) code, cross-origin sandbox | MCP project, open | Stable 2026-01-26; Claude, ChatGPT, VS Code, M365 Copilot, Goose… | `@mcp-ui/client` or App Bridge from `@modelcontextprotocol/ext-apps` |
| **AI SDK tool parts** | You | Tool parts (`tool-${name}`) with three states | Your component per part | Per part state change | Whatever your component does | The tool call | Yours | No | Vercel, Apache-2.0 | Stable; RSC path experimental | `ai` + `@ai-sdk/react`, no UI dep |
| **Adaptive Cards** | Server (originally a bot) | Card JSON, schema v1.6 | Native renderers per platform | Not designed for streaming | `Action.ToggleVisibility`; inputs submit values | `Submit`, `Execute` (v1.4), `OpenUrl` | Host config + card styles | No | Microsoft, MIT source (EULA for binaries) | v1.6; Carousel JS-only; RTL/Table from v1.5 | `adaptivecards` (JS); community RN/Vue |

## 4. Each in a few paragraphs

**Intelligent UI.** Good at looking native (every node is ChatGPT's own component), at progressive appearance that survives half-written output, at local interaction, and at server-side validation with repair. Bad at being inspectable or portable, and at the measured costs above. As a reference it argues for "catalog + compiler + sandbox", not "let the model write code": almost all of its structure could come from a declarative format, and the code is what forces the worker, the watchdog and the 83%-resent payload.

**ChatKit widgets** (developers.openai.com/api/docs/guides/chatkit-widgets). One `WidgetRoot` (`Card`, `ListView`) over `WidgetNode`s — `Box`, `Row`, `Col`, `Text`, `Title`, `Caption`, `Markdown`, `Badge`, `Image`, `Icon`, `Button`, `Select`, `DatePicker`, `Form`, `Divider`, `Spacer`, `Transition` — with `ActionConfig` surfacing as an `onAction` payload, and `confirm`/`cancel` on a card. Good at bounded, safe, backend-driven cards with no model involvement. Bad at everything generative: the model does not compose, so a new shape is a new template, and the layout vocabulary (CSS-like boxes with per-node colours) is the opposite of a token system. Agent Builder, its hosted backend, shuts down 2026-11-30; OpenAI now points to the custom-server integration.

**A2UI 1.0** (a2ui.org/specification/v1.0-a2ui/). Four structural messages in a six-key envelope; a **flat adjacency list** (`id`, `component`, `child`/`children`); separate data messages by JSON Pointer; `Dynamic*` props accepting a literal, `{"@path": …}` or `{"@call": …}`; two-way binding; `catalogId` per surface; `sendDataModel`. Its best ideas are dull and useful: a catalog is a JSON Schema the compiler validates; **every component carries `label`, `description`, `live`, `hidden`**, with a catalog-agnostic accessibility section; media URLs are scheme-allowlisted in the renderer; `openUrl` needs a gesture plus `noopener,noreferrer`; the `regex` function is a documented subset with ReDoS guards. Bad at ceremony (envelope, surface, catalog, data model, compiler before anything appears) and at shipping in step with itself: the site says **v1.0 current**, while `@a2ui/react` 0.15.0's README still recommends **v0.9** and defaults to v0.8. That gap is the most important adoption fact today.

**json-render** (json-render.dev/docs). Zod catalog → prompt and runtime validation; model emits flat `{root, elements}` as JSONL patches, so a partial spec already renders; expressions (`$state`, `$bindState`, `$item`, `$cond`, `$template`, `$computed`), visibility, repeats, watchers, actions with `confirm`, and real repair (`validateSpec`, `autoFixSpec` separating lossy from lossless). Largest renderer matrix, plus an inline mode that splits text from patches inside an AI SDK stream. Bad at restraint: 25+ packages, per-node key repetition (2.1× OpenUI's tokens in OpenUI's benchmark), 0.x with `experimental_` APIs already in core, and 36 shadcn components a house system would replace wholesale.

**OpenUI Lang** (openui.com/docs/openui-lang). Every statement is `id = Component(args)`; components are Zod schemas; the prompt is generated from the library; forward references let skeletons appear for ids not yet streamed; state lives in `$variables` and is computed by registered `@functions`. Good at token economy and streaming shape, and at being notation rather than a serialized AST. Bad at being a new language, and at reliability by construction: the vendor's answer to invalid output is a hosted Gateway that "corrects invalid OpenUI Lang while it streams".

**MCP Apps** (modelcontextprotocol.io/docs/extensions/apps; SEP-1865, stable 2026-01-26). The only format designed for *someone else's host*: a tool declares `_meta.ui.resourceUri`, the host fetches a `ui://` HTML resource, renders it in an iframe on a **different origin** through a sandbox proxy, with CSP built from declared domains (restrictive defaults, `default-src 'none'`), optional camera/mic/geolocation/clipboard permissions, and inline/fullscreen/pip display modes. The bridge is JSON-RPC over `postMessage`, reusing `tools/call`; `visibility: ["model","app"]` separates tools the model may call from app-only tools. Good at portability across Claude, ChatGPT, VS Code, Copilot and others, with an auditable security story. Bad at styling, accessibility (nothing guarantees the app's markup), and generativity: resources are predeclared, so the model chooses *when*, not *what*.

**AI SDK tool components.** The static level done properly: typed `tool-${name}` parts with `input-available`/`output-available`/`output-error` mapped by a `switch`. Good at types, zero new concepts, any model. Bad at open layouts: each new answer shape is a new component. RSC (`streamUI`) exists, but its overview calls it "currently experimental" and points to a migration guide.

**Adaptive Cards.** The precedent: `TextBlock`, `FactSet`, `ColumnSet`, `Container`, `Input.*`, `Action.Submit/OpenUrl/ShowCard/Execute`, `ToggleVisibility` (v1.2), RTL and `Table` (v1.5), `Carousel` (v1.6, JS only) across JS, .NET, iOS, Android, UWP/WPF and community RN/Vue. Good at proving a declarative card schema can outlive many renderers. Bad at anything generative: styling is host config plus a few card styles, input is submit-shaped, and the feature matrix shows the cost of many renderers (RTL and `Table` are parse-only on .NET).

**Anthropic (Claude).** What is official is a document, not a format. An artifact is "anything Claude makes for you that you'd put in front of someone" — a design, deck, document, dashboard or small interactive tool — made when the content is "significant and self-contained, typically over 15 lines" and likely to be edited or reused, opening beside the conversation (support.claude.com/en/articles/17153992; pre-2026-09-16 artifacts are "legacy" and cannot be created). Named kinds are templates: Docs, Slides and Design on all plans (Enterprise defaults on 2026-10-15), Dashboards (beta, paid), Motion (beta, Team/Enterprise), and a Design-systems template capturing colours, fonts and components (support.claude.com/en/articles/16994751). Claude Code states the medium plainly: an artifact "is a single HTML page, so anything you can express in HTML, CSS, and inline JavaScript is in scope", with no backend and no multiple routes, published to a private URL that updates in place with version history (code.claude.com/docs/en/artifacts). "Imagine with Claude" was a five-day research preview for Max subscribers: "Claude generates software on the fly. No functionality is predetermined; no code is prewritten" (anthropic.com/news/claude-sonnet-4-5, 2025-09-29). MCP Apps support in Claude is asserted by MCP's host list, not by Anthropic. **Not official:** the inline visualisations of 2026-03-12 (charts, diagrams, timelines, quizzes, in-line rather than in a side panel, temporary, on every plan) — I found no Anthropic post for them, so they are reported only as three outlets describe them (source 35).

**AG-UI.** An open, event-based protocol for the agent↔user layer, beside MCP (agent↔tools) and A2A (agent↔agent): it standardises streaming chat, multimodality, shared state with event-sourced deltas, thinking steps, frontend tool calls, interrupts for human approval, sub-agents and steering, over SSE, WebSocket or webhook (docs.ag-ui.com/introduction). It carries *events*, not a description of an interface — which is why A2UI's spec names it "the standard transport binding" and rides its messages over it, and why AG-UI's own feature list separates "generative UI, static" from "generative UI, declarative" and links A2UI and MCP Apps as supported specs. Its relevance to a design system is plumbing: it would change how a turn reaches the client, not how the client draws it.

## 5. What is measured about models emitting these formats

Every number here comes from an interested party, and none is a validity rate for a declarative format across models.

**Google Research, open-ended HTML** (arxiv.org/abs/2604.09577). The system emits "a single fully-generated web page" from Gemini 3 Pro with tools, instructions and post-processors — open-ended generation, not a catalog — and its preference claims hold "when ignoring generation speed". **Elo 1736.2** is the score from human preference comparisons across UI modalities on the LMArena prompt set, beaten only by human-expert sites; **82.8%** is how often the generated interface was preferred over the next-best baseline, Markdown UI, side-by-side on that set, with **90.5%** on a second set of information-seeking prompts; "at least comparable [to human experts] in 50% of cases" is the authors' own summary. **Output errors 0% / 29% / 60%** are the paper's per-backbone-model error column (Gemini 3, 2.5 Pro, 2.5 Flash: 0%; Gemini 2.0 Flash: 29%; 2.0 Flash-Lite: 60%) — the closest thing here to a validity measurement, though it measures a whole page, not a constrained tree. Google built the system.

**OpenUI's token benchmark** (openui.com/docs/openui-lang/benchmarks). Seven scenarios, from a simple table to an e-commerce page, generated by GPT-5.2 at temperature 0 and counted with tiktoken's `gpt-5` encoder: OpenUI Lang 4,800 tokens in total, YAML 9,122, Thesys C1 JSON 9,948, Vercel json-render 10,180 — "up to 67.1% fewer" than json-render, 52.8% fewer in total. Two caveats the page itself supports: the four formats are serialisations of the *same* model output, not four independent generations, so it measures syntax overhead rather than how well a model emits each; and the "2–3× faster" figure is arithmetic at 60 tokens/second, not a measurement. The vendor measures its own format, and one baseline is its own previous format.

**Intelligent UI**'s only field numbers are reverse-engineered, not published: 83% of a response's patches were resent compiled code, 158 operations for one click, 230 ms median updates (section 2).

**A2UI and json-render publish no rates.** A2UI specifies a "prompt-generate-validate loop" with a standard validation-error format and requires validators to resolve child references; json-render ships `validateSpec` (dangling children, malformed `visible`, repeat scope) and `autoFixSpec` with lossy/lossless classification, and its experimental composition API concedes that completion "does not guarantee that the model selected the right content". Repair machinery and honesty, not evidence.

**Not measured anywhere I looked:** the validity or repair rate of A2UI, json-render or OpenUI Lang across different models, by anyone other than the party selling the format.

## 6. What a design system contributes

At the declarative level the catalog **is** the design system: the one place that records which components exist, with which props, drawn how — read by a compiler as a schema and by a model as a prompt. A host that owns the catalog owns the look; a host that does not is rendering someone else's system inside its own page.

| Primitive these catalogs define | Fabrials component | Note |
|---|---|---|
| Text (body) | *(none)* — body type is the `.fui-*` text styles | **Gap** |
| Heading / Title | `PageHeader`, `SectionHeader` (`headingLevel`) | **Gap**: no bare `Heading` with a level |
| Card | `Card` + Header/Title/Description/Action/Content/Footer/Caption | Matches; one plate per thing is a rule |
| Row / Column / Box / Stack / Grid | *(none)* — layout is product CSS | **Gap**: A2UI and ChatKit both require these |
| List / ListView | `ItemGroup` + `Item` (`ItemLink`, `ItemMedia`, `ItemActions`), `ListBox`, `VirtualList` | Richer |
| Table | `Table` (+ `Spreadsheet`, `readSpreadsheet`) | `Table` needs an `aria-label` on its scroll region |
| Image | `Image`, `AspectRatio`, `MediaGrid`, `ImageViewer`, `ZoomableImage` | Much richer |
| Icon | *(none by name)* — `lucide-react` components, `aria-hidden` beside text | **Gap**: no name→icon registry |
| Button | `Button` (7 variants, 8 sizes, `loading`), `IconButton`, `ToolbarButton` | `variant="accent"` is one per view |
| Text field | `Input`, `Textarea` (`autoResize`, `count`), `Field`, `FieldSet`, `NumberField`, `SearchInput`, `PasswordInput`, `InputOTP` | Validation stays in the host |
| Select / ChoiceSet | `Select`, `NativeSelect`, `Combobox`, `MultiSelect`, `RadioGroup`, `NativeRadioGroup` | |
| Checkbox / toggle | `Checkbox`, `Switch`, `Toggle`, `ToggleGroup` | A setting that applies now is a `Switch` |
| Slider | `Slider`, `SliderGroup` | `marks`, `showValue`, `unit`, `onValueCommitted` |
| Date picker | `Calendar`, `DatePicker`, `DateRangePicker` | Locale from `useLocale()` for hydration |
| Tabs | `Tabs`, `NavTabs` | |
| Chart | `SeriesChart` (+`ChartLegend`, `Sparkline`, `Meter`, `Stat`) | `caption` required, plot named |
| Progress | `Progress` (`steps`, `segments`, `marks`, `ring`), `Meter` (`ruler`), `Stat meter` | |
| Badge / status | `Badge` (tones, `dot`, `pulse`), `StatusDot`, `Readout` | Colour travels with a word |
| Alert | `Alert` (tones, `layout="inline"`, `onRetry`), `MarkdownCallout` (ai-ui) | |
| Divider | `Separator` | |
| Form | `FieldSet` + `FieldGroup` + `Field` + `Button`; `ActionBar` | No `Form` with submit semantics |
| Modal | `Dialog`, `AlertDialog`, `Sheet`, `InlineConfirm` | A question inside a flow is `InlineConfirm` |
| Markdown | `.fui-markdown`, `CodeBlock` (ai-ui) | Not in `@fabrials/ui` |
| *Surplus* answer choices, results | `ChoiceGroup` + `ChoiceFeedback`, `RevealCard` + `RatingBar` | No catalog above has it |
| *Surplus* steps and deadlines | `StepControls`, `Countdown`, `ActionBar`, `Timeline` | |
| *Surplus* marked text | `MarkedText`, `TextDiff`, `AnnotationList` | |
| *Surplus* voice | `RecorderPanel`, `ClipButton`, `SpeedToggle`, `useSpeech` | |
| *Surplus* agent at work | `WorkingLight`, `AgentThinking`, `AgentMark`, `TaskList`, `GenerationFrame` | |
| *Surplus* loading | `Loading` + `placeholderText`/`placeholderList` | A skeleton that is the component it replaces |

Two gaps are structural. **Layout**: every declarative format assumes containers (`Row`, `Column`, `Box`, `Stack`, `Grid`, `Spacer`), because arrangement is what the model decides — and Fabrials ships none. **Text and Heading**: a catalog must say "body text" and "level-2 heading" without a page pattern.

| House rule | Declarative (A2UI / json-render / OpenUI) | Declarative-with-code (Intelligent UI) | Iframe (MCP Apps / AppBlock) |
|---|---|---|---|
| Every word is a prop, locale via `LabelsProvider` | **Breaks by construction**: the model writes the words; only chrome can be localized by the renderer | Same, and the model may write labels in any language | The app author supplies words; host passes `locale` |
| RTL, logical properties | Achievable: the wire carries structure only | Achievable but not guaranteed (fixed columns, pixel widths measured) | Depends on the third-party app |
| Forced colors | Achievable: components are the host's | Achievable for native nodes; lost in `AppBlock` | Not reachable |
| Keyboard and focus return | Achievable if entries map to real controls | Achievable for native nodes | Not guaranteed |
| Hydration-exact SSR | Achievable: same tree both sides | n/a (client worker) | n/a (iframe) |
| Continuous motion only while working | Host decides; formats carry no motion | **Conflicts**: text 0.7 s, rows 0.42 s, charts 1.8 s on every update | A foreign motion vocabulary enters the page |
| Tokens only | Yes: props are the tokens | Partly: tokens preferred, raw CSS accepted | No |

## 7. Where Radiant is today

Radiant's chat is two levels at once, which is why `ArtifactFrame` existed.

- **37 feature manifests** (21 `display: "inline"`, 2 `"trace"`, 1 `"hidden"`). `CLIENT_FEATURES` registers the same 37: 11 hand-listed plus 26 fence features in `index.fences.ts`. The copy I read has **31 files named `view.tsx`** under `src/features`; the brief's 32 is one more than I find there (`app/api/lang/*/view.ts` are response builders, not chat views). `registry.test.ts` holds manifests, client registry and server registry together.
- **Two ways in.** About ten tool groups with typed arguments and a hand-written view (`quiz`, `flashcards`, `ask_learner`, `lesson-steps`, `lang`, `web_search`/`x_search`, `image_search`, `show_visual`, `image_generation`/`generate_video`, `code_execution`). And **26 fenced language groups** the model writes directly — `mermaid`, `vega-lite`/`chart`, `plot`, `dot`, `tikz`, `plantuml`, `d2`, `svg`, `smiles`, `punnett`, `geometry`, `number-line`, `timeline`, `periodic-table`, `algorithm`, `phet`, `simulation`, `free-body`, `mindmap`, `python-run`, `molecule3d`, `map`/`geomap`, `pronounce`, `hanzi`, `abc` — where the view is a renderer for a notation that already existed.
- That second path is why the app carries its own renderers for those notations (a diagram library, a chart grammar, a graph layout engine, a maths typesetter) and sends three notations to a rendering service. The notation views re-theme their renderers from the app's tokens.
- `ArtifactFrame` is **not** in Radiant: the app still has its own `.feature-frame` (header, source toggle, skeleton, error, full screen) — exactly what the component generalized.

What each level would change, factually: **more static** means one module, manifest, prompt entry and view per new shape — the pattern already in use and the source of its best output. **Declarative** would change arrangement, not notation: the model could put a `Card` around a chart with a `StatGroup` beside it and a `ChoiceGroup` under it. The 26 notation renderers would remain, so the honest scope is chrome, layout and non-notation primitives. **Open-ended** would subsume those renderers with HTML, at the cost of the theming each view does today plus an iframe in a keyboard- and RTL-sensitive conversation. **MCP Apps** matters only if these views had to appear in someone else's chat.

## 8. Open questions

1. Which level, for which answers: is the complaint "the model cannot arrange what exists" or "the catalog lacks the shape"?
2. Is the catalog a new public contract, versioned with a migration note like a component? Who reviews a change?
3. Own format, A2UI 1.0, json-render, or a thin layer over existing components?
4. If A2UI: target v1.0 when the published renderer's README still recommends v0.9?
5. Where does interface state live — message, client, or product store — and what happens on reload, on a second device, in a shared conversation?
6. Does the model ever see what the person changed (Intelligent UI's model does not), and through which message?
7. Which models must emit it reliably — only house models through the relay, or Claude and GPT too? What validity rate is acceptable, measured on whose prompts, by whom?
8. What is the time-to-first-render budget, and does the format's syntax fit in it?
9. How does a generated view persist in history: spec, rendered HTML, screenshot, or nothing?
10. What happens to an old message when a component is renamed or a prop changes?
11. Which actions may a generated view take: only "send this as my next message", or a typed allowlist? Who confirms, with `InlineConfirm` or a dialog?
12. May a generated view load anything from the network, and through which allowlist?
13. What is the accessibility contract: does every entry carry a name, is the surface a landmark, does a streamed answer announce once at the end?
14. Is there an escape hatch (a sandboxed component for the shape the catalog lacks), and can a product switch it off?
15. Do the words come from the model (and therefore all localization from it), or does it emit keys the host translates?

## 9. Sources

**Primary — vendor, specification, repository, documentation, paper.**

1. openai.com/index/gpt-6-for-everyone/ (2026-10-07).
2. developers.openai.com/api/docs/changelog (read 2026-11-10; 2026-10-07 entry; Agent Builder deprecation 2026-06-03).
3. developers.openai.com/api/docs/guides/chatkit-widgets (read 2026-11-10).
4. developers.openai.com/api/docs/guides/chatkit and /agent-builder (read 2026-11-10; shutdown 2026-11-30).
5. developers.openai.com/plugins/build/chatgpt-ui (read 2026-11-10; MCP Apps bridge, `window.openai`, `@openai/apps-sdk-ui`).
6. raw.githubusercontent.com/modelcontextprotocol/ext-apps/main/specification/2026-01-26/apps.mdx — SEP-1865, "Stable (2026-01-26)", created 2025-11-21.
7. modelcontextprotocol.io/docs/extensions/apps (read 2026-11-10; hosts, security model, `@mcp-ui/client`).
8. a2ui.org/specification/v1.0-a2ui/ — "Version 1.0 · Status Current · Created Nov 20, 2025 · Last Updated Jun 8, 2026".
9. a2ui.org/specification/v1.0-basic-catalog-implementation-guide/ (read 2026-11-10).
10. a2ui.org/concepts/overview/ (read 2026-11-10).
11. npmjs.com/package/@a2ui/react — 0.15.0, published ~2026-11-02, Apache-2.0, 5 deps, 205,036 weekly downloads.
12. github.com/vercel-labs/json-render (Apache-2.0, Vercel Labs, 36 shadcn components; read 2026-11-10).
13. json-render.dev/docs (read 2026-11-10).
14. npmjs.com/package/@json-render/core — 0.22.0, ~2026-11-04, 1 dep, 3,026,357 weekly downloads.
15. openui.com/docs/openui-lang (read 2026-11-10).
16. openui.com/docs/openui-lang/benchmarks (read 2026-11-10; GPT-5.2, temp 0, tiktoken `gpt-5`).
17. docs.ag-ui.com/introduction (read 2026-11-10).
18. ai-sdk.dev/docs/ai-sdk-ui/generative-user-interfaces (read 2026-11-10).
19. ai-sdk.dev/docs/ai-sdk-rsc (read 2026-11-10; "currently experimental").
20. github.com/microsoft/AdaptiveCards (MIT source, EULA for binaries, feature matrix v1.0–v1.6; read 2026-11-10).
21. support.claude.com/en/articles/17153992 (read 2026-11-10).
22. claude.com/features/artifacts (read 2026-11-10).
23. code.claude.com/docs/en/artifacts (read 2026-11-10).
24. support.claude.com/en/articles/16994751 (read 2026-11-10; templates).
25. anthropic.com/news/claude-sonnet-4-5 (2025-09-29; "Imagine with Claude", five days, Max).
26. academy.claude.com/tutorials/build-custom-artifacts-with-claude (read 2026-11-10).
27. arxiv.org/abs/2604.09577 — *Generative UI: LLMs are Effective UI Generators* (Google Research; Elo 1736.2; 82.8% / 90.5% preference over Markdown; 0% / 29% / 60% output errors by model; PAGEN).
28. research.google/blog/generative-ui-a-rich-custom-visual-interactive-user-experience-for-any-prompt/ (2025-11-18; dynamic view, AI Mode).
29. openui.com/blog/state-of-generative-ui-report (2026-06-10; the three-level frame; MCP Apps stable since Jan 2026).
30. openui.com/blog/how-chatgpt-intelligent-ui-works (2026-10-08; deep reverse engineering, protocol version 14).
31. Fabrials UI local checkout — `DESIGN.md`, `references/components.md`, `docs/migration-0.12.md`, both package indexes (read 2026-11-10).
32. Radiant local copy — `features/manifests.ts`, `features/*/manifest.ts`, `features/core/{server,tool-part,remote-diagram}.ts`, `features.css`, `package.json` (read 2026-11-10).

**Secondary.**

33. teapawt.org/rabi_guha/article/2108238432355123572 (2026-10-08) — a shorter version of source 30, which it links to as the fuller one; a mirror, not independent confirmation.
34. copilotkit.ai/blog/introducing-open-intelligent-ui (2026-10-09; "There is no API to bring it into your own product").
35. SiliconANGLE 2026-03-12, Inc. 2026-03-12, Gadgets360 2026-03-13 — press on Claude's inline visualisations, all citing an Anthropic post of 2026-03-12 that I did not open.
36. aireiter.com/blog/gpt-6-intelligent-ui-guide (2026-10-08; "No public Intelligent UI renderer announced").
37. aparté 2026-10-26, contenox 2026-10-14, reflektlab 2026-10-17 — corroborate the shutdown date (primary is source 4).

**Could not open, therefore not paraphrased:** adaptivecards.io and adaptivecards.microsoft.com (no response; `/explore/` 404 after redirect), so Adaptive Cards rests on its repository; research.google/blog/generative-ui-llms-are-effective-ui-generators/ (404), so the paper itself is the source; the Anthropic post of 2026-03-12 on inline visualisations (not found at an anthropic.com URL); OpenAI's deprecations page (shutdown date taken from sources 4).
