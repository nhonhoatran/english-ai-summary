"use client";

import { useCallback, useEffect, useState } from "react";
import { getSocket } from "@/lib/socket";
import {
  mergeAttempt,
  type PracticeAttemptEvent,
  type PracticeAttemptView,
} from "./practice-types";

interface UsePracticeRealtimeArgs {
  lessonId: string;
  /** null for solo practice — no socket work is done in that case. */
  classroomCode: string | null;
  initialOwnAttempts: PracticeAttemptView[];
  initialClassroomAttempts: PracticeAttemptView[];
}

interface UsePracticeRealtimeResult {
  ownAttempts: PracticeAttemptView[];
  classroomAttempts: PracticeAttemptView[];
  /** Record the caller's own attempt locally the instant it is graded. */
  recordOwnAttempt: (attempt: PracticeAttemptView) => void;
}

/**
 * Keeps practice attempts in sync across the classroom.
 *
 * Own attempts are applied optimistically on grade; classmates' attempts arrive
 * over the `practice-attempt` socket event. On reconnect the whole state is
 * re-fetched, because any event emitted while the socket was down is gone.
 */
export function usePracticeRealtime({
  lessonId,
  classroomCode,
  initialOwnAttempts,
  initialClassroomAttempts,
}: UsePracticeRealtimeArgs): UsePracticeRealtimeResult {
  const [ownAttempts, setOwnAttempts] =
    useState<PracticeAttemptView[]>(initialOwnAttempts);
  const [classroomAttempts, setClassroomAttempts] = useState<
    PracticeAttemptView[]
  >(initialClassroomAttempts);

  const recordOwnAttempt = useCallback((attempt: PracticeAttemptView) => {
    setOwnAttempts((prev) => mergeAttempt(prev, attempt));
    setClassroomAttempts((prev) => mergeAttempt(prev, attempt));
  }, []);

  const refetch = useCallback(async () => {
    try {
      const res = await fetch(`/api/practice/${lessonId}`);
      if (!res.ok) return;
      const data = await res.json();
      setOwnAttempts(data.ownAttempts ?? []);
      setClassroomAttempts(data.classroomAttempts ?? []);
    } catch (err) {
      console.error("[usePracticeRealtime] refetch failed:", err);
    }
  }, [lessonId]);

  useEffect(() => {
    if (!classroomCode) return;

    const socket = getSocket();

    const onAttempt = (payload: PracticeAttemptEvent) => {
      if (!payload?.attempt || payload.lessonId !== lessonId) return;
      setClassroomAttempts((prev) => mergeAttempt(prev, payload.attempt));
    };

    socket.on("practice-attempt", onAttempt);
    socket.on("reconnect", refetch);

    return () => {
      socket.off("practice-attempt", onAttempt);
      socket.off("reconnect", refetch);
    };
  }, [classroomCode, lessonId, refetch]);

  return { ownAttempts, classroomAttempts, recordOwnAttempt };
}
