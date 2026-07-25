// path/to/src/components/lesson/delete-lesson-button.tsx
"use client";

import { useState, useTransition, MouseEvent } from "react";
import { useRouter } from "next/navigation";
import { deleteLessonAction } from "@/app/actions/delete-lesson-action";
import { Trash2, Loader2, Check, X } from "lucide-react";

interface DeleteLessonButtonProps {
  lessonId: string;
  redirectOnSuccess?: boolean;
  variant?: "icon" | "button";
}

export function DeleteLessonButton({
  lessonId,
  redirectOnSuccess = false,
  variant = "icon",
}: DeleteLessonButtonProps) {
  const [confirming, setConfirming] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleStartConfirm = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setConfirming(true);
  };

  const handleCancel = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setConfirming(false);
  };

  const handleConfirmDelete = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    startTransition(async () => {
      try {
        const res = await deleteLessonAction(lessonId);
        if (res.success) {
          if (redirectOnSuccess) {
            router.push("/");
          }
        } else {
          alert(res.error);
        }
      } catch {
        alert("An error occurred while deleting the lesson.");
      } finally {
        setConfirming(false);
      }
    });
  };

  if (confirming) {
    return (
      <div
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        className="inline-flex items-center gap-1.5 p-1 rounded-lg bg-red-950/80 border border-red-800 text-xs font-semibold text-red-200 z-10"
      >
        <span>Xóa?</span>
        <button
          type="button"
          onClick={handleConfirmDelete}
          disabled={isPending}
          className="p-1 rounded bg-red-600 hover:bg-red-500 text-white transition-colors"
          title="Xác nhận xóa"
        >
          {isPending ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Check className="w-3.5 h-3.5" />
          )}
        </button>
        <button
          type="button"
          onClick={handleCancel}
          disabled={isPending}
          className="p-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors"
          title="Hủy"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  if (variant === "button") {
    return (
      <button
        type="button"
        onClick={handleStartConfirm}
        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-red-950/40 hover:bg-red-900/60 border border-red-800/60 text-red-400 hover:text-red-300 text-xs font-medium transition-all"
      >
        <Trash2 className="w-4 h-4" />
        <span>Xóa bài học</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleStartConfirm}
      className="p-2 rounded-lg text-zinc-400 hover:text-red-400 hover:bg-red-950/40 transition-colors"
      title="Xóa bài học"
    >
      <Trash2 className="w-4 h-4" />
    </button>
  );
}
