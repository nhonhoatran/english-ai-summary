// path/to/src/lib/speech/rank-english-voices.ts

/**
 * Minimal shape of `SpeechSynthesisVoice` this module needs.
 * Declaring it separately keeps the ranking pure and testable under Node.
 */
export interface RankableVoice {
  name: string;
  lang: string;
  localService: boolean;
}

/**
 * Quality hints tuned for Chrome (desktop + Android) and mobile Safari, which
 * are the browsers this app is actually used in. Higher score = more natural.
 *
 * Without an explicit pick the browser falls back to its default voice, which
 * on Windows is a legacy SAPI voice (David/Zira) and on iOS can be a "compact"
 * voice — both markedly more robotic than what is otherwise available.
 */
const NAME_RULES: ReadonlyArray<{ pattern: RegExp; score: number }> = [
  // Edge's "Microsoft Ava Online (Natural)" family — best of the free voices.
  { pattern: /natural/i, score: 120 },
  // Chrome desktop and Android: "Google US English", "Google UK English Female".
  { pattern: /^google/i, score: 100 },
  // Android TTS variant ids, e.g. "en-us-x-sfg#female_1-local".
  { pattern: /^en-[a-z]{2}-x-/i, score: 70 },
  // iOS/macOS voices the user downloaded at higher quality.
  { pattern: /\b(enhanced|premium)\b/i, score: 60 },
  // Modern iOS/macOS defaults.
  { pattern: /^(samantha|ava|allison|susan|nicky|aaron|evan|zoe|alex|serena|siri)\b/i, score: 55 },
  // Older but still acceptable Apple voices.
  { pattern: /^(karen|daniel|moira|tessa|rishi|fiona)\b/i, score: 30 },
  // Legacy Windows SAPI voices — the robotic default we are escaping.
  { pattern: /desktop/i, score: -100 },
  { pattern: /microsoft (david|zira|mark|hazel|george)/i, score: -80 },
  // iOS low-footprint voices, noticeably worse than that platform's default.
  { pattern: /compact/i, score: -140 },
  { pattern: /eloquence/i, score: -120 },
];

const LANG_BONUS: ReadonlyArray<{ prefix: string; score: number }> = [
  { prefix: "en-us", score: 25 },
  { prefix: "en-gb", score: 15 },
  { prefix: "en-au", score: 5 },
];

export function isEnglishVoice(voice: RankableVoice): boolean {
  return voice.lang.toLowerCase().startsWith("en");
}

/** Higher is better. Exported for tests and for debugging voice availability. */
export function scoreVoice(voice: RankableVoice): number {
  const lang = voice.lang.toLowerCase();
  let score = 0;

  for (const rule of NAME_RULES) {
    if (rule.pattern.test(voice.name)) score += rule.score;
  }

  const langRule = LANG_BONUS.find((entry) => lang.startsWith(entry.prefix));
  if (langRule) score += langRule.score;

  // Cloud-backed voices are synthesised server-side and generally beat the
  // on-device ones, so break ties in their favour.
  if (!voice.localService) score += 30;

  return score;
}

/**
 * English voices only, best first, duplicates by name removed.
 * The first entry is what we use when the user has not picked a voice.
 */
/**
 * Label for the voice picker. Android exposes opaque ids such as
 * "en-us-x-sfg#female_1-local", so those get rewritten into something readable.
 */
export function describeVoice(voice: RankableVoice): string {
  const android = /^en-([a-z]{2})-x-[a-z]+#(male|female)_(\d+)/i.exec(voice.name);
  if (android) {
    const [, region, gender, index] = android;
    return `Google ${region.toUpperCase()} — ${gender.toLowerCase() === "male" ? "Nam" : "Nữ"} ${index}`;
  }
  return voice.name;
}

export function rankEnglishVoices<T extends RankableVoice>(voices: readonly T[]): T[] {
  const seen = new Set<string>();
  const english: T[] = [];

  for (const voice of voices) {
    if (!isEnglishVoice(voice) || seen.has(voice.name)) continue;
    seen.add(voice.name);
    english.push(voice);
  }

  return english.sort((a, b) => {
    const diff = scoreVoice(b) - scoreVoice(a);
    return diff !== 0 ? diff : a.name.localeCompare(b.name);
  });
}
