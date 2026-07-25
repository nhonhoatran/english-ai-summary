// path/to/scripts/test-ingest-pipeline.ts

import { parseYoutubeUrl } from "../src/lib/ingest/parse-youtube-url";
import { fetchYoutubeCaptions } from "../src/lib/ingest/fetch-youtube-captions";

async function runTests() {
  console.log("=== Phase 04 Ingest Pipeline Tests ===\n");

  // 1. Test URL Parser
  console.log("1. Testing parseYoutubeUrl...");

  const validUrls = [
    { input: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", expectedId: "dQw4w9WgXcQ" },
    { input: "https://youtu.be/dQw4w9WgXcQ", expectedId: "dQw4w9WgXcQ" },
    { input: "https://m.youtube.com/watch?v=dQw4w9WgXcQ&feature=shared", expectedId: "dQw4w9WgXcQ" },
    { input: "https://www.youtube.com/shorts/dQw4w9WgXcQ", expectedId: "dQw4w9WgXcQ" },
    { input: "https://www.youtube.com/watch?v=dQw4w9WgXcQ&list=PL123456", expectedId: "dQw4w9WgXcQ" },
  ];

  for (const { input, expectedId } of validUrls) {
    const res = parseYoutubeUrl(input);
    if (!res.ok || res.videoId !== expectedId) {
      throw new Error(`Parser failed for valid URL ${input}: got ${JSON.stringify(res)}`);
    }
  }
  console.log("   ✅ Valid YouTube URLs parsed correctly.");

  // Test Playlist rejection
  const playlistOnly = "https://www.youtube.com/playlist?list=PL123456789";
  const playlistRes = parseYoutubeUrl(playlistOnly);
  if (playlistRes.ok || !playlistRes.error.includes("Playlists aren't supported")) {
    throw new Error(`Playlist rejection failed: got ${JSON.stringify(playlistRes)}`);
  }
  console.log("   ✅ Playlist-only URL rejected with exact user message.");

  // Test Garbage rejection
  const garbageInputs = [
    "not a url",
    "https://google.com/search?q=youtube",
    "https://youtube.com/watch?v=too_short",
  ];
  for (const input of garbageInputs) {
    const res = parseYoutubeUrl(input);
    if (res.ok) {
      throw new Error(`Garbage input ${input} should be rejected, but passed`);
    }
  }
  console.log("   ✅ Invalid/Garbage strings rejected pre-API.");

  // 2. Test Caption Fetcher (safety check - never throws)
  console.log("\n2. Testing fetchYoutubeCaptions safety...");
  const dummyResult = await fetchYoutubeCaptions("invalid_id_123");
  if (dummyResult !== null) {
    throw new Error("Invalid video ID should yield null transcript");
  }
  console.log("   ✅ fetchYoutubeCaptions returned null without throwing.");

  console.log("\n🎉 All unit & contract verification tests passed successfully!");
}

runTests().catch((err) => {
  console.error("\n❌ Test run failed:", err);
  process.exit(1);
});
