// path/to/src/lib/ingest/enrich-vocab-ipa.ts

interface VocabWithIpa {
  term: string;
  meaning: string;
  ipa?: string | null;
  example: string;
}

const DICTIONARY_API_BASE = "https://api.dictionaryapi.dev/api/v2/entries/en";

/**
 * For each vocab item without a valid IPA string, fetch from Free Dictionary API.
 * English lessons only. Returns items with ipa filled where available.
 * Fails silently — missing IPA is acceptable.
 */
export async function enrichVocabWithIpa<T extends VocabWithIpa>(
  items: T[]
): Promise<T[]> {
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
