// path/to/src/app/page.tsx
import { AddLessonForm } from "@/components/add-lesson-form";

export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col items-center justify-center p-6">
      <main className="w-full max-w-3xl flex flex-col items-center gap-8 text-center">
        <div className="space-y-3">
          <h1 className="text-4xl font-bold tracking-tight text-white">
            YouTube English Lesson Generator
          </h1>
          <p className="text-zinc-400 text-lg max-w-xl mx-auto">
            Paste any YouTube English video URL to generate an interactive ELLLO-style lesson with script, grammar, quiz, and vocabulary.
          </p>
        </div>

        <AddLessonForm />
      </main>
    </div>
  );
}
