"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AddLessonForm } from "@/components/add-lesson-form";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Plus, Video } from "lucide-react";

interface ClassroomAddLessonDialogProps {
  code: string;
  /** How many lessons the class already owns — shown so the host knows where the new one lands. */
  lessonCount: number;
}

/**
 * Lets the host add another lesson while the class is already on one. The
 * server action appends the lesson without switching the class off the lesson
 * everyone is currently studying.
 */
export function ClassroomAddLessonDialog({
  code,
  lessonCount,
}: ClassroomAddLessonDialogProps) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        variant="ghost"
        className="h-7 px-2 text-xs text-emerald-400 hover:text-emerald-300 hover:bg-emerald-950/40 gap-1"
      >
        <Plus className="w-3.5 h-3.5" />
        <span>Thêm bài</span>
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-2xl bg-zinc-950 border-zinc-800 text-zinc-100 rounded-2xl shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-white flex items-center gap-2">
              <Video className="w-5 h-5 text-emerald-400" />
              Thêm bài học vào lớp {code}
            </DialogTitle>
            <DialogDescription className="text-xs text-zinc-400 leading-relaxed">
              {lessonCount > 0
                ? `Lớp đang có ${lessonCount} bài — bài mới được thêm vào cuối danh sách. Cả lớp vẫn ở nguyên bài đang học cho tới khi bạn bấm ▶ để chuyển.`
                : "Dán link YouTube để tạo bài học đầu tiên cho lớp."}
            </DialogDescription>
          </DialogHeader>

          <AddLessonForm
            classroomCode={code}
            onLessonCreated={() => {
              setOpen(false);
              router.refresh();
            }}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
