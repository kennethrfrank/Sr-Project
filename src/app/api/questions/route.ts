import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type Question = {
  id: number;
  statement: string;
  answer: boolean;
  explanation: string;
};

type OpenAIQuestion = Omit<Question, "id">;

const DEFAULT_TOPIC = "phishing, social engineering, MFA, and password safety";
const DEFAULT_COUNT = 6;
const MAX_COUNT = 10;
const DEFAULT_MODEL = process.env.OPENAI_MODEL || "gpt-4.1-mini";

const parseCount = (raw: unknown): number => {
  if (typeof raw !== "number") return DEFAULT_COUNT;
  if (!Number.isFinite(raw)) return DEFAULT_COUNT;
  const normalized = Math.round(raw);
  if (normalized < 2) return 2;
  if (normalized > MAX_COUNT) return MAX_COUNT;
  return normalized;
};

const parseRound = (raw: unknown): number => {
  if (typeof raw !== "number") return 1;
  if (!Number.isFinite(raw)) return 1;
  const normalized = Math.round(raw);
  if (normalized < 1) return 1;
  if (normalized > 10) return 10;
  return normalized;
};

const parseTopic = (raw: unknown): string => {
  if (typeof raw !== "string") return DEFAULT_TOPIC;
  const trimmed = raw.trim();
  if (!trimmed) return DEFAULT_TOPIC;
  return trimmed.slice(0, 140);
};

const difficultyLabel = (round: number): string => {
  if (round <= 2) return "beginner";
  if (round <= 4) return "intermediate";
  if (round <= 7) return "advanced";
  return "expert";
};

const normalizeQuestions = (rawQuestions: unknown): Question[] => {
  if (!Array.isArray(rawQuestions)) return [];

  const validQuestions: Question[] = [];

  for (const [index, item] of rawQuestions.entries()) {
    if (!item || typeof item !== "object") continue;
    const candidate = item as Partial<OpenAIQuestion>;

    if (typeof candidate.statement !== "string") continue;
    if (typeof candidate.answer !== "boolean") continue;

    const statement = candidate.statement.trim();
    if (!statement) continue;

    validQuestions.push({
      id: index + 1,
      statement,
      answer: candidate.answer,
      explanation:
        typeof candidate.explanation === "string" && candidate.explanation.trim()
          ? candidate.explanation.trim()
          : "Review core cybersecurity best practices and threat indicators.",
    });
  }

  return validQuestions;
};

export async function POST(request: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Missing OPENAI_API_KEY on server." },
      { status: 500 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const payload = (body || {}) as Record<string, unknown>;
  const topic = parseTopic(payload.topic);
  const count = parseCount(payload.count);
  const round = parseRound(payload.round);
  const level = difficultyLabel(round);

  const responseFormatSchema = {
    type: "object",
    additionalProperties: false,
    properties: {
      questions: {
        type: "array",
        minItems: count,
        maxItems: count,
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            statement: { type: "string" },
            answer: { type: "boolean" },
            explanation: { type: "string" },
          },
          required: ["statement", "answer", "explanation"],
        },
      },
    },
    required: ["questions"],
  };

  let openAiResponse: Response;
  try {
    openAiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: DEFAULT_MODEL,
        temperature: 0.8,
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "cyber_true_false_questions",
            strict: true,
            schema: responseFormatSchema,
          },
        },
        messages: [
          {
            role: "system",
            content:
              "You generate concise, accurate cybersecurity true/false questions. Keep statements clear and realistic.",
          },
          {
            role: "user",
            content: [
              `Create ${count} unique cybersecurity True/False statements.`,
              `Topic focus: ${topic}.`,
              `Difficulty level: ${level} (round ${round}).`,
              "Output valid JSON only using the required schema.",
              "Each explanation must be one short sentence that teaches the concept.",
            ].join(" "),
          },
        ],
      }),
    });
  } catch (error) {
    console.error("Failed to reach OpenAI", error);
    return NextResponse.json(
      { error: "Could not contact OpenAI. Check network and try again." },
      { status: 502 },
    );
  }

  const openAiJson = await openAiResponse.json();
  if (!openAiResponse.ok) {
    const errorMessage =
      openAiJson?.error?.message || "OpenAI returned an unexpected error.";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }

  const messageContent = openAiJson?.choices?.[0]?.message?.content;
  if (typeof messageContent !== "string") {
    return NextResponse.json(
      { error: "OpenAI response was missing question content." },
      { status: 500 },
    );
  }

  let parsedContent: unknown;
  try {
    parsedContent = JSON.parse(messageContent);
  } catch {
    return NextResponse.json(
      { error: "OpenAI response could not be parsed as JSON." },
      { status: 500 },
    );
  }

  const questions = normalizeQuestions(
    (parsedContent as { questions?: unknown })?.questions,
  );

  if (questions.length === 0) {
    return NextResponse.json(
      { error: "No valid questions were generated. Try another topic." },
      { status: 500 },
    );
  }

  return NextResponse.json({
    topic,
    round,
    questions,
  });
}
