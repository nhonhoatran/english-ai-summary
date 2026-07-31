// path/to/src/components/lesson/tab-grammar.tsx
interface GrammarPointData {
  id: string;
  orderIndex: number;
  explanation: string;
  examples: string[];
}

interface TabGrammarProps {
  grammarTheme: string | null;
  grammarPoints: GrammarPointData[];
}

export function TabGrammar({ grammarTheme, grammarPoints }: TabGrammarProps) {
  return (
    <div className="space-y-6">
      {grammarTheme && (
        <div className="p-5 glass-card bg-gradient-to-r from-blue-950/60 via-indigo-950/40 to-purple-950/40 border-blue-500/30 shadow-xl space-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-blue-400">
            Grammar Focus
          </span>
          <h3 className="text-xl sm:text-2xl font-extrabold text-white">{grammarTheme}</h3>
        </div>
      )}

      {grammarPoints.length === 0 ? (
        <div className="p-8 text-center text-zinc-500 glass-card">
          No grammar points available for this lesson.
        </div>
      ) : (
        <div className="grid gap-4">
          {grammarPoints.map((point) => (
            <div
              key={point.id}
              className="p-5 glass-card glass-card-hover space-y-4 shadow-lg"
            >
              <h4 className="text-base font-semibold text-zinc-100 flex items-start gap-3">
                <span className="inline-flex items-center justify-center w-7 h-7 rounded-xl bg-blue-500/20 text-blue-300 text-xs font-extrabold border border-blue-500/30 shrink-0 shadow-inner">
                  {point.orderIndex}
                </span>
                <span className="leading-snug pt-0.5">{point.explanation}</span>
              </h4>

              {point.examples.length > 0 && (
                <ul className="space-y-2 pl-2 text-sm text-zinc-300">
                  {point.examples.map((example, idx) => (
                    <li key={idx} className="flex items-start gap-3 bg-zinc-950/60 p-3 rounded-xl border border-zinc-800/60 font-mono text-xs text-zinc-200">
                      <span className="text-blue-400 font-bold select-none">•</span>
                      <span className="leading-relaxed font-sans">{example}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
