import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ClassroomJoinForm } from "@/components/classroom/classroom-join-form";
import { ClassroomViewer } from "@/components/classroom/classroom-viewer";
import { ClassroomAddLesson } from "@/components/classroom/classroom-add-lesson";
import { ClassroomWaitingLesson } from "@/components/classroom/classroom-waiting-lesson";
import { getClassroomContext } from "@/lib/classroom/get-classroom-context";
import { buildHostDisplayName } from "@/lib/classroom/display-name";
import {
  getClassroomAttempts,
  getOwnAttempts,
} from "@/lib/practice/practice-attempts";
import { AlertTriangle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ClassroomPageProps {
  params: Promise<{ code: string }>;
}

function ClassroomNotice({
  title,
  message,
}: {
  title: string;
  message: string;
}) {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full p-8 glass-card border border-rose-900/50 rounded-2xl text-center space-y-4 shadow-2xl">
        <div className="w-12 h-12 rounded-full bg-rose-950/60 border border-rose-800 text-rose-400 flex items-center justify-center mx-auto">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-white">{title}</h2>
        <p className="text-xs text-zinc-400">{message}</p>
        <Link href="/">
          <Button className="mt-4 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-semibold rounded-xl gap-2">
            <ArrowLeft className="w-4 h-4" />
            <span>Về trang chủ</span>
          </Button>
        </Link>
      </div>
    </div>
  );
}

export default async function ClassroomPage({ params }: ClassroomPageProps) {
  const { code } = await params;
  const ctx = await getClassroomContext(code);

  if (!ctx) notFound();

  const { classroom, isHost, member, userId } = ctx;
  const hostName = buildHostDisplayName(classroom.hostPhone);

  if (!classroom.isActive) {
    return (
      <ClassroomNotice
        title="Buổi học đã kết thúc"
        message={`Lớp ${classroom.code} đã được Host đóng. Host có thể mở buổi mới bất cứ lúc nào.`}
      />
    );
  }

  // Middleware gates every route, so this only trips if the session expired
  // between the middleware check and this render.
  if (!userId) {
    return (
      <ClassroomNotice
        title="Phiên đăng nhập đã hết hạn"
        message="Đăng nhập lại rồi vào lớp nghen."
      />
    );
  }

  if (!isHost && !member) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 p-4 sm:p-8 flex items-center justify-center">
        <ClassroomJoinForm code={classroom.code} />
      </div>
    );
  }

  const lessons = await db.lesson.findMany({
    where: { classroomId: classroom.id },
    orderBy: [{ classroomOrder: "asc" }, { createdAt: "asc" }],
    select: {
      id: true,
      title: true,
      description: true,
      status: true,
      durationSec: true,
    },
  });

  const currentLesson = classroom.currentLessonId
    ? await db.lesson.findFirst({
        where: { id: classroom.currentLessonId, classroomId: classroom.id },
        include: {
          segments: { orderBy: { orderIndex: "asc" } },
          dialogueLines: { orderBy: { orderIndex: "asc" } },
          grammarPoints: { orderBy: { orderIndex: "asc" } },
          quizQuestions: { orderBy: { orderIndex: "asc" } },
          writingPrompts: { orderBy: { orderIndex: "asc" } },
          vocabItems: {
            orderBy: { orderIndex: "asc" },
            include: { flashcards: { where: { userId }, select: { id: true } } },
          },
        },
      })
    : null;

  if (!currentLesson) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 p-4 sm:p-8 relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-6xl h-80 pointer-events-none -z-10 overflow-hidden">
          <div className="absolute top-[-20%] left-[30%] w-[450px] h-[250px] bg-emerald-600/10 rounded-full blur-[100px]" />
        </div>

        {isHost ? (
          <ClassroomAddLesson code={classroom.code} lessonCount={lessons.length} />
        ) : (
          <ClassroomWaitingLesson code={classroom.code} hostName={hostName} />
        )}
      </div>
    );
  }

  const [ownAttempts, classroomAttempts] = await Promise.all([
    getOwnAttempts(currentLesson.id, userId),
    getClassroomAttempts(currentLesson.id, classroom.id),
  ]);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-4 sm:p-8 relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-6xl h-80 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-[-20%] left-[30%] w-[450px] h-[250px] bg-indigo-600/10 rounded-full blur-[100px]" />
      </div>

      <div className="max-w-7xl mx-auto">
        <ClassroomViewer
          code={classroom.code}
          className={classroom.name}
          isHost={isHost}
          hostName={hostName}
          hostUserId={classroom.hostUserId}
          currentUserId={userId}
          displayName={member?.displayName ?? hostName}
          memberId={member?.id ?? null}
          lesson={currentLesson}
          lessons={lessons}
          initialTab={classroom.currentTab ?? "summary"}
          ownAttempts={ownAttempts}
          classroomAttempts={classroomAttempts}
        />
      </div>
    </div>
  );
}
