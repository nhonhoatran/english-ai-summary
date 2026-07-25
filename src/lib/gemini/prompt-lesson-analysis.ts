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

export function buildLessonAnalysisPrompt(formattedTranscript: string): string {
  return `You are building an English lesson page in the exact style of elllo.org, from the
conversation transcript below.

Produce FOUR things: lesson metadata, a grammar section, a quiz, and a vocabulary list.

=== 1. METADATA ===
- title: short, natural, describes the conversation topic (e.g. "Making a Sandwich").
- description: ONE sentence describing what the speakers talk about.

=== 2. GRAMMAR SECTION ===
This is the part most often done wrong. Read carefully.

STEP A - Pick ONE grammar structure. Scan the transcript and identify the single
grammatical structure that appears most often and most characteristically in it
(for example: imperatives, present perfect, comparatives, "used to", modals of
advice, past continuous). Name it in \`grammarTheme\`. Pick exactly ONE.
Do NOT pick four different unrelated grammar topics.

STEP B - Break that ONE structure into exactly 4 points. Each point teaches a
different facet of the SAME structure: its form, why/when it is used, a variation
or politeness form, and its negative or question form.

STEP C - For each point write:
  - explanation: ONE sentence, plain language, aimed at an intermediate learner.
  - examples: exactly 4 short example sentences.

CRITICAL RULE FOR EXAMPLES: The examples must be NEWLY INVENTED generic sentences.
Do NOT quote, copy, or lightly reword any line from the transcript. They should be
everyday sentences a textbook would use, unrelated to the transcript's topic.

Worked reference (a transcript about making a sandwich yielded the theme
"imperatives", and note how the examples have nothing to do with sandwiches):
  Point 1: The imperative is the base form of the verb. We use it to give
           instructions, commands or suggestions.
           - Come here.  - Help me please.  - Look at this.  - Don't do that!
  Point 2: The imperative does not have a subject because the subject is the listener.
           - Listen to me.  - Speak slower please.  - Stand over there.  - Open the door.
  Point 3: Add the word 'please' to make the commands more polite.
           - Please sit here.  - Please give me your passport.
           - Please spell your name for me.  - Please pay this amount.
  Point 4: The negative form of the imperative uses 'do not' or 'don't' plus the base verb.
           - Do not go there.  - Don't eat too much.  - Do not stay up too late.
           - Don't fall asleep.

=== 3. QUIZ ===
Exactly 5 gap-fill questions. Each has exactly 3 options labelled by position
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

Worked reference (from the sandwich transcript):
  1) Spread the _______.                    0) bread  1) bacon   2) mayonnaise   [correct 2]
  2) Slice the _______.                     0) bread  1) cheese  2) tomatoes     [correct 2]
  3) Fry the _______.                       0) bread  1) bacon   2) both of them [correct 1]
  4) Cut the _______.                       0) bacon  1) bananas 2) bread        [correct 1]
  5) On both sandwiches, _____ the bread.   0) spread 1) toast   2) slice        [correct 1]
Note how 1-4 blank the noun and 5 blanks the verb, and how every option is a real
item from that conversation.

=== 4. VOCABULARY ===
Pick 6 to 10 words or phrases from the transcript that an intermediate English
learner would likely NOT know - prefer idioms, phrasal verbs, and collocations
over single easy nouns. For each:
  - term: the word or phrase as used in the conversation.
  - meaning: a short plain-English definition (under 15 words).
  - example: ONE new sentence using the term correctly, different from the
    transcript's sentence.

=== TRANSCRIPT ===
${formattedTranscript}`;
}
