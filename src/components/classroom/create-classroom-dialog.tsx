"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Users, Plus, Loader2 } from "lucide-react";

export function CreateClassroomDialog() {
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
        body: JSON.stringify({}),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Không thể tạo lớp học.");
      }

      router.push(`/classroom/${data.code}`);
    } catch (err: any) {
      setError(err?.message || "Đã xảy ra lỗi khi tạo lớp học.");
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <Button
        onClick={handleCreate}
        disabled={loading}
        className="w-full sm:w-auto bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold px-6 py-3 h-auto rounded-xl shadow-lg shadow-emerald-600/20 transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2 text-sm"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin text-white" />
            <span>Đang tạo lớp học...</span>
          </>
        ) : (
          <>
            <Users className="w-4 h-4" />
            <span>Tạo Lớp Học Mới</span>
            <Plus className="w-4 h-4 ml-1" />
          </>
        )}
      </Button>

      {error && (
        <p className="text-xs text-rose-400 font-medium animate-fade-in">
          {error}
        </p>
      )}
    </div>
  );
}
