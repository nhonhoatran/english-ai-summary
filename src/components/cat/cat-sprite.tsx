"use client";

import React, { useState, useRef, useEffect } from "react";
import { CatMood } from "@/lib/cat/compute-cat-mood";
import { CatAnimatedSvg } from "./cat-animated-svg";
import {
  playCatMeow,
  playCatPurr,
  playCatMunch,
  playCatSplash,
} from "@/lib/cat/cat-audio";

export type CatActionType = "feed" | "bath" | "pet" | "play" | null;

interface CatSpriteProps {
  mood: CatMood;
  size?: number;
  accessories?: string[];
  actionState?: CatActionType;
  onActionComplete?: () => void;
  interactive?: boolean;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  text: string;
  color?: string;
  size?: string;
}

export function CatSprite({
  mood,
  size = 140,
  actionState = null,
  onActionComplete,
  interactive = true,
}: CatSpriteProps) {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [isSquishing, setIsSquishing] = useState(false);
  const [isSpinning, setIsSpinning] = useState(false);
  const [isPettingActive, setIsPettingActive] = useState(false);

  const lastPetTimeRef = useRef<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Handle action animations and sound effects
  useEffect(() => {
    if (!actionState) return;

    if (actionState === "feed") {
      playCatMunch();
      setIsSquishing(true);
      spawnActionParticles(["🍲", "🍖", "Ngon quá!", "+20 🍖"], "#f59e0b");
      const timer = setTimeout(() => {
        setIsSquishing(false);
        if (onActionComplete) onActionComplete();
      }, 1200);
      return () => clearTimeout(timer);
    }

    if (actionState === "bath") {
      playCatSplash();
      setIsSquishing(true);
      spawnActionParticles(["🧼", "🫧", "Sạch rồi!", "+25 🧼"], "#0284c7");
      const timer = setTimeout(() => {
        setIsSquishing(false);
        if (onActionComplete) onActionComplete();
      }, 1200);
      return () => clearTimeout(timer);
    }

    if (actionState === "play") {
      playCatMeow("cute");
      setIsSpinning(true);
      spawnActionParticles(["🧶", "⭐", "Vui quá!", "+15 ❤️"], "#6366f1");
      const timer = setTimeout(() => {
        setIsSpinning(false);
        if (onActionComplete) onActionComplete();
      }, 1200);
      return () => clearTimeout(timer);
    }

    if (actionState === "pet") {
      playCatPurr();
      setIsSquishing(true);
      spawnActionParticles(["❤️", "💕", "Purr~", "+10 ❤️"], "#ec4899");
      const timer = setTimeout(() => {
        setIsSquishing(false);
        if (onActionComplete) onActionComplete();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [actionState]);

  const spawnActionParticles = (texts: string[], color: string) => {
    const newParticles: Particle[] = texts.map((text, idx) => ({
      id: Date.now() + idx,
      x: size / 2 + (Math.random() * 40 - 20),
      y: size / 3 + (Math.random() * 20 - 10) - idx * 15,
      text,
      color,
      size: "text-sm sm:text-base font-extrabold",
    }));

    setParticles((prev) => [...prev, ...newParticles]);

    setTimeout(() => {
      setParticles((prev) =>
        prev.filter((p) => !newParticles.some((np) => np.id === p.id))
      );
    }, 1200);
  };

  // Click on Cat Reaction
  const handleCatClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!interactive) return;

    playCatMeow(mood === "sad" ? "sad" : mood === "sleeping" ? "cute" : "happy");

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const meowQuotes = [
      "Meow~ ❤️",
      "Purr~ ✨",
      "🐾",
      "Mochi nè!",
      "Thương anh! 💕",
    ];
    const text = meowQuotes[Math.floor(Math.random() * meowQuotes.length)];

    setParticles((prev) => [
      ...prev,
      { id: Date.now(), x, y, text, color: "#f43f5e", size: "text-xs font-bold" },
    ]);

    setIsSquishing(true);
    setTimeout(() => setIsSquishing(false), 300);

    setTimeout(() => {
      setParticles((prev) => prev.filter((p) => Date.now() - p.id < 1000));
    }, 1000);
  };

  // Mouse Move / Stroking Petting Interaction
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!interactive || mood === "sleeping") return;

    const now = Date.now();
    if (now - lastPetTimeRef.current > 250) {
      lastPetTimeRef.current = now;
      setIsPettingActive(true);
      playCatPurr();

      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const items = ["❤️", "✨", "🐾"];
      const text = items[Math.floor(Math.random() * items.length)];

      setParticles((prev) => [
        ...prev,
        { id: now, x, y, text, color: "#ec4899", size: "text-xs font-bold" },
      ]);

      setTimeout(() => setIsPettingActive(false), 400);
      setTimeout(() => {
        setParticles((prev) => prev.filter((p) => Date.now() - p.id < 800));
      }, 800);
    }
  };

  return (
    <div
      ref={containerRef}
      onClick={handleCatClick}
      onMouseMove={handleMouseMove}
      className={`relative flex items-center justify-center select-none ${
        interactive ? "cursor-pointer group hover:brightness-105" : ""
      }`}
      style={{ width: `${size}px`, height: `${size}px` }}
      aria-label={`Mèo Mochi trạng thái: ${mood}`}
    >
      {/* Mood Floating Badges & Special Visual Effects */}
      {mood === "sleeping" && (
        <div className="absolute -top-4 right-2 text-sm font-black text-indigo-400 animate-bounce z-20 drop-shadow">
          Z<span className="text-xs">z</span>
          <span className="text-[10px]">z</span> 💤
        </div>
      )}

      {mood === "playing" && (
        <div className="absolute -top-3 left-1 text-amber-400 text-base animate-spin z-20">
          ✨
        </div>
      )}

      {mood === "hungry" && (
        <div className="absolute -top-4 right-1 text-[11px] font-bold text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-300 shadow-sm animate-pulse z-20 flex items-center gap-1">
          <span>🐟</span> <span>Đói quá!</span>
        </div>
      )}

      {mood === "dirty" && (
        <div className="absolute -top-4 left-1 text-[11px] font-bold text-sky-600 bg-sky-100 px-2 py-0.5 rounded-full border border-sky-300 shadow-sm animate-bounce z-20 flex items-center gap-1">
          <span>🧼</span> <span>Tắm nha!</span>
        </div>
      )}

      {mood === "sad" && (
        <div className="absolute -top-4 right-2 text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-300 animate-pulse z-20">
          🥺 Hơi buồn...
        </div>
      )}

      {/* Action Overlay Effects */}
      {actionState === "feed" && (
        <div className="absolute top-0 z-30 animate-bounce text-3xl filter drop-shadow-md">
          🍲
        </div>
      )}
      {actionState === "bath" && (
        <div className="absolute inset-0 z-30 pointer-events-none flex items-center justify-center">
          <span className="animate-ping text-3xl">🫧</span>
          <span className="animate-pulse text-2xl absolute -top-2 right-2">
            🧼
          </span>
        </div>
      )}
      {actionState === "play" && (
        <div className="absolute -bottom-2 z-30 animate-spin duration-700 text-3xl">
          🧶
        </div>
      )}

      {/* SVG Vector Animated Cat Component */}
      <CatAnimatedSvg
        mood={mood}
        size={size}
        isSquishing={isSquishing}
        isSpinning={isSpinning}
        isPetting={isPettingActive}
        actionState={actionState}
      />

      {/* Floating Particles (Hearts / Meow text / Effects) */}
      {particles.map((p) => (
        <span
          key={p.id}
          className={`absolute pointer-events-none z-30 transition-all duration-700 animate-float-up ${
            p.size || "text-sm font-bold"
          }`}
          style={{
            left: `${p.x}px`,
            top: `${p.y}px`,
            color: p.color || "#f43f5e",
            textShadow: "0 2px 4px rgba(0,0,0,0.15)",
          }}
        >
          {p.text}
        </span>
      ))}

      <style jsx global>{`
        @keyframes floatUp {
          0% {
            opacity: 1;
            transform: translateY(0) scale(0.8);
          }
          100% {
            opacity: 0;
            transform: translateY(-35px) scale(1.2);
          }
        }
        .animate-float-up {
          animation: floatUp 1s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
        }
      `}</style>
    </div>
  );
}
