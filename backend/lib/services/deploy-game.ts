export type DeployedGame = {
  gameUrl: string;
};

/**
 * TODO: Publish the stored bundle at its own URL. Pick one approach:
 *
 * 1. Vercel Deployment API (preferred for "its own distinct URL").
 *    Create a static deployment per game with `VERCEL_TOKEN` and
 *    `VERCEL_TEAM_ID`, uploading `index.html` and the assets. The deployment
 *    URL is the public game URL. Optionally alias it.
 * 2. Subpath on this API project. Serve the stored HTML at
 *    `GET /play/{gameId}` from the `game-assets` bucket. One deployment,
 *    many games. Simpler, and not a separate origin.
 * 3. Wildcard subdomain. Point `{gameId}.games.<domain>` at option 1 or 2
 *    with a Vercel alias or a host-based rewrite.
 *
 * Until that exists, a configured Supabase project uses the public URL of the
 * uploaded `index.html`. Otherwise the URL is a placeholder on `.invalid`.
 */
export async function deployGame(
  gameId: string,
  bundle: { assetUrls: string[] },
): Promise<DeployedGame> {
  if (bundle.assetUrls.length === 0) {
    throw new Error('Refusing to describe a deployment with no assets.');
  }

  const storedIndex = bundle.assetUrls.find((url) => url.endsWith('/index.html'));
  if (process.env.SUPABASE_URL?.trim() && storedIndex) {
    return { gameUrl: storedIndex };
  }

  const base = (process.env.GAME_PUBLIC_URL_BASE ?? 'https://games.example.invalid').replace(
    /\/$/,
    '',
  );
  return { gameUrl: `${base}/${gameId}` };
}
