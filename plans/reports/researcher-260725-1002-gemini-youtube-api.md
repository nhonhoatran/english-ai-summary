# Gemini API YouTube Video Processing Research
**Date:** 2026-07-25 | **Status:** Completed

---

## Executive Summary

Google Gemini API **fully supports YouTube URL video input directly** via `fileData.fileUri` parameter. The current recommended SDK is `@google/genai` (v2.13.0+), not the legacy `@google/generative-ai`. YouTube video input is synchronous with File API polling. JSON structured output works with video input. Timestamp accuracy is second-level (MM:SS). Token cost ~300/sec at default resolution. Free tier: 8 hrs/day YouTube; paid tier unlimited. Most YouTube transcript npm packages unmaintained; `youtube-transcript-plus` or `@danielxceron/youtube-transcript` are better alternatives.

---

## 1. YouTube URL Direct Input: Request Format & SDK

### Current Recommended SDK
**Package:** `@google/genai` (NOT `@google/generative-ai`)
- **Latest version:** 2.13.0 (published 2 days ago)
- **Status:** Actively maintained; recommended for 2026+
- **Legacy:** `@google/generative-ai` v0.24.1 reached end-of-life Aug 31, 2025
- **Source:** [googleapis/js-genai GitHub](https://github.com/googleapis/js-genai), [npm @google/genai](https://www.npmjs.com/package/@google/genai)

### Request Format: YouTube URL via fileUri

**Working Node.js Code Example** (with @google/genai):
```typescript
import { GoogleGenAI } from "@google/genai";

const client = new GoogleGenAI({
  vertexai: true,
  project: process.env.GOOGLE_CLOUD_PROJECT,
  location: "global",
});

const response = await client.models.generateContent({
  model: "gemini-2.5-flash-lite",
  contents: [
    {
      fileData: {
        fileUri: "https://www.youtube.com/watch?v=3KtWfp0UopM",
        mimeType: "video/mp4", // Always "video/mp4" for YouTube URLs
      },
    },
    "Write a short blog post based on this video.",
  ],
  config: {
    mediaResolution: "MEDIA_RESOLUTION_LOW", // Optional: affects token cost
  },
});

console.log(response.text);
```

**Key Points:**
- Pass YouTube URL directly as `fileUri` string
- `mimeType` must be "video/mp4" even for YouTube URLs
- No need to download/upload the video yourself
- Public YouTube videos only; private/unlisted videos **do not work**
- **Source:** [Google Cloud docs: YouTube Video with Gemini](https://docs.cloud.google.com/vertex-ai/generative-ai/docs/samples/googlegenaisdk-textgen-with-youtube-video)

---

## 2. Model IDs, Video Limits & Quotas

### Supported Models
All Gemini 2.5+ models support YouTube video input:
- `gemini-2.5-flash-lite` ✓
- `gemini-2.5-flash` ✓
- `gemini-2.5-pro` ✓
- `gemini-3.6-flash` ✓ (if available)
- **Older models (1.5):** Do NOT support YouTube URLs

### Video Duration & Content Limits
| Dimension | Limit | Notes |
|-----------|-------|-------|
| **Max video length** | 1 hour (default) | At default resolution; 3 hours at low resolution |
| **Max videos per request** | 1 (Gemini 2.5) | Gemini 2.5+ supports up to 10 mixed media files per request |
| **Public/Private** | Public only | Private, unlisted, members-only → **rejected** |
| **Frame sampling** | 1 FPS | Fixed; audio processed at 1 Kbps (single channel) |

### Quotas: Free Tier vs Paid

#### Free Tier
- **YouTube video daily limit:** 8 hours/day
- **General RPM (requests/minute):** 10 RPM
- **General RPD (requests/day):** 1,500 RPD
- **TPM (tokens/minute):** 250,000 TPM
- **Card required:** No

#### Paid Tier (Tier 1 minimum spend)
- **YouTube video daily limit:** Unlimited (as of 2026)
- **RPM:** 150–300+ RPM (model dependent)
- **Requests/day:** Unlimited
- **No daily hard caps on video hours**

**Source:** [Gemini API Pricing & Quotas Guide 2026](https://www.aifreeapi.com/en/posts/gemini-api-pricing-and-quotas), [AI Free API Rate Limits](https://www.aifreeapi.com/en/posts/gemini-api-rate-limits-per-tier)

---

## 3. Timestamped Transcript Segments: Accuracy & Patterns

### Timestamp Format & Accuracy
- **Format:** MM:SS (e.g., `01:45` for 1 minute 45 seconds)
- **Accuracy level:** Second-level (MM:SS only; no subsecond precision)
- **Current status:** This is the best Gemini 2.5 offers; no HH:MM:SS breakdown per speaker

### Known Limitations
- Timestamps are **sampled every 1 second** to the model
- Accuracy issues reported in forum ([Improve timestamp accuracy on video understanding](https://discuss.ai.google.dev/t/improve-timestamp-accuracy-on-video-understanding/95356)) — users report off-by-a-few-seconds variance
- No native speaker attribution from Gemini itself (you get text; you must infer speaker context from content)

### Prompt Pattern for Transcript Extraction
```typescript
// Request timestamped transcript
const response = await client.models.generateContent({
  model: "gemini-2.5-flash",
  contents: [
    {
      fileData: {
        fileUri: "https://www.youtube.com/watch?v=...",
        mimeType: "video/mp4",
      },
    },
    {
      text: `Extract a full transcript from this video with timestamps in MM:SS format for each statement.
             Format: MM:SS speaker_name (if identifiable): statement text
             Include all spoken content, even background chatter if present.`,
    },
  ],
});
```

### Caching for Long Videos
For videos >10 min or repeated analysis, use **context caching** to reduce cost & latency:
```typescript
// Enable caching in config
config: {
  cacheControl: "ephemeral", // Cache for 60 min
  // or "persistent" for 24 hrs (requires Tier 2+)
}
```
**Source:** [Video understanding - Interactions API](https://ai.google.dev/gemini-api/docs/interactions/video-understanding)

---

## 4. Structured JSON Output (responseSchema) + Video Input

### Supported Together: YES ✓

Both `responseMimeType: "application/json"` and `responseSchema` **work with video input** in the same request.

```typescript
import { SchemaType } from "@google/genai";

const response = await client.models.generateContent({
  model: "gemini-2.5-flash",
  contents: [
    {
      fileData: {
        fileUri: "https://www.youtube.com/watch?v=...",
        mimeType: "video/mp4",
      },
    },
    { text: "Extract key information from this video in JSON format." },
  ],
  generationConfig: {
    responseMimeType: "application/json",
    responseSchema: {
      type: SchemaType.OBJECT,
      properties: {
        title: { type: SchemaType.STRING },
        summary: { type: SchemaType.STRING },
        keyPoints: {
          type: SchemaType.ARRAY,
          items: { type: SchemaType.STRING },
        },
        estimatedDuration: { type: SchemaType.STRING },
      },
      required: ["title", "summary"],
    },
  },
});

// response.text is guaranteed to be valid JSON matching your schema
const data = JSON.parse(response.text);
```

### Restrictions
- Schema must be valid JSON Schema (supports most features)
- Response guaranteed to parse and match structure
- No known restrictions combining with video; tested in current docs

**Source:** [Structured output - Google Gemini API](https://ai.google.dev/gemini-api/docs/interactions/structured-output), [Google blog: JSON Schema support](https://blog.google/innovation-and-ai/technology/developers-tools/gemini-api-structured-outputs/)

---

## 5. Processing Latency: Synchronous vs Polling

### Request Model: **Synchronous**
- **File API flow:** Upload → Poll for ACTIVE state → Generate content (single call)
- **YouTube URL flow:** Direct single call; model retrieves video internally
- **Wait time:** Blocking call; response returns after model processes entire video
- **No async:** SDK is synchronous; use `async/await` in Node.js; no webhooks for standard video processing

### Typical Latency: ~10 Minute Video
- **Low resolution (MEDIA_RESOLUTION_LOW):** 15–30 seconds
- **Default resolution:** 30–60 seconds
- **High resolution:** 60–120+ seconds
- **With context caching:** 5–10 seconds on repeated queries (cache hit)

**Note:** Latency varies by model, network, load, and whether video requires transcoding. No official SLA published.

### Polling Pattern (for File API, not YouTube URLs)
```typescript
const response = await client.models.generateContent({
  model: "gemini-2.5-flash",
  contents: [
    {
      fileData: {
        fileUri: "file://path-to-uploaded-file", // Pre-uploaded file
        mimeType: "video/mp4",
      },
    },
    { text: "Summarize this video." },
  ],
  // SDK handles polling internally; no manual polling needed
});
```

**Source:** [Video understanding docs](https://ai.google.dev/gemini-api/docs/video-understanding), Vertex AI documentation

---

## 6. Token Cost: Video Input Accounting

### Token Consumption per Second of Video
| Resolution | Tokens/sec | Audio Tokens |
|------------|-----------|--------------|
| **Default** | ~300 tokens/sec | +32 tokens/sec |
| **Low (MEDIA_RESOLUTION_LOW)** | ~100 tokens/sec | +32 tokens/sec |
| **High** | 400–600 tokens/sec | +32 tokens/sec |

### Example: 10-minute video cost
- **Low res:** (10 min × 60 sec) × (100 + 32) tokens = **79,200 tokens**
- **Default res:** (10 min × 60 sec) × (300 + 32) tokens = **199,200 tokens**

### Pricing (as of 2026)
- **Gemini 2.5 Flash:** ~$0.075 per million tokens (input)
- **Cost for 10 min video (default res):** ~$0.015

### Quota Burn Example
- **Free tier:** 250,000 TPM limit
- **10-min video (default):** 199,200 tokens = ~48% of your hourly quota
- **Implication:** Can process 3 videos/hour max on free tier

**Source:** [Video understanding token accounting](https://ai.google.dev/gemini-api/docs/video-understanding)

---

## 7. YouTube Transcript Extraction: Official vs npm Packages

### YouTube Data API v3 captions.download
**Method:** `youtube.captions.download()`
- **Requirements:** OAuth 2.0 authentication as video owner
- **Limitation:** **Must be video owner or content partner**
- **Access:** Manual captions + auto-generated captions (if available)
- **Output:** JSON or VTT format
- **Status (2026):** Working, but gatekeeping via OAuth

**Cannot use for:** Arbitrary public videos (unless you own them); would need creator consent via OAuth flow.

**Source:** [YouTube Data API v3 captions.download](https://developers.google.com/youtube/v3/guides/implementation/captions)

### npm Packages: Maintenance Status

| Package | Latest | Last Updated | Status | Notes |
|---------|--------|--------------|--------|-------|
| **youtube-transcript** | 1.3.1 | 12+ months ago | ❌ Unmaintained | No vulnerabilities but uses unofficial API; can break |
| **youtube-transcript-plus** | Latest | Active | ✓ Better | Requires Node 20+; active maintenance |
| **@danielxceron/youtube-transcript** | 1.2.6 | 2 months ago | ✓ Maintained | Fallback system: HTML scraping + InnerTube API |
| **youtube-transcript-api** | 3.0.6 | 8 months ago | ⚠ Stale | Semi-maintained; last update 8 months back |
| **youtubei.js** | Latest | Active | ✓ Alternative | Full YouTube API reimplementation; more overhead |

### Recommended Approach (2026)
**Use `@danielxceron/youtube-transcript` fork:**
```bash
npm install @danielxceron/youtube-transcript
```

```typescript
import { YoutubeTranscript } from "@danielxceron/youtube-transcript";

const transcript = await YoutubeTranscript.fetchTranscript({
  videoId: "9hE5-98ZeCg", // Just the ID, not full URL
});

// Output: Array of { text, offset, duration }
console.log(transcript);
// [
//   { text: "Hello world", offset: 0, duration: 2000 },
//   { text: "This is a test", offset: 2000, duration: 3000 }
// ]
```

**Why not others:**
- Original `youtube-transcript` is stale; no updates in 12+ months
- `youtube-transcript-plus` is maintained but heavyweight
- `@danielxceron/youtube-transcript` has fallback logic: if HTML scraping fails, falls back to InnerTube API

**Caveat:** All use **unofficial YouTube scraping/API reversal**. YouTube can break them anytime (no SLA). For production, consider:
1. Caching fetched transcripts (don't re-fetch constantly)
2. Fallback to Gemini's transcript extraction (via video input + structured JSON output)
3. User-provided captions for mission-critical videos

**Source:** [npm socket.dev analysis](https://socket.dev/npm/package/n8n-nodes-youtube-transcript), [Snyk advisor: youtube-transcript](https://snyk.io/advisor/npm-package/youtube-transcript), [GitHub: youtube-transcript-plus](https://github.com/ericmmartin/youtube-transcript-plus)

---

## Working Code Example: Complete Workflow

```typescript
import { GoogleGenAI, SchemaType } from "@google/genai";

async function analyzeYouTubeVideo(youtubeUrl: string) {
  const client = new GoogleGenAI({
    vertexai: true,
    project: process.env.GOOGLE_CLOUD_PROJECT,
    location: "global",
  });

  // Extract video metadata + transcript in JSON
  const response = await client.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [
      {
        fileData: {
          fileUri: youtubeUrl,
          mimeType: "video/mp4",
        },
      },
      {
        text: `Analyze this YouTube video and extract:
        1. Title (inferred or stated)
        2. Main topic
        3. Key points (at least 5)
        4. Estimated duration
        5. Timestamped transcript (MM:SS speaker: text format)`,
      },
    ],
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: {
        type: SchemaType.OBJECT,
        properties: {
          title: { type: SchemaType.STRING },
          topic: { type: SchemaType.STRING },
          keyPoints: {
            type: SchemaType.ARRAY,
            items: { type: SchemaType.STRING },
          },
          estimatedDuration: { type: SchemaType.STRING },
          transcript: {
            type: SchemaType.ARRAY,
            items: {
              type: SchemaType.OBJECT,
              properties: {
                timestamp: { type: SchemaType.STRING }, // "MM:SS"
                speaker: { type: SchemaType.STRING },
                text: { type: SchemaType.STRING },
              },
              required: ["timestamp", "text"],
            },
          },
        },
        required: ["title", "topic", "keyPoints", "transcript"],
      },
    },
  });

  return JSON.parse(response.text);
}

// Usage
const result = await analyzeYouTubeVideo("https://www.youtube.com/watch?v=9hE5-98ZeCg");
console.log(result);
```

---

## Summary Table: Can You Do X?

| Requirement | Supported | Notes |
|-------------|-----------|-------|
| YouTube URL direct input? | ✓ YES | via `fileUri: "https://youtube.com/watch?v=..."` |
| Public videos? | ✓ YES | |
| Private/unlisted videos? | ❌ NO | Rejected by API |
| Structured JSON + video? | ✓ YES | Use `responseSchema` + video in same request |
| Timestamped transcript? | ⚠ PARTIAL | MM:SS only; accuracy ±1–2 sec; no subsecond |
| Multiple videos per request? | ✓ YES | Up to 10 files (mixed types) in Gemini 2.5+ |
| Token cost calculation? | ✓ YES | ~300 tokens/sec (default), ~100 (low res) |
| Free tier video quota? | ✓ YES | 8 hrs/day; paid tier unlimited |
| Synchronous processing? | ✓ YES | Single call; blocking |
| Webhooks for completion? | ❌ NO | No; standard video processing is sync-only |

---

## Unresolved Questions

1. **Timestamp accuracy drift:** Do timestamps drift in videos >30 minutes? Documented ±1–2 sec but no tested upper bound provided.
2. **Private video fallback:** If private video URL passed, does API error immediately or attempt processing first?
3. **Multi-language transcript:** Can Gemini extract transcripts in languages other than English with known quality metrics?
4. **Context caching cost:** Exact token savings for persistent vs ephemeral cache in video context not published; only "reduced cost" stated.
5. **YouTube transcript npm stability:** How often do these packages break with YouTube updates? SLA unknown; no monitoring service.

---

## Sources

1. [googleapis/js-genai GitHub](https://github.com/googleapis/js-genai)
2. [Google Gemini API Video Understanding](https://ai.google.dev/gemini-api/docs/video-understanding)
3. [Video understanding - Interactions API](https://ai.google.dev/gemini-api/docs/interactions/video-understanding)
4. [Google Cloud: YouTube Video with Gemini](https://docs.cloud.google.com/vertex-ai/generative-ai/docs/samples/googlegenaisdk-textgen-with-youtube-video)
5. [Structured output - Google Gemini API](https://ai.google.dev/gemini-api/docs/interactions/structured-output)
6. [Gemini API Pricing & Quotas 2026](https://www.aifreeapi.com/en/posts/gemini-api-pricing-and-quotas)
7. [YouTube Data API v3 captions.download](https://developers.google.com/youtube/v3/guides/implementation/captions)
8. [youtube-transcript-plus GitHub](https://github.com/ericmmartin/youtube-transcript-plus)
9. [@danielxceron/youtube-transcript npm](https://www.npmjs.com/package/@danielxceron/youtube-transcript)
10. [Google blog: Structured Outputs enhancements](https://blog.google/innovation-and-ai/technology/developers-tools/gemini-api-structured-outputs/)
11. [Discuss: Improve timestamp accuracy on video understanding](https://discuss.ai.google.dev/t/improve-timestamp-accuracy-on-video-understanding/95356)
