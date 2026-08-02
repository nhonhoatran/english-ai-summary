// path/to/src/components/lesson/lesson-tabs.tsx
"use client";

import { useState, useEffect, useRef, ReactNode } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { FileText, BookOpen, HelpCircle, BookMarked, MessageSquare, Brain, PenLine } from "lucide-react";

const VALID_TABS = ["summary", "script", "dialogue", "grammar", "quiz", "vocab", "writing"] as const;
type TabValue = (typeof VALID_TABS)[number];

interface LessonTabsProps {
  summaryTab: ReactNode;
  scriptTab: ReactNode;
  dialogueTab: ReactNode;
  grammarTab: ReactNode;
  quizTab: ReactNode;
  vocabTab: ReactNode;
  writingTab: ReactNode;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

export function LessonTabs({
  summaryTab,
  scriptTab,
  dialogueTab,
  grammarTab,
  quizTab,
  vocabTab,
  writingTab,
  activeTab: controlledActiveTab,
  onTabChange: controlledOnTabChange,
}: LessonTabsProps) {
  const [internalActiveTab, setInternalActiveTab] = useState<TabValue>("summary");

  const currentTab = (controlledActiveTab && VALID_TABS.includes(controlledActiveTab as TabValue))
    ? (controlledActiveTab as TabValue)
    : internalActiveTab;

  // Parents pass an inline arrow, so depending on the callback directly would
  // re-subscribe the hash listener on every render. Keep it in a ref instead.
  const onTabChangeRef = useRef(controlledOnTabChange);
  useEffect(() => {
    onTabChangeRef.current = controlledOnTabChange;
  }, [controlledOnTabChange]);

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace("#", "");
      if (VALID_TABS.includes(hash as TabValue)) {
        setInternalActiveTab(hash as TabValue);
        onTabChangeRef.current?.(hash);
      }
    };

    handleHashChange();
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  const handleTabChange = (val: string) => {
    if (VALID_TABS.includes(val as TabValue)) {
      setInternalActiveTab(val as TabValue);
      controlledOnTabChange?.(val);
      window.history.replaceState(null, "", `#${val}`);
    }
  };

  return (
    <Tabs value={currentTab} onValueChange={handleTabChange} className="w-full space-y-6">
      <div className="relative">
        <TabsList className="w-full justify-start bg-zinc-900/90 backdrop-blur-md border border-zinc-800/80 p-1.5 rounded-2xl h-auto gap-1.5 flex overflow-x-auto no-scrollbar shadow-xl">
          <TabsTrigger
            value="summary"
            className="flex-shrink-0 py-2.5 px-4 rounded-xl text-zinc-400 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-purple-600/30 transition-all text-xs sm:text-sm font-semibold gap-2 hover:text-zinc-200"
          >
            <Brain className="w-4 h-4 text-purple-300" />
            <span>Summary</span>
          </TabsTrigger>

          <TabsTrigger
            value="script"
            className="flex-shrink-0 py-2.5 px-4 rounded-xl text-zinc-400 data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-blue-600/30 transition-all text-xs sm:text-sm font-semibold gap-2 hover:text-zinc-200"
          >
            <FileText className="w-4 h-4 text-blue-300" />
            <span>Script</span>
          </TabsTrigger>

          <TabsTrigger
            value="dialogue"
            className="flex-shrink-0 py-2.5 px-4 rounded-xl text-zinc-400 data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-blue-600/30 transition-all text-xs sm:text-sm font-semibold gap-2 hover:text-zinc-200"
          >
            <MessageSquare className="w-4 h-4 text-sky-300" />
            <span>Dialogue</span>
          </TabsTrigger>

          <TabsTrigger
            value="grammar"
            className="flex-shrink-0 py-2.5 px-4 rounded-xl text-zinc-400 data-[state=active]:bg-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-indigo-600/30 transition-all text-xs sm:text-sm font-semibold gap-2 hover:text-zinc-200"
          >
            <BookOpen className="w-4 h-4 text-indigo-300" />
            <span>Grammar</span>
          </TabsTrigger>

          <TabsTrigger
            value="quiz"
            className="flex-shrink-0 py-2.5 px-4 rounded-xl text-zinc-400 data-[state=active]:bg-amber-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-amber-600/30 transition-all text-xs sm:text-sm font-semibold gap-2 hover:text-zinc-200"
          >
            <HelpCircle className="w-4 h-4 text-amber-300" />
            <span>Quiz</span>
          </TabsTrigger>

          <TabsTrigger
            value="vocab"
            className="flex-shrink-0 py-2.5 px-4 rounded-xl text-zinc-400 data-[state=active]:bg-emerald-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-emerald-600/30 transition-all text-xs sm:text-sm font-semibold gap-2 hover:text-zinc-200"
          >
            <BookMarked className="w-4 h-4 text-emerald-300" />
            <span>Vocabulary</span>
          </TabsTrigger>

          <TabsTrigger
            value="writing"
            className="flex-shrink-0 py-2.5 px-4 rounded-xl text-zinc-400 data-[state=active]:bg-teal-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-teal-600/30 transition-all text-xs sm:text-sm font-semibold gap-2 hover:text-zinc-200"
          >
            <PenLine className="w-4 h-4 text-teal-300" />
            <span>Practice</span>
          </TabsTrigger>
        </TabsList>
      </div>

      {/*
        keepMounted is REQUIRED, not cosmetic: Base UI's Tabs.Panel defaults to
        keepMounted={false}, which unmounts the hidden panel and throws away all
        of its React state. Without this, leaving the Practice tab reset the
        learner back to prompt 1 (and the progress bar back to 1/N) every time.
      */}
      <TabsContent
        value="summary"
        keepMounted
        className="mt-4 focus-visible:outline-none animate-scale-in"
      >
        {summaryTab}
      </TabsContent>
      <TabsContent
        value="script"
        keepMounted
        className="mt-4 focus-visible:outline-none animate-scale-in"
      >
        {scriptTab}
      </TabsContent>
      <TabsContent
        value="dialogue"
        keepMounted
        className="mt-4 focus-visible:outline-none animate-scale-in"
      >
        {dialogueTab}
      </TabsContent>
      <TabsContent
        value="grammar"
        keepMounted
        className="mt-4 focus-visible:outline-none animate-scale-in"
      >
        {grammarTab}
      </TabsContent>
      <TabsContent
        value="quiz"
        keepMounted
        className="mt-4 focus-visible:outline-none animate-scale-in"
      >
        {quizTab}
      </TabsContent>
      <TabsContent
        value="vocab"
        keepMounted
        className="mt-4 focus-visible:outline-none animate-scale-in"
      >
        {vocabTab}
      </TabsContent>
      <TabsContent
        value="writing"
        keepMounted
        className="mt-4 focus-visible:outline-none animate-scale-in"
      >
        {writingTab}
      </TabsContent>
    </Tabs>
  );
}
