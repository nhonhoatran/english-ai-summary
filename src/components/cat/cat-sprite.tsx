"use client";

import React from "react";
import { CatMood } from "@/lib/cat/compute-cat-mood";

interface CatSpriteProps {
  mood: CatMood;
  size?: number; // Size in px (default 80)
  className?: string;
}

export function CatSprite({ mood, size = 80, className = "" }: CatSpriteProps) {
  // Scale relative to base size of 100px
  const scale = size / 100;

  return (
    <div
      className={`relative inline-block select-none ${className}`}
      style={{ width: `${size}px`, height: `${size}px` }}
      aria-label={`Mèo Mochi trạng thái: ${mood}`}
    >
      <div
        className="origin-bottom-center transition-transform duration-300 w-[100px] h-[100px] relative"
        style={{ transform: `scale(${scale})` }}
      >
        {/* Shadow */}
        <div className="absolute bottom-1 left-[15px] w-[70px] h-[12px] bg-black/15 rounded-full blur-[2px] animate-pulse" />

        {/* Floating elements for specific moods */}
        {mood === "sleeping" && (
          <div className="absolute -top-4 right-1 text-xs font-bold text-indigo-400 animate-bounce">
            Z<span className="text-[10px]">z</span><span className="text-[8px]">z</span>
          </div>
        )}

        {mood === "sad" && (
          <div className="absolute top-8 left-2 w-2 h-3 bg-sky-400 rounded-full animate-ping opacity-75" />
        )}

        {mood === "playing" && (
          <div className="absolute -top-2 left-2 text-yellow-400 text-sm animate-spin">
            ✨
          </div>
        )}

        {/* Cat Outer Wrapper with mood animation */}
        <div className={`w-full h-full relative cat-anim-${mood}`}>
          {/* Tail */}
          <div className="absolute bottom-4 right-1 w-4 h-12 border-r-4 border-t-4 border-slate-700 rounded-tr-full origin-bottom animate-wiggle" />

          {/* Ears */}
          {/* Left Ear */}
          <div className="absolute top-3 left-4 w-7 h-8 bg-slate-800 rounded-tl-full transform -rotate-12 border-2 border-slate-800">
            <div className="w-3 h-4 bg-pink-200 rounded-tl-full m-1" />
          </div>
          {/* Right Ear */}
          <div className="absolute top-3 right-4 w-7 h-8 bg-white rounded-tr-full transform rotate-12 border-2 border-slate-700">
            <div className="w-3 h-4 bg-pink-200 rounded-tr-full m-1" />
          </div>

          {/* Head & Body (Kawaii round blob shape) */}
          <div
            className={`absolute bottom-2 left-3 w-[74px] h-[68px] bg-white border-3 border-slate-700 rounded-[40%] shadow-md overflow-hidden ${
              mood === "dirty" ? "brightness-90 bg-amber-50" : ""
            }`}
          >
            {/* Black patch on top left of head */}
            <div className="absolute top-0 left-0 w-8 h-8 bg-slate-800 rounded-br-full" />

            {/* Dirt smudges for dirty mood */}
            {mood === "dirty" && (
              <>
                <div className="absolute bottom-2 right-2 w-3 h-2 bg-amber-700/30 rounded-full blur-[1px]" />
                <div className="absolute top-4 right-4 w-2 h-2 bg-amber-700/30 rounded-full blur-[1px]" />
              </>
            )}

            {/* Face Container */}
            <div className="relative w-full h-full">
              {/* Eyes */}
              <div className="absolute top-6 left-3 right-3 flex justify-between items-center px-2">
                {/* Left Eye */}
                {mood === "happy" || mood === "playing" ? (
                  <div className="text-slate-800 font-bold text-sm leading-none">^</div>
                ) : mood === "sleeping" ? (
                  <div className="w-3 h-1 border-b-2 border-slate-800 rounded-full" />
                ) : mood === "sad" ? (
                  <div className="w-3 h-3 border-t-2 border-slate-800 rounded-t-full transform rotate-12" />
                ) : mood === "hungry" ? (
                  <div className="w-3 h-1 bg-slate-800 rounded-full" />
                ) : (
                  // default / dirty
                  <div className="w-3 h-3 bg-slate-800 rounded-full relative">
                    <div className="w-1 h-1 bg-white rounded-full absolute top-0.5 right-0.5" />
                  </div>
                )}

                {/* Right Eye */}
                {mood === "happy" || mood === "playing" ? (
                  <div className="text-slate-800 font-bold text-sm leading-none">^</div>
                ) : mood === "sleeping" ? (
                  <div className="w-3 h-1 border-b-2 border-slate-800 rounded-full" />
                ) : mood === "sad" ? (
                  <div className="w-3 h-3 border-t-2 border-slate-800 rounded-t-full transform -rotate-12" />
                ) : mood === "hungry" ? (
                  <div className="w-3 h-1 bg-slate-800 rounded-full" />
                ) : (
                  // default / dirty
                  <div className="w-3 h-3 bg-slate-800 rounded-full relative">
                    <div className="w-1 h-1 bg-white rounded-full absolute top-0.5 right-0.5" />
                  </div>
                )}
              </div>

              {/* Pink Cheeks */}
              <div className="absolute top-8 left-2.5 w-2.5 h-1.5 bg-pink-300 rounded-full opacity-70" />
              <div className="absolute top-8 right-2.5 w-2.5 h-1.5 bg-pink-300 rounded-full opacity-70" />

              {/* Nose & Mouth */}
              <div className="absolute top-7 left-1/2 -translate-x-1/2 flex flex-col items-center">
                <div className="w-1.5 h-1 bg-pink-400 rounded-full" />
                {mood === "happy" || mood === "playing" ? (
                  <div className="text-[10px] font-bold text-slate-800 leading-none -mt-0.5">3</div>
                ) : mood === "hungry" ? (
                  <div className="w-2 h-2 border border-slate-800 rounded-full bg-slate-800 -mt-0.5" />
                ) : mood === "sad" ? (
                  <div className="w-2 h-1 border-t-2 border-slate-800 rounded-t-full -mt-0.5" />
                ) : (
                  <div className="text-[9px] font-bold text-slate-700 leading-none -mt-0.5">ω</div>
                )}
              </div>

              {/* Whiskers */}
              <div className="absolute top-7 left-0.5 w-2 h-0.5 bg-slate-400 rotate-12" />
              <div className="absolute top-8.5 left-0.5 w-2 h-0.5 bg-slate-400 -rotate-6" />
              <div className="absolute top-7 right-0.5 w-2 h-0.5 bg-slate-400 -rotate-12" />
              <div className="absolute top-8.5 right-0.5 w-2 h-0.5 bg-slate-400 rotate-6" />
            </div>

            {/* Paws */}
            <div className="absolute bottom-0 left-3 w-3 h-2 bg-white border-2 border-slate-700 rounded-t-full" />
            <div className="absolute bottom-0 right-3 w-3 h-2 bg-white border-2 border-slate-700 rounded-t-full" />
          </div>
        </div>
      </div>

      {/* Embedded CSS Animations */}
      <style jsx global>{`
        @keyframes catBounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        @keyframes catJump {
          0%, 100% { transform: translateY(0) scale(1, 1); }
          30% { transform: translateY(-14px) scale(0.9, 1.1); }
          60% { transform: translateY(0) scale(1.1, 0.9); }
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
        @keyframes catWiggle {
          0%, 100% { transform: rotate(0deg); }
          50% { transform: rotate(15deg); }
        }

        .cat-anim-happy { animation: catBounce 1.2s ease-in-out infinite; }
        .cat-anim-playing { animation: catJump 0.8s ease-in-out infinite; }
        .cat-anim-hungry { animation: catSway 2s ease-in-out infinite; }
        .cat-anim-sleeping { animation: catBreathe 3s ease-in-out infinite; }
        .cat-anim-sad { animation: catDroop 2s ease-in-out infinite; }
        .cat-anim-dirty { animation: catSway 2.5s ease-in-out infinite; }
        .animate-wiggle { animation: catWiggle 2s ease-in-out infinite; }
      `}</style>
    </div>
  );
}
