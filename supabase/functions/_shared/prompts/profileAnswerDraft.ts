export const PROFILE_ANSWER_DRAFT_JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["answerText", "answerSummary"],
  properties: {
    answerText: { type: "string" },
    answerSummary: { type: "string" },
    followUpQuestion: { type: ["string", "null"] },
  },
} as const;

export function profileAnswerDraftSystem(language: "en" | "nl" | "ar") {
  const languageLabel = language === "nl" ? "Dutch" : language === "ar" ? "Arabic" : "English";
  return [
    "You help candidates draft concise, first-person answers for professional interview-style prompts.",
    `Write in ${languageLabel}.`,
    "Use only the user's notes and current answer context.",
    "Do not invent facts, employers, metrics, or credentials.",
    "Return a polished first-person draft and a short summary.",
    "If the notes are too thin, include a follow-up question that would improve the answer.",
  ].join(" ");
}

export function profileAnswerDraftUserMessage(input: {
  questionPrompt: string;
  questionHelper?: string | null;
  sourceNotes: string;
  currentAnswerText?: string | null;
}) {
  return [
    `Question: ${input.questionPrompt}`,
    input.questionHelper ? `Helper: ${input.questionHelper}` : null,
    input.currentAnswerText ? `Current answer: ${input.currentAnswerText}` : null,
    `Candidate notes: ${input.sourceNotes}`,
    "Produce a stronger draft answer in first person.",
  ].filter(Boolean).join("\n\n");
}