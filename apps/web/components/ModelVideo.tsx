/**
 * Renders a model video from a URL. Supports YouTube and Vimeo (embedded as an
 * iframe) and direct video files (mp4/webm/ogg via <video>). Anything else
 * falls back to a plain link. Server component — pure URL parsing, no hooks.
 */

function youtubeId(url: URL): string | null {
    if (url.hostname === "youtu.be") {
        return url.pathname.slice(1) || null;
    }
    if (url.hostname.endsWith("youtube.com")) {
        if (url.pathname === "/watch") return url.searchParams.get("v");
        if (url.pathname.startsWith("/embed/")) {
            return url.pathname.split("/")[2] ?? null;
        }
        if (url.pathname.startsWith("/shorts/")) {
            return url.pathname.split("/")[2] ?? null;
        }
    }
    return null;
}

function vimeoId(url: URL): string | null {
    if (!url.hostname.endsWith("vimeo.com")) return null;
    const id = url.pathname.split("/").filter(Boolean)[0];
    return id && /^\d+$/.test(id) ? id : null;
}

export function ModelVideo({ url, title }: { url: string; title: string }) {
    let parsed: URL | null = null;
    try {
        parsed = new URL(url);
    } catch {
        parsed = null;
    }

    if (parsed) {
        const yt = youtubeId(parsed);
        if (yt) {
            return (
                <div className="aspect-video w-full overflow-hidden rounded-xl border border-border bg-black">
                    <iframe
                        src={`https://www.youtube.com/embed/${yt}`}
                        title={title}
                        className="h-full w-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                    />
                </div>
            );
        }

        const vm = vimeoId(parsed);
        if (vm) {
            return (
                <div className="aspect-video w-full overflow-hidden rounded-xl border border-border bg-black">
                    <iframe
                        src={`https://player.vimeo.com/video/${vm}`}
                        title={title}
                        className="h-full w-full"
                        allow="autoplay; fullscreen; picture-in-picture"
                        allowFullScreen
                    />
                </div>
            );
        }

        if (/\.(mp4|webm|ogg)(\?.*)?$/i.test(parsed.pathname)) {
            return (
                <video
                    controls
                    preload="metadata"
                    className="aspect-video w-full rounded-xl border border-border bg-black"
                >
                    <source src={url} />
                    Your browser does not support the video tag.
                </video>
            );
        }
    }

    return (
        <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="text-sm font-semibold text-primary hover:underline"
        >
            Watch the {title} video
        </a>
    );
}
