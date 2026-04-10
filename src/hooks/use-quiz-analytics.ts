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
import {
  EMPTY_QUIZ_ANALYTICS,
  type QuizAnalytics,
  type QuizType,
  type SessionSummary,
} from "@/lib/firebase/quiz-history";

export type QuizAnalyticsStatus = "loading" | "ready" | "disabled" | "error";

const readTimestamp = (value: unknown): string | null => {
  if (value instanceof Timestamp) {
    return value.toDate().toISOString();
  }

  return null;
};

const readNumber = (value: unknown): number => {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
};

const readQuizType = (value: unknown): QuizType | null => {
  return value === "projects" || value === "avatar" ? value : null;
};

const mapSession = (id: string, value: Record<string, unknown>): SessionSummary => ({
  id,
  quizType: readQuizType(value.quizType) || "projects",
  topic: typeof value.topic === "string" ? value.topic : "Unknown Topic",
  round: readNumber(value.round) || 1,
  questionCount: readNumber(value.questionCount),
  answeredCount: readNumber(value.answeredCount),
  correctCount: readNumber(value.correctCount),
  timedOutCount: readNumber(value.timedOutCount),
  source: value.source === "fallback" ? "fallback" : "openai",
  startedAt: readTimestamp(value.startedAt),
  completedAt: readTimestamp(value.completedAt),
});

export const useQuizAnalytics = (userId: string | null) => {
  const [analytics, setAnalytics] = useState<QuizAnalytics>(EMPTY_QUIZ_ANALYTICS);
  const [status, setStatus] = useState<QuizAnalyticsStatus>(
    isFirebaseConfigured ? "loading" : "disabled",
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [observedUserId, setObservedUserId] = useState<string | null>(null);

  useEffect(() => {
    if (!isFirebaseConfigured || !firebaseDb) {
      return;
    }

    if (!userId) {
      return;
    }

    let statsLoaded = false;
    let sessionsLoaded = false;

    const maybeSetReady = () => {
      if (statsLoaded && sessionsLoaded) {
        setStatus("ready");
      }
    };

    const userRef = doc(firebaseDb, "users", userId);
    const sessionsQuery = query(
      collection(userRef, "quizSessions"),
      orderBy("startedAt", "desc"),
      limit(8),
    );

    const unsubscribeUser = onSnapshot(
      userRef,
      (snapshot) => {
        const statsValue = snapshot.data()?.stats as Record<string, unknown> | undefined;
        const totalAnswered = readNumber(statsValue?.totalAnswered);
        const totalCorrect = readNumber(statsValue?.totalCorrect);

        setAnalytics((current) => ({
          ...current,
          stats: {
            totalSessions: readNumber(statsValue?.totalSessions),
            totalQuestionsGenerated: readNumber(statsValue?.totalQuestionsGenerated),
            totalAnswered,
            totalCorrect,
            totalTimedOut: readNumber(statsValue?.totalTimedOut),
            accuracy: totalAnswered > 0 ? (totalCorrect / totalAnswered) * 100 : 0,
            lastTopic:
              typeof statsValue?.lastTopic === "string" ? statsValue.lastTopic : null,
            lastQuizType: readQuizType(statsValue?.lastQuizType),
          },
        }));

        statsLoaded = true;
        setObservedUserId(userId);
        setErrorMessage(null);
        maybeSetReady();
      },
      (error) => {
        console.error("Failed to load Firebase user stats", error);
        setObservedUserId(userId);
        setStatus("error");
        setErrorMessage("Could not load Firebase stats.");
      },
    );

    const unsubscribeSessions = onSnapshot(
      sessionsQuery,
      (snapshot) => {
        setAnalytics((current) => ({
          ...current,
          recentSessions: snapshot.docs.map((sessionDoc) =>
            mapSession(
              sessionDoc.id,
              sessionDoc.data() as Record<string, unknown>,
            ),
          ),
        }));

        sessionsLoaded = true;
        setObservedUserId(userId);
        setErrorMessage(null);
        maybeSetReady();
      },
      (error) => {
        console.error("Failed to load Firebase quiz sessions", error);
        setObservedUserId(userId);
        setStatus("error");
        setErrorMessage("Could not load Firebase sessions.");
      },
    );

    return () => {
      unsubscribeUser();
      unsubscribeSessions();
    };
  }, [userId]);

  const effectiveStatus: QuizAnalyticsStatus =
    !isFirebaseConfigured || !firebaseDb
      ? "disabled"
      : !userId || observedUserId !== userId
        ? "loading"
        : status;

  const effectiveAnalytics =
    !userId || observedUserId !== userId ? EMPTY_QUIZ_ANALYTICS : analytics;

  return {
    analytics: effectiveAnalytics,
    status: effectiveStatus,
    errorMessage: userId && observedUserId === userId ? errorMessage : null,
  };
};
