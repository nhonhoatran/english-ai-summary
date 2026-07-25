// path/to/src/components/lesson/lesson-list-card.tsx
import Link from "next/link";
import { IngestStatus } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import { Clock, AlertCircle, Loader2 } from "lucide-react";
import { formatTimestamp } from "@/lib/format-timestamp";
import { DeleteLessonButton } from "./delete-lesson-button";

interface LessonListCardProps {
  lesson: {
    id: string;
    videoId: string;
    title: string;
    description: string | null;
    durationSec: number | null;
    status: IngestStatus;
    createdAt: Date;
  };
}

export function LessonListCard({ lesson }: LessonListCardProps) {
  const thumbnailUrl = `https://i.ytimg.com/vi/${lesson.videoId}/mqdefault.jpg`;

  return (
    <Link
      href={`/lessons/${lesson.id}`}
      className="group block p-4 rounded-xl bg-zinc-900/80 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800/50 transition-all"
    >
      <div className="flex flex-col sm:flex-row gap-4 items-start">
        {/* Thumbnail Container */}
        <div className="relative w-full sm:w-44 aspect-video rounded-lg overflow-hidden bg-zinc-950 shrink-0 border border-zinc-800 group-hover:border-zinc-700 transition-colors">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={thumbnailUrl}
            alt={lesson.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          {lesson.durationSec && (
            <span className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded bg-black/80 text-zinc-200 text-[10px] font-mono font-medium">
              {formatTimestamp(lesson.durationSec)}
            </span>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 space-y-2 w-full">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-base text-zinc-100 group-hover:text-blue-400 transition-colors line-clamp-2">
              {lesson.title}
            </h3>
            <div className="flex items-center gap-2 shrink-0">
              {lesson.status !== IngestStatus.READY && (
                <StatusBadge status={lesson.status} />
              )}
              <DeleteLessonButton lessonId={lesson.id} variant="icon" />
            </div>
          </div>

          {lesson.description && (
            <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
              {lesson.description}
            </p>
          )}

          <div className="flex items-center justify-between text-[11px] text-zinc-500 pt-1">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {new Date(lesson.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

function StatusBadge({ status }: { status: IngestStatus }) {
  if (status === IngestStatus.PENDING || status === IngestStatus.GENERATING) {
    return (
      <Badge
        variant="outline"
        className="border-amber-500/40 text-amber-400 bg-amber-950/20 text-[10px] gap-1 shrink-0"
      >
        <Loader2 className="w-3 h-3 animate-spin" />
        Processing
      </Badge>
    );
  }

  if (status === IngestStatus.FAILED) {
    return (
      <Badge
        variant="outline"
        className="border-rose-500/40 text-rose-400 bg-rose-950/20 text-[10px] gap-1 shrink-0"
      >
        <AlertCircle className="w-3 h-3" />
        Failed
      </Badge>
    );
  }

  return null;
}
