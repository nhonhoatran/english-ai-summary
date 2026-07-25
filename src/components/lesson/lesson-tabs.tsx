// path/to/src/components/lesson/lesson-tabs.tsx
"use client";

import { useState, useEffect, ReactNode } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { FileText, BookOpen, HelpCircle, BookMarked } from "lucide-react";

const VALID_TABS = ["script", "grammar", "quiz", "vocab"] as const;
type TabValue = (typeof VALID_TABS)[number];

interface LessonTabsProps {
  scriptTab: ReactNode;
  grammarTab: ReactNode;
  quizTab: ReactNode;
  vocabTab: ReactNode;
}

export function LessonTabs({
  scriptTab,
  grammarTab,
  quizTab,
  vocabTab,
}: LessonTabsProps) {
  const [activeTab, setActiveTab] = useState<TabValue>("script");

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace("#", "");
      if (VALID_TABS.includes(hash as TabValue)) {
        setActiveTab(hash as TabValue);
      }
    };

    handleHashChange();
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  const handleTabChange = (val: string) => {
    if (VALID_TABS.includes(val as TabValue)) {
      setActiveTab(val as TabValue);
      window.history.replaceState(null, "", `#${val}`);
    }
  };

  return (
    <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full space-y-6">
      <TabsList className="w-full justify-start bg-zinc-900 border border-zinc-800 p-1.5 rounded-xl h-auto gap-2">
        <TabsTrigger
          value="script"
          className="flex-1 sm:flex-none py-2.5 px-4 rounded-lg text-zinc-400 data-[state=active]:bg-zinc-800 data-[state=active]:text-white transition-all text-sm font-medium gap-2"
        >
          <FileText className="w-4 h-4" />
          <span>Script</span>
        </TabsTrigger>

        <TabsTrigger
          value="grammar"
          className="flex-1 sm:flex-none py-2.5 px-4 rounded-lg text-zinc-400 data-[state=active]:bg-zinc-800 data-[state=active]:text-white transition-all text-sm font-medium gap-2"
        >
          <BookOpen className="w-4 h-4" />
          <span>Grammar</span>
        </TabsTrigger>

        <TabsTrigger
          value="quiz"
          className="flex-1 sm:flex-none py-2.5 px-4 rounded-lg text-zinc-400 data-[state=active]:bg-zinc-800 data-[state=active]:text-white transition-all text-sm font-medium gap-2"
        >
          <HelpCircle className="w-4 h-4" />
          <span>Quiz</span>
        </TabsTrigger>

        <TabsTrigger
          value="vocab"
          className="flex-1 sm:flex-none py-2.5 px-4 rounded-lg text-zinc-400 data-[state=active]:bg-zinc-800 data-[state=active]:text-white transition-all text-sm font-medium gap-2"
        >
          <BookMarked className="w-4 h-4" />
          <span>Vocabulary</span>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="script" className="mt-4 focus-visible:outline-none">
        {scriptTab}
      </TabsContent>
      <TabsContent value="grammar" className="mt-4 focus-visible:outline-none">
        {grammarTab}
      </TabsContent>
      <TabsContent value="quiz" className="mt-4 focus-visible:outline-none">
        {quizTab}
      </TabsContent>
      <TabsContent value="vocab" className="mt-4 focus-visible:outline-none">
        {vocabTab}
      </TabsContent>
    </Tabs>
  );
}
