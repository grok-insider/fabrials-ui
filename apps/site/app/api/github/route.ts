export async function GET() {
  try {
    const response = await fetch(
      "https://api.github.com/repos/grok-insider/fabrials-webmcp",
      {
        headers: { Accept: "application/vnd.github+json" },
        next: { revalidate: 3600 },
        signal: AbortSignal.timeout(5000),
      },
    );
    if (!response.ok) throw new Error("GitHub unavailable");
    const data = await response.json();
    if (
      !Number.isSafeInteger(data.stargazers_count) ||
      data.stargazers_count < 0
    )
      throw new Error("Invalid count");
    return Response.json(
      { stars: data.stargazers_count },
      {
        headers: {
          "Cache-Control":
            "public, s-maxage=3600, stale-while-revalidate=86400",
        },
      },
    );
  } catch {
    return Response.json(
      { stars: null },
      { headers: { "Cache-Control": "no-store" } },
    );
  }
}
