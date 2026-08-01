"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Sparkles, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface ClassroomWaitingLessonProps {
  code: string;
  hostName: string;
}

export function ClassroomWaitingLesson({ code, hostName }: ClassroomWaitingLessonProps) {
  const router = useRouter();

  useEffect(() => {
    const interval = setInterval(() => {
      router.refresh();
    }, 3000);

    return () => clearInterval(interval);
  }, [router]);

  return (
    <div className="max-w-md mx-auto space-y-6 pt-8 animate-fade-in text-center">
      <div className="flex justify-start">
        <Link href="/">
          <Button variant="ghost" className="text-zinc-400 hover:text-white text-xs gap-1.5 px-3">
            <ArrowLeft className="w-4 h-4" />
            <span>Trang chủ</span>
          </Button>
        </Link>
      </div>

      <div className="glass-card p-8 space-y-6 border-zinc-800/80 shadow-2xl">
        <div className="relative w-16 h-16 mx-auto flex items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-emerald-500/20 animate-ping" />
          <div className="relative w-14 h-14 rounded-2xl bg-zinc-900 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shadow-lg">
            <Loader2 className="w-7 h-7 animate-spin" />
          </div>
        </div>

        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Lớp học: {code}</span>
          </div>

          <h2 className="text-xl font-bold text-white">
            Đang đợi bài học từ Host...
          </h2>

          <p className="text-xs text-zinc-400 leading-relaxed">
            <strong className="text-zinc-200">{hostName}</strong> đang chọn video YouTube và cài đặt bài học cho lớp. Trang này sẽ tự động cập nhật ngay khi bài học sẵn sàng!
          </p>
        </div>

        <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800/60 text-xs text-zinc-500 flex items-center justify-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Tự động đồng bộ mỗi 3 giây</span>
        </div>
      </div>
    </div>
  );
}
