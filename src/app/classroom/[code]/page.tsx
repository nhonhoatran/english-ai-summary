import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { AUTH_COOKIE_NAME, verifySession } from "@/lib/auth/auth-cookie";
import { env } from "@/lib/env";
import { ClassroomJoinForm } from "@/components/classroom/classroom-join-form";
import { ClassroomViewer } from "@/components/classroom/classroom-viewer";
import { AlertTriangle, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface ClassroomPageProps {
  params: Promise<{ code: string }>;
}

export default async function ClassroomPage({ params }: ClassroomPageProps) {
  const { code } = await params;
  const formattedCode = code.toUpperCase();

  const classroom = await db.classroom.findUnique({
    where: { code: formattedCode },
    include: {
      host: { select: { id: true, phone: true } },
      lesson: {
        include: {
          segments: { orderBy: { orderIndex: "asc" } },
          dialogueLines: { orderBy: { orderIndex: "asc" } },
          grammarPoints: { orderBy: { orderIndex: "asc" } },
          quizQuestions: { orderBy: { orderIndex: "asc" } },
          writingPrompts: { orderBy: { orderIndex: "asc" } },
          vocabItems: {
            orderBy: { orderIndex: "asc" },
            include: {
              flashcards: { select: { id: true } },
            },
          },
        },
      },
    },
  });

  if (!classroom || !classroom.lesson) {
    notFound();
  }

  if (!classroom.isActive) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full p-8 glass-card border border-rose-900/50 rounded-2xl text-center space-y-4 shadow-2xl">
          <div className="w-12 h-12 rounded-full bg-rose-950/60 border border-rose-800 text-rose-400 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-white">Lớp học đã kết thúc</h2>
          <p className="text-xs text-zinc-400">
            Mã lớp <span className="font-mono font-bold text-rose-400">{formattedCode}</span> đã được Host đóng hoặc không còn hoạt động.
          </p>
          <Link href={`/lessons/${classroom.lessonId}`}>
            <Button className="mt-4 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-semibold rounded-xl gap-2">
              <ArrowLeft className="w-4 h-4" />
              <span>Quay lại bài học đơn</span>
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const cookieStore = await cookies();
  const authCookie = cookieStore.get(AUTH_COOKIE_NAME);
  let isHost = false;

  if (authCookie?.value) {
    const session = await verifySession(authCookie.value, env.AUTH_SECRET);
    if (session && session.userId === classroom.hostUserId) {
      isHost = true;
    }
  }

  const memberCookie = cookieStore.get(`classroom_member_id_${formattedCode}`);
  const hasMemberCookie = !!memberCookie?.value;

  // If user is not host and does not have member cookie, show join form
  if (!isHost && !hasMemberCookie) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 p-4 sm:p-8 flex items-center justify-center">
        <ClassroomJoinForm code={classroom.code} />
      </div>
    );
  }

  const hostName = classroom.host?.phone
    ? `Host (${classroom.host.phone.slice(-4)})`
    : "Host";

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-4 sm:p-8 relative overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-6xl h-80 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-[-20%] left-[30%] w-[450px] h-[250px] bg-indigo-600/10 rounded-full blur-[100px]" />
      </div>

      <div className="max-w-7xl mx-auto">
        <ClassroomViewer
          code={classroom.code}
          isHost={isHost}
          hostName={hostName}
          lesson={classroom.lesson}
          initialTab={classroom.currentTab ?? "summary"}
          initialSegment={classroom.currentSegment ?? 0}
        />
      </div>
    </div>
  );
}
