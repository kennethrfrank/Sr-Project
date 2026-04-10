import type { ManualReviewVote } from "./firebase/quiz-history";

export type IntegrityAssessment = {
  score: number;
  label: "High" | "Moderate" | "Low";
  synopsis: string;
};

type IntegrityInput = {
  topic: string;
  statement: string;
  explanation: string;
  correctAnswer: boolean;
  userAnswer: boolean | null;
  manualReviewVote: ManualReviewVote;
  status: string;
};

const STOP_WORDS = new Set([
  "a",
  "an",
  "and",
  "are",
  "for",
  "from",
  "how",
  "in",
  "into",
  "of",
  "on",
  "or",
  "the",
  "to",
  "with",
]);

const tokenize = (value: string): string[] => {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((token) => token.length > 2 && !STOP_WORDS.has(token));
};

const clamp = (value: number, min: number, max: number) => {
  return Math.min(max, Math.max(min, value));
};

const topicAlignmentRatio = (topic: string, statement: string, explanation: string) => {
  const topicTokens = Array.from(new Set(tokenize(topic)));
  if (topicTokens.length === 0) {
    return 0.55;
  }

  const corpus = new Set([...tokenize(statement), ...tokenize(explanation)]);
  const matchedCount = topicTokens.filter((token) => corpus.has(token)).length;
  return matchedCount / topicTokens.length;
};

export const assessQuestionIntegrity = (input: IntegrityInput): IntegrityAssessment => {
  const alignmentRatio = topicAlignmentRatio(input.topic, input.statement, input.explanation);
  const explanationWordCount = tokenize(input.explanation).length;

  const alignmentScore = Math.round(alignmentRatio * 28);
  const explanationScore = clamp(explanationWordCount * 2, 4, 16);
  const answerEvidenceScore =
    input.userAnswer === null ? 4 : input.userAnswer === input.correctAnswer ? 14 : 7;
  const timeoutPenalty = input.status === "timed_out" ? 6 : 0;
  const reviewAdjustment =
    input.manualReviewVote === "up" ? 18 : input.manualReviewVote === "down" ? -30 : 0;

  const score = clamp(
    42 + alignmentScore + explanationScore + answerEvidenceScore + reviewAdjustment - timeoutPenalty,
    0,
    100,
  );

  const label: IntegrityAssessment["label"] =
    score >= 75 ? "High" : score >= 55 ? "Moderate" : "Low";

  const topicSignal =
    alignmentRatio >= 0.67
      ? "strong topic alignment"
      : alignmentRatio >= 0.34
        ? "partial topic alignment"
        : "weak topic alignment";

  const explanationSignal =
    explanationWordCount >= 8 ? "usable rationale" : "thin supporting rationale";

  const evidenceSignal =
    input.manualReviewVote === "up"
      ? "positive manual review"
      : input.manualReviewVote === "down"
        ? "negative manual review"
        : input.userAnswer === null
          ? "no learner answer recorded"
          : input.userAnswer === input.correctAnswer
            ? "learner answer matched the expected result"
            : "learner answer diverged from the expected result";

  return {
    score,
    label,
    synopsis: `${topicSignal}, ${explanationSignal}, ${evidenceSignal}.`,
  };
};
