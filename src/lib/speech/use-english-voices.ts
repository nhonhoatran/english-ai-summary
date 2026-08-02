// path/to/src/lib/speech/use-english-voices.ts
"use client";

import { useCallback, useSyncExternalStore } from "react";
import { rankEnglishVoices } from "./rank-english-voices";

const PREFERENCE_KEY = "english-summary:tts-voice";

/* -------------------------------------------------------------------------- */
/* Voice list store                                                           */
/* -------------------------------------------------------------------------- */

const EMPTY: SpeechSynthesisVoice[] = [];

// `getVoices()` returns a fresh array on every call, so useSyncExternalStore
// would loop forever without caching. Recompute only when the roster changes.
let cachedVoices: SpeechSynthesisVoice[] = EMPTY;
let cachedKey = "";

function supportsSpeech(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

function getVoicesSnapshot(): SpeechSynthesisVoice[] {
  if (!supportsSpeech()) return EMPTY;

  const raw = window.speechSynthesis.getVoices();
  const key = raw.map((v) => `${v.name}:${v.lang}`).join("|");
  if (key !== cachedKey) {
    cachedKey = key;
    cachedVoices = rankEnglishVoices(raw);
  }
  return cachedVoices;
}

function subscribeToVoices(onChange: () => void): () => void {
  if (!supportsSpeech()) return () => {};

  window.speechSynthesis.addEventListener("voiceschanged", onChange);

  // Chrome populates the list asynchronously and some builds never fire
  // `voiceschanged`, so poll briefly until the first voices show up.
  let attempts = 0;
  const timer = window.setInterval(() => {
    attempts += 1;
    if (window.speechSynthesis.getVoices().length > 0 || attempts >= 20) {
      window.clearInterval(timer);
    }
    onChange();
  }, 250);

  return () => {
    window.clearInterval(timer);
    window.speechSynthesis.removeEventListener("voiceschanged", onChange);
  };
}

/* -------------------------------------------------------------------------- */
/* Saved preference store                                                     */
/* -------------------------------------------------------------------------- */

const preferenceListeners = new Set<() => void>();

function subscribeToPreference(onChange: () => void): () => void {
  preferenceListeners.add(onChange);
  // Keep other tabs of the same lesson in sync.
  window.addEventListener("storage", onChange);
  return () => {
    preferenceListeners.delete(onChange);
    window.removeEventListener("storage", onChange);
  };
}

function getPreferenceSnapshot(): string | null {
  try {
    return window.localStorage.getItem(PREFERENCE_KEY);
  } catch {
    // Private browsing / disabled storage: fall back to the ranked default.
    return null;
  }
}

const getServerPreference = () => null;

/* -------------------------------------------------------------------------- */
/* Hook                                                                       */
/* -------------------------------------------------------------------------- */

export interface EnglishVoices {
  /** English voices, best sounding first. Empty until the browser loads them. */
  voices: SpeechSynthesisVoice[];
  /** The voice to speak with: the saved pick, else the best ranked one. */
  selectedVoice: SpeechSynthesisVoice | null;
  selectVoice: (name: string) => void;
}

/**
 * Exposes the browser's English voices, best first, plus a persisted user pick.
 *
 * Both stores go through `useSyncExternalStore` so nothing is written to state
 * during an effect and the server render stays empty (no hydration mismatch).
 */
export function useEnglishVoices(): EnglishVoices {
  const voices = useSyncExternalStore(subscribeToVoices, getVoicesSnapshot, () => EMPTY);
  const savedName = useSyncExternalStore(
    subscribeToPreference,
    getPreferenceSnapshot,
    getServerPreference
  );

  const selectVoice = useCallback((name: string) => {
    try {
      window.localStorage.setItem(PREFERENCE_KEY, name);
    } catch {
      // Ignore write failures; the pick simply will not survive a reload.
    }
    preferenceListeners.forEach((listener) => listener());
  }, []);

  const selectedVoice = voices.find((v) => v.name === savedName) ?? voices[0] ?? null;

  // Callers gate the voice picker on `voices.length`, which is empty both on
  // the server and on the first client render — so hydration always matches.
  return { voices, selectedVoice, selectVoice };
}
