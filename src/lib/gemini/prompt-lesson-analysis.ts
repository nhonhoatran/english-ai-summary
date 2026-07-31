// path/to/src/lib/gemini/prompt-lesson-analysis.ts
import { TranscriptSegment } from "./lesson-schemas";

export function formatTranscriptForPrompt(segments: TranscriptSegment[]): string {
  return segments
    .map((s) => {
      const minutes = Math.floor(s.startSeconds / 60)
        .toString()
        .padStart(2, "0");
      const seconds = (s.startSeconds % 60).toString().padStart(2, "0");
      return `${minutes}:${seconds} ${s.speaker}: ${s.text}`;
    })
    .join("\n");
}

export interface LessonAnalysisOptions {
  grammarCount?: number;
  quizCount?: number;
  vocabCount?: number;
  dialogueCount?: number;
  writingPromptCount?: number;
  targetLanguage?: "english" | "chinese";
}

export function buildLessonAnalysisPrompt(
  formattedTranscript: string,
  options?: LessonAnalysisOptions
): string {
  const grammarCount = options?.grammarCount || 4;
  const quizCount = options?.quizCount || 5;
  const vocabCount = options?.vocabCount || 10;
  const dialogueCount = options?.dialogueCount || 20;
  const writingPromptCount = options?.writingPromptCount || 8;

  const isEnglish = (options?.targetLanguage ?? "english") === "english";
  const langLabel = isEnglish ? "English" : "Chinese (Mandarin)";
  const ipaLabel = isEnglish ? "IPA phonetic transcription (en-US)" : "Pinyin romanization";
  const ipaExample = isEnglish ? "/teɪk ɒf/" : "nǐ hǎo";

  return `You are building a ${langLabel} lesson page in the exact style of elllo.org, from the
conversation transcript below.

Produce SEVEN things: lesson metadata, a grammar section, a quiz, a vocabulary list, an ELLLO-style practice dialogue, a lesson summary, and sentence-writing prompts.

=== 1. METADATA ===
- title: short, natural, describes the conversation topic (e.g. "Making a Sandwich").
- description: ONE sentence describing what the speakers talk about.

=== 2. GRAMMAR SECTION ===
This is the part most often done wrong. Read carefully.

STEP A - Pick ONE grammar structure. Scan the transcript and identify the single
grammatical structure that appears most often and most characteristically in it
(for example: imperatives, present perfect, comparatives, "used to", modals of
advice, past continuous). Name it in \`grammarTheme\`. Pick exactly ONE.
Do NOT pick multiple unrelated grammar topics.

STEP B - Break that ONE structure into exactly ${grammarCount} points. Each point teaches a
different facet of the SAME structure: its form, why/when it is used, a variation
or politeness form, and its negative or question form.

STEP C - For each point write:
  - explanation: ONE sentence, plain language, aimed at an intermediate learner.
  - examples: exactly 4 short example sentences.

CRITICAL RULE FOR EXAMPLES: The examples must be NEWLY INVENTED generic sentences.
Do NOT quote, copy, or lightly reword any line from the transcript. They should be
everyday sentences a textbook would use, unrelated to the transcript's topic.

=== 3. QUIZ ===
Exactly ${quizCount} gap-fill questions. Each has exactly 3 options labelled by position
(index 0, 1, 2) and exactly one correct answer.

Rules:
- Write each prompt as a short sentence with the missing word shown as "_______".
- Every answer MUST be derivable from the transcript alone - someone who listened
  can answer; someone who did not, cannot.
- Where possible, phrase the stems using the lesson's grammar theme, so the quiz
  tests the grammar AND comprehension at once.
- DISTRACTORS: the two wrong options must be plausible, in-domain words drawn from
  the same conversation - other things actually mentioned. Never random or
  obviously-wrong words.
- VARY THE BLANK: blank the object/noun in most questions, but make at least one
  question blank the VERB instead.
- A distractor may be a phrase rather than a single word (e.g. "both of them").

=== 4. VOCABULARY ===
Pick exactly ${vocabCount} words or phrases from the transcript that an intermediate English
learner would likely NOT know - prefer idioms, phrasal verbs, and collocations
over single easy nouns. For each:
  - term: the word or phrase as used in the conversation.
  - meaning: a short plain-English definition (under 15 words).
  - ipa: ${ipaLabel} for this term (e.g. "${ipaExample}"). Must be a valid phonetic notation string.
  - example: ONE new sentence using the term correctly, different from the
    transcript's sentence.

=== 5. ELLLO-STYLE DIALOGUE ===
Create a natural 2-person ELLLO-style dialogue with EXACTLY ${dialogueCount} back-and-forth turns between 2 speakers (e.g. "Speaker A" and "Speaker B" or real character names like Meg and Todd).

STRICT CONTEXT ALIGNMENT & LENGTH RULES:
- STRICT CONTEXT ANCHORING: The dialogue MUST be deeply grounded in the EXACT context, situation, story, and topic of the video transcript below. Do NOT invent unrelated scenarios or let the conversation drift away from the video's core topic.
- MANDATORY LENGTH: You MUST output EXACTLY ${dialogueCount} dialogue turns — no fewer, no more. Count carefully before finalizing.
- GRAMMAR & VOCABULARY INTEGRATION: The dialogue must naturally demonstrate the target \`grammarTheme\` and naturally use several extracted \`vocabItems\`.
- NATURAL CONVERSATION FLOW: Speakers ask follow-up questions, express interest, give natural reactions, and elaborate on details just like authentic ELLLO listening dialogues.

=== 6. SUMMARY ===
Write a concise summary of this video in 3-5 sentences. Include:
- What the speakers discuss (the main topic)
- 2-3 key points or themes covered
- Suggested English level for this content (A1/A2/B1/B2/C1/C2)
Write in plain English, friendly tone.

=== 7. WRITING PROMPTS ===
Create exactly ${writingPromptCount} sentence-writing exercises based on the transcript content.
Each exercise gives the learner a Vietnamese meaning, and the learner must write the English sentence.

For each:
  - viMeaning: the Vietnamese translation of the sentence (plain, natural Vietnamese)
  - enAnswer: the reference English sentence (short, natural, derivable from the transcript context)

Rules:
- Sentences should be SHORT (max 10 words) — learnable sentences, not paragraphs
- viMeaning must be natural Vietnamese, not literal word-for-word translation
- enAnswer must demonstrate the lesson's grammarTheme where possible
- Each enAnswer must be UNIQUE — no duplicate sentences

=== TRANSCRIPT ===
${formattedTranscript}`;
}
