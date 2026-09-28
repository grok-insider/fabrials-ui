export interface RepoStats {
  stars: number | null;
  forks: number | null;
}

const count = (value: unknown) => (Number.isSafeInteger(value) && (value as number) >= 0 ? (value as number) : null);

/**
 * Stars and forks of a public GitHub repository, cached for an hour. Any
 * failure gives nulls, which the UI leaves out rather than showing a zero.
 */
export async function repoStats(repository: string): Promise<RepoStats> {
  try {
    const response = await fetch(`https://api.github.com/repos/${repository}`, {
      headers: { Accept: "application/vnd.github+json" },
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) throw new Error("GitHub unavailable");
    const data = (await response.json()) as { stargazers_count?: unknown; forks_count?: unknown };
    return { stars: count(data.stargazers_count), forks: count(data.forks_count) };
  } catch {
    return { stars: null, forks: null };
  }
}
