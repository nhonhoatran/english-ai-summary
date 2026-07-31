"use client";

// Web Audio API Synthesizer for Cat Sounds (zero external audio files needed)

let audioCtx: AudioContext | null = null;
let soundMuted = false;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!audioCtx) {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioCtx) {
      audioCtx = new AudioCtx();
    }
  }
  if (audioCtx && audioCtx.state === "suspended") {
    audioCtx.resume();
  }
  return audioCtx;
}

export function toggleCatMute(): boolean {
  soundMuted = !soundMuted;
  return soundMuted;
}

export function isCatMuted(): boolean {
  return soundMuted;
}

/**
 * Play a synthesized cute cat meow sound!
 */
export function playCatMeow(type: "happy" | "cute" | "sad" | "angry" = "happy") {
  if (soundMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = "sine";

  // Base frequencies and pitch bend based on meow type
  if (type === "cute") {
    osc.frequency.setValueAtTime(700, now);
    osc.frequency.exponentialRampToValueAtTime(1100, now + 0.15);
    osc.frequency.exponentialRampToValueAtTime(600, now + 0.35);
  } else if (type === "sad") {
    osc.frequency.setValueAtTime(500, now);
    osc.frequency.exponentialRampToValueAtTime(650, now + 0.2);
    osc.frequency.exponentialRampToValueAtTime(350, now + 0.5);
  } else if (type === "angry") {
    osc.frequency.setValueAtTime(350, now);
    osc.frequency.linearRampToValueAtTime(500, now + 0.1);
    osc.frequency.linearRampToValueAtTime(300, now + 0.3);
  } else {
    // Happy default meow
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.exponentialRampToValueAtTime(950, now + 0.12);
    osc.frequency.exponentialRampToValueAtTime(550, now + 0.3);
  }

  // Envelope for volume
  gain.gain.setValueAtTime(0.01, now);
  gain.gain.linearRampToValueAtTime(0.25, now + 0.08);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.36);
}

/**
 * Play a low purring rumbling sound
 */
export function playCatPurr() {
  if (soundMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = "triangle";
  osc.frequency.setValueAtTime(75, now);
  
  // Frequency vibrato for purring rhythm
  const lfo = ctx.createOscillator();
  const lfoGain = ctx.createGain();
  lfo.frequency.setValueAtTime(25, now); // purr pulse speed
  lfoGain.gain.setValueAtTime(15, now);

  lfo.connect(osc.frequency);

  gain.gain.setValueAtTime(0.01, now);
  gain.gain.linearRampToValueAtTime(0.18, now + 0.1);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

  lfo.start(now);
  osc.start(now);

  lfo.stop(now + 0.65);
  osc.stop(now + 0.65);

  osc.connect(gain);
  gain.connect(ctx.destination);
}

/**
 * Play crunching/munching sound for feeding
 */
export function playCatMunch() {
  if (soundMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  for (let i = 0; i < 3; i++) {
    const delay = i * 0.12;
    const now = ctx.currentTime + delay;
    
    // Short noise burst for crunch
    const bufferSize = ctx.sampleRate * 0.05;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let j = 0; j < bufferSize; j++) {
      data[j] = Math.random() * 2 - 1;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = 1200 + Math.random() * 400;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    noise.start(now);
    noise.stop(now + 0.05);
  }
}

/**
 * Play splash/bubble sound for bathing
 */
export function playCatSplash() {
  if (soundMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;

  for (let i = 0; i < 4; i++) {
    const delay = i * 0.08;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    const startFreq = 400 + Math.random() * 400;
    osc.frequency.setValueAtTime(startFreq, now + delay);
    osc.frequency.exponentialRampToValueAtTime(startFreq + 600, now + delay + 0.08);

    gain.gain.setValueAtTime(0.15, now + delay);
    gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.08);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now + delay);
    osc.stop(now + delay + 0.09);
  }
}

/**
 * Play pop / button click sound
 */
export function playCatPop() {
  if (soundMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = "sine";
  osc.frequency.setValueAtTime(400, now);
  osc.frequency.exponentialRampToValueAtTime(800, now + 0.05);

  gain.gain.setValueAtTime(0.2, now);
  gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.06);
}
