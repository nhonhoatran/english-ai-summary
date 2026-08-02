"use client";

import { useState } from "react";
import { Users, LogIn, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ClassroomJoinFormProps {
  code: string;
  onJoined?: () => void;
}

export function ClassroomJoinForm({ code, onJoined }: ClassroomJoinFormProps) {
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) {
      setError("Vui lòng nhập tên hiển thị của bạn.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Phone is not asked for: joining requires a login, so the server takes
      // it from the session instead of trusting a typed-in value.
      const res = await fetch(`/api/classroom/${code}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName: displayName.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Không thể tham gia lớp học.");
      }

      if (onJoined) {
        onJoined();
      } else {
        window.location.reload();
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Đã xảy ra lỗi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto my-12 p-6 glass-card border border-zinc-800/80 rounded-2xl shadow-2xl space-y-6 animate-fade-in">
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-blue-600/20 border border-blue-500/30 text-blue-400 flex items-center justify-center mx-auto">
          <Users className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-white tracking-tight">
          Tham gia lớp học
        </h2>
        <p className="text-xs text-zinc-400">
          Mã phòng: <span className="font-mono font-bold text-blue-400">{code}</span>
        </p>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800/50 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-zinc-300">
            Tên hiển thị <span className="text-rose-400">*</span>
          </label>
          <Input
            type="text"
            placeholder="Ví dụ: Nguyễn Văn A"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            maxLength={30}
            required
            className="bg-zinc-900/90 border-zinc-700/80 text-white placeholder:text-zinc-500 text-sm focus:ring-blue-500"
          />
        </div>

        <Button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold py-2.5 rounded-xl shadow-lg shadow-blue-600/25 transition-all text-sm gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Đang tham gia...</span>
            </>
          ) : (
            <>
              <LogIn className="w-4 h-4" />
              <span>Vào lớp học ngay</span>
            </>
          )}
        </Button>
      </form>
    </div>
  );
}
