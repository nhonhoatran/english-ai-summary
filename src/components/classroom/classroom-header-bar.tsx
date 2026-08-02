"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { DeleteClassroomButton } from "@/components/classroom/delete-classroom-button";
import {
  Radio,
  PowerOff,
  Copy,
  Check,
  Compass,
  Crown,
  ArrowLeft,
  Zap,
} from "lucide-react";

interface ClassroomHeaderBarProps {
  code: string;
  className: string | null;
  lessonTitle: string | null;
  isHost: boolean;
  hostName: string;
  isConnected: boolean;
  isFreeMode: boolean;
  ending: boolean;
  onToggleFreeMode: () => void;
  onEndClass: () => void;
}

/** Top bar of the classroom: identity, share link, sync mode and host controls. */
export function ClassroomHeaderBar({
  code,
  className,
  lessonTitle,
  isHost,
  hostName,
  isConnected,
  isFreeMode,
  ending,
  onToggleFreeMode,
  onEndClass,
}: ClassroomHeaderBarProps) {
  const [copied, setCopied] = useState(false);

  const copyShareLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/classroom/${code}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="glass-card p-4 rounded-2xl border border-zinc-800/80 shadow-xl flex flex-wrap items-center justify-between gap-4">
      <div className="flex items-center gap-3 min-w-0">
        <Link
          href="/"
          title="Về trang chủ"
          className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>

        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-bold text-white truncate">
              {className || `Lớp ${code}`}
            </span>
            <span className="font-mono font-bold text-xs text-blue-400 px-2 py-0.5 rounded bg-blue-950/50 border border-blue-800/40">
              {code}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={copyShareLink}
              className="h-7 px-2 text-xs text-zinc-400 hover:text-white hover:bg-zinc-800"
            >
              {copied ? (
                <Check className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
              <span className="ml-1">{copied ? "Đã chép" : "Copy link"}</span>
            </Button>
          </div>

          <p className="text-xs text-zinc-400 mt-0.5 flex items-center gap-1.5 flex-wrap">
            <span className="truncate">
              Đang học:{" "}
              <strong className="text-zinc-200">
                {lessonTitle || "chưa chọn bài"}
              </strong>
            </span>
            <span
              className={`inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded border ${
                isConnected
                  ? "text-emerald-400 bg-emerald-950/60 border-emerald-800/40"
                  : "text-zinc-500 bg-zinc-900 border-zinc-800"
              }`}
            >
              <Zap className={`w-3 h-3 ${isConnected ? "animate-pulse" : ""}`} />
              {isConnected ? "Realtime" : "Mất kết nối"}
            </span>
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {isHost ? (
          <>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold">
              <Crown className="w-4 h-4 text-amber-400" />
              Host
            </span>
            <Button
              onClick={onEndClass}
              disabled={ending}
              variant="outline"
              className="h-8 px-3 text-xs rounded-xl font-semibold gap-1.5 border-zinc-700 bg-zinc-900 text-zinc-200 hover:bg-zinc-800"
            >
              <PowerOff className="w-3.5 h-3.5" />
              <span>Kết thúc buổi</span>
            </Button>
            <DeleteClassroomButton code={code} variant="button" redirectOnSuccess />
          </>
        ) : (
          <>
            <div
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium ${
                isFreeMode
                  ? "bg-zinc-900 border-zinc-800 text-zinc-400"
                  : "bg-blue-950/40 border-blue-800/40 text-blue-300"
              }`}
            >
              {isFreeMode ? (
                <>
                  <Compass className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Chế độ tự do</span>
                </>
              ) : (
                <>
                  <Radio className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
                  <span>Đồng bộ theo {hostName}</span>
                </>
              )}
            </div>

            <Button
              onClick={onToggleFreeMode}
              variant="outline"
              className="h-8 px-3 text-xs rounded-xl border-zinc-700 bg-zinc-900 text-zinc-200 hover:bg-zinc-800 hover:text-white"
            >
              {isFreeMode ? "Bật đồng bộ" : "Tự do xem"}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
