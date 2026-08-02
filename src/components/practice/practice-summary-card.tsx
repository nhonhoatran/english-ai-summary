"use client";

import { Button } from "@/components/ui/button";
import { RotateCcw, Trophy } from "lucide-react";

interface PracticeSummaryCardProps {
  answeredCount: number;
  totalPrompts: number;
  correctCount: number;
  averageScore: number;
  onResume: () => void;
}

/** End-of-session roll-up for the learner's own writing practice. */
export function PracticeSummaryCard({
  answeredCount,
  totalPrompts,
  correctCount,
  averageScore,
  onResume,
}: PracticeSummaryCardProps) {
  return (
    <div className="p-8 rounded-xl bg-zinc-900 border border-zinc-800 text-center space-y-6 max-w-xl mx-auto">
      <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
        <Trophy className="w-8 h-8" />
      </div>

      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-white">Kết quả luyện viết</h2>
        <p className="text-zinc-400 text-sm">
          Bạn đã làm {answeredCount}/{totalPrompts} câu của bài học này.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-zinc-950 border border-zinc-800">
        <div className="space-y-1">
          <span className="text-xs text-zinc-500 uppercase tracking-wider font-medium">
            Điểm trung bình
          </span>
          <div className="text-3xl font-extrabold text-emerald-400">
            {averageScore}/100
          </div>
        </div>
        <div className="space-y-1">
          <span className="text-xs text-zinc-500 uppercase tracking-wider font-medium">
            Câu đúng
          </span>
          <div className="text-3xl font-extrabold text-blue-400">
            {correctCount}/{totalPrompts}
          </div>
        </div>
      </div>

      <Button
        onClick={onResume}
        className="w-full bg-zinc-800 hover:bg-zinc-700 text-white gap-2"
      >
        <RotateCcw className="w-4 h-4" />
        Quay lại luyện tiếp
      </Button>
    </div>
  );
}
