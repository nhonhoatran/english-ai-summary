# Phase 03 — IPA Enrichment (Dictionary API Fallback)

**Effort:** 1.5h | **Priority:** P1 | **Status:** completed  
**Depends on:** Phase 02 (vocabItems.ipa field exists in DB)  
**Blocks:** Phase 07 (vocabulary display)

---

## Goal

After Gemini generates vocab items (with IPA attempt), call Free Dictionary API for any item where:
- `ipa` is null/empty, OR
- `ipa` string looks malformed (doesn't contain `/` or `[` — basic IPA markers)

This is English-only. For Chinese lessons, Pinyin is handled entirely in the prompt (no API fallback needed).

---

## Architecture

```
ingest-lesson.ts
  └── generateLesson() → vocabItems with ipa? from Gemini
  └── enrichVocabWithIpa(vocabItems) → fills missing ipa from Dictionary API  [NEW]
  └── db.$transaction() → saves enriched vocabItems
```

---

## Step 1: Create `src/lib/ingest/enrich-vocab-ipa.ts` (NEW FILE)

```typescript
// path/to/src/lib/ingest/enrich-vocab-ipa.ts

interface VocabWithIpa {
  term: string;
  meaning: string;
  ipa: string | null | undefined;
  example: string;
}

const DICTIONARY_API_BASE = "https://api.dictionaryapi.dev/api/v2/entries/en";

/**
 * For each vocab item without a valid IPA string, fetch from Free Dictionary API.
 * English lessons only. Returns items with ipa filled where available.
 * Fails silently — missing IPA is acceptable.
 */
export async function enrichVocabWithIpa(
  items: VocabWithIpa[]
): Promise<VocabWithIpa[]> {
  const results = await Promise.allSettled(
    items.map(async (item) => {
      if (isValidIpa(item.ipa)) return item;

      const ipa = await fetchIpaFromDictionary(item.term);
      return { ...item, ipa: ipa ?? item.ipa ?? null };
    })
  );

  return results.map((r, i) =>
    r.status === "fulfilled" ? r.value : items[i]
  );
}

function isValidIpa(ipa: string | null | undefined): boolean {
  if (!ipa || ipa.trim().length === 0) return false;
  return ipa.includes("/") || ipa.includes("[");
}

async function fetchIpaFromDictionary(term: string): Promise<string | null> {
  try {
    const encodedTerm = encodeURIComponent(term.trim().toLowerCase());
    const res = await fetch(`${DICTIONARY_API_BASE}/${encodedTerm}`, {
      next: { revalidate: 86400 }, // cache 24h in Next.js
    });

    if (!res.ok) return null;

    const data = await res.json();
    // API returns array of entries, each with phonetics array
    const phonetic = data?.[0]?.phonetics?.find(
      (p: { text?: string }) => p.text && p.text.includes("/")
    );
    return phonetic?.text ?? data?.[0]?.phonetic ?? null;
  } catch {
    return null;
  }
}
```

> **Edge cases handled:**
> - Phrasal verbs (e.g. "take off") — API may return null → acceptable, leave ipa null
> - Idioms — same handling
> - Rate limiting — `Promise.allSettled` ensures one failure doesn't break others
> - Network timeout — fetch will throw, caught by try/catch, returns null

---

## Step 2: Update `ingest-lesson.ts`

After `generateLesson()` call, before the DB transaction:

```typescript
import { enrichVocabWithIpa } from "./enrich-vocab-ipa";

// ...inside try block, after generateLesson():

let enrichedVocabItems = generated.vocabItems;

// Only enrich for English lessons
if ((options?.targetLanguage ?? "english") === "english") {
  enrichedVocabItems = await enrichVocabWithIpa(generated.vocabItems);
  console.log(`[ingestLesson] IPA enrichment complete for ${enrichedVocabItems.length} vocab items`);
}

// Then use enrichedVocabItems in the transaction
```

---

## Step 3: Update vocab display in `tab-vocabulary.tsx`

Add IPA display below the term:

```tsx
<div className="flex items-center gap-2">
  <h4 className="text-lg font-bold text-white tracking-wide">
    {item.term}
  </h4>
  {item.ipa && (
    <span className="text-sm text-zinc-400 font-mono">
      {item.ipa}
    </span>
  )}
</div>
```

Update `VocabItemData` interface:
```typescript
interface VocabItemData {
  id: string;
  orderIndex: number;
  term: string;
  ipa: string | null;   // NEW
  meaning: string;
  example: string;
  flashcard: { id: string } | null;
}
```

Update `lesson page.tsx` vocabItemsForTab mapping to include `ipa: item.ipa`.

---

## Pre-condition test (do BEFORE implementing)

Run this test manually in Node REPL or a scratch script to confirm API works:

```bash
curl "https://api.dictionaryapi.dev/api/v2/entries/en/take%20off"
curl "https://api.dictionaryapi.dev/api/v2/entries/en/give%20in"
curl "https://api.dictionaryapi.dev/api/v2/entries/en/ubiquitous"
```

Expected: phrasal verbs may return 404 (OK — null IPA fallback). Single words should return phonetic.

---

## Verification checklist

- [x] Pre-condition test passes (curl tests run, behavior confirmed)
- [x] `enrich-vocab-ipa.ts` < 80 lines
- [x] `enrichVocabWithIpa` does NOT throw on 404 or network error
- [x] Generate 1 English lesson → check `vocabItems` in DB: some have `ipa`, some null
- [x] UI shows IPA in gray mono font next to term
- [x] `npx tsc --noEmit` passes

---

## Risk

**LOW** — API call is entirely optional enrichment. If it fails, lesson still saves. No user-visible errors.
