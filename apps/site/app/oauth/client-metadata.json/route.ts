export function GET() {
  const origin = "https://ui.fabrials.com";
  return Response.json(
    {
      client_id: `${origin}/oauth/client-metadata.json`,
      client_name: "Fabrials WebMCP UI",
      client_uri: origin,
      redirect_uris: [`${origin}/oauth/callback`],
      grant_types: ["authorization_code", "refresh_token"],
      response_types: ["code"],
      token_endpoint_auth_method: "none",
      application_type: "web",
    },
    { headers: { "Cache-Control": "public, max-age=3600" } },
  );
}
