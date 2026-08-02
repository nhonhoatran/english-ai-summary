// path/to/src/app/page.tsx
import { db } from "@/lib/db";
import { AddLessonForm } from "@/components/add-lesson-form";
import { LessonListCard } from "@/components/lesson/lesson-list-card";
import { CreateClassroomDialog } from "@/components/classroom/create-classroom-dialog";
import { JoinClassroomCard } from "@/components/classroom/join-classroom-card";
import { ClassroomListCard } from "@/components/classroom/classroom-list-card";
import { LogoutButton } from "@/components/logout-button";
import { PointsWidget } from "@/components/points/points-widget";
import Link from "next/link";
import { Sparkles, Phone, BookOpen, BookMarked, Users, Video } from "lucide-react";
import { requireAuth } from "@/lib/auth/require-auth";
import { getTodayPointsSummary } from "@/lib/points/get-today-points-summary";

export default async function Home() {
  const session = await requireAuth();

  const [lessons, classrooms, dueCount, totalVocabCount, pointsSummary] =
    await Promise.all([
    db.lesson.findMany({
      // Lessons owned by a classroom live inside that class, not in this list.
      where: { userId: session.userId, classroomId: null },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        videoId: true,
        title: true,
        description: true,
        durationSec: true,
        targetLanguage: true,
        status: true,
        createdAt: true,
      },
    }),
    db.classroom.findMany({
      where: {
        OR: [
          { hostUserId: session.userId },
          { members: { some: { userId: session.userId } } },
        ],
      },
      orderBy: [{ isActive: "desc" }, { createdAt: "desc" }],
      take: 20,
      include: {
        currentLesson: { select: { title: true } },
        _count: { select: { members: true, lessons: true } },
      },
    }),
    db.flashcard.count({
      where: {
        userId: session.userId,
        due: { lte: new Date() },
      },
    }),
      db.vocabItem.count({
        where: {
          lesson: { userId: session.userId },
        },
      }),
      getTodayPointsSummary(session.userId),
    ]);

  const activeClassrooms = classrooms.filter((c) => c.isActive);
  const endedClassrooms = classrooms.filter((c) => !c.isActive);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col items-center p-4 sm:p-8 relative overflow-hidden">
      {/* Background Ambient Glow Blobs */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-[-10%] left-[20%] w-[500px] h-[300px] bg-emerald-600/10 rounded-full blur-[120px]" />
        <div className="absolute top-[10%] right-[20%] w-[450px] h-[280px] bg-blue-600/10 rounded-full blur-[120px]" />
      </div>

      <main className="w-full max-w-4xl space-y-10 animate-fade-in">
        {/* Top Header / Account Info */}
        <div className="flex justify-between items-center w-full glass-card px-5 py-3 shadow-lg">
          <div className="flex items-center gap-2.5 text-xs sm:text-sm text-zinc-300 font-medium">
            <div className="p-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400">
              <Phone className="w-3.5 h-3.5" />
            </div>
            <span>SĐT: <strong className="text-white font-semibold">{session.phone}</strong></span>
          </div>
          <div className="flex items-center gap-3">
            <PointsWidget initialData={pointsSummary} />
            <LogoutButton />
          </div>
        </div>

        {/* Hero Section */}
        <div className="flex flex-col items-center text-center space-y-6 pt-2">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-semibold shadow-inner">
            <Users className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span>Phòng Học Trực Tuyến & Cùng Học Tiếng Anh/Trung</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight gradient-text max-w-2xl leading-tight sm:leading-tight">
            Tạo Lớp Học Trực Tuyến.<br />Cùng Học Qua Video YouTube.
          </h1>

          <p className="text-zinc-400 text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
            Tạo lớp học trước, sau đó chọn bất kỳ video YouTube nào để học cùng bạn bè với thoại, từ vựng, ngữ pháp và luyện viết tương tác real-time.
          </p>

          {/* Primary Classroom Action Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full pt-2">
            <CreateClassroomDialog />
            <span className="text-xs text-zinc-500 font-medium hidden sm:inline">•</span>
            <JoinClassroomCard />
          </div>

          {/* Stat Pills / Review Shortcut */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link
              href="/review"
              className="inline-flex items-center gap-2.5 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-lg shadow-blue-600/20 transition-all hover:scale-[1.02] active:scale-95"
            >
              <Sparkles className="w-4 h-4 text-blue-200" />
              <span>Review Flashcards</span>
              <span className="px-2 py-0.5 text-xs font-bold bg-white/20 text-white rounded-full">
                {dueCount}
              </span>
            </Link>

            <div className="inline-flex items-center gap-4 px-4 py-2 rounded-xl glass-card text-xs text-zinc-400 font-medium">
              <span className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-emerald-400" />
                <strong className="text-white">{classrooms.length}</strong> Lớp học
              </span>
              <span className="text-zinc-700">•</span>
              <span className="flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-purple-400" />
                <strong className="text-white">{lessons.length}</strong> Lessons
              </span>
              <span className="text-zinc-700">•</span>
              <span className="flex items-center gap-1.5">
                <BookMarked className="w-3.5 h-3.5 text-amber-400" />
                <strong className="text-white">{totalVocabCount}</strong> Từ vựng
              </span>
            </div>
          </div>
        </div>

        {/* Classroom List Section (Primary) */}
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white tracking-wide flex items-center gap-2">
              <Users className="w-5 h-5 text-emerald-400" />
              <span>Lớp Học Đang Hoạt Động</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400 font-normal">
                {activeClassrooms.length}
              </span>
            </h2>
          </div>

          {activeClassrooms.length === 0 ? (
            <div className="p-8 text-center text-zinc-500 glass-card text-sm space-y-3 border-dashed border-zinc-800">
              <Users className="w-8 h-8 text-zinc-600 mx-auto" />
              <p className="text-zinc-400 font-medium">Chưa có lớp học nào đang mở.</p>
              <p className="text-xs text-zinc-500">
                Bấm &quot;Tạo Lớp Học Mới&quot; ở trên để khởi tạo lớp đầu tiên!
              </p>
            </div>
          ) : (
            <div className="grid gap-3">
              {activeClassrooms.map((classroom) => (
                <ClassroomListCard
                  key={classroom.id}
                  classroom={classroom}
                  currentUserId={session.userId}
                />
              ))}
            </div>
          )}
        </div>

        {endedClassrooms.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-sm font-bold text-zinc-400 tracking-wide flex items-center gap-2">
              <Users className="w-4 h-4 text-zinc-600" />
              <span>Lớp Đã Kết Thúc</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-500 font-normal">
                {endedClassrooms.length}
              </span>
            </h2>
            <div className="grid gap-3 opacity-70">
              {endedClassrooms.map((classroom) => (
                <ClassroomListCard
                  key={classroom.id}
                  classroom={classroom}
                  currentUserId={session.userId}
                />
              ))}
            </div>
          </div>
        )}

        {/* Solo Lesson Generator Card (Secondary Option) */}
        <div className="space-y-4 pt-6 border-t border-zinc-800/80">
          <div className="flex items-center gap-2">
            <Video className="w-5 h-5 text-blue-400" />
            <h2 className="text-lg font-bold text-white tracking-wide">
              Tạo Bài Học Cá Nhân (Quick Solo Lesson)
            </h2>
          </div>
          <div className="glass-card p-6 shadow-2xl border-zinc-800/80">
            <AddLessonForm />
          </div>
        </div>

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <div className="glass-card p-4 space-y-2 border-zinc-800/60 hover:border-emerald-500/30 transition-colors">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold">
              1
            </div>
            <h3 className="text-sm font-semibold text-white">1. Tạo Lớp Học Mới</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Khởi tạo lớp học tức thì, nhận mã code 6 ký tự để chia sẻ cho học viên vào lớp.
            </p>
          </div>

          <div className="glass-card p-4 space-y-2 border-zinc-800/60 hover:border-blue-500/30 transition-colors">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center font-bold">
              2
            </div>
            <h3 className="text-sm font-semibold text-white">2. Thêm Video YouTube</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Dán link video YouTube trong lớp học để AI tự động gen bài học ELLLO cho cả lớp.
            </p>
          </div>

          <div className="glass-card p-4 space-y-2 border-zinc-800/60 hover:border-purple-500/30 transition-colors">
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center font-bold">
              3
            </div>
            <h3 className="text-sm font-semibold text-white">3. Đồng Bộ Real-time</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Host và học viên cùng nghe thoại, làm quiz, học từ vựng và luyện viết đồng bộ.
            </p>
          </div>
        </div>

        {/* Solo Lessons Section */}
        <div className="space-y-4 pt-4 border-t border-zinc-800/80">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white tracking-wide flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-purple-400" />
              <span>Bài Học Đơn Đã Tạo</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400 font-normal">
                {lessons.length}
              </span>
            </h2>
          </div>

          {lessons.length === 0 ? (
            <div className="p-8 text-center text-zinc-500 glass-card text-sm space-y-2">
              <BookOpen className="w-8 h-8 text-zinc-600 mx-auto" />
              <p className="text-zinc-400 font-medium">Chưa có bài học cá nhân nào.</p>
            </div>
          ) : (
            <div className="grid gap-3.5">
              {lessons.map((lesson) => (
                <LessonListCard key={lesson.id} lesson={lesson} />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
