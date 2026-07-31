"use client";

import React, { useState, useEffect } from "react";
import { CatMood } from "@/lib/cat/compute-cat-mood";

interface CatAnimatedSvgProps {
  mood: CatMood;
  size?: number;
  isSquishing?: boolean;
  isSpinning?: boolean;
  isPetting?: boolean;
  actionState?: "feed" | "bath" | "pet" | "play" | null;
  cursorPos?: { x: number; y: number };
}

export function CatAnimatedSvg({
  mood,
  size = 140,
  isSquishing = false,
  isSpinning = false,
  isPetting = false,
  actionState = null,
}: CatAnimatedSvgProps) {
  const [blink, setBlink] = useState(false);
  const [mouthOpen, setMouthOpen] = useState(false);

  // Random eye blinking
  useEffect(() => {
    const interval = setInterval(() => {
      setBlink(true);
      setTimeout(() => setBlink(false), 180);
    }, 3500 + Math.random() * 2000);
    return () => clearInterval(interval);
  }, []);

  // Mouth animation during action or meowing
  useEffect(() => {
    if (actionState === "feed" || actionState === "play") {
      const interval = setInterval(() => {
        setMouthOpen((prev) => !prev);
      }, 150);
      return () => clearInterval(interval);
    } else {
      setMouthOpen(false);
    }
  }, [actionState]);

  // Colors based on cat theme (Cute Orange Tabby)
  const catColor = "#ff9e43"; // Orange main body
  const catDarkColor = "#ee5253"; // Darker stripe/ear inner
  const bellyColor = "#fff5e6"; // Cream belly & muzzle
  const earInner = "#ffb8b8"; // Soft pink ear inner

  return (
    <div
      className={`relative flex items-center justify-center select-none transition-transform duration-300 ${
        isSquishing ? "scale-x-110 scale-y-90" : ""
      } ${isSpinning ? "rotate-[360deg] scale-110" : ""} ${
        isPetting ? "scale-105" : ""
      }`}
      style={{ width: `${size}px`, height: `${size}px` }}
    >
      <svg
        viewBox="0 0 200 200"
        className="w-full h-full filter drop-shadow-xl"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Gradients */}
          <linearGradient id="catBodyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffb142" />
            <stop offset="100%" stopColor="#ff793f" />
          </linearGradient>

          <linearGradient id="catBellyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#ffeaa7" />
          </linearGradient>

          <radialGradient id="blushGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ff7675" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#ff7675" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* --- TAIL (Wagging Animation) --- */}
        <g className={`tail-anim-${mood}`}>
          <path
            d="M 140 145 C 175 140, 185 90, 160 70 C 150 60, 140 75, 150 85 C 165 100, 155 130, 135 138 Z"
            fill="url(#catBodyGrad)"
            stroke="#e67e22"
            strokeWidth="2"
          />
        </g>

        {/* --- CAT BODY (Breathing / Bouncing Animation) --- */}
        <g className={`body-anim-${mood}`}>
          {/* Main Torso */}
          <ellipse
            cx="100"
            cy="135"
            rx="52"
            ry="42"
            fill="url(#catBodyGrad)"
            stroke="#e67e22"
            strokeWidth="2.5"
          />

          {/* Belly Patch */}
          <ellipse
            cx="100"
            cy="142"
            rx="34"
            ry="28"
            fill="url(#catBellyGrad)"
          />

          {/* Tabby Stripes on Back */}
          <path
            d="M 60 125 Q 70 128 65 135"
            stroke="#d35400"
            strokeWidth="3.5"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M 140 125 Q 130 128 135 135"
            stroke="#d35400"
            strokeWidth="3.5"
            strokeLinecap="round"
            fill="none"
          />

          {/* Paws (Front Feet) */}
          <g className={isPetting ? "paws-knead" : ""}>
            <ellipse
              cx="76"
              cy="168"
              rx="14"
              ry="10"
              fill="#ffffff"
              stroke="#e67e22"
              strokeWidth="2"
            />
            <ellipse
              cx="124"
              cy="168"
              rx="14"
              ry="10"
              fill="#ffffff"
              stroke="#e67e22"
              strokeWidth="2"
            />
            {/* Paw Toes */}
            <line x1="72" y1="168" x2="72" y2="174" stroke="#e67e22" strokeWidth="1.5" />
            <line x1="80" y1="168" x2="80" y2="174" stroke="#e67e22" strokeWidth="1.5" />
            <line x1="120" y1="168" x2="120" y2="174" stroke="#e67e22" strokeWidth="1.5" />
            <line x1="128" y1="168" x2="128" y2="174" stroke="#e67e22" strokeWidth="1.5" />
          </g>

          {/* --- CAT HEAD --- */}
          <g className={`head-anim-${mood}`}>
            {/* Ears (Left & Right) */}
            {/* Left Ear */}
            <g className="ear-left-anim">
              <path
                d="M 52 75 L 35 30 Q 55 40 70 58 Z"
                fill="url(#catBodyGrad)"
                stroke="#e67e22"
                strokeWidth="2.5"
              />
              <path
                d="M 54 70 L 42 38 Q 55 46 66 58 Z"
                fill={earInner}
              />
            </g>

            {/* Right Ear */}
            <g className="ear-right-anim">
              <path
                d="M 148 75 L 165 30 Q 145 40 130 58 Z"
                fill="url(#catBodyGrad)"
                stroke="#e67e22"
                strokeWidth="2.5"
              />
              <path
                d="M 146 70 L 158 38 Q 145 46 134 58 Z"
                fill={earInner}
              />
            </g>

            {/* Head Sphere */}
            <ellipse
              cx="100"
              cy="85"
              rx="48"
              ry="40"
              fill="url(#catBodyGrad)"
              stroke="#e67e22"
              strokeWidth="2.5"
            />

            {/* Muzzle (Snout Area) */}
            <ellipse cx="91" cy="95" rx="13" ry="10" fill="url(#catBellyGrad)" />
            <ellipse cx="109" cy="95" rx="13" ry="10" fill="url(#catBellyGrad)" />

            {/* Forehead Stripes */}
            <path
              d="M 100 50 L 100 62 M 93 53 L 96 64 M 107 53 L 104 64"
              stroke="#d35400"
              strokeWidth="3"
              strokeLinecap="round"
            />

            {/* Blushing Cheeks */}
            <ellipse cx="62" cy="95" rx="10" ry="6" fill="url(#blushGrad)" />
            <ellipse cx="138" cy="95" rx="10" ry="6" fill="url(#blushGrad)" />

            {/* Whiskers */}
            <g stroke="#d35400" strokeWidth="2" strokeLinecap="round" opacity="0.8">
              {/* Left Whiskers */}
              <line x1="50" y1="88" x2="20" y2="82" className="whisker-left" />
              <line x1="48" y1="95" x2="18" y2="95" className="whisker-left" />
              <line x1="50" y1="102" x2="22" y2="108" className="whisker-left" />
              {/* Right Whiskers */}
              <line x1="150" y1="88" x2="180" y2="82" className="whisker-right" />
              <line x1="152" y1="95" x2="182" y2="95" className="whisker-right" />
              <line x1="150" y1="102" x2="178" y2="108" className="whisker-right" />
            </g>

            {/* Cute Pink Nose */}
            <polygon
              points="96,90 104,90 100,96"
              fill="#ff5e57"
              rx="2"
              ry="2"
            />

            {/* --- EYES EXPRESSIONS --- */}
            {blink || mood === "sleeping" ? (
              /* Closed / Sleeping Eyes */
              <g stroke="#2d3436" strokeWidth="3.5" strokeLinecap="round" fill="none">
                <path d="M 68 80 Q 76 88 84 80" />
                <path d="M 116 80 Q 124 88 132 80" />
              </g>
            ) : mood === "happy" || isPetting ? (
              /* Happy Squinting Eyes (^ ^) */
              <g stroke="#2d3436" strokeWidth="4" strokeLinecap="round" fill="none">
                <path d="M 68 84 Q 76 74 84 84" />
                <path d="M 116 84 Q 124 74 132 84" />
              </g>
            ) : mood === "hungry" ? (
              /* Hungry Pleading Anime Eyes (🥺) */
              <g>
                <circle cx="76" cy="80" r="11" fill="#2d3436" />
                <circle cx="124" cy="80" r="11" fill="#2d3436" />
                <circle cx="73" cy="76" r="4.5" fill="#ffffff" />
                <circle cx="121" cy="76" r="4.5" fill="#ffffff" />
                <circle cx="79" cy="83" r="2" fill="#ffffff" />
                <circle cx="127" cy="83" r="2" fill="#ffffff" />
              </g>
            ) : mood === "sad" ? (
              /* Sad Teary Eyes */
              <g>
                <circle cx="76" cy="82" r="9" fill="#2d3436" />
                <circle cx="124" cy="82" r="9" fill="#2d3436" />
                <circle cx="74" cy="79" r="3.5" fill="#ffffff" />
                <circle cx="122" cy="79" r="3.5" fill="#ffffff" />
                {/* Teardrop */}
                <ellipse cx="64" cy="92" rx="3" ry="5" fill="#00cec9" opacity="0.8" />
              </g>
            ) : (
              /* Normal / Playing Curious Pupil Eyes */
              <g>
                <ellipse cx="76" cy="80" rx="10" ry="12" fill="#2d3436" />
                <ellipse cx="124" cy="80" rx="10" ry="12" fill="#2d3436" />
                {/* Eye Highlights */}
                <circle cx="73" cy="76" r="4" fill="#ffffff" />
                <circle cx="121" cy="76" r="4" fill="#ffffff" />
                <circle cx="79" cy="83" r="1.8" fill="#ffffff" />
                <circle cx="127" cy="83" r="1.8" fill="#ffffff" />
              </g>
            )}

            {/* --- MOUTH EXPRESSIONS --- */}
            {mouthOpen ? (
              /* Open Mouth for Meowing / Eating */
              <path
                d="M 94 97 Q 100 110 106 97 Z"
                fill="#ff5e57"
                stroke="#d63031"
                strokeWidth="1.5"
              />
            ) : mood === "sad" ? (
              /* Sad Frown Mouth */
              <path
                d="M 94 102 Q 100 97 106 102"
                stroke="#2d3436"
                strokeWidth="2.5"
                strokeLinecap="round"
                fill="none"
              />
            ) : (
              /* Cute Cat Smile Mouth (3 shape) */
              <path
                d="M 92 97 Q 96 102 100 97 Q 104 102 108 97"
                stroke="#2d3436"
                strokeWidth="2.5"
                strokeLinecap="round"
                fill="none"
              />
            )}
          </g>
        </g>
      </svg>

      <style jsx global>{`
        /* Tail Wagging */
        @keyframes tailWag {
          0%, 100% { transform: rotate(0deg); transform-origin: 140px 145px; }
          50% { transform: rotate(18deg); transform-origin: 140px 145px; }
        }
        @keyframes tailFastWag {
          0%, 100% { transform: rotate(-5deg); transform-origin: 140px 145px; }
          50% { transform: rotate(28deg); transform-origin: 140px 145px; }
        }
        .tail-anim-happy { animation: tailWag 1.8s ease-in-out infinite; }
        .tail-anim-playing { animation: tailFastWag 0.9s ease-in-out infinite; }
        .tail-anim-hungry { animation: tailWag 2.5s ease-in-out infinite; }
        .tail-anim-sleeping { animation: tailWag 4s ease-in-out infinite; }
        .tail-anim-sad { animation: tailWag 3.5s ease-in-out infinite; }
        .tail-anim-dirty { animation: tailWag 2.2s ease-in-out infinite; }

        /* Head & Body Animations */
        @keyframes catBreath {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-3px) scale(1.02, 0.98); }
        }
        @keyframes catPlayBop {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          25% { transform: translateY(-8px) rotate(-3deg); }
          75% { transform: translateY(0) rotate(3deg); }
        }
        @keyframes earTwitch {
          0%, 90%, 100% { transform: rotate(0deg); }
          95% { transform: rotate(-8deg); }
        }

        .body-anim-happy { animation: catBreath 2s ease-in-out infinite; }
        .body-anim-playing { animation: catPlayBop 1.1s ease-in-out infinite; }
        .body-anim-hungry { animation: catBreath 2.8s ease-in-out infinite; }
        .body-anim-sleeping { animation: catBreath 3.5s ease-in-out infinite; }
        .body-anim-sad { animation: catBreath 3s ease-in-out infinite; }
        .body-anim-dirty { animation: catBreath 2.5s ease-in-out infinite; }

        .ear-left-anim { animation: earTwitch 4s ease-in-out infinite; transform-origin: 52px 75px; }
        .ear-right-anim { animation: earTwitch 4.5s ease-in-out infinite 0.5s; transform-origin: 148px 75px; }

        /* Whisker twitch */
        @keyframes whiskerMove {
          0%, 100% { transform: rotate(0deg); }
          50% { transform: rotate(3deg); }
        }
        .whisker-left { animation: whiskerMove 3s ease-in-out infinite; transform-origin: 50px 95px; }
        .whisker-right { animation: whiskerMove 3s ease-in-out infinite 0.3s; transform-origin: 150px 95px; }

        .paws-knead {
          animation: pawsKnead 0.4s ease-in-out infinite alternate;
        }
        @keyframes pawsKnead {
          0% { transform: translateY(0); }
          100% { transform: translateY(-4px); }
        }
      `}</style>
    </div>
  );
}
