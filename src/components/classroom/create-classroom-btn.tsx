"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Users, Loader2, Copy, Check, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";

interface CreateClassroomBtnProps {
  lessonId: string;
}

export function CreateClassroomBtn({ lessonId }: CreateClassroomBtnProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [code, setCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/classroom/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lessonId }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Không thể tạo lớp học.");
      }

      setCode(data.code);
    } catch (err: any) {
      setError(err.message || "Đã xảy ra lỗi khi tạo lớp.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!code) return;
    const url = `${window.location.origin}/classroom/${code}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleEnterRoom = () => {
    if (code) {
      router.push(`/classroom/${code}`);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger>
        <Button
          onClick={handleCreate}
          variant="outline"
          className="bg-gradient-to-r from-blue-600/20 to-indigo-600/20 hover:from-blue-600/30 hover:to-indigo-600/30 border-blue-500/40 text-blue-300 text-xs sm:text-sm font-semibold rounded-xl gap-2 shadow-sm"
        >
          <Users className="w-4 h-4 text-blue-400" />
          <span>Tạo lớp học</span>
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md bg-zinc-950 border-zinc-800 text-zinc-100 rounded-2xl shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-400" />
            Tạo lớp học trực tuyến
          </DialogTitle>
          <DialogDescription className="text-xs text-zinc-400">
            Tạo phòng học cùng các thành viên khác theo thời gian thực.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="py-8 text-center space-y-3">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin mx-auto" />
            <p className="text-xs text-zinc-400 font-medium">
              Đang khởi tạo mã lớp học...
            </p>
          </div>
        ) : error ? (
          <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800/50 text-rose-300 text-xs space-y-2">
            <p className="font-semibold">Lỗi tạo lớp học:</p>
            <p>{error}</p>
            <Button
              onClick={handleCreate}
              size="sm"
              className="mt-2 bg-rose-800 hover:bg-rose-700 text-white text-xs rounded-lg"
            >
              Thử lại
            </Button>
          </div>
        ) : code ? (
          <div className="space-y-5 pt-2">
            <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 space-y-2 text-center">
              <span className="text-xs text-zinc-400 uppercase font-semibold tracking-wider">
                Mã lớp học của bạn
              </span>
              <div className="text-3xl font-mono font-extrabold text-blue-400 tracking-widest">
                {code}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-300">
                Đường dẫn chia sẻ:
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={typeof window !== "undefined" ? `${window.location.origin}/classroom/${code}` : `/classroom/${code}`}
                  className="flex-1 px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-300 font-mono"
                />
                <Button
                  onClick={handleCopy}
                  variant="outline"
                  className="bg-zinc-900 border-zinc-700 hover:bg-zinc-800 text-xs text-zinc-200 gap-1.5"
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                  <span>{copied ? "Đã copy" : "Copy"}</span>
                </Button>
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <Button
                onClick={handleEnterRoom}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold py-2.5 rounded-xl text-xs sm:text-sm gap-2"
              >
                <span>Vào lớp ngay</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
