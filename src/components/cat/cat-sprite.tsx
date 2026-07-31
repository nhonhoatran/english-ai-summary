"use client";

import React from "react";
import Image from "next/image";
import { CatMood } from "@/lib/cat/compute-cat-mood";

interface CatSpriteProps {
  mood: CatMood;
  size?: number;
  accessories?: string[];
}

const MOOD_IMAGES: Record<CatMood, string> = {
  happy: "/cat/cat-happy.png",
  playing: "/cat/cat-playing.png",
  sleeping: "/cat/cat-sleeping.png",
  hungry: "/cat/cat-hungry.png",
  sad: "/cat/cat-sad.png",
  dirty: "/cat/cat-dirty.png",
};

export function CatSprite({ mood, size = 80 }: CatSpriteProps) {
  const imgSrc = MOOD_IMAGES[mood] || MOOD_IMAGES.happy;

  return (
    <div
      className="relative flex items-center justify-center select-none"
      style={{ width: `${size}px`, height: `${size}px` }}
      aria-label={`Mèo Mochi trạng thái: ${mood}`}
    >
      {/* Mood floating indicators */}
      {mood === "sleeping" && (
        <div className="absolute -top-3 right-0 text-xs font-bold text-indigo-400 animate-bounce z-10">
          Z<span className="text-[10px]">z</span><span className="text-[8px]">z</span>
        </div>
      )}

      {mood === "playing" && (
        <div className="absolute -top-2 left-0 text-amber-400 text-sm animate-spin z-10">
          ✨
        </div>
      )}

      {mood === "sad" && (
        <div className="absolute top-2 left-0 w-2 h-3 bg-sky-400 rounded-full animate-ping opacity-75 z-10" />
      )}

      {/* Cat Image container with animations */}
      <div className={`relative w-full h-full cat-anim-${mood} flex items-center justify-center`}>
        <Image
          src={imgSrc}
          alt={`Mèo đen trắng - ${mood}`}
          width={size}
          height={size}
          className="object-contain drop-shadow-xl rounded-2xl transition-transform duration-300 hover:scale-105"
          priority
        />
      </div>

      <style jsx global>{`
        @keyframes catBounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
        @keyframes catJump {
          0%, 100% { transform: translateY(0) scale(1, 1); }
          30% { transform: translateY(-10px) scale(0.95, 1.05); }
          60% { transform: translateY(0) scale(1.05, 0.95); }
        }
        @keyframes catSway {
          0%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(-3deg); }
          75% { transform: rotate(3deg); }
        }
        @keyframes catBreathe {
          0%, 100% { transform: scale(1, 1); }
          50% { transform: scale(1.02, 0.98); }
        }
        @keyframes catDroop {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(3px); }
        }

        .cat-anim-happy { animation: catBounce 1.5s ease-in-out infinite; }
        .cat-anim-playing { animation: catJump 1s ease-in-out infinite; }
        .cat-anim-hungry { animation: catSway 2s ease-in-out infinite; }
        .cat-anim-sleeping { animation: catBreathe 3s ease-in-out infinite; }
        .cat-anim-sad { animation: catDroop 2.5s ease-in-out infinite; }
        .cat-anim-dirty { animation: catSway 2.5s ease-in-out infinite; }
      `}</style>
    </div>
  );
}
