import { GeneratedLesson } from "@/lib/gemini/generate-lesson";

export const validGeneratedLessonFixture: GeneratedLesson = {
  title: "Talking About Past Experiences",
  description: "A conversation exploring daily routines and past experiences in English.",
  grammarTheme: "Present Perfect vs Past Simple",
  transcript: [
    { startSeconds: 0, speaker: "Alice", text: "Have you ever visited London?" },
    { startSeconds: 5, speaker: "Bob", text: "Yes, I went there two years ago." },
    { startSeconds: 12, speaker: "Alice", text: "That sounds wonderful! Did you enjoy it?" },
    { startSeconds: 18, speaker: "Bob", text: "I loved it. The museums were amazing." },
  ],
  grammarPoints: [
    {
      explanation: "Use Present Perfect for life experiences without a specific time.",
      examples: [
        "Have you ever eaten sushi?",
        "I have visited Japan twice.",
        "She has never tried skiing.",
        "They have seen that movie.",
      ],
    },
    {
      explanation: "Use Past Simple for finished actions at a specific time in the past.",
      examples: [
        "I visited London in 2024.",
        "He bought a car yesterday.",
        "We watched the game last night.",
        "She graduated three years ago.",
      ],
    },
    {
      explanation: "Use 'ever' in questions to ask about experiences at any time.",
      examples: [
        "Have you ever met a celebrity?",
        "Has he ever travelled alone?",
        "Have they ever won a prize?",
        "Have you ever lost your keys?",
      ],
    },
    {
      explanation: "Use 'ago' with Past Simple to show how far back in time something happened.",
      examples: [
        "I arrived ten minutes ago.",
        "They met five years ago.",
        "The train left an hour ago.",
        "She called two days ago.",
      ],
    },
  ],
  quizQuestions: [
    {
      prompt: "Which sentence correctly asks about a life experience?",
      options: [
        "Have you ever been to Paris?",
        "Did you ever go to Paris yesterday?",
        "Are you ever going to Paris last year?",
      ],
      correctIndex: 0,
    },
    {
      prompt: "Choose the correct Past Simple sentence:",
      options: [
        "I have seen him yesterday.",
        "I saw him yesterday.",
        "I see him yesterday.",
      ],
      correctIndex: 1,
    },
    {
      prompt: "What is the correct answer to 'Have you ever tried surfing?'",
      options: [
        "Yes, I do.",
        "Yes, I have.",
        "Yes, I am.",
      ],
      correctIndex: 1,
    },
    {
      prompt: "Where does 'ago' go in a sentence?",
      options: [
        "Before the time period (ago two days).",
        "After the time period (two days ago).",
        "At the start of the sentence.",
      ],
      correctIndex: 1,
    },
    {
      prompt: "Fill in the blank: 'She moved to London three years ___.'",
      options: ["since", "before", "ago"],
      correctIndex: 2,
    },
  ],
  vocabItems: [
    {
      term: "Experience",
      meaning: "Knowledge or skill gained by doing things over time.",
      example: "Traveling gives you valuable life experience.",
    },
    {
      term: "Wonderful",
      meaning: "Extremely good or pleasant.",
      example: "We had a wonderful time in Rome.",
    },
    {
      term: "Museum",
      meaning: "A building where objects of historical or artistic interest are kept.",
      example: "The British Museum is famous worldwide.",
    },
    {
      term: "Travel",
      meaning: "To go from one place to another.",
      example: "They love to travel during summer vacation.",
    },
    {
      term: "Celebrity",
      meaning: "A famous person.",
      example: "She spotted a celebrity at the airport.",
    },
    {
      term: "Graduation",
      meaning: "The receiving or conferring of an academic degree or diploma.",
      example: "His graduation ceremony was held in June.",
    },
  ],
  dialogueLines: [
    { speaker: "Alice", text: "Have you ever visited London?" },
    { speaker: "Bob", text: "Yes, I went there two years ago. It was amazing!" },
    { speaker: "Alice", text: "That sounds wonderful! What did you do there?" },
    { speaker: "Bob", text: "I visited the British Museum and walked around the parks." },
  ],
};
