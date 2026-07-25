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
        <div className="p-4 rounded-xl bg-gradient-to-r from-blue-950/40 to-indigo-950/40 border border-blue-800/30">
          <span className="text-xs font-semibold uppercase tracking-wider text-blue-400">
            Grammar Focus
          </span>
          <h3 className="text-xl font-bold text-white mt-1">{grammarTheme}</h3>
        </div>
      )}

      {grammarPoints.length === 0 ? (
        <div className="p-8 text-center text-zinc-500 rounded-xl bg-zinc-900/50 border border-zinc-800">
          No grammar points available for this lesson.
        </div>
      ) : (
        <div className="grid gap-4">
          {grammarPoints.map((point) => (
            <div
              key={point.id}
              className="p-5 rounded-xl bg-zinc-900/70 border border-zinc-800/80 space-y-3"
            >
              <h4 className="text-base font-semibold text-zinc-100 flex items-center gap-2">
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-600/20 text-blue-400 text-xs font-bold border border-blue-500/30">
                  {point.orderIndex}
                </span>
                <span>{point.explanation}</span>
              </h4>

              {point.examples.length > 0 && (
                <ul className="space-y-2 pl-4 text-sm text-zinc-300">
                  {point.examples.map((example, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-blue-400 font-bold select-none">•</span>
                      <span>{example}</span>
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
