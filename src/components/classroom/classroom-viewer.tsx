"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
import { ClassroomHeaderBar } from "@/components/classroom/classroom-header-bar";
import {
  ClassroomLessonList,
  type ClassroomLessonSummary,
} from "@/components/classroom/classroom-lesson-list";
import { ClassroomLeaderboard } from "@/components/classroom/classroom-leaderboard";
import { ClassroomActivityFeed } from "@/components/classroom/classroom-activity-feed";
import { Button } from "@/components/ui/button";
import { getSocket } from "@/lib/socket";
import type { PracticeAttemptView } from "@/lib/practice/practice-types";
import { AlertTriangle } from "lucide-react";

interface ClassroomViewerProps {
  code: string;
  className: string | null;
  isHost: boolean;
  hostName: string;
  hostUserId: string;
  currentUserId: string;
  displayName: string;
  memberId: string | null;
  /** Fully-loaded lesson the class is currently on, or null when none is set. */
  lesson: {
    id: string;
    videoId: string;
    title: string;
    description: string | null;
    summary: string | null;
    grammarTheme: string | null;
    targetLanguage: "english" | "chinese";
    segments: unknown[];
    dialogueLines: unknown[];
    grammarPoints: unknown[];
    quizQuestions: unknown[];
    writingPrompts: { id: string; orderIndex: number; viMeaning: string }[];
    vocabItems: {
      id: string;
      orderIndex: number;
      term: string;
      ipa: string | null;
      meaning: string;
      example: string;
      flashcards?: { id: string }[];
    }[];
  };
  lessons: ClassroomLessonSummary[];
  initialTab?: string;
  ownAttempts: PracticeAttemptView[];
  classroomAttempts: PracticeAttemptView[];
}

export function ClassroomViewer({
  code,
  className,
  isHost,
  hostName,
  hostUserId,
  currentUserId,
  displayName,
  memberId,
  lesson,
  lessons,
  initialTab = "summary",
  ownAttempts,
  classroomAttempts,
}: ClassroomViewerProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState(initialTab);
  const [isFreeMode, setIsFreeMode] = useState(false);
  const [roomState, setRoomState] = useState<"live" | "ended" | "deleted">("live");
  const [ending, setEnding] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  // Read inside the socket handler without making the subscription depend on
  // it — otherwise toggling free mode tore down the socket and re-joined the
  // room, making the member blink out of everyone else's presence list.
  const followsHostRef = useRef(!isHost && !isFreeMode);

  useEffect(() => {
    followsHostRef.current = !isHost && !isFreeMode;
  }, [isHost, isFreeMode]);

  useEffect(() => {
    const socket = getSocket();

    const onConnect = () => {
      setIsConnected(true);
      // Join with the real identity — everyone used to join as "Member", so the
      // server could not tell members apart for presence or the feed.
      socket.emit("join-room", { code, userId: currentUserId, memberId, displayName });
    };

    const onDisconnect = () => setIsConnected(false);

    const onStateUpdated = (data: { currentTab?: string }) => {
      if (followsHostRef.current && data?.currentTab) {
        setActiveTab(data.currentTab);
      }
    };

    const onLessonChanged = () => router.refresh();
    const onRoomEnded = () => setRoomState("ended");
    const onRoomDeleted = () => setRoomState("deleted");

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("state-updated", onStateUpdated);
    socket.on("lesson-switched", onLessonChanged);
    socket.on("lessons-changed", onLessonChanged);
    socket.on("room-ended", onRoomEnded);
    socket.on("room-deleted", onRoomDeleted);

    if (socket.connected) onConnect();

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("state-updated", onStateUpdated);
      socket.off("lesson-switched", onLessonChanged);
      socket.off("lessons-changed", onLessonChanged);
      socket.off("room-ended", onRoomEnded);
      socket.off("room-deleted", onRoomDeleted);
      socket.emit("leave-room");
    };
  }, [code, currentUserId, memberId, displayName, router]);

  // Safety net: if the socket is down, "room ended" would never arrive. A slow
  // poll still catches it without the old 10s hammering.
  useEffect(() => {
    const check = async () => {
      try {
        const res = await fetch(`/api/classroom/${code}/state`);
        if (res.status === 404) {
          setRoomState("deleted");
          return;
        }
        if (!res.ok) return;
        const data = await res.json();
        if (!data.isActive) setRoomState("ended");
      } catch {
        // offline — the socket listener will catch up on reconnect
      }
    };

    const interval = setInterval(check, 30000);
    return () => clearInterval(interval);
  }, [code]);

  const handleTabChange = async (newTab: string) => {
    setActiveTab(newTab);
    if (!isHost) return;

    getSocket().emit("sync-state", { code, currentTab: newTab, currentSegment: 0 });
    fetch(`/api/classroom/${code}/sync`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentTab: newTab, currentSegment: 0 }),
    }).catch(() => {});
  };

  const handleEndClass = async () => {
    if (!confirm("Kết thúc buổi học này? Lớp và bài học vẫn được giữ lại.")) return;
    setEnding(true);
    try {
      await fetch(`/api/classroom/${code}/end`, { method: "POST" });
      setRoomState("ended");
    } catch (err) {
      console.error("Failed to end classroom:", err);
    } finally {
      setEnding(false);
    }
  };

  if (roomState !== "live") {
    return (
      <div className="max-w-md mx-auto my-16 p-8 glass-card border border-rose-900/50 rounded-2xl text-center space-y-4 shadow-2xl">
        <div className="w-12 h-12 rounded-full bg-rose-950/60 border border-rose-800 text-rose-400 flex items-center justify-center mx-auto">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-white">
          {roomState === "deleted" ? "Lớp học đã bị xóa" : "Buổi học đã kết thúc"}
        </h2>
        <p className="text-xs text-zinc-400">
          {roomState === "deleted"
            ? "Host đã xóa vĩnh viễn lớp học này."
            : "Host đã đóng buổi học. Cảm ơn bạn đã tham gia!"}
        </p>
        <Link href="/">
          <Button className="mt-4 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-semibold rounded-xl">
            Về trang chủ
          </Button>
        </Link>
      </div>
    );
  }

  const vocabItemsForTab = lesson.vocabItems.map((item) => ({
    id: item.id,
    orderIndex: item.orderIndex,
    term: item.term,
    ipa: item.ipa,
    meaning: item.meaning,
    example: item.example,
    flashcard: item.flashcards?.[0] ? { id: item.flashcards[0].id } : null,
  }));

  return (
    <div className="space-y-6">
      <ClassroomHeaderBar
        code={code}
        className={className}
        lessonTitle={lesson.title}
        isHost={isHost}
        hostName={hostName}
        isConnected={isConnected}
        isFreeMode={isFreeMode}
        ending={ending}
        onToggleFreeMode={() => setIsFreeMode((prev) => !prev)}
        onEndClass={handleEndClass}
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 space-y-6">
          <LessonPlayerProvider videoId={lesson.videoId}>
            <LessonTabs
              activeTab={activeTab}
              onTabChange={handleTabChange}
              summaryTab={
                <TabSummary
                  summary={lesson.summary ?? ""}
                  description={lesson.description}
                />
              }
              scriptTab={<TabScript segments={lesson.segments as never} />}
              dialogueTab={
                <TabDialogue
                  dialogueLines={lesson.dialogueLines as never}
                  segments={lesson.segments as never}
                />
              }
              grammarTab={
                <TabGrammar
                  grammarTheme={lesson.grammarTheme}
                  grammarPoints={lesson.grammarPoints as never}
                />
              }
              quizTab={<TabQuiz questions={lesson.quizQuestions as never} />}
              vocabTab={
                <TabVocabulary
                  items={vocabItemsForTab}
                  targetLanguage={lesson.targetLanguage}
                />
              }
              writingTab={
                <TabWritingPractice
                  prompts={lesson.writingPrompts}
                  lessonId={lesson.id}
                  targetLanguage={lesson.targetLanguage}
                  currentUserId={currentUserId}
                  classroomCode={code}
                  initialOwnAttempts={ownAttempts}
                  initialClassroomAttempts={classroomAttempts}
                />
              }
            />
          </LessonPlayerProvider>
        </div>

        <div className="lg:col-span-1 space-y-5">
          <MemberList
            code={code}
            hostUserId={hostUserId}
            currentUserId={currentUserId}
          />
          <ClassroomLessonList
            code={code}
            lessons={lessons}
            currentLessonId={lesson.id}
            isHost={isHost}
          />
          <ClassroomLeaderboard
            lessonId={lesson.id}
            initialAttempts={classroomAttempts}
            totalPrompts={lesson.writingPrompts.length}
            currentUserId={currentUserId}
          />
          <ClassroomActivityFeed code={code} currentUserId={currentUserId} />
        </div>
      </div>
    </div>
  );
}
