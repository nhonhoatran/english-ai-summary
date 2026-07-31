"use client";

import { useEffect, useState } from "react";
import { LessonPlayerProvider } from "@/components/lesson/lesson-player-provider";
import { LessonTabs } from "@/components/lesson/lesson-tabs";
import { TabSummary } from "@/components/lesson/tab-summary";
import { TabScript } from "@/components/lesson/tab-script";
import { TabDialogue } from "@/components/lesson/tab-dialogue";
import { TabGrammar } from "@/components/lesson/tab-grammar";
import { TabQuiz } from "@/components/lesson/tab-quiz";
import { TabVocabulary } from "@/components/lesson/tab-vocabulary";
import { TabWritingPractice } from "@/components/lesson/tab-writing-practice";
import { MemberList } from "@/components/classroom/member-list";
import { Button } from "@/components/ui/button";
import { getSocket } from "@/lib/socket";
import {
  Radio,
  PowerOff,
  Copy,
  Check,
  Compass,
  Crown,
  AlertTriangle,
  ArrowLeft,
  Zap,
} from "lucide-react";
import Link from "next/link";

interface ClassroomViewerProps {
  code: string;
  isHost: boolean;
  hostName: string;
  lesson: any;
  initialTab?: string;
  initialSegment?: number;
}

export function ClassroomViewer({
  code,
  isHost,
  hostName,
  lesson,
  initialTab = "summary",
}: ClassroomViewerProps) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [isFreeMode, setIsFreeMode] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [copied, setCopied] = useState(false);
  const [ending, setEnding] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  // Socket.io Realtime Listener
  useEffect(() => {
    const socket = getSocket();

    const onConnect = () => {
      setIsConnected(true);
      socket.emit("join-room", { code, displayName: isHost ? hostName : "Member" });
    };

    const onDisconnect = () => {
      setIsConnected(false);
    };

    const onStateUpdated = (data: { currentTab: string; currentSegment: number; lastSyncAt: string }) => {
      if (!isHost && !isFreeMode && data.currentTab) {
        setActiveTab(data.currentTab);
      }
    };

    const onRoomEnded = () => {
      setIsActive(false);
    };

    if (socket.connected) {
      onConnect();
    } else {
      socket.on("connect", onConnect);
    }

    socket.on("disconnect", onDisconnect);
    socket.on("state-updated", onStateUpdated);
    socket.on("room-ended", onRoomEnded);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("state-updated", onStateUpdated);
      socket.off("room-ended", onRoomEnded);
    };
  }, [code, isHost, hostName, isFreeMode]);

  // Fallback Polling (10s) to keep lastSeenAt updated in DB
  useEffect(() => {
    const fetchState = async () => {
      try {
        const res = await fetch(`/api/classroom/${code}/state`);
        if (!res.ok) return;
        const data = await res.json();
        if (!data.isActive) {
          setIsActive(false);
        }
      } catch (err) {
        console.error("State polling error:", err);
      }
    };

    const interval = setInterval(fetchState, 10000);
    return () => clearInterval(interval);
  }, [code]);

  // Host tab sync trigger via Socket.io + DB
  const handleTabChange = async (newTab: string) => {
    setActiveTab(newTab);
    if (isHost) {
      const socket = getSocket();
      socket.emit("sync-state", { code, currentTab: newTab, currentSegment: 0 });

      // Async DB sync
      fetch(`/api/classroom/${code}/sync`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentTab: newTab, currentSegment: 0 }),
      }).catch(() => {});
    }
  };

  // Host end class trigger via Socket.io + DB
  const handleEndClass = async () => {
    if (!confirm("Bạn có chắc chắn muốn kết thúc lớp học này không?")) return;
    setEnding(true);

    const socket = getSocket();
    socket.emit("end-room", { code });
    setIsActive(false);

    try {
      await fetch(`/api/classroom/${code}/end`, { method: "POST" });
    } catch (err) {
      console.error("Failed to end classroom:", err);
    } finally {
      setEnding(false);
    }
  };

  const copyShareLink = () => {
    const shareUrl = `${window.location.origin}/classroom/${code}`;
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isActive) {
    return (
      <div className="max-w-md mx-auto my-16 p-8 glass-card border border-rose-900/50 rounded-2xl text-center space-y-4 shadow-2xl">
        <div className="w-12 h-12 rounded-full bg-rose-950/60 border border-rose-800 text-rose-400 flex items-center justify-center mx-auto">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-white">Lớp học đã kết thúc</h2>
        <p className="text-xs text-zinc-400">
          Host đã đóng buổi học này. Cảm ơn bạn đã tham gia!
        </p>
        <Link href={`/lessons/${lesson.id}`}>
          <Button className="mt-4 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-semibold rounded-xl">
            Quay lại bài học đơn
          </Button>
        </Link>
      </div>
    );
  }

  const vocabItemsForTab = (lesson.vocabItems || []).map((item: any) => ({
    id: item.id,
    orderIndex: item.orderIndex,
    term: item.term,
    ipa: item.ipa,
    meaning: item.meaning,
    example: item.example,
    flashcard: item.flashcards?.[0] ? { id: item.flashcards[0].id } : null,
  }));

  const writingPromptsForTab = (lesson.writingPrompts || []).map((wp: any) => ({
    id: wp.id,
    orderIndex: wp.orderIndex,
    viMeaning: wp.viMeaning,
  }));

  return (
    <div className="space-y-6">
      {/* Top Classroom Navigation & Controls Bar */}
      <div className="glass-card p-4 rounded-2xl border border-zinc-800/80 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href={`/lessons/${lesson.id}`}
            className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white transition-colors"
            title="Quay về bài học"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-zinc-400">Mã lớp:</span>
              <span className="font-mono font-bold text-sm text-blue-400 px-2 py-0.5 rounded bg-blue-950/50 border border-blue-800/40">
                {code}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={copyShareLink}
                className="h-7 px-2 text-xs text-zinc-400 hover:text-white hover:bg-zinc-800"
              >
                {copied ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
                <span className="ml-1">{copied ? "Đã chép" : "Copy link"}</span>
              </Button>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5 flex items-center gap-1.5">
              <span>Bài học: <strong className="text-zinc-200">{lesson.title}</strong></span>
              {isConnected && (
                <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-semibold px-1.5 py-0.2 rounded bg-emerald-950/60 border border-emerald-800/40">
                  <Zap className="w-3 h-3 text-emerald-400 animate-bounce" />
                  Realtime Socket
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Sync status & User Mode toggles */}
        <div className="flex items-center gap-3">
          {isHost ? (
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold">
                <Crown className="w-4 h-4 text-amber-400" />
                Bạn là Host (Điều hành lớp)
              </span>
              <Button
                onClick={handleEndClass}
                disabled={ending}
                variant="destructive"
                className="h-8 px-3 text-xs rounded-xl font-semibold gap-1.5 bg-rose-600/80 hover:bg-rose-600"
              >
                <PowerOff className="w-3.5 h-3.5" />
                <span>Kết thúc lớp</span>
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              {!isFreeMode ? (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-950/40 border border-blue-800/40 text-blue-300 text-xs font-medium">
                  <Radio className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
                  <span>Đồng bộ theo Host ({hostName})</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 text-xs font-medium">
                  <Compass className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Chế độ Tự do</span>
                </div>
              )}

              <Button
                onClick={() => setIsFreeMode(!isFreeMode)}
                variant="outline"
                className="h-8 px-3 text-xs rounded-xl border-zinc-700 bg-zinc-900 text-zinc-200 hover:bg-zinc-800 hover:text-white"
              >
                {isFreeMode ? "Bật đồng bộ" : "Tự do xem"}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Main Grid: Player & Tabs on Left, Member Sidebar on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 space-y-6">
          <LessonPlayerProvider videoId={lesson.videoId}>
            <LessonTabs
              activeTab={activeTab}
              onTabChange={handleTabChange}
              summaryTab={
                <TabSummary
                  summary={lesson.summary ?? ""}
                  title={lesson.title}
                  description={lesson.description}
                />
              }
              scriptTab={<TabScript segments={lesson.segments || []} />}
              dialogueTab={
                <TabDialogue
                  dialogueLines={lesson.dialogueLines || []}
                  segments={lesson.segments || []}
                />
              }
              grammarTab={
                <TabGrammar
                  grammarTheme={lesson.grammarTheme}
                  grammarPoints={lesson.grammarPoints || []}
                />
              }
              quizTab={<TabQuiz questions={lesson.quizQuestions || []} />}
              vocabTab={
                <TabVocabulary
                  items={vocabItemsForTab}
                  targetLanguage={lesson.targetLanguage}
                />
              }
              writingTab={
                <TabWritingPractice
                  prompts={writingPromptsForTab}
                  lessonId={lesson.id}
                  targetLanguage={lesson.targetLanguage}
                />
              }
            />
          </LessonPlayerProvider>
        </div>

        <div className="lg:col-span-1 space-y-6">
          <MemberList code={code} hostName={hostName} />
        </div>
      </div>
    </div>
  );
}
