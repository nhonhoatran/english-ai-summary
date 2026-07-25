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
      <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="font-semibold text-white">Interactive Quiz</h3>
          <p className="text-xs text-zinc-400">
            {isChecked
              ? `Score: ${correctCount} / ${totalQuestions} (${Math.round(
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
              className="bg-blue-600 hover:bg-blue-500 text-white"
            >
              <Check className="w-4 h-4 mr-1.5" />
              Check Answers
            </Button>
          )}

          <Button
            onClick={handleShowAnswers}
            variant="outline"
            size="sm"
            className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
          >
            <Eye className="w-4 h-4 mr-1.5" />
            Show Answers
          </Button>

          {(isChecked || isRevealed || answeredCount > 0) && (
            <Button
              onClick={handleReset}
              variant="outline"
              size="sm"
              className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
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
              className="p-5 rounded-xl bg-zinc-900/70 border border-zinc-800/80 space-y-4"
            >
              <div className="flex items-start justify-between gap-3">
                <h4 className="text-base font-medium text-zinc-100 flex items-start gap-2">
                  <span className="text-blue-400 font-bold">{q.orderIndex}.</span>
                  <span>{q.prompt}</span>
                </h4>

                {isChecked && (
                  <div className="shrink-0">
                    {isCorrect ? (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Correct
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2.5 py-1 rounded-full">
                        <XCircle className="w-3.5 h-3.5" /> Incorrect
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Options */}
              <div className="grid gap-2.5 pl-4">
                {q.options.map((opt, idx) => {
                  const label = optionLabels[idx] ?? `${idx + 1}`;
                  const isThisSelected = selectedIdx === idx;
                  const isThisCorrectOption = idx === q.correctIndex;

                  let optionStyle =
                    "border-zinc-800 bg-zinc-950/60 text-zinc-300 hover:bg-zinc-800/60 hover:border-zinc-700";

                  if (isChecked) {
                    if (isThisSelected && isThisCorrectOption) {
                      optionStyle =
                        "border-emerald-500/50 bg-emerald-950/30 text-emerald-300 font-medium";
                    } else if (isThisSelected && !isThisCorrectOption) {
                      optionStyle =
                        "border-rose-500/50 bg-rose-950/30 text-rose-300 line-through";
                    } else if (isRevealed && isThisCorrectOption) {
                      optionStyle =
                        "border-emerald-500/40 bg-emerald-950/20 text-emerald-300 font-medium";
                    }
                  } else if (isRevealed) {
                    if (isThisCorrectOption) {
                      optionStyle =
                        "border-emerald-500/50 bg-emerald-950/30 text-emerald-300 font-medium";
                    }
                  } else if (isThisSelected) {
                    optionStyle =
                      "border-blue-500/50 bg-blue-950/40 text-blue-200 font-medium";
                  }

                  return (
                    <label
                      key={idx}
                      onClick={() => handleSelect(q.id, idx)}
                      className={`p-3 rounded-lg border flex items-center gap-3 transition-all cursor-pointer select-none text-sm ${optionStyle}`}
                    >
                      <input
                        type="radio"
                        name={`question-${q.id}`}
                        checked={isThisSelected}
                        onChange={() => handleSelect(q.id, idx)}
                        disabled={isChecked || isRevealed}
                        className="sr-only"
                      />
                      <span className="w-6 h-6 rounded-md bg-zinc-800/80 border border-zinc-700 flex items-center justify-center text-xs font-mono text-zinc-400 font-bold uppercase shrink-0">
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
