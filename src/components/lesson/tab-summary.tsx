import { BookText, Brain } from "lucide-react";

interface TabSummaryProps {
  summary: string;
  title: string;
  description: string | null;
}

export function TabSummary({ summary, title, description }: TabSummaryProps) {
  if (!summary) {
    return (
      <div className="p-8 text-center text-zinc-500 rounded-xl bg-zinc-900/50 border border-zinc-800">
        Summary not available for this lesson.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary card */}
      <div className="p-6 rounded-xl bg-zinc-900/70 border border-zinc-800/80 space-y-4">
        <div className="flex items-center gap-2 text-blue-400">
          <Brain className="w-5 h-5" />
          <h3 className="font-semibold text-sm uppercase tracking-wider">AI Summary</h3>
        </div>
        <p className="text-zinc-200 leading-relaxed">{summary}</p>
      </div>

      {/* Description card (the 1-sentence elllo description) */}
      {description && (
        <div className="p-6 rounded-xl bg-zinc-900/50 border border-zinc-800/60 space-y-3">
          <div className="flex items-center gap-2 text-emerald-400">
            <BookText className="w-5 h-5" />
            <h3 className="font-semibold text-sm uppercase tracking-wider">About this lesson</h3>
          </div>
          <p className="text-zinc-300 text-sm leading-relaxed">{description}</p>
        </div>
      )}
    </div>
  );
}
