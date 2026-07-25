// path/to/src/components/lesson/tab-vocabulary.tsx
"use client";

import { useState, useTransition } from "react";
import { saveVocabToDeckAction } from "@/app/actions/save-vocab-to-deck-action";
import { Button } from "@/components/ui/button";
import { BookmarkCheck, Bookmark, Loader2 } from "lucide-react";

interface VocabItemData {
  id: string;
  orderIndex: number;
  term: string;
  meaning: string;
  example: string;
  flashcard: { id: string } | null;
}

interface TabVocabularyProps {
  items: VocabItemData[];
}

export function TabVocabulary({ items }: TabVocabularyProps) {
  const [savedIds, setSavedIds] = useState<Set<string>>(() => {
    const initial = new Set<string>();
    items.forEach((item) => {
      if (item.flashcard) {
        initial.add(item.id);
      }
    });
    return initial;
  });

  const [savingId, setSavingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSave = (vocabItemId: string) => {
    if (savedIds.has(vocabItemId) || isPending) return;

    setSavingId(vocabItemId);
    startTransition(async () => {
      try {
        const res = await saveVocabToDeckAction(vocabItemId);
        if (res.success) {
          setSavedIds((prev) => new Set(prev).add(vocabItemId));
        }
      } catch (err) {
        console.error("Failed to save flashcard:", err);
      } finally {
        setSavingId(null);
      }
    });
  };

  if (items.length === 0) {
    return (
      <div className="p-8 text-center text-zinc-500 rounded-xl bg-zinc-900/50 border border-zinc-800">
        No vocabulary items available for this lesson.
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {items.map((item) => {
        const isSaved = savedIds.has(item.id);
        const isCurrentlySaving = isPending && savingId === item.id;

        return (
          <div
            key={item.id}
            className="p-5 rounded-xl bg-zinc-900/70 border border-zinc-800/80 space-y-3 flex flex-col sm:flex-row sm:items-start justify-between gap-4"
          >
            <div className="space-y-2 flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h4 className="text-lg font-bold text-white tracking-wide">
                  {item.term}
                </h4>
              </div>
              <p className="text-sm text-zinc-300 font-medium leading-relaxed">
                {item.meaning}
              </p>
              {item.example && (
                <p className="text-xs text-zinc-400 italic bg-zinc-950/60 p-3 rounded-lg border border-zinc-800/60">
                  &ldquo;{item.example}&rdquo;
                </p>
              )}
            </div>

            <div className="shrink-0 self-start sm:self-auto">
              <Button
                onClick={() => handleSave(item.id)}
                disabled={isSaved || isPending}
                size="sm"
                variant={isSaved ? "outline" : "default"}
                className={
                  isSaved
                    ? "border-emerald-500/40 text-emerald-400 bg-emerald-950/20 hover:bg-emerald-950/30"
                    : "bg-blue-600 hover:bg-blue-500 text-white"
                }
              >
                {isCurrentlySaving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                    Saving...
                  </>
                ) : isSaved ? (
                  <>
                    <BookmarkCheck className="w-4 h-4 mr-1.5" />
                    Saved to Deck
                  </>
                ) : (
                  <>
                    <Bookmark className="w-4 h-4 mr-1.5" />
                    Save to Deck
                  </>
                )}
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
