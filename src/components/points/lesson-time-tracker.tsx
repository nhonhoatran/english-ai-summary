"use client";

import { useEffect } from "react";

interface LessonTimeTrackerProps {
  lessonId: string;
}

export function LessonTimeTracker({ lessonId }: LessonTimeTrackerProps) {
  useEffect(() => {
    // Wait 30 seconds before triggering daily_lesson points award
    const timer = setTimeout(async () => {
      try {
        await fetch("/api/points/award", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            source: "daily_lesson",
            meta: { lessonId },
          }),
        });
      } catch (err) {
        console.error("Failed to award daily_lesson points:", err);
      }
    }, 30000);

    return () => clearTimeout(timer);
  }, [lessonId]);

  return null;
}
