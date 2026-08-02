"use client";

import { AddLessonForm } from "@/components/add-lesson-form";
import { Sparkles, Video, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface ClassroomAddLessonProps {
  code: string;
  /** How many lessons the class already owns — 0 means this is the first. */
  lessonCount?: number;
}

export function ClassroomAddLesson({ code, lessonCount = 0 }: ClassroomAddLessonProps) {
  return (
    <div className="max-w-3xl mx-auto space-y-6 pt-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <Link href="/">
          <Button variant="ghost" className="text-zinc-400 hover:text-white text-xs gap-1.5 px-3">
            <ArrowLeft className="w-4 h-4" />
            <span>Trang chủ</span>
          </Button>
        </Link>

        <div className="font-mono text-xs font-bold px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
          MÃ LỚP: {code}
        </div>
      </div>

      <div className="glass-card p-6 sm:p-8 space-y-6 border-zinc-800/80 shadow-2xl text-center">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600/20 to-teal-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto shadow-inner">
          <Video className="w-7 h-7" />
        </div>

        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Host Lớp Học</span>
          </div>

          <h2 className="text-2xl font-extrabold text-white tracking-tight">
            {lessonCount > 0 ? "Thêm Bài Học Mới" : "Thêm Bài Học Đầu Tiên"}
          </h2>

          <p className="text-zinc-400 text-sm max-w-lg mx-auto leading-relaxed">
            Dán đường dẫn video YouTube (Tiếng Anh hoặc Tiếng Trung) để tạo bài học cho lớp{" "}
            <span className="font-mono font-bold text-white">{code}</span>.{" "}
            {lessonCount > 0
              ? `Lớp đang có ${lessonCount} bài — bài mới sẽ được thêm vào cuối danh sách.`
              : "Một lớp có thể chứa nhiều bài học, cứ thêm thoải mái nghen!"}
          </p>
        </div>

        <div className="pt-2 text-left">
          <AddLessonForm classroomCode={code} />
        </div>
      </div>
    </div>
  );
}
