import { repoStats } from "@/lib/github";
import { knownRepositories } from "@/lib/docs-nav";

/** Stars for Fabrials UI, or for an aggregated library with ?repo=owner/name. Unknown repositories are refused. */
export async function GET(request?: Request) {
  const repo = request ? new URL(request.url).searchParams.get("repo") ?? "grok-insider/fabrials-ui" : "grok-insider/fabrials-ui";
  if (!knownRepositories.has(repo)) return Response.json({ stars: null, forks: null }, { status: 404 });
  const { stars, forks } = await repoStats(repo);
  return Response.json(
    { stars, forks },
    {
      headers: {
        "Cache-Control": stars === null ? "no-store" : "public, s-maxage=3600, stale-while-revalidate=86400",
      },
    },
  );
}
