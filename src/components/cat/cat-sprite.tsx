"use client";

import React, { useState } from "react";
import Image from "next/image";
import { CatMood } from "@/lib/cat/compute-cat-mood";

interface CatSpriteProps {
  mood: CatMood;
  size?: number;
  accessories?: string[];
}

export function CatSprite({ mood, size = 120 }: CatSpriteProps) {
  const [particles, setParticles] = useState<{ id: number; x: number; y: number; text: string }[]>([]);

  const handleCatClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const icons = ["❤️", "✨", "🐾", "⭐", "🐟"];
    const text = icons[Math.floor(Math.random() * icons.length)];

    setParticles((prev) => [...prev, { id: Date.now(), x, y, text }]);

    setTimeout(() => {
      setParticles((prev) => prev.filter((p) => Date.now() - p.id < 1000));
    }, 1000);
  };

  return (
    <div
      onClick={handleCatClick}
      className="relative flex items-center justify-center select-none cursor-pointer group"
      style={{ width: `${size}px`, height: `${size}px` }}
      aria-label={`Mèo Mochi trạng thái: ${mood}`}
    >
      {/* Mood Floating Badges & Effects */}
      {mood === "sleeping" && (
        <div className="absolute -top-3 right-1 text-xs font-bold text-indigo-400 animate-bounce z-20">
          Z<span className="text-[10px]">z</span><span className="text-[8px]">z</span>
        </div>
      )}

      {mood === "playing" && (
        <div className="absolute -top-2 left-1 text-amber-400 text-sm animate-spin z-20">
          ✨
        </div>
      )}

      {mood === "hungry" && (
        <div className="absolute -top-2 right-2 text-xs font-bold text-amber-500 bg-amber-100 px-1.5 py-0.5 rounded-full border border-amber-300 animate-pulse z-20">
          🐟 Đói quá!
        </div>
      )}

      {mood === "sad" && (
        <div className="absolute top-2 left-1 w-2.5 h-3 bg-sky-400 rounded-full animate-ping opacity-75 z-20" />
      )}

      {/* Main 3D Pixar Cat Image */}
      <div className={`relative w-full h-full cat-anim-${mood} flex items-center justify-center`}>
        <Image
          src="/cat/cat-v1.png"
          alt={`Mèo 3D Pixar - ${mood}`}
          width={size}
          height={size}
          className={`object-contain drop-shadow-2xl rounded-2xl transition-transform duration-300 group-hover:scale-105 ${
            mood === "dirty" ? "sepia-[0.3] brightness-90" : ""
          } ${mood === "sleeping" ? "opacity-90" : ""}`}
          priority
        />
      </div>

      {/* Interactive floating particles on click */}
      {particles.map((p) => (
        <span
          key={p.id}
          className="absolute text-base font-bold animate-ping pointer-events-none z-30"
          style={{ left: `${p.x}px`, top: `${p.y}px` }}
        >
          {p.text}
        </span>
      ))}

      <style jsx global>{`
        @keyframes catBounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        @keyframes catJump {
          0%, 100% { transform: translateY(0) scale(1, 1); }
          30% { transform: translateY(-14px) scale(0.95, 1.05); }
          60% { transform: translateY(0) scale(1.05, 0.95); }
        }
        @keyframes catSway {
          0%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(-4deg); }
          75% { transform: rotate(4deg); }
        }
        @keyframes catBreathe {
          0%, 100% { transform: scale(1, 1); }
          50% { transform: scale(1.03, 0.97); }
        }
        @keyframes catDroop {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(4px); }
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
