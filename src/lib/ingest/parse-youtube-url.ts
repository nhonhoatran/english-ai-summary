// path/to/src/lib/ingest/parse-youtube-url.ts

export type ParseYoutubeUrlResult =
  | { ok: true; videoId: string }
  | { ok: false; error: string };

const YOUTUBE_HOSTS = new Set([
  "youtube.com",
  "www.youtube.com",
  "m.youtube.com",
  "music.youtube.com",
  "youtu.be",
  "www.youtu.be",
]);

const VIDEO_ID_REGEX = /^[A-Za-z0-9_-]{11}$/;

export function parseYoutubeUrl(rawUrl: string): ParseYoutubeUrlResult {
  const trimmed = rawUrl.trim();
  if (!trimmed) {
    return { ok: false, error: "That doesn't look like a YouTube video link." };
  }

  let urlToParse = trimmed;
  if (!/^https?:\/\//i.test(trimmed)) {
    urlToParse = `https://${trimmed}`;
  }

  let parsed: URL;
  try {
    parsed = new URL(urlToParse);
  } catch {
    return { ok: false, error: "That doesn't look like a YouTube video link." };
  }

  const hostname = parsed.hostname.toLowerCase();
  if (!YOUTUBE_HOSTS.has(hostname)) {
    return { ok: false, error: "That doesn't look like a YouTube video link." };
  }

  let videoId: string | null = null;

  if (hostname === "youtu.be" || hostname === "www.youtu.be") {
    const pathname = parsed.pathname.slice(1);
    const idFromPath = pathname.split("/")[0];
    if (idFromPath) {
      videoId = idFromPath;
    }
  } else {
    const searchParams = parsed.searchParams;
    const vParam = searchParams.get("v");
    const hasList = searchParams.has("list");

    if (!vParam && hasList) {
      return {
        ok: false,
        error: "Playlists aren't supported — paste a single video link.",
      };
    }

    if (vParam) {
      videoId = vParam;
    } else if (parsed.pathname.startsWith("/shorts/")) {
      const parts = parsed.pathname.split("/");
      if (parts[2]) {
        videoId = parts[2];
      }
    } else if (parsed.pathname.startsWith("/embed/")) {
      const parts = parsed.pathname.split("/");
      if (parts[2]) {
        videoId = parts[2];
      }
    }
  }

  if (!videoId || !VIDEO_ID_REGEX.test(videoId)) {
    return { ok: false, error: "That doesn't look like a YouTube video link." };
  }

  return { ok: true, videoId };
}
