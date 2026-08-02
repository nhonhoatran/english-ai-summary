"use client";

import { useState, useTransition, MouseEvent } from "react";
import { useRouter } from "next/navigation";
import {
  deleteClassroomAction,
  getClassroomDeletionSummary,
} from "@/app/actions/delete-classroom-action";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Trash2, Loader2, AlertTriangle } from "lucide-react";

interface DeleteClassroomButtonProps {
  code: string;
  /** "icon" sits inside the classroom card, "button" inside the classroom itself. */
  variant?: "icon" | "button";
  /** Send the host home after deleting (used from inside the classroom). */
  redirectOnSuccess?: boolean;
}

export function DeleteClassroomButton({
  code,
  variant = "icon",
  redirectOnSuccess = false,
}: DeleteClassroomButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<{
    lessonCount: number;
    memberCount: number;
  } | null>(null);
  const [isPending, startTransition] = useTransition();

  const canDelete = confirmText.trim().toUpperCase() === code.toUpperCase();

  const handleOpen = (e: MouseEvent) => {
    // The card is wrapped in a <Link>; without this the click navigates away.
    e.preventDefault();
    e.stopPropagation();
    setOpen(true);
    setConfirmText("");
    setError(null);
    setSummary(null);

    getClassroomDeletionSummary(code)
      .then(setSummary)
      .catch(() => setSummary(null));
  };

  const handleDelete = () => {
    if (!canDelete) return;
    setError(null);

    startTransition(async () => {
      const res = await deleteClassroomAction(code, confirmText);
      if (!res.success) {
        setError(res.error);
        return;
      }
      setOpen(false);
      if (redirectOnSuccess) {
        router.push("/");
      } else {
        router.refresh();
      }
    });
  };

  return (
    <>
      {variant === "button" ? (
        <Button
          onClick={handleOpen}
          variant="outline"
          className="h-8 px-3 text-xs rounded-xl gap-1.5 border-rose-900/60 bg-rose-950/40 text-rose-300 hover:bg-rose-900/50 hover:text-rose-200"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Xóa lớp</span>
        </Button>
      ) : (
        <button
          type="button"
          onClick={handleOpen}
          title="Xóa lớp học"
          className="p-2 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-rose-950/40 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md bg-zinc-950 border-zinc-800 text-zinc-100 rounded-2xl shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-white flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-rose-400" />
              Xóa vĩnh viễn lớp {code}?
            </DialogTitle>
            <DialogDescription className="text-xs text-zinc-400 leading-relaxed">
              {summary ? (
                <>
                  Sẽ xóa luôn <strong className="text-rose-300">{summary.lessonCount} bài học</strong>{" "}
                  và <strong className="text-rose-300">{summary.memberCount} thành viên</strong>{" "}
                  cùng toàn bộ tiến độ luyện tập trong lớp. Không khôi phục lại được.
                </>
              ) : (
                "Đang tính xem lớp này có bao nhiêu bài học và thành viên..."
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-zinc-300">
              Gõ lại mã lớp{" "}
              <span className="font-mono font-bold text-white">{code}</span> để xác nhận:
            </label>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              disabled={isPending}
              autoComplete="off"
              placeholder={code}
              className="w-full px-3 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-sm font-mono tracking-widest text-white placeholder-zinc-600 focus:outline-none focus:border-rose-600 focus:ring-2 focus:ring-rose-600/20 disabled:opacity-60"
            />
          </div>

          {error && (
            <p className="text-xs text-rose-400 font-medium">{error}</p>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <Button
              onClick={() => setOpen(false)}
              disabled={isPending}
              variant="outline"
              className="h-9 px-4 text-xs rounded-xl border-zinc-700 bg-zinc-900 text-zinc-200 hover:bg-zinc-800"
            >
              Hủy
            </Button>
            <Button
              onClick={handleDelete}
              disabled={!canDelete || isPending}
              className="h-9 px-4 text-xs rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold gap-1.5 disabled:opacity-40"
            >
              {isPending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Trash2 className="w-3.5 h-3.5" />
              )}
              <span>Xóa vĩnh viễn</span>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
