"use client";

import React, { useEffect, useRef, useState } from "react";
import { CatMood } from "@/lib/cat/compute-cat-mood";

interface CatSpriteProps {
  mood: CatMood;
  size?: number;
  accessories?: string[];
}

export function CatSprite({ mood, size = 120 }: CatSpriteProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const moodRef = useRef<CatMood>(mood);
  moodRef.current = mood;

  const [particles, setParticles] = useState<{ id: number; x: number; y: number; text: string }[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let reqId: number;
    let time = 0;
    let blinkTimer = 0;
    let isBlinking = false;

    // Mouse tracking
    let mouseX = 0;
    let mouseY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      mouseX = Math.max(-1, Math.min(1, (e.clientX - cx) / (rect.width / 2)));
      mouseY = Math.max(-1, Math.min(1, (e.clientY - cy) / (rect.height / 2)));
    };

    window.addEventListener("mousemove", handleMouseMove);

    const render = () => {
      reqId = requestAnimationFrame(render);
      time += 0.03;

      const width = size;
      const height = size;
      const currentMood = moodRef.current;

      // Handle Blinking
      blinkTimer += 0.016;
      if (blinkTimer > 3.5) {
        isBlinking = true;
        if (blinkTimer > 3.7) {
          blinkTimer = 0;
          isBlinking = false;
        }
      }

      ctx.clearRect(0, 0, width, height);

      const cx = width / 2;
      const cy = height / 2;

      // Mood-based motion offsets
      let bounceY = Math.sin(time * 3) * 3;
      let headTilt = mouseX * 0.15;
      let tailWiggle = Math.sin(time * 4) * 0.25;

      if (currentMood === "playing") {
        bounceY = Math.abs(Math.sin(time * 6)) * -8;
        tailWiggle = Math.sin(time * 8) * 0.4;
      } else if (currentMood === "sleeping") {
        bounceY = Math.sin(time * 1.5) * 1.5;
        tailWiggle = Math.sin(time * 1.5) * 0.1;
      } else if (currentMood === "happy") {
        bounceY = Math.sin(time * 4) * 4;
      }

      ctx.save();
      ctx.translate(cx, cy + bounceY + 6);

      // 1. Soft Floor Shadow
      ctx.beginPath();
      ctx.ellipse(0, 42, 38, 8, 0, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(0, 0, 0, 0.12)";
      ctx.fill();

      // 2. Animated Tail
      ctx.save();
      ctx.translate(22, 18);
      ctx.rotate(tailWiggle);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.bezierCurveTo(15, -10, 25, -25, 20, -38);
      ctx.lineWidth = 10;
      ctx.strokeStyle = "#18181b"; // Black tail
      ctx.lineCap = "round";
      ctx.stroke();

      // White Tail Tip
      ctx.beginPath();
      ctx.arc(20, -38, 5, 0, Math.PI * 2);
      ctx.fillStyle = "#ffffff";
      ctx.fill();
      ctx.restore();

      // 3. Body (Chubby Round Body - Tuxedo Black & White)
      ctx.beginPath();
      ctx.ellipse(0, 20, 32, 26, 0, 0, Math.PI * 2);
      ctx.fillStyle = "#18181b"; // Black fur
      ctx.fill();

      // White Chest/Belly
      ctx.beginPath();
      ctx.ellipse(0, 22, 22, 20, 0, 0, Math.PI * 2);
      ctx.fillStyle = "#ffffff";
      ctx.fill();

      // Front Paws
      ctx.beginPath();
      ctx.ellipse(-14, 38, 8, 6, 0, 0, Math.PI * 2);
      ctx.ellipse(14, 38, 8, 6, 0, 0, Math.PI * 2);
      ctx.fillStyle = "#ffffff";
      ctx.fill();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = "#e2e8f0";
      ctx.stroke();

      // 4. Head Group (with mouse tilt)
      ctx.save();
      ctx.translate(mouseX * 4, mouseY * 3 - 10);
      ctx.rotate(headTilt);

      // Ears (Black Outer, Pink Inner)
      // Left Ear
      ctx.beginPath();
      ctx.moveTo(-28, -12);
      ctx.quadraticCurveTo(-38, -38, -18, -38);
      ctx.quadraticCurveTo(-8, -26, -10, -12);
      ctx.fillStyle = "#18181b";
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(-26, -14);
      ctx.quadraticCurveTo(-33, -33, -19, -33);
      ctx.quadraticCurveTo(-12, -24, -13, -14);
      ctx.fillStyle = "#f472b6"; // Pink inner
      ctx.fill();

      // Right Ear
      ctx.beginPath();
      ctx.moveTo(28, -12);
      ctx.quadraticCurveTo(38, -38, 18, -38);
      ctx.quadraticCurveTo(8, -26, 10, -12);
      ctx.fillStyle = "#18181b";
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(26, -14);
      ctx.quadraticCurveTo(33, -33, 19, -33);
      ctx.quadraticCurveTo(12, -24, 13, -14);
      ctx.fillStyle = "#f472b6";
      ctx.fill();

      // Head Base (Black Patch top, White face)
      ctx.beginPath();
      ctx.ellipse(0, -6, 34, 28, 0, 0, Math.PI * 2);
      ctx.fillStyle = "#ffffff";
      ctx.fill();

      // Top Black Patch (Tuxedo pattern on forehead)
      ctx.beginPath();
      ctx.moveTo(-32, -18);
      ctx.bezierCurveTo(-20, -36, 20, -36, 32, -18);
      ctx.bezierCurveTo(20, -14, 0, -10, -32, -18);
      ctx.fillStyle = "#18181b";
      ctx.fill();

      // 5. Rosy Cheeks (Cute Pink Blush)
      ctx.beginPath();
      ctx.ellipse(-20, 2, 7, 4, 0, 0, Math.PI * 2);
      ctx.ellipse(20, 2, 7, 4, 0, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(251, 113, 133, 0.4)";
      ctx.fill();

      // 6. Eyes (Kawaii Big Eyes with pupil & shine)
      const eyeOffsetX = mouseX * 2;
      const eyeOffsetY = mouseY * 2;

      if (isBlinking || currentMood === "sleeping") {
        // Closed eyes ^ ^
        ctx.beginPath();
        ctx.arc(-14, -4, 6, 0.1, Math.PI - 0.1);
        ctx.arc(14, -4, 6, 0.1, Math.PI - 0.1);
        ctx.lineWidth = 3;
        ctx.strokeStyle = "#18181b";
        ctx.stroke();
      } else if (currentMood === "happy" || currentMood === "playing") {
        // Anime Happy Eyes ^ ^
        ctx.beginPath();
        ctx.arc(-14, -2, 7, Math.PI + 0.2, -0.2);
        ctx.moveTo(7, -2);
        ctx.arc(14, -2, 7, Math.PI + 0.2, -0.2);
        ctx.lineWidth = 3.5;
        ctx.strokeStyle = "#18181b";
        ctx.lineCap = "round";
        ctx.stroke();
      } else if (currentMood === "hungry") {
        // Puss in boots big shiny begging eyes
        ctx.beginPath();
        ctx.arc(-14 + eyeOffsetX, -4 + eyeOffsetY, 9, 0, Math.PI * 2);
        ctx.arc(14 + eyeOffsetX, -4 + eyeOffsetY, 9, 0, Math.PI * 2);
        ctx.fillStyle = "#0f172a";
        ctx.fill();

        // Big sparkle shine
        ctx.beginPath();
        ctx.arc(-16 + eyeOffsetX, -7 + eyeOffsetY, 3.5, 0, Math.PI * 2);
        ctx.arc(12 + eyeOffsetX, -7 + eyeOffsetY, 3.5, 0, Math.PI * 2);
        ctx.fillStyle = "#ffffff";
        ctx.fill();

        ctx.beginPath();
        ctx.arc(-12 + eyeOffsetX, -2 + eyeOffsetY, 2, 0, Math.PI * 2);
        ctx.arc(16 + eyeOffsetX, -2 + eyeOffsetY, 2, 0, Math.PI * 2);
        ctx.fillStyle = "#ffffff";
        ctx.fill();
      } else if (currentMood === "sad") {
        // Sad droopy eyes
        ctx.beginPath();
        ctx.arc(-14 + eyeOffsetX, -2 + eyeOffsetY, 7, 0, Math.PI * 2);
        ctx.arc(14 + eyeOffsetX, -2 + eyeOffsetY, 7, 0, Math.PI * 2);
        ctx.fillStyle = "#334155";
        ctx.fill();

        // Tear drop
        ctx.beginPath();
        ctx.arc(-22, 6, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = "#38bdf8";
        ctx.fill();
      } else {
        // Default Kawaii Eye (Big Black pupil + dual shine)
        ctx.beginPath();
        ctx.arc(-14 + eyeOffsetX, -4 + eyeOffsetY, 7.5, 0, Math.PI * 2);
        ctx.arc(14 + eyeOffsetX, -4 + eyeOffsetY, 7.5, 0, Math.PI * 2);
        ctx.fillStyle = "#18181b";
        ctx.fill();

        // Sparkle 1
        ctx.beginPath();
        ctx.arc(-16 + eyeOffsetX, -6 + eyeOffsetY, 2.5, 0, Math.PI * 2);
        ctx.arc(12 + eyeOffsetX, -6 + eyeOffsetY, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = "#ffffff";
        ctx.fill();

        // Sparkle 2
        ctx.beginPath();
        ctx.arc(-12 + eyeOffsetX, -2 + eyeOffsetY, 1.5, 0, Math.PI * 2);
        ctx.arc(16 + eyeOffsetX, -2 + eyeOffsetY, 1.5, 0, Math.PI * 2);
        ctx.fillStyle = "#ffffff";
        ctx.fill();
      }

      // 7. Cute Nose & Mouth (ω shape)
      ctx.beginPath();
      ctx.arc(0, 3, 2, 0, Math.PI * 2);
      ctx.fillStyle = "#fb7185"; // Pink nose
      ctx.fill();

      // Mouth ω
      ctx.beginPath();
      ctx.arc(-3, 6, 3, 0, Math.PI);
      ctx.arc(3, 6, 3, 0, Math.PI);
      ctx.lineWidth = 2;
      ctx.strokeStyle = "#334155";
      ctx.stroke();

      // Whiskers
      ctx.strokeStyle = "#cbd5e1";
      ctx.lineWidth = 1.5;

      // Left Whiskers
      ctx.beginPath();
      ctx.moveTo(-24, 2);
      ctx.lineTo(-38, 0);
      ctx.moveTo(-24, 6);
      ctx.lineTo(-38, 8);
      ctx.stroke();

      // Right Whiskers
      ctx.beginPath();
      ctx.moveTo(24, 2);
      ctx.lineTo(38, 0);
      ctx.moveTo(24, 6);
      ctx.lineTo(38, 8);
      ctx.stroke();

      ctx.restore(); // end head group
      ctx.restore(); // end main cat
    };

    render();

    return () => {
      cancelAnimationFrame(reqId);
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, [size]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const icons = ["❤️", "✨", "🐾", "⭐"];
    const text = icons[Math.floor(Math.random() * icons.length)];

    setParticles((prev) => [...prev, { id: Date.now(), x, y, text }]);

    setTimeout(() => {
      setParticles((prev) => prev.filter((p) => Date.now() - p.id < 1000));
    }, 1000);
  };

  return (
    <div
      onClick={handleCanvasClick}
      className="relative flex items-center justify-center select-none cursor-pointer group"
      style={{ width: `${size}px`, height: `${size}px` }}
    >
      <canvas
        ref={canvasRef}
        width={size}
        height={size}
        className="w-full h-full object-contain filter drop-shadow-md group-hover:scale-105 transition-transform duration-300"
      />

      {/* Floating particles on click */}
      {particles.map((p) => (
        <span
          key={p.id}
          className="absolute text-sm font-bold animate-ping pointer-events-none"
          style={{ left: `${p.x}px`, top: `${p.y}px` }}
        >
          {p.text}
        </span>
      ))}
    </div>
  );
}
