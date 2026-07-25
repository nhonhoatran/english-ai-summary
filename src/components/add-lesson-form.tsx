// path/to/src/components/add-lesson-form.tsx
"use client";

import { useState, useTransition, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ingestLessonAction } from "@/app/actions/ingest-lesson-action";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function AddLessonForm() {
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = RouterHook();

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
        const res = await ingestLessonAction(trimmed);
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
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
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

function RouterHook() {
  return useRouter();
}
