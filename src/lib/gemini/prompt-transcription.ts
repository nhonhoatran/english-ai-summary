export function buildTranscriptionPrompt(): string {
  return `You are transcribing an English-learning video for a study website.

Produce a faithful, verbatim transcript of everything spoken.

Rules:
- One entry per speaker turn. A new entry every time the speaker changes.
- Label speakers with their real names if stated in the video; otherwise "Speaker 1", "Speaker 2".
- startSeconds = the integer second at which that turn begins.
- Transcribe EXACTLY what is said. Do NOT clean up grammar, do NOT fix mistakes,
  do NOT remove filler. Keep short backchannel turns as their own entries
  ("Yum.", "Yes.", "Mm-hmm.", "Right.").
- Do not add commentary, summaries, or stage directions.`;
}
