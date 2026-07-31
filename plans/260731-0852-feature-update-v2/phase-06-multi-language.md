# Phase 06 — Multi-language: English + Chinese

**Effort:** 5h | **Priority:** P1 | **Status:** completed  
**Depends on:** Phase 02 (targetLanguage in options + prompts)  
**Blocks:** Phase 07

---

## Goal

Support Chinese (Mandarin) lessons alongside English. User selects language when pasting a video URL.  
Same pipeline, dual prompt templates, Pinyin instead of IPA for Chinese vocab.

---

## Changes summary

| File | Change |
|---|---|
| `add-lesson-form.tsx` | Add language selector UI |
| `ingest-lesson-action.ts` | Accept + forward `targetLanguage` |
| `ingest-lesson.ts` | Pass to options + DB write |
| `fetch-youtube-captions.ts` | Accept `lang` param |
| `prompt-lesson-analysis.ts` | Already done in Phase 02 (language-aware) |
| `lesson-schemas.ts` | `targetLanguage` in schema already from Phase 01 |

---

## Step 1: Update `add-lesson-form.tsx`

Add language selector above/beside the URL input:

```tsx
// Add state
const [targetLanguage, setTargetLanguage] = useState<"english" | "chinese">("english");

// UI — language toggle (2 buttons, not dropdown for speed)
<div className="flex gap-2">
  {(["english", "chinese"] as const).map((lang) => (
    <button
      key={lang}
      type="button"
      onClick={() => setTargetLanguage(lang)}
      disabled={isPending}
      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
        targetLanguage === lang
          ? "bg-blue-600 text-white"
          : "bg-zinc-800 text-zinc-400 hover:text-white"
      }`}
    >
      {lang === "english" ? "🇺🇸 English" : "🇨🇳 Chinese"}
    </button>
  ))}
</div>
```

Pass `targetLanguage` to `ingestLessonAction`:
```typescript
const res = await ingestLessonAction(trimmed, {
  quizCount,
  vocabCount,
  grammarCount,
  dialogueCount,
  targetLanguage,  // NEW
});
```

---

## Step 2: Update `src/app/actions/ingest-lesson-action.ts`

Add `targetLanguage` to the action's options parameter and forward it to `ingestLesson()`.

---

## Step 3: Update `fetch-youtube-captions.ts`

Accept optional `lang` param:
```typescript
export async function fetchYoutubeCaptions(
  videoId: string,
  lang?: string
): Promise<TranscriptSegment[] | null> {
  const primaryLang = lang ?? "en";

  let subtitles = await getSubtitles({
    videoID: videoId,
    lang: primaryLang,
  }).catch(() => null);

  // For Chinese: try simplified first, then traditional fallback
  if ((!subtitles || subtitles.length === 0) && primaryLang === "zh-Hans") {
    subtitles = await getSubtitles({ videoID: videoId, lang: "zh-Hant" }).catch(() => null);
  }

  // Final fallback: no lang filter (any available)
  if (!subtitles || subtitles.length === 0) {
    subtitles = await getSubtitles({ videoID: videoId }).catch(() => null);
  }

  // ...rest unchanged
}
```

---

## Step 4: Update `ingest-lesson.ts`

Pass `lang` to `fetchYoutubeCaptions` based on `targetLanguage`:

```typescript
const captionLang = options?.targetLanguage === "chinese" ? "zh-Hans" : "en";
const captions = await fetchYoutubeCaptions(videoId, captionLang);
```

Skip IPA enrichment for Chinese (Pinyin is in prompt output):
```typescript
// Phase 03 guard:
if ((options?.targetLanguage ?? "english") === "english") {
  enrichedVocabItems = await enrichVocabWithIpa(generated.vocabItems);
}
// For Chinese: ipa field contains Pinyin — don't overwrite with English IPA
```

---

## Step 5: Chinese-specific prompt considerations (in Phase 02 already)

Verify the language-aware prompt handles:
- `=== 2. GRAMMAR SECTION ===` → Chinese grammar themes (e.g. "measure words", "ba-construction", "aspect particles")
- `=== 4. VOCABULARY ===` → `ipa` field = Pinyin (e.g. `nǐ hǎo`, `xǐ huān`)
- `=== 7. WRITING PROMPTS ===` → `viMeaning` in Vietnamese (same), `enAnswer` = Chinese sentence (target language)

> **IMPORTANT:** `enAnswer` in writing prompts = the target language sentence (Chinese for Chinese lessons, English for English lessons).

Update `phase-05-tab-writing-practice.md` writing prompt check API:
- Prompt label: "Write in Chinese" for Chinese lessons
- Gemini check prompt adapts to language

---

## Step 6: Update `tab-vocabulary.tsx`

IPA label changes by language:
```tsx
{item.ipa && (
  <span className="text-sm text-zinc-400 font-mono" title={isEnglish ? "IPA" : "Pinyin"}>
    {item.ipa}
  </span>
)}
```

Pass `targetLanguage` to `TabVocabulary` component (from lesson page).

---

## Step 7: Update lesson page `[id]/page.tsx`

Pass `targetLanguage` down to tabs that need it:
- `TabVocabulary` — IPA vs Pinyin label
- `TabWritingPractice` — "Write in Chinese" vs "Write in English"

---

## Pre-condition tests (run BEFORE implementing)

```bash
# Test 1: Can youtube-caption-extractor fetch Chinese captions?
# Create a scratch test script with a known Chinese YouTube video
# e.g. https://www.youtube.com/watch?v=<chinese_video_id>
# Run: node -e "require('@danielxceron/youtube-transcript').getSubtitles({videoID:'<id>', lang:'zh-Hans'}).then(console.log)"

# Test 2: Gemini Chinese lesson quality
# Manually run ingestLesson with a short Chinese video URL
# Check: does Gemini produce valid Pinyin? Reasonable grammar theme?
```

---

## Verification checklist

- [x] Language selector UI renders and toggles correctly
- [x] English lesson flow unchanged (regression test)
- [x] Chinese lesson: `targetLanguage = "chinese"` saved to DB
- [x] Chinese captions fetch attempted with `zh-Hans` lang
- [x] Chinese vocab items have Pinyin in `ipa` field (not English IPA)
- [x] Pinyin NOT overwritten by Dictionary API (skip guard works)
- [x] `tab-vocabulary.tsx` shows Pinyin label correctly for Chinese lessons
- [x] Writing practice tab shows "Write in Chinese" for Chinese lessons
- [x] `npx tsc --noEmit` passes

---

## Risk

**MEDIUM-HIGH** — Depends on:
1. YouTube caption availability for Chinese videos (API may return null → Gemini fallback)
2. Gemini prompt quality for Chinese (untested until probe)
3. Pinyin accuracy from Gemini

Mitigation: If Gemini Pinyin quality is poor, Phase 06 can add a separate Pinyin lookup via CC-CEDICT or a similar Chinese dictionary API as a future enhancement.
