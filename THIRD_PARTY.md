# Third-party material

Fabrials UI is MIT licensed (see `LICENSE`). It includes, or republishes, material from these projects under their own licenses.

## In the packages

| Material | License | Where |
| --- | --- | --- |
| IBM Plex Sans, Sans Condensed, Mono and Serif (Fontsource builds) | SIL Open Font License 1.1 | `packages/ui/fonts/` (`OFL.txt`) |
| Lobe Icons provider marks | MIT | `packages/ai-ui` (`LOBE-ICONS-LICENSE`) |
| shadcn/ui component structure | MIT | Controls listed in `docs/provenance.md` |
| Base UI | MIT | Dependency |
| Spectrum UI number ticker | Apache-2.0 | `packages/ui/src/number-ticker.tsx` |
| Vercel AI Elements (message, prompt input, code block, reasoning, sources, attachments, suggestion, shimmer) | Apache-2.0 | `packages/ai-ui`, `packages/ui` (see `docs/provenance.md`) |
| Lucide icon paths | ISC | `packages/ai-ui/src/chat-icons.tsx` |

## Republished by the registry

Components from other libraries are stored in `apps/site/registry/external/<library>/` with the library's `LICENSE` and republished with that license at the top of every file. Their origin, license, commit and hashes are in each `upstream.json` and on ui.fabrials.com/libraries.

| Library | License | Copyright |
| --- | --- | --- |
| Magic UI (`magicuidesign/magicui`) | MIT | Copyright (c) Magic UI |
| Kibo UI (`haydenbleasel/kibo`) | MIT | Copyright (c) 2023 — Present shadcnblocks |
