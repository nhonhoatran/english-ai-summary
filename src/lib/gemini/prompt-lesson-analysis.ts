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
}

export function buildLessonAnalysisPrompt(
  formattedTranscript: string,
  options?: LessonAnalysisOptions
): string {
  const grammarCount = options?.grammarCount || 4;
  const quizCount = options?.quizCount || 5;
  const vocabCount = options?.vocabCount || 10;

  return `You are building an English lesson page in the exact style of elllo.org, from the
conversation transcript below.

Produce FIVE things: lesson metadata, a grammar section, a quiz, a vocabulary list, and an ELLLO-style practice dialogue.

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
  - example: ONE new sentence using the term correctly, different from the
    transcript's sentence.

=== 5. ELLLO-STYLE DIALOGUE ===
Create an extended, natural 2-person ELLLO-style dialogue (between 14 and 20 back-and-forth turns between 2 speakers, e.g. "Speaker A" and "Speaker B" or character names like Meg and Todd).

STRICT CONTEXT ALIGNMENT & LENGTH RULES:
- STRICT CONTEXT ANCHORING: The dialogue MUST be deeply grounded in the EXACT context, situation, story, and topic of the video transcript below. Do NOT invent unrelated scenarios or let the conversation drift away from the video's core topic.
- EXTENDED DIALOGUE LENGTH: Provide a full, detailed discussion with AT LEAST 14 to 20 back-and-forth turns so learners have substantial dialogue for practice.
- GRAMMAR & VOCABULARY INTEGRATION: The dialogue must naturally demonstrate the target \`grammarTheme\` and naturally use several extracted \`vocabItems\`.
- NATURAL CONVERSATION FLOW: Speakers ask follow-up questions, express interest, give natural reactions, and elaborate on details just like authentic ELLLO listening dialogues.

=== TRANSCRIPT ===
${formattedTranscript}`;
}
