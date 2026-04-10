import { NextResponse } from "next/server";
import { buildFallbackQuiz, type QuizQuestion } from "@/lib/quiz/fallback";

const OPENAI_URL = "https://api.openai.com/v1/responses";

type Difficulty = QuizQuestion["difficulty"];

type RequestBody = {
  topic?: string;
  difficulty?: Difficulty;
  count?: number;
};

function cleanQuestions(raw: unknown, topic: string, difficulty: Difficulty): QuizQuestion[] {
  if (!Array.isArray(raw)) return [];

  return raw
    .map((item, index) => {
      const record = item as Record<string, unknown>;
      const question = typeof record.question === "string" ? record.question.trim() : "";
      const options = Array.isArray(record.options)
        ? record.options.filter((option): option is string => typeof option === "string").map((option) => option.trim())
        : [];
      const answer = typeof record.answer === "string" ? record.answer.trim() : "";
      const explanation = typeof record.explanation === "string" ? record.explanation.trim() : "";

      if (!question || options.length !== 4 || !answer || !explanation || !options.includes(answer)) {
        return null;
      }

      return {
        id: `${topic}-${difficulty}-${index + 1}`.toLowerCase().replace(/[^a-z0-9-]/g, "-"),
        question,
        options,
        answer,
        explanation,
        topic,
        difficulty,
      } satisfies QuizQuestion;
    })
    .filter((item): item is QuizQuestion => Boolean(item));
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as RequestBody;
    const topic = body.topic?.trim() || "General Cybersecurity";
    const difficulty: Difficulty = body.difficulty || "beginner";
    const count = Math.min(Math.max(Number(body.count) || 5, 3), 8);
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return NextResponse.json({
        source: "fallback",
        questions: buildFallbackQuiz(topic, difficulty, count),
        message: "OPENAI_API_KEY is not set, so fallback quiz content was used.",
      });
    }

    const prompt = [
      `Generate ${count} multiple-choice cybersecurity quiz questions.`,
      `Topic: ${topic}.`,
      `Difficulty: ${difficulty}.`,
      "Return only valid JSON as an array.",
      'Each object must contain: question, options, answer, explanation.',
      "Use exactly 4 options per question.",
      "The answer must match one of the options exactly.",
      "Keep explanations short, practical, and student-friendly.",
    ].join(" ");

    const response = await fetch(OPENAI_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
        input: prompt,
        text: {
          format: {
            type: "json_schema",
            name: "cybersecurity_quiz_questions",
            schema: {
              type: "array",
              items: {
                type: "object",
                additionalProperties: false,
                properties: {
                  question: { type: "string" },
                  options: {
                    type: "array",
                    items: { type: "string" },
                    minItems: 4,
                    maxItems: 4,
                  },
                  answer: { type: "string" },
                  explanation: { type: "string" },
                },
                required: ["question", "options", "answer", "explanation"],
              },
            },
          },
        },
      }),
    });

    if (!response.ok) {
      const fallbackQuestions = buildFallbackQuiz(topic, difficulty, count);
      return NextResponse.json(
        {
          source: "fallback",
          questions: fallbackQuestions,
          message: `OpenAI request failed with status ${response.status}, so fallback quiz content was used.`,
        },
        { status: 200 }
      );
    }

    const data = (await response.json()) as {
      output_text?: string;
    };

    const parsed = data.output_text ? JSON.parse(data.output_text) : [];
    const questions = cleanQuestions(parsed, topic, difficulty);

    if (!questions.length) {
      return NextResponse.json({
        source: "fallback",
        questions: buildFallbackQuiz(topic, difficulty, count),
        message: "The AI response could not be validated, so fallback quiz content was used.",
      });
    }

    return NextResponse.json({
      source: "openai",
      questions,
      message: "AI-generated questions loaded successfully.",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to generate quiz questions.";
    return NextResponse.json(
      {
        source: "fallback",
        questions: buildFallbackQuiz("General Cybersecurity", "beginner", 5),
        message,
      },
      { status: 200 }
    );
  }
}
