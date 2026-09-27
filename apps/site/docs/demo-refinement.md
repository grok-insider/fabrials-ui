# Demo refinement research

Reference checkout: /tmp/webmcp-espresso-store, https://github.com/vincanger/webmcp-espresso-store. Read README, WebMCPTools.tsx, schemas.ts and CompareTable.tsx. Analyze behavior; do not copy unlicensed source or product images.

Video: https://www.youtube.com/watch?v=EoNH3Tn8wYE (Greg Isenberg, WebMCP: Let AI Agents pay you money). Retrieved metadata and English transcript. Relevant demonstration: around 03:00–08:00 (constraints, comparison highlights, conditional tools) and 16:05–18:42 (compatible accessories, cart, coupons).

The strongest idea is a continuous user task: a 32 cm counter constraint leads to a visible comparison, compatible accessories, and a reviewed cart. The user sees why the agent acted, can change the same state manually, and keeps the final decision. Our prior film instead reset to unrelated panels every ten seconds and illustrated protocol concepts before establishing a useful task.

Implementation direction: an original fictional coffee equipment comparison, explicit demo data, a shared set of manual/native/simulated actions, evidence highlights and a reviewable cart. Reuse the actual comparison presentation in Remotion so the site and film agree. Keep the library's general-purpose explorer and remote MCP examples available. Improve landing hierarchy, mobile wrapping, surface contrast and installation access.

Pronunciation: Sanderson's official FAQ recommends audiobooks but explicitly allows variations (https://faq.brandonsanderson.com/knowledge-base/how-do-you-pronounce-_________s-name/). Community reports conflict between FAB-ree-uhl and FAY-bree-uhl; they do not prove an official pronunciation. The previous speech replacement "Fay bree uls" inserted unnatural word boundaries. Obtain the user's brand preference, use one joined phonetic replacement and verify a short sample before regenerating the film.

## Implemented

- Original Studio Dual / Atelier Pro example, with original SVG machines and explicit fictional prices/specifications. No upstream code or imagery copied.
- Reusable registry Comparison component: desktop table, mobile cards, highlighted evidence and application-owned actions. Docs preview and installable registry entry included.
- Four application tools: compare_coffee_machines, set_coffee_cart, set_coffee_filter and review_coffee_cart. Last two are registered only when a machine is selected. Manual controls and native/simulated tools use the same handlers. Review has no payment side effect.
- The film imports the registry Comparison and the same product data/illustrations. It maintains the store across the middle chapters and shows a manual correction before review.
- Grok supports explicit IPA replacements. Adopted /ˈfæbriəlz/ (FAB-ree-uhlz); the request and returned alignment both carry it. English text on screen keeps the normal spelling. Caption timing now uses returned graph_times instead of proportional word counts.
- Downloaded the reference demonstration segment 16:10–17:30 to /tmp/espresso-actual-demo.mp4 and inspected its visual arrangement alongside the transcript: product UI plus agent activity, with task outcomes staying visible.
