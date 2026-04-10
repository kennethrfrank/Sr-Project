"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  MIN_SESSION_DURATION_MS,
  createQuizSession,
  recordQuestionResponse,
  type QuizSource,
} from "@/lib/firebase/quiz-history";

import styles from "./content-slider.styles.module.css";

type Question = {
  id: number;
  statement: string;
  answer: boolean;
  explanation: string;
};

type Props = {
  topic: string;
  userId: string | null;
};

type AnswerMap = Record<number, boolean>;
type PendingSession = {
  topic: string;
  round: number;
  questions: Question[];
  source: QuizSource;
};

const QUESTION_COUNT = 6;

const ContentSlider: React.FC<Props> = ({ topic, userId }) => {
  const [debouncedTopic, setDebouncedTopic] = useState(topic);
  const [round, setRound] = useState(1);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<AnswerMap>({});
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [pendingSession, setPendingSession] = useState<PendingSession | null>(null);
  const [sessionStartedAtMs, setSessionStartedAtMs] = useState<number | null>(null);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const lastFetchedTopic = useRef(topic);
  const answersRef = useRef<AnswerMap>({});
  const questionsRef = useRef<Question[]>([]);
  const pendingSessionRef = useRef<PendingSession | null>(null);
  const currentSessionIdRef = useRef<string | null>(null);
  const sessionStartedAtRef = useRef<number | null>(null);
  const persistedAnswerIdsRef = useRef<Set<number>>(new Set());
  const answerSyncInFlightRef = useRef(false);
  const sessionCreateInFlightRef = useRef(false);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedTopic(topic);
    }, 450);

    return () => window.clearTimeout(timeoutId);
  }, [topic]);

  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  useEffect(() => {
    questionsRef.current = questions;
  }, [questions]);

  useEffect(() => {
    pendingSessionRef.current = pendingSession;
  }, [pendingSession]);

  useEffect(() => {
    currentSessionIdRef.current = currentSessionId;
  }, [currentSessionId]);

  useEffect(() => {
    sessionStartedAtRef.current = sessionStartedAtMs;
  }, [sessionStartedAtMs]);

  const syncUnsavedAnswers = useCallback(async (sessionId: string, actorUserId: string) => {
    if (answerSyncInFlightRef.current) {
      return;
    }

    answerSyncInFlightRef.current = true;

    try {
      for (const question of questionsRef.current) {
        if (!(question.id in answersRef.current) || persistedAnswerIdsRef.current.has(question.id)) {
          continue;
        }

        const nextAnsweredCount = persistedAnswerIdsRef.current.size + 1;

        await recordQuestionResponse({
          userId: actorUserId,
          sessionId,
          question,
          userAnswer: answersRef.current[question.id],
          questionCount: questionsRef.current.length,
          nextAnsweredCount,
          sessionResolved: nextAnsweredCount >= questionsRef.current.length,
        });

        persistedAnswerIdsRef.current.add(question.id);
      }

      setSyncMessage(null);
    } catch (error) {
      console.error("Failed to persist project quiz answer", error);
      setSyncMessage("The latest answer stayed local because Firebase sync failed.");
    } finally {
      answerSyncInFlightRef.current = false;
    }
  }, []);

  const persistQualifiedSession = useCallback(async () => {
    if (!userId || currentSessionIdRef.current || sessionCreateInFlightRef.current) {
      return;
    }

    const draft = pendingSessionRef.current;
    const startedAtMs = sessionStartedAtRef.current;

    if (!draft || !startedAtMs) {
      return;
    }

    const persistedAfterMs = Date.now() - startedAtMs;
    if (persistedAfterMs < MIN_SESSION_DURATION_MS) {
      return;
    }

    sessionCreateInFlightRef.current = true;

    try {
      const sessionId = await createQuizSession({
        userId,
        quizType: "projects",
        topic: draft.topic,
        round: draft.round,
        questions: draft.questions,
        source: draft.source,
        startedAtMs,
        persistedAfterMs,
      });

      currentSessionIdRef.current = sessionId;
      pendingSessionRef.current = null;
      setCurrentSessionId(sessionId);
      setPendingSession(null);
      await syncUnsavedAnswers(sessionId, userId);
      setSyncMessage(null);
    } catch (error) {
      console.error("Failed to persist generated project quiz session", error);
      currentSessionIdRef.current = null;
      setCurrentSessionId(null);
      setSyncMessage("Firebase could not save this round. Gameplay still works locally.");
    } finally {
      sessionCreateInFlightRef.current = false;
    }
  }, [syncUnsavedAnswers, userId]);

  useEffect(() => {
    if (!userId || !pendingSession || currentSessionId) {
      return;
    }

    void persistQualifiedSession();

    const intervalId = window.setInterval(() => {
      void persistQualifiedSession();
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [currentSessionId, pendingSession, persistQualifiedSession, userId]);

  useEffect(() => {
    if (debouncedTopic !== lastFetchedTopic.current) {
      lastFetchedTopic.current = debouncedTopic;
      if (round !== 1) {
        setRound(1);
        return;
      }
    }

    const controller = new AbortController();

    const fetchQuestions = async () => {
      setIsLoading(true);
      setErrorMessage(null);
      setAnswers({});
      setCurrentSessionId(null);
      setPendingSession(null);
      setSessionStartedAtMs(null);
      setSyncMessage(null);
      currentSessionIdRef.current = null;
      pendingSessionRef.current = null;
      sessionStartedAtRef.current = null;
      persistedAnswerIdsRef.current = new Set();

      try {
        const response = await fetch("/api/questions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          signal: controller.signal,
          body: JSON.stringify({
            topic: debouncedTopic,
            round,
            count: QUESTION_COUNT,
          }),
        });

        const payload = (await response.json()) as {
          error?: string;
          questions?: Question[];
        };

        if (!response.ok) {
          throw new Error(payload.error || "Unable to load questions.");
        }

        if (!Array.isArray(payload.questions) || payload.questions.length === 0) {
          throw new Error("No questions returned. Try another topic.");
        }

        setQuestions(payload.questions);
        setSessionStartedAtMs(Date.now());
        setPendingSession({
          topic: debouncedTopic,
          round,
          questions: payload.questions,
          source: "openai",
        });
      } catch (error) {
        if (controller.signal.aborted) return;

        const message =
          error instanceof Error
            ? error.message
            : "Unexpected error while loading questions.";
        setQuestions([]);
        setSessionStartedAtMs(null);
        setErrorMessage(message);
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    };

    fetchQuestions();

    return () => controller.abort();
  }, [debouncedTopic, round]);

  const onAnswer = (questionId: number, userAnswer: boolean) => {
    if (questionId in answers) {
      return;
    }

    const question = questions.find((entry) => entry.id === questionId);
    if (!question) return;

    setAnswers((currentAnswers) => {
      if (questionId in currentAnswers) {
        return currentAnswers;
      }
      return { ...currentAnswers, [questionId]: userAnswer };
    });

    if (!userId) {
      return;
    }

    if (currentSessionIdRef.current) {
      void syncUnsavedAnswers(currentSessionIdRef.current, userId);
      return;
    }

    void persistQualifiedSession();
  };

  const score = useMemo(() => {
    return questions.reduce((total, question) => {
      return answers[question.id] === question.answer ? total + 1 : total;
    }, 0);
  }, [questions, answers]);

  const answeredCount = Object.keys(answers).length;
  const isRoundComplete = questions.length > 0 && answeredCount === questions.length;
  const syncThresholdMessage = currentSessionId
    ? "This round is being included in the Firebase integrity report."
    : sessionStartedAtMs
      ? "This round will enter Firebase reporting after 10 seconds of activity."
      : "Generate a round to begin tracking a qualified session.";

  return (
    <div className={styles.sliderContainerStyling}>
      <div className={styles.headerBar}>
        <p>
          Round {round} | Score: {score}/{questions.length || QUESTION_COUNT}
        </p>
        <button type="button" onClick={() => setRound((current) => current + 1)}>
          Next Round
        </button>
      </div>

      {isLoading && <p className={styles.statusMessage}>Generating questions...</p>}
      {!isLoading && errorMessage && <p className={styles.errorMessage}>{errorMessage}</p>}
      {!isLoading && !errorMessage && syncMessage && (
        <p className={styles.errorMessage}>{syncMessage}</p>
      )}
      {!isLoading && !errorMessage && <p className={styles.statusMessage}>{syncThresholdMessage}</p>}
      {!isLoading && isRoundComplete && (
        <p className={styles.statusMessage}>Round complete. Click Next Round for harder questions.</p>
      )}

      <div className={styles.scroller}>
        {!isLoading &&
          !errorMessage &&
          questions.map((question) => {
            const selectedAnswer = answers[question.id];
            const answered = selectedAnswer !== undefined;
            const isCorrect = answered && selectedAnswer === question.answer;

            return (
              <article key={question.id} className={styles.card}>
                <div className={styles.questionPanel}>
                  <h2 className={styles.statement}>{question.statement}</h2>
                </div>

                <div className={styles.meta}>
                  <p className={styles.questionNumber}>Question {question.id}</p>
                  <div className={styles.answerRow}>
                    <button
                      type="button"
                      disabled={answered}
                      onClick={() => onAnswer(question.id, true)}
                    >
                      True
                    </button>
                    <button
                      type="button"
                      disabled={answered}
                      onClick={() => onAnswer(question.id, false)}
                    >
                      False
                    </button>
                  </div>
                  {answered && (
                    <p className={isCorrect ? styles.correct : styles.incorrect}>
                      {isCorrect ? "Correct." : "Incorrect."} {question.explanation}
                    </p>
                  )}
                </div>
              </article>
            );
          })}
      </div>
    </div>
  );
};

export default ContentSlider;
