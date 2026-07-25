// path/to/src/app/login/page.tsx
"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Phone, Loader2 } from "lucide-react";

function LoginForm() {
  const searchParams = useSearchParams();
  const nextParam = searchParams.get("next") || "/";

  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim()) return;

    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: phone.trim(), next: nextParam }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || "Đăng nhập thất bại.");
        setLoading(false);
        return;
      }

      window.location.href = data.redirectUrl || "/";
    } catch {
      setError("Có lỗi xảy ra. Vui lòng thử lại.");
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md p-8 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-xl space-y-6">
      <div className="flex flex-col items-center text-center space-y-2">
        <div className="p-3 rounded-full bg-blue-950/80 border border-blue-800/60 text-blue-400">
          <Phone className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Đăng Nhập / Sign In</h1>
        <p className="text-sm text-zinc-400">
          Nhập số điện thoại để vào học (mỗi SĐT là 1 tài khoản).
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 text-xs font-medium text-red-300 bg-red-950/60 border border-red-800/80 rounded-xl text-center">
            {error}
          </div>
        )}

        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-zinc-300">
            Số điện thoại
          </label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Ví dụ: 0912345678"
            required
            className="w-full px-4 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all text-sm"
          />
        </div>

        <button
          type="submit"
          disabled={loading || !phone.trim()}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:hover:bg-blue-600 text-white font-semibold text-sm transition-all shadow-md active:scale-[0.98]"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Đang xử lý...</span>
            </>
          ) : (
            <span>Vào học ngay</span>
          )}
        </button>
      </form>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center p-4">
      <Suspense fallback={<div className="text-zinc-400 text-sm">Loading...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
