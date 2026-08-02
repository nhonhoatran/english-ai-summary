// path/to/src/lib/speech/rank-english-voices.test.ts
import { describe, it, expect } from "vitest";
import { rankEnglishVoices, describeVoice, type RankableVoice } from "./rank-english-voices";

const voice = (name: string, lang: string, localService = true): RankableVoice => ({
  name,
  lang,
  localService,
});

describe("rankEnglishVoices", () => {
  it("drops non-English voices", () => {
    const result = rankEnglishVoices([
      voice("Microsoft An - Vietnamese", "vi-VN"),
      voice("Google US English", "en-US", false),
    ]);
    expect(result.map((v) => v.name)).toEqual(["Google US English"]);
  });

  it("prefers the Google cloud voice over a legacy Windows SAPI voice", () => {
    const result = rankEnglishVoices([
      voice("Microsoft David Desktop - English (United States)", "en-US"),
      voice("Microsoft Zira Desktop - English (United States)", "en-US"),
      voice("Google US English", "en-US", false),
    ]);
    expect(result[0].name).toBe("Google US English");
  });

  it("ranks Edge natural voices first when present", () => {
    const result = rankEnglishVoices([
      voice("Google US English", "en-US", false),
      voice("Microsoft Ava Online (Natural) - English (United States)", "en-US", false),
    ]);
    expect(result[0].name).toContain("Natural");
  });

  it("pushes iOS compact voices to the bottom", () => {
    const result = rankEnglishVoices([
      voice("Daniel (Compact) (English (United Kingdom))", "en-GB"),
      voice("Samantha", "en-US"),
    ]);
    expect(result[0].name).toBe("Samantha");
  });

  it("removes duplicates by name", () => {
    const result = rankEnglishVoices([voice("Samantha", "en-US"), voice("Samantha", "en-US")]);
    expect(result).toHaveLength(1);
  });

  it("sorts deterministically when scores tie", () => {
    const result = rankEnglishVoices([voice("Bravo", "en-US"), voice("Alpha", "en-US")]);
    expect(result.map((v) => v.name)).toEqual(["Alpha", "Bravo"]);
  });
});

describe("describeVoice", () => {
  it("rewrites opaque Android voice ids", () => {
    expect(describeVoice(voice("en-us-x-sfg#female_1-local", "en-US"))).toBe("Google US — Nữ 1");
  });

  it("leaves normal names untouched", () => {
    expect(describeVoice(voice("Google US English", "en-US"))).toBe("Google US English");
  });
});
