import { db } from "@/lib/db";

export async function resetTestDatabase() {
  const targetDbUrl = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL || "";

  if (!targetDbUrl.toLowerCase().includes("test")) {
    throw new Error(
      `REFUSING TO TRUNCATE DATABASE: Target URL "${targetDbUrl}" does not contain "test". Safety check failed.`
    );
  }

  const tablenames = [
    "ReviewLog",
    "Flashcard",
    "QuizQuestion",
    "GrammarPoint",
    "VocabItem",
    "TranscriptSegment",
    "Lesson",
    "User",
  ];

  for (const table of tablenames) {
    await db.$executeRawUnsafe(`TRUNCATE TABLE "${table}" CASCADE;`);
  }
}
