"use client";

import {
  Timestamp,
  collection,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
} from "firebase/firestore";
import { useEffect, useState } from "react";

import { firebaseDb, isFirebaseConfigured } from "@/lib/firebase/firebase-client";
import { assessQuestionIntegrity } from "@/lib/question-integrity";
import type {
  ManualReviewVote,
  QuizSource,
  QuizType,
} from "@/lib/firebase/quiz-history";

export type QuestionReportStatus = "loading" | "ready" | "disabled" | "error";

export type QuestionReportRow = {
  id: string;
  sessionId: string;
  questionId: number;
  quizType: QuizType;
  source: QuizSource;
  topic: string;
  statement: string;
  explanation: string;
  correctAnswer: boolean;
  userAnswer: boolean | null;
  status: string;
  stationId: number | null;
  manualReviewVote: ManualReviewVote;
  manualReviewUpdatedAt: string | null;
  answeredAt: string | null;
  timedOutAt: string | null;
  updatedAt: string | null;
  confidenceScore: number;
  confidenceLabel: "High" | "Moderate" | "Low";
  confidenceSynopsis: string;
};

const readTimestamp = (value: unknown): string | null => {
  if (value instanceof Timestamp) {
    return value.toDate().toISOString();
  }

  return null;
};

const readBoolean = (value: unknown): boolean | null => {
  return typeof value === "boolean" ? value : null;
};

const readNumber = (value: unknown): number | null => {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
};

const readQuizType = (value: unknown): QuizType => {
  return value === "avatar" ? "avatar" : "projects";
};

const readQuizSource = (value: unknown): QuizSource => {
  return value === "fallback" ? "fallback" : "openai";
};

const readManualVote = (value: unknown): ManualReviewVote => {
  return value === "up" || value === "down" ? value : null;
};

const latestTimestampValue = (row: QuestionReportRow) => {
  return row.updatedAt || row.answeredAt || row.timedOutAt || "";
};

export const useQuestionReport = (userId: string | null) => {
  const [rows, setRows] = useState<QuestionReportRow[]>([]);
  const [status, setStatus] = useState<QuestionReportStatus>(
    isFirebaseConfigured ? "loading" : "disabled",
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [observedUserId, setObservedUserId] = useState<string | null>(null);

  useEffect(() => {
    if (!isFirebaseConfigured || !firebaseDb || !userId) {
      return;
    }

    const userRef = doc(firebaseDb, "users", userId);
    const sessionsQuery = query(
      collection(userRef, "quizSessions"),
      orderBy("startedAt", "desc"),
      limit(12),
    );
    let questionUnsubscribers: Array<() => void> = [];

    const clearQuestionSubscriptions = () => {
      for (const unsubscribe of questionUnsubscribers) {
        unsubscribe();
      }
      questionUnsubscribers = [];
    };

    const unsubscribeSessions = onSnapshot(
      sessionsQuery,
      (sessionSnapshot) => {
        clearQuestionSubscriptions();

        if (sessionSnapshot.docs.length === 0) {
          setRows([]);
          setObservedUserId(userId);
          setErrorMessage(null);
          setStatus("ready");
          return;
        }

        const sessionRowMap = new Map<string, QuestionReportRow[]>();
        const publishRows = () => {
          const nextRows = Array.from(sessionRowMap.values())
            .flat()
            .sort((left, right) =>
              latestTimestampValue(right).localeCompare(latestTimestampValue(left)),
            );

          setRows(nextRows);
          setObservedUserId(userId);
          setErrorMessage(null);
          setStatus("ready");
        };

        for (const sessionDoc of sessionSnapshot.docs) {
          const sessionValue = sessionDoc.data() as Record<string, unknown>;
          const unsubscribeQuestions = onSnapshot(
            collection(sessionDoc.ref, "questions"),
            (questionSnapshot) => {
              const nextRows = questionSnapshot.docs.map((questionDoc) => {
                const value = questionDoc.data() as Record<string, unknown>;
                const correctAnswer = readBoolean(value.correctAnswer) ?? false;
                const userAnswer = readBoolean(value.userAnswer);
                const topic =
                  typeof value.topic === "string"
                    ? value.topic
                    : typeof sessionValue.topic === "string"
                      ? sessionValue.topic
                      : "Unknown Topic";
                const statement =
                  typeof value.statement === "string" ? value.statement : "Question unavailable";
                const explanation =
                  typeof value.explanation === "string"
                    ? value.explanation
                    : "No explanation saved.";
                const manualReviewVote = readManualVote(value.manualReviewVote);
                const integrity = assessQuestionIntegrity({
                  topic,
                  statement,
                  explanation,
                  correctAnswer,
                  userAnswer,
                  manualReviewVote,
                  status: typeof value.status === "string" ? value.status : "pending",
                });

                return {
                  id: questionDoc.id,
                  sessionId: sessionDoc.id,
                  questionId: readNumber(value.questionId) ?? 0,
                  quizType:
                    value.quizType !== undefined
                      ? readQuizType(value.quizType)
                      : readQuizType(sessionValue.quizType),
                  source:
                    value.source !== undefined
                      ? readQuizSource(value.source)
                      : readQuizSource(sessionValue.source),
                  topic,
                  statement,
                  explanation,
                  correctAnswer,
                  userAnswer,
                  status: typeof value.status === "string" ? value.status : "pending",
                  stationId: readNumber(value.stationId),
                  manualReviewVote,
                  manualReviewUpdatedAt: readTimestamp(value.manualReviewUpdatedAt),
                  answeredAt: readTimestamp(value.answeredAt),
                  timedOutAt: readTimestamp(value.timedOutAt),
                  updatedAt: readTimestamp(value.updatedAt),
                  confidenceScore: integrity.score,
                  confidenceLabel: integrity.label,
                  confidenceSynopsis: integrity.synopsis,
                } satisfies QuestionReportRow;
              });

              sessionRowMap.set(sessionDoc.id, nextRows);
              publishRows();
            },
            (error) => {
              console.error("Failed to load session question rows", error);
              setRows([]);
              setObservedUserId(userId);
              setErrorMessage("Could not load question rows for a saved session.");
              setStatus("error");
            },
          );

          questionUnsubscribers.push(unsubscribeQuestions);
        }
      },
      (error) => {
        console.error("Failed to load question integrity report", error);
        setRows([]);
        setObservedUserId(userId);
        setErrorMessage("Could not load the saved question report.");
        setStatus("error");
      },
    );

    return () => {
      clearQuestionSubscriptions();
      unsubscribeSessions();
    };
  }, [userId]);

  const effectiveStatus: QuestionReportStatus =
    !isFirebaseConfigured || !firebaseDb
      ? "disabled"
      : !userId || observedUserId !== userId
        ? "loading"
        : status;

  return {
    rows: !userId || observedUserId !== userId ? [] : rows,
    status: effectiveStatus,
    errorMessage: userId && observedUserId === userId ? errorMessage : null,
  };
};
