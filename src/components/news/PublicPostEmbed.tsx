import type { PublicPostEmbed as PublicPostEmbedData } from "@/types";

function xStatusId(url: string) {
  try {
    const parsed = new URL(url);
    if (!["x.com", "www.x.com", "twitter.com", "www.twitter.com"].includes(parsed.hostname.toLowerCase())) {
      return null;
    }
    const match = parsed.pathname.match(/\/status\/(\d+)/);
    return match?.[1] ?? null;
  } catch {
    return null;
  }
}

function youtubeVideoId(url: string) {
  try {
    const parsed = new URL(url);
    if (parsed.hostname === "youtu.be") return parsed.pathname.split("/").filter(Boolean)[0] ?? null;
    if (["youtube.com", "www.youtube.com"].includes(parsed.hostname)) {
      if (parsed.pathname === "/watch") return parsed.searchParams.get("v");
      const match = parsed.pathname.match(/^\/(?:embed|shorts)\/([^/?]+)/);
      return match?.[1] ?? null;
    }
    return null;
  } catch {
    return null;
  }
}

export default function PublicPostEmbed({ post }: { post: PublicPostEmbedData }) {
  const xId = post.platform === "x" ? xStatusId(post.url) : null;
  const youtubeId = post.platform === "youtube" ? youtubeVideoId(post.url) : null;

  return (
    <figure className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <figcaption className="border-b border-slate-200 bg-slate-50 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-red-700">
              Embedded public post
            </p>
            <p className="mt-1 text-sm font-black text-slate-950">
              {post.label ?? post.author + " on " + post.platform}
            </p>
          </div>
          <a
            href={post.url}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-black text-blue-800 hover:border-blue-400"
          >
            Open original
          </a>
        </div>
        {post.context ? (
          <p className="mt-3 text-xs font-semibold leading-5 text-slate-600">{post.context}</p>
        ) : null}
        <p className="mt-2 text-[11px] font-bold leading-5 text-slate-500">
          An embedded post proves what the named account published. It does not independently prove the post&apos;s claims.
        </p>
      </figcaption>

      {xId ? (
        <iframe
          src={"https://platform.twitter.com/embed/Tweet.html?id=" + encodeURIComponent(xId) + "&dnt=true"}
          title={post.author + " public post on X"}
          loading="lazy"
          referrerPolicy="no-referrer"
          sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"
          className="min-h-[520px] w-full border-0 bg-white"
        />
      ) : youtubeId ? (
        <div className="aspect-video bg-black">
          <iframe
            src={"https://www.youtube-nocookie.com/embed/" + encodeURIComponent(youtubeId)}
            title={post.author + " public video"}
            loading="lazy"
            referrerPolicy="strict-origin-when-cross-origin"
            sandbox="allow-scripts allow-same-origin allow-presentation allow-popups"
            allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            className="h-full w-full border-0"
          />
        </div>
      ) : (
        <div className="p-5">
          <p className="text-sm font-semibold leading-6 text-slate-700">
            This platform does not offer a privacy-minimized inline format here. Use the original-post link above.
          </p>
        </div>
      )}
    </figure>
  );
}
