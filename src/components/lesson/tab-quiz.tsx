// path/to/src/components/lesson/tab-quiz.tsx
"use client";

import { useState } from "react";
import { CheckCircle2, XCircle, RotateCcw, Eye, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

interface QuizQuestionData {
  id: string;
  orderIndex: number;
  prompt: string;
  options: string[];
  correctIndex: number;
}

interface TabQuizProps {
  questions: QuizQuestionData[];
}

export function TabQuiz({ questions }: TabQuizProps) {
  const [userSelections, setUserSelections] = useState<Record<string, number>>({});
  const [isChecked, setIsChecked] = useState(false);
  const [isRevealed, setIsRevealed] = useState(false);

  const handleSelect = (questionId: string, optionIndex: number) => {
    if (isChecked || isRevealed) return;
    setUserSelections((prev) => ({
      ...prev,
      [questionId]: optionIndex,
    }));
  };

  const handleCheck = () => {
    setIsChecked(true);
  };

  const handleReset = () => {
    setUserSelections({});
    setIsChecked(false);
    setIsRevealed(false);
  };

  const handleShowAnswers = () => {
    setIsRevealed(true);
  };

  const totalQuestions = questions.length;
  const answeredCount = Object.keys(userSelections).length;

  const correctCount = questions.reduce((acc, q) => {
    return userSelections[q.id] === q.correctIndex ? acc + 1 : acc;
  }, 0);

  if (totalQuestions === 0) {
    return (
      <div className="p-8 text-center text-zinc-500 rounded-xl bg-zinc-900/50 border border-zinc-800">
        No quiz questions available for this lesson.
      </div>
    );
  }

  const optionLabels = ["a", "b", "c"];

  return (
    <div className="space-y-6">
      {/* Quiz Controls & Score Bar */}
      <div className="p-5 glass-card shadow-xl flex flex-wrap items-center justify-between gap-4 border-zinc-800/80">
        <div>
          <h3 className="font-extrabold text-base text-white flex items-center gap-2">
            <span>Interactive Quiz</span>
          </h3>
          <p className="text-xs text-zinc-400 font-medium mt-0.5">
            {isChecked
              ? `Final Score: ${correctCount} / ${totalQuestions} (${Math.round(
                  (correctCount / totalQuestions) * 100
                )}%)`
              : `${answeredCount} of ${totalQuestions} answered`}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {!isChecked && !isRevealed && (
            <Button
              onClick={handleCheck}
              disabled={answeredCount === 0}
              size="sm"
              className="bg-blue-600 hover:bg-blue-500 text-white font-semibold shadow-md shadow-blue-600/20"
            >
              <Check className="w-4 h-4 mr-1.5" />
              Check Answers
            </Button>
          )}

          <Button
            onClick={handleShowAnswers}
            variant="outline"
            size="sm"
            className="border-zinc-700/80 text-zinc-300 hover:bg-zinc-800"
          >
            <Eye className="w-4 h-4 mr-1.5" />
            Show Answers
          </Button>

          {(isChecked || isRevealed || answeredCount > 0) && (
            <Button
              onClick={handleReset}
              variant="outline"
              size="sm"
              className="border-zinc-700/80 text-zinc-300 hover:bg-zinc-800"
            >
              <RotateCcw className="w-4 h-4 mr-1.5" />
              Reset Quiz
            </Button>
          )}
        </div>
      </div>

      {/* Question List */}
      <div className="space-y-4">
        {questions.map((q) => {
          const selectedIdx = userSelections[q.id];
          const isCorrect = selectedIdx === q.correctIndex;

          return (
            <div
              key={q.id}
              className="p-5 glass-card glass-card-hover space-y-4 shadow-lg"
            >
              <div className="flex items-start justify-between gap-3">
                <h4 className="text-base font-semibold text-zinc-100 flex items-start gap-2.5">
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-extrabold shrink-0">
                    {q.orderIndex}
                  </span>
                  <span className="leading-snug pt-0.5">{q.prompt}</span>
                </h4>

                {isChecked && (
                  <div className="shrink-0">
                    {isCorrect ? (
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full shadow-inner">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Correct
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-400 bg-rose-500/10 border border-rose-500/20 px-3 py-1 rounded-full shadow-inner">
                        <XCircle className="w-3.5 h-3.5" /> Incorrect
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Options */}
              <div className="grid gap-2.5 pl-2">
                {q.options.map((opt, idx) => {
                  const label = optionLabels[idx] ?? `${idx + 1}`;
                  const isThisSelected = selectedIdx === idx;
                  const isThisCorrectOption = idx === q.correctIndex;

                  let optionStyle =
                    "border-zinc-800/80 bg-zinc-950/60 text-zinc-300 hover:bg-zinc-800/60 hover:border-zinc-700";

                  if (isChecked) {
                    if (isThisSelected && isThisCorrectOption) {
                      optionStyle =
                        "border-emerald-500/60 bg-emerald-950/40 text-emerald-200 font-semibold shadow-inner";
                    } else if (isThisSelected && !isThisCorrectOption) {
                      optionStyle =
                        "border-rose-500/60 bg-rose-950/40 text-rose-300 line-through opacity-80";
                    } else if (isRevealed && isThisCorrectOption) {
                      optionStyle =
                        "border-emerald-500/50 bg-emerald-950/30 text-emerald-300 font-semibold";
                    }
                  } else if (isRevealed) {
                    if (isThisCorrectOption) {
                      optionStyle =
                        "border-emerald-500/60 bg-emerald-950/40 text-emerald-300 font-semibold";
                    }
                  } else if (isThisSelected) {
                    optionStyle =
                      "border-blue-500/60 bg-blue-950/50 text-blue-100 font-semibold shadow-md shadow-blue-500/10";
                  }

                  return (
                    <label
                      key={idx}
                      onClick={() => handleSelect(q.id, idx)}
                      className={`p-3.5 rounded-xl border flex items-center gap-3 transition-all cursor-pointer select-none text-sm ${optionStyle}`}
                    >
                      <input
                        type="radio"
                        name={`question-${q.id}`}
                        checked={isThisSelected}
                        onChange={() => handleSelect(q.id, idx)}
                        disabled={isChecked || isRevealed}
                        className="sr-only"
                      />
                      <span className={`w-6 h-6 rounded-lg border flex items-center justify-center text-xs font-mono font-bold uppercase shrink-0 transition-colors ${
                        isThisSelected
                          ? "bg-blue-600 border-blue-500 text-white shadow-sm"
                          : "bg-zinc-800/80 border-zinc-700/80 text-zinc-400"
                      }`}>
                        {label}
                      </span>
                      <span className="flex-1">{opt}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
