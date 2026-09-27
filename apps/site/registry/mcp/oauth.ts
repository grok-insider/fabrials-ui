import type {
  OAuthClientProvider,
  OAuthClientMetadata,
  StoredOAuthClientInformation,
  StoredOAuthTokens,
  OAuthClientInformationContext,
  OAuthDiscoveryState,
} from "@modelcontextprotocol/client";
const PREFIX = "fabrials.webmcp.oauth";
type Pending = {
  endpoint: string;
  returnPath: string;
  state: string;
  createdAt: number;
  verifier?: string;
  discovery?: OAuthDiscoveryState;
  clients: Record<string, StoredOAuthClientInformation>;
  clientId?: string;
};
export class BrowserOAuthProvider implements OAuthClientProvider {
  private tokenSets = new Map<string, StoredOAuthTokens>();
  private lastIssuer = "";
  private pending: Pending;
  readonly redirectUrl: string;
  readonly clientMetadataUrl: string;
  constructor(
    readonly endpoint: string,
    options: {
      callbackPath?: string;
      metadataPath?: string;
      clientId?: string;
      resume?: boolean;
    } = {},
  ) {
    this.redirectUrl = new URL(
      options.callbackPath ?? "/oauth/callback",
      location.origin,
    ).href;
    this.clientMetadataUrl = new URL(
      options.metadataPath ?? "/oauth/client-metadata.json",
      location.origin,
    ).href;
    const saved = options.resume
      ? BrowserOAuthProvider.readPending()
      : undefined;
    if (options.resume && (!saved || saved.endpoint !== endpoint))
      throw new Error("OAuth session expired. Start a new connection.");
    this.pending = saved ?? {
      endpoint,
      returnPath: location.pathname,
      state: crypto.randomUUID(),
      createdAt: Date.now(),
      clients: {},
      clientId: options.clientId,
    };
  }
  static readPending(): Pending | undefined {
    try {
      const saved = JSON.parse(
        sessionStorage.getItem(PREFIX) ?? "null",
      ) as Pending | null;
      if (saved && Date.now() - saved.createdAt < 10 * 60_000) return saved;
    } catch {
      /* Invalid transient state is discarded. */
    }
    sessionStorage.removeItem(PREFIX);
  }
  private save() {
    sessionStorage.setItem(PREFIX, JSON.stringify(this.pending));
  }
  get clientMetadata(): OAuthClientMetadata {
    return {
      client_name: "Fabrials WebMCP UI",
      redirect_uris: [this.redirectUrl],
      grant_types: ["authorization_code", "refresh_token"],
      response_types: ["code"],
      token_endpoint_auth_method: "none",
      application_type: "web",
    };
  }
  state = () => this.pending.state;
  clientInformation = (ctx?: OAuthClientInformationContext) =>
    this.pending.clientId
      ? { client_id: this.pending.clientId }
      : this.pending.clients[ctx?.issuer ?? ""];
  saveClientInformation = (
    value: StoredOAuthClientInformation,
    ctx?: OAuthClientInformationContext,
  ) => {
    this.pending.clients[ctx?.issuer ?? ""] = value;
    this.save();
  };
  tokens = (ctx?: OAuthClientInformationContext) =>
    this.tokenSets.get(ctx?.issuer ?? this.lastIssuer);
  saveTokens = (
    value: StoredOAuthTokens,
    ctx?: OAuthClientInformationContext,
  ) => {
    this.lastIssuer = ctx?.issuer ?? "";
    this.tokenSets.set(this.lastIssuer, value);
  };
  saveCodeVerifier = (value: string) => {
    this.pending.verifier = value;
    this.save();
  };
  codeVerifier = () => {
    if (!this.pending.verifier)
      throw new Error("Missing PKCE verifier. Restart authorization.");
    return this.pending.verifier;
  };
  saveDiscoveryState = (value: OAuthDiscoveryState) => {
    this.pending.discovery = value;
    this.save();
  };
  discoveryState = () => this.pending.discovery;
  redirectToAuthorization = (url: URL) => {
    this.save();
    location.assign(url.href);
  };
  validateCallback(params: URLSearchParams) {
    if (params.get("state") !== this.pending.state)
      throw new Error("OAuth state mismatch. Restart authorization.");
    if (Date.now() - this.pending.createdAt > 600_000)
      throw new Error("OAuth session expired.");
    if (params.has("error"))
      throw new Error(`Authorization declined: ${params.get("error")}`);
    if (!params.get("code")) throw new Error("No authorization code returned.");
  }
  complete() {
    delete this.pending.verifier;
    sessionStorage.removeItem(PREFIX);
  }
  invalidateCredentials = (
    scope: "all" | "client" | "tokens" | "verifier" | "discovery",
  ) => {
    if (scope === "all" || scope === "tokens") this.tokenSets.clear();
    if (scope === "all" || scope === "client") this.pending.clients = {};
    if (scope === "all" || scope === "verifier") delete this.pending.verifier;
    if (scope === "all" || scope === "discovery") delete this.pending.discovery;
    if (scope === "all") sessionStorage.removeItem(PREFIX);
    else this.save();
  };
}
