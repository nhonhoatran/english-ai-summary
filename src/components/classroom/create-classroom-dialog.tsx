"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Users, Plus, Loader2 } from "lucide-react";

export function CreateClassroomDialog() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleCreate() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/classroom/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() || undefined }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Không thể tạo lớp học.");
      }

      router.push(`/classroom/${data.code}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Đã xảy ra lỗi khi tạo lớp học.");
      setLoading(false);
    }
  }

  return (
    <>
      <Button
        onClick={() => {
          setOpen(true);
          setName("");
          setError(null);
        }}
        className="w-full sm:w-auto bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold px-6 py-3 h-auto rounded-xl shadow-lg shadow-emerald-600/20 transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2 text-sm"
      >
        <Users className="w-4 h-4" />
        <span>Tạo Lớp Học Mới</span>
        <Plus className="w-4 h-4 ml-1" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md bg-zinc-950 border-zinc-800 text-zinc-100 rounded-2xl shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-emerald-400" />
              Tạo lớp học mới
            </DialogTitle>
            <DialogDescription className="text-xs text-zinc-400 leading-relaxed">
              Đặt tên cho lớp để dễ nhận ra sau này. Tạo xong bạn có thể thêm
              nhiều bài học vào lớp này.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-300">
              Tên lớp <span className="text-zinc-500 font-normal">(không bắt buộc)</span>
            </label>
            <Input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !loading) handleCreate();
              }}
              maxLength={60}
              disabled={loading}
              placeholder="Ví dụ: Lớp IELTS tối thứ 3"
              className="bg-zinc-900/90 border-zinc-700/80 text-white placeholder:text-zinc-500 text-sm focus:ring-emerald-500"
            />
          </div>

          {error && <p className="text-xs text-rose-400 font-medium">{error}</p>}

          <div className="flex justify-end gap-2 pt-1">
            <Button
              onClick={() => setOpen(false)}
              disabled={loading}
              variant="outline"
              className="h-9 px-4 text-xs rounded-xl border-zinc-700 bg-zinc-900 text-zinc-200 hover:bg-zinc-800"
            >
              Hủy
            </Button>
            <Button
              onClick={handleCreate}
              disabled={loading}
              className="h-9 px-4 text-xs rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold gap-1.5"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Đang tạo...</span>
                </>
              ) : (
                <>
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tạo lớp</span>
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
