-- V4: a classroom owns MANY lessons, members are linked to users,
-- and writing practice attempts are persisted (progress + realtime peer feed).

-- ---------------------------------------------------------------------------
-- Lesson: can now belong to a classroom
-- ---------------------------------------------------------------------------
ALTER TABLE "Lesson" ADD COLUMN "classroomId" TEXT;
ALTER TABLE "Lesson" ADD COLUMN "classroomOrder" INTEGER NOT NULL DEFAULT 0;

-- ---------------------------------------------------------------------------
-- Classroom: the single-lesson pointer becomes "the lesson the class is on now".
-- Renaming (instead of drop + add) preserves the existing links.
-- ---------------------------------------------------------------------------
ALTER TABLE "Classroom" RENAME COLUMN "lessonId" TO "currentLessonId";
ALTER TABLE "Classroom" ADD COLUMN "name" TEXT;

-- Backfill: whatever lesson a classroom pointed at is now owned by that classroom.
UPDATE "Lesson" l
SET "classroomId" = c."id"
FROM "Classroom" c
WHERE c."currentLessonId" = l."id"
  AND l."classroomId" IS NULL;

-- ---------------------------------------------------------------------------
-- ClassMember: link to the authenticated user (every route is auth-gated)
-- ---------------------------------------------------------------------------
ALTER TABLE "ClassMember" ADD COLUMN "userId" TEXT;

-- Backfill from phone, skipping any classroom where the same phone appears twice
-- (those would violate the new unique constraint and are left NULL on purpose).
UPDATE "ClassMember" m
SET "userId" = u."id"
FROM "User" u
WHERE m."phone" = u."phone"
  AND m."userId" IS NULL
  AND NOT EXISTS (
    SELECT 1 FROM "ClassMember" m2
    WHERE m2."classroomId" = m."classroomId"
      AND m2."phone" = m."phone"
      AND m2."id" <> m."id"
  );

-- ---------------------------------------------------------------------------
-- Indexes & constraints
-- ---------------------------------------------------------------------------

-- The same host may reuse one video across several classrooms, so the old
-- unique constraint has to go; idempotency is scoped by classroomId in code.
DROP INDEX "Lesson_userId_videoId_key";
CREATE INDEX "Lesson_userId_videoId_idx" ON "Lesson"("userId", "videoId");
CREATE INDEX "Lesson_classroomId_classroomOrder_idx" ON "Lesson"("classroomId", "classroomOrder");

ALTER TABLE "Lesson" ADD CONSTRAINT "Lesson_classroomId_fkey"
  FOREIGN KEY ("classroomId") REFERENCES "Classroom"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Re-point the renamed FK and make host deletion cascade.
ALTER TABLE "Classroom" DROP CONSTRAINT "Classroom_lessonId_fkey";
ALTER TABLE "Classroom" ADD CONSTRAINT "Classroom_currentLessonId_fkey"
  FOREIGN KEY ("currentLessonId") REFERENCES "Lesson"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Classroom" DROP CONSTRAINT "Classroom_hostUserId_fkey";
ALTER TABLE "Classroom" ADD CONSTRAINT "Classroom_hostUserId_fkey"
  FOREIGN KEY ("hostUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "Classroom_hostUserId_createdAt_idx" ON "Classroom"("hostUserId", "createdAt");

ALTER TABLE "ClassMember" ADD CONSTRAINT "ClassMember_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE UNIQUE INDEX "ClassMember_classroomId_userId_key" ON "ClassMember"("classroomId", "userId");

-- ---------------------------------------------------------------------------
-- PracticeAttempt: latest graded answer per (prompt, learner).
-- Doubles as the progress store — resume at the first prompt without a row.
-- ---------------------------------------------------------------------------
CREATE TABLE "PracticeAttempt" (
    "id" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "promptId" TEXT NOT NULL,
    "promptIndex" INTEGER NOT NULL,
    "userId" TEXT NOT NULL,
    "classroomId" TEXT,
    "displayName" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "isCorrect" BOOLEAN NOT NULL,
    "score" INTEGER NOT NULL,
    "feedback" TEXT,
    "suggestion" TEXT,
    "attemptNo" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PracticeAttempt_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PracticeAttempt_promptId_userId_key" ON "PracticeAttempt"("promptId", "userId");
CREATE INDEX "PracticeAttempt_lessonId_userId_idx" ON "PracticeAttempt"("lessonId", "userId");
CREATE INDEX "PracticeAttempt_classroomId_lessonId_promptIndex_idx" ON "PracticeAttempt"("classroomId", "lessonId", "promptIndex");
CREATE INDEX "PracticeAttempt_classroomId_updatedAt_idx" ON "PracticeAttempt"("classroomId", "updatedAt");

ALTER TABLE "PracticeAttempt" ADD CONSTRAINT "PracticeAttempt_lessonId_fkey"
  FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PracticeAttempt" ADD CONSTRAINT "PracticeAttempt_promptId_fkey"
  FOREIGN KEY ("promptId") REFERENCES "WritingPrompt"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PracticeAttempt" ADD CONSTRAINT "PracticeAttempt_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PracticeAttempt" ADD CONSTRAINT "PracticeAttempt_classroomId_fkey"
  FOREIGN KEY ("classroomId") REFERENCES "Classroom"("id") ON DELETE CASCADE ON UPDATE CASCADE;
