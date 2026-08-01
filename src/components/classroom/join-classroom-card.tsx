"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { LogIn } from "lucide-react";

export function JoinClassroomCard() {
  const [code, setCode] = useState("");
  const router = useRouter();

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode) return;
    router.push(`/classroom/${cleanCode}`);
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 w-full max-w-sm">
      <Input
        type="text"
        placeholder="Nhập mã lớp (VD: ABC123)"
        value={code}
        onChange={(e) => setCode(e.target.value.toUpperCase())}
        maxLength={8}
        className="bg-zinc-950/80 border-zinc-800 focus:border-emerald-500 text-xs py-2 rounded-xl font-mono uppercase text-center tracking-widest placeholder:tracking-normal placeholder:font-sans"
      />
      <Button
        type="submit"
        disabled={!code.trim()}
        className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold px-4 rounded-xl shrink-0 gap-1.5"
      >
        <LogIn className="w-3.5 h-3.5" />
        <span>Vào Lớp</span>
      </Button>
    </form>
  );
}
