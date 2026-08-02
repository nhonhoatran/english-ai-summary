import { BookText, Brain } from "lucide-react";

interface TabSummaryProps {
  summary: string;
  description: string | null;
}

export function TabSummary({ summary, description }: TabSummaryProps) {
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
      <div className="p-6 glass-card space-y-4 shadow-xl border-zinc-800/80">
        <div className="flex items-center gap-2.5 text-blue-400">
          <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-300">
            <Brain className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-sm uppercase tracking-wider text-purple-300">AI Summary</h3>
        </div>
        <p className="text-zinc-200 leading-relaxed text-base font-normal">{summary}</p>
      </div>

      {/* Description card (the 1-sentence elllo description) */}
      {description && (
        <div className="p-6 glass-card space-y-3 border-zinc-800/60 shadow-lg">
          <div className="flex items-center gap-2.5 text-emerald-400">
            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300">
              <BookText className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm uppercase tracking-wider text-emerald-300">About this lesson</h3>
          </div>
          <p className="text-zinc-300 text-sm leading-relaxed">{description}</p>
        </div>
      )}
    </div>
  );
}
