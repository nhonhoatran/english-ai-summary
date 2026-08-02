"use client";

import Link from "next/link";
import { Users, Clock, ArrowRight, Copy, Check, BookOpen } from "lucide-react";
import { useState } from "react";
import { DeleteClassroomButton } from "@/components/classroom/delete-classroom-button";

interface ClassroomListCardProps {
  classroom: {
    id: string;
    code: string;
    name: string | null;
    isActive: boolean;
    createdAt: Date;
    hostUserId: string;
    currentLesson?: { title: string } | null;
    _count: { members: number; lessons: number };
  };
  currentUserId: string;
}

export function ClassroomListCard({
  classroom,
  currentUserId,
}: ClassroomListCardProps) {
  const [copied, setCopied] = useState(false);
  const isHost = classroom.hostUserId === currentUserId;

  function copyCode(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(classroom.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="group relative rounded-2xl glass-card border-zinc-800/80 hover:border-emerald-500/40 hover:bg-zinc-900/60 transition-all shadow-md overflow-hidden">
      <Link href={`/classroom/${classroom.code}`} className="block p-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="space-y-1.5 flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-xs font-extrabold px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 tracking-wider">
                {classroom.code}
              </span>
              <button
                onClick={copyCode}
                className="p-1 text-zinc-500 hover:text-zinc-300 transition-colors text-xs inline-flex items-center gap-1 bg-zinc-900 px-2 py-0.5 rounded-md border border-zinc-800"
                title="Copy mã lớp"
              >
                {copied ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-400" />
                    <span className="text-emerald-400 font-medium">Đã chép</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Copy</span>
                  </>
                )}
              </button>

              <span
                className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${
                  isHost
                    ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                    : "bg-purple-500/10 text-purple-400 border-purple-500/20"
                }`}
              >
                {isHost ? "Host (Bạn)" : "Học viên"}
              </span>

              {classroom.isActive ? (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Đang hoạt động
                </span>
              ) : (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400">
                  Đã kết thúc
                </span>
              )}
            </div>

            <h3 className="text-sm font-semibold text-white group-hover:text-emerald-300 transition-colors truncate">
              {classroom.name || `Lớp ${classroom.code}`}
            </h3>

            <div className="flex items-center gap-4 text-xs text-zinc-400 flex-wrap">
              <span className="flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-purple-400" />
                <span>{classroom._count.lessons} bài học</span>
              </span>
              <span className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-emerald-400" />
                <span>{classroom._count.members} thành viên</span>
              </span>
              <span className="flex items-center gap-1.5 text-zinc-500">
                <Clock className="w-3.5 h-3.5" />
                <span>
                  {new Date(classroom.createdAt).toLocaleDateString("vi-VN")}
                </span>
              </span>
            </div>

            {classroom.currentLesson && (
              <p className="text-xs text-zinc-500 truncate">
                Đang học:{" "}
                <span className="text-zinc-300">{classroom.currentLesson.title}</span>
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
            <span className="text-xs font-medium text-emerald-400 group-hover:translate-x-1 transition-transform flex items-center gap-1">
              Vào Lớp
              <ArrowRight className="w-4 h-4" />
            </span>
          </div>
        </div>
      </Link>

      {/* Outside the <Link> so the dialog does not navigate on open. */}
      {isHost && (
        <div className="absolute top-2 right-2">
          <DeleteClassroomButton code={classroom.code} />
        </div>
      )}
    </div>
  );
}
