// path/to/src/components/add-lesson-form.tsx
"use client";

import { useState, useTransition, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ingestLessonAction } from "@/app/actions/ingest-lesson-action";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SlidersHorizontal, ChevronDown, ChevronUp } from "lucide-react";

export function AddLessonForm() {
  const [url, setUrl] = useState("");
  const [targetLanguage, setTargetLanguage] = useState<"english" | "chinese">("english");
  const [quizCount, setQuizCount] = useState<number>(5);
  const [vocabCount, setVocabCount] = useState<number>(10);
  const [grammarCount, setGrammarCount] = useState<number>(4);
  const [dialogueCount, setDialogueCount] = useState<number>(20);
  const [showOptions, setShowOptions] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const trimmed = url.trim();
    if (!trimmed) {
      setError("Please paste a YouTube video URL.");
      return;
    }

    startTransition(async () => {
      try {
        const res = await ingestLessonAction(trimmed, {
          quizCount,
          vocabCount,
          grammarCount,
          dialogueCount,
          targetLanguage,
        });

        if (!res.success) {
          setError(res.error);
          return;
        }

        setUrl("");
        router.push(`/lessons/${res.lessonId}`);
      } catch (err: unknown) {
        setError(
          err instanceof Error ? err.message : "An unexpected error occurred."
        );
      }
    });
  }

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4">
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-zinc-400">Target Language:</span>
          {(["english", "chinese"] as const).map((lang) => (
            <button
              key={lang}
              type="button"
              onClick={() => setTargetLanguage(lang)}
              disabled={isPending}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                targetLanguage === lang
                  ? "bg-blue-600 text-white shadow-sm font-semibold"
                  : "bg-zinc-800/80 text-zinc-400 hover:text-white hover:bg-zinc-800"
              }`}
            >
              {lang === "english" ? "🇺🇸 English" : "🇨🇳 Chinese"}
            </button>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Input
            type="text"
            placeholder="Paste YouTube Video URL (e.g. https://www.youtube.com/watch?v=...)"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            disabled={isPending}
            className="flex-1"
          />
          <Button type="submit" disabled={isPending || !url.trim()}>
            {isPending ? "Generating..." : "Generate Lesson"}
          </Button>
        </div>

        {/* Options toggle button */}
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => setShowOptions(!showOptions)}
            disabled={isPending}
            className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-blue-400 font-medium transition-colors"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Tùy chỉnh số lượng gen (Quiz / Từ vựng / Ngữ pháp)</span>
            {showOptions ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </button>
        </div>

        {/* Collapsible custom generation options */}
        {showOptions && (
          <div className="p-4 rounded-xl bg-zinc-900/90 border border-zinc-800 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="space-y-1.5">
              <label className="block text-zinc-300 font-semibold">
                📝 Số câu Quiz
              </label>
              <select
                value={quizCount}
                onChange={(e) => setQuizCount(Number(e.target.value))}
                disabled={isPending}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500 text-xs"
              >
                <option value={5}>5 câu (Mặc định)</option>
                <option value={10}>10 câu</option>
                <option value={15}>15 câu</option>
                <option value={20}>20 câu</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-zinc-300 font-semibold">
                📚 Số từ vựng (Vocab)
              </label>
              <select
                value={vocabCount}
                onChange={(e) => setVocabCount(Number(e.target.value))}
                disabled={isPending}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500 text-xs"
              >
                <option value={5}>5 từ</option>
                <option value={10}>10 từ (Mặc định)</option>
                <option value={15}>15 từ</option>
                <option value={20}>20 từ</option>
                <option value={25}>25 từ</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-zinc-300 font-semibold">
                💡 Điểm ngữ pháp (Grammar)
              </label>
              <select
                value={grammarCount}
                onChange={(e) => setGrammarCount(Number(e.target.value))}
                disabled={isPending}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500 text-xs"
              >
                <option value={4}>4 điểm (Mặc định)</option>
                <option value={6}>6 điểm</option>
                <option value={8}>8 điểm</option>
              </select>
            </div>

            <div className="space-y-1.5 sm:col-span-3">
              <label className="block text-zinc-300 font-semibold">
                💬 Số lượt thoại (Dialogue)
              </label>
              <select
                value={dialogueCount}
                onChange={(e) => setDialogueCount(Number(e.target.value))}
                disabled={isPending}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500 text-xs"
              >
                <option value={10}>10 lượt</option>
                <option value={15}>15 lượt</option>
                <option value={20}>20 lượt (Mặc định)</option>
                <option value={25}>25 lượt</option>
                <option value={30}>30 lượt</option>
                <option value={40}>40 lượt</option>
                <option value={50}>50 lượt</option>
              </select>
            </div>
          </div>
        )}
      </form>

      {isPending && (
        <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm flex items-center gap-3 animate-pulse">
          <div className="h-2 w-2 rounded-full bg-blue-400 animate-ping" />
          <span>
            Generating your lesson — this can take a few minutes for a long video.
            Please leave this tab open.
          </span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {error}
        </div>
      )}
    </div>
  );
}
