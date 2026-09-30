/** Caddy preserves Host, while self-hosted Next constructs request.url with its
 * internal listener. Accept this site's HTTPS hosts and development loopback. */
export function getSiteRequestOrigin(request: Request, hosting: string | undefined, nodeEnv: string | undefined): URL | null {
  try {
    if (hosting !== "DigitalOcean") return new URL(new URL(request.url).origin);
    const host = request.headers.get("host")?.toLowerCase();
    if (!host || /[\s/@?#\\]/.test(host)) return null;
    const publicOrigin = new URL(`https://${host}`);
    if (["www.repwatchr.com", "repwatchr.com"].includes(publicOrigin.hostname) && !publicOrigin.port) return publicOrigin;
    if (nodeEnv === "development" || nodeEnv === "test") {
      const localOrigin = new URL(`http://${host}`);
      if (["127.0.0.1", "localhost", "[::1]"].includes(localOrigin.hostname)) return localOrigin;
    }
    return null;
  } catch { return null; }
}
