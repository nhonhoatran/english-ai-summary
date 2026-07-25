import { describe, it, expect } from "vitest";
import { parseYoutubeUrl } from "./parse-youtube-url";

describe("parseYoutubeUrl", () => {
  it("parses standard youtube.com/watch?v=ID link", () => {
    const res = parseYoutubeUrl("https://www.youtube.com/watch?v=dQw4w9WgXcQ");
    expect(res).toEqual({ ok: true, videoId: "dQw4w9WgXcQ" });
  });

  it("parses short youtu.be/ID link", () => {
    const res = parseYoutubeUrl("https://youtu.be/dQw4w9WgXcQ");
    expect(res).toEqual({ ok: true, videoId: "dQw4w9WgXcQ" });
  });

  it("parses m.youtube.com mobile link", () => {
    const res = parseYoutubeUrl("https://m.youtube.com/watch?v=dQw4w9WgXcQ");
    expect(res).toEqual({ ok: true, videoId: "dQw4w9WgXcQ" });
  });

  it("parses /shorts/ID link", () => {
    const res = parseYoutubeUrl("https://www.youtube.com/shorts/dQw4w9WgXcQ");
    expect(res).toEqual({ ok: true, videoId: "dQw4w9WgXcQ" });
  });

  it("handles extra query parameters correctly", () => {
    const res = parseYoutubeUrl(
      "https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=120s&feature=shared"
    );
    expect(res).toEqual({ ok: true, videoId: "dQw4w9WgXcQ" });
  });

  it("uses v= parameter when both v= and list= exist", () => {
    const res = parseYoutubeUrl(
      "https://www.youtube.com/watch?v=dQw4w9WgXcQ&list=PL1234567890"
    );
    expect(res).toEqual({ ok: true, videoId: "dQw4w9WgXcQ" });
  });

  it("rejects playlist-only link (list= without v=)", () => {
    const res = parseYoutubeUrl(
      "https://www.youtube.com/playlist?list=PL1234567890"
    );
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.error).toContain("Playlists aren't supported");
    }
  });

  it("rejects non-YouTube hostnames", () => {
    const res = parseYoutubeUrl("https://vimeo.com/123456789");
    expect(res.ok).toBe(false);
  });

  it("rejects invalid video ID length (10-char or 12-char IDs)", () => {
    const shortId = parseYoutubeUrl("https://www.youtube.com/watch?v=1234567890"); // 10 chars
    const longId = parseYoutubeUrl("https://www.youtube.com/watch?v=123456789012"); // 12 chars

    expect(shortId.ok).toBe(false);
    expect(longId.ok).toBe(false);
  });

  it("rejects empty or whitespace strings", () => {
    expect(parseYoutubeUrl("").ok).toBe(false);
    expect(parseYoutubeUrl("   ").ok).toBe(false);
  });

  it("parses URL without scheme prefix", () => {
    const res = parseYoutubeUrl("www.youtube.com/watch?v=dQw4w9WgXcQ");
    expect(res).toEqual({ ok: true, videoId: "dQw4w9WgXcQ" });
  });
});
