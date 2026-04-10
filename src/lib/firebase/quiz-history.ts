import type { User } from "firebase/auth";
import {
  Timestamp,
  collection,
  doc,
  getDoc,
  increment,
  serverTimestamp,
  setDoc,
  writeBatch,
} from "firebase/firestore";

import { firebaseDb } from "./firebase-client";

export type QuizType = "projects" | "avatar";
export type QuizSource = "openai" | "fallback";
export type ManualReviewVote = "up" | "down" | null;
export const MIN_SESSION_DURATION_MS = 10_000;

export type PersistedQuestion = {
  id: number;
  statement: string;
  answer: boolean;
  explanation: string;
  stationId?: number;
};

export type SessionSummary = {
  id: string;
  quizType: QuizType;
  topic: string;
  round: number;
  questionCount: number;
  answeredCount: number;
  correctCount: number;
  timedOutCount: number;
  source: QuizSource;
  startedAt: string | null;
  completedAt: string | null;
};

export type UserQuizStats = {
  totalSessions: number;
  totalQuestionsGenerated: number;
  totalAnswered: number;
  totalCorrect: number;
  totalTimedOut: number;
  accuracy: number;
  lastTopic: string | null;
  lastQuizType: QuizType | null;
};

export type QuizAnalytics = {
  stats: UserQuizStats;
  recentSessions: SessionSummary[];
};

export const EMPTY_QUIZ_ANALYTICS: QuizAnalytics = {
  stats: {
    totalSessions: 0,
    totalQuestionsGenerated: 0,
    totalAnswered: 0,
    totalCorrect: 0,
    totalTimedOut: 0,
    accuracy: 0,
    lastTopic: null,
    lastQuizType: null,
  },
  recentSessions: [],
};

type SessionSeedInput = {
  userId: string;
  quizType: QuizType;
  topic: string;
  round: number;
  questions: PersistedQuestion[];
  source: QuizSource;
  startedAtMs: number;
  persistedAfterMs: number;
};

type QuestionResponseInput = {
  userId: string;
  sessionId: string;
  question: PersistedQuestion;
  userAnswer: boolean;
  questionCount: number;
  nextAnsweredCount: number;
  sessionResolved?: boolean;
};

type TimedOutQuestionsInput = {
  userId: string;
  sessionId: string;
  questions: PersistedQuestion[];
  sessionResolved: boolean;
  gameOver: boolean;
};

type QuestionManualReviewInput = {
  userId: string;
  sessionId: string;
  questionId: number;
  vote: ManualReviewVote;
};

const getDb = () => {
  if (!firebaseDb) {
    throw new Error("Firebase is not configured for this app.");
  }

  return firebaseDb;
};

const providerLabel = (user: User): string => {
  if (user.isAnonymous) return "anonymous";
  return user.providerData[0]?.providerId || "unknown";
};

export const ensureUserRecord = async (user: User) => {
  const db = getDb();
  const userRef = doc(db, "users", user.uid);
  const snapshot = await getDoc(userRef);

  const baseRecord = snapshot.exists()
    ? {
        lastSeenAt: serverTimestamp(),
        authProvider: providerLabel(user),
      }
    : {
        uid: user.uid,
        displayName: user.displayName || null,
        email: user.email || null,
        photoURL: user.photoURL || null,
        authProvider: providerLabel(user),
        createdAt: serverTimestamp(),
        lastSeenAt: serverTimestamp(),
      };

  if (snapshot.exists()) {
    Object.assign(baseRecord, {
      displayName: user.displayName || null,
      email: user.email || null,
      photoURL: user.photoURL || null,
    });
  }

  await setDoc(userRef, baseRecord, { merge: true });
};

export const createQuizSession = async (input: SessionSeedInput): Promise<string> => {
  const db = getDb();
  const userRef = doc(db, "users", input.userId);
  const sessionRef = doc(collection(userRef, "quizSessions"));
  const batch = writeBatch(db);

  batch.set(
    userRef,
    {
      uid: input.userId,
      lastSeenAt: serverTimestamp(),
      stats: {
        totalSessions: increment(1),
        totalQuestionsGenerated: increment(input.questions.length),
        lastQuizType: input.quizType,
        lastTopic: input.topic,
      },
    },
    { merge: true },
  );

  batch.set(sessionRef, {
    userId: input.userId,
    quizType: input.quizType,
    topic: input.topic,
    round: input.round,
    source: input.source,
    questionCount: input.questions.length,
    answeredCount: 0,
    correctCount: 0,
    timedOutCount: 0,
    result: "active",
    startedAt: Timestamp.fromMillis(input.startedAtMs),
    qualifiedAt: serverTimestamp(),
    persistedAfterMs: input.persistedAfterMs,
    minimumDurationMs: MIN_SESSION_DURATION_MS,
    updatedAt: serverTimestamp(),
  });

  for (const question of input.questions) {
    batch.set(doc(collection(sessionRef, "questions"), String(question.id)), {
      userId: input.userId,
      sessionId: sessionRef.id,
      questionId: question.id,
      statement: question.statement,
      correctAnswer: question.answer,
      explanation: question.explanation,
      topic: input.topic,
      round: input.round,
      stationId: question.stationId ?? null,
      quizType: input.quizType,
      source: input.source,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      answeredAt: null,
      userAnswer: null,
      isCorrect: null,
      status: "pending",
      timedOutAt: null,
      timedOutReason: null,
      manualReviewVote: null,
      manualReviewUpdatedAt: null,
    });
  }

  await batch.commit();
  return sessionRef.id;
};

export const recordQuestionResponse = async (input: QuestionResponseInput) => {
  const db = getDb();
  const userRef = doc(db, "users", input.userId);
  const sessionRef = doc(userRef, "quizSessions", input.sessionId);
  const questionRef = doc(sessionRef, "questions", String(input.question.id));
  const isCorrect = input.question.answer === input.userAnswer;
  const batch = writeBatch(db);

  batch.update(questionRef, {
    userAnswer: input.userAnswer,
    isCorrect,
    answeredAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    status: "answered",
  });

  batch.update(sessionRef, {
    answeredCount: increment(1),
    correctCount: increment(isCorrect ? 1 : 0),
    updatedAt: serverTimestamp(),
    ...(input.sessionResolved || input.nextAnsweredCount >= input.questionCount
      ? { completedAt: serverTimestamp(), result: "completed" }
      : {}),
  });

  batch.set(
    userRef,
    {
      uid: input.userId,
      lastSeenAt: serverTimestamp(),
      stats: {
        totalAnswered: increment(1),
        totalCorrect: increment(isCorrect ? 1 : 0),
      },
    },
    { merge: true },
  );

  await batch.commit();
};

export const recordTimedOutQuestions = async (input: TimedOutQuestionsInput) => {
  if (input.questions.length === 0) {
    return;
  }

  const db = getDb();
  const userRef = doc(db, "users", input.userId);
  const sessionRef = doc(userRef, "quizSessions", input.sessionId);
  const batch = writeBatch(db);

  for (const question of input.questions) {
    const questionRef = doc(sessionRef, "questions", String(question.id));
    batch.update(questionRef, {
      userAnswer: null,
      isCorrect: null,
      updatedAt: serverTimestamp(),
      status: "timed_out",
      timedOutAt: serverTimestamp(),
      timedOutReason: "station_expired",
    });
  }

  batch.update(sessionRef, {
    timedOutCount: increment(input.questions.length),
    updatedAt: serverTimestamp(),
    ...(input.sessionResolved
      ? {
          completedAt: serverTimestamp(),
          result: input.gameOver ? "game_over" : "completed",
        }
      : {}),
  });

  batch.set(
    userRef,
    {
      uid: input.userId,
      lastSeenAt: serverTimestamp(),
      stats: {
        totalTimedOut: increment(input.questions.length),
      },
    },
    { merge: true },
  );

  await batch.commit();
};

export const recordQuestionManualReview = async (input: QuestionManualReviewInput) => {
  const db = getDb();
  const questionRef = doc(
    db,
    "users",
    input.userId,
    "quizSessions",
    input.sessionId,
    "questions",
    String(input.questionId),
  );

  await setDoc(
    questionRef,
    {
      manualReviewVote: input.vote,
      manualReviewUpdatedAt: input.vote ? serverTimestamp() : null,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
};
