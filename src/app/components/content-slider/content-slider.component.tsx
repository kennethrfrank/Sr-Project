"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import styles from "./content-slider.styles.module.css";

type Question = {
  id: number;
  statement: string;
  answer: boolean;
  explanation: string;
};

type Props = {
  topic: string;
};

type AnswerMap = Record<number, boolean>;

const QUESTION_COUNT = 6;

const ContentSlider: React.FC<Props> = ({ topic }) => {
  const [debouncedTopic, setDebouncedTopic] = useState(topic);
  const [round, setRound] = useState(1);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<AnswerMap>({});
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const lastFetchedTopic = useRef(topic);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedTopic(topic);
    }, 450);

    return () => window.clearTimeout(timeoutId);
  }, [topic]);

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
      } catch (error) {
        if (controller.signal.aborted) return;

        const message =
          error instanceof Error
            ? error.message
            : "Unexpected error while loading questions.";
        setQuestions([]);
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
    setAnswers((currentAnswers) => {
      if (questionId in currentAnswers) {
        return currentAnswers;
      }
      return { ...currentAnswers, [questionId]: userAnswer };
    });
  };

  const score = useMemo(() => {
    return questions.reduce((total, question) => {
      return answers[question.id] === question.answer ? total + 1 : total;
    }, 0);
  }, [questions, answers]);

  const answeredCount = Object.keys(answers).length;
  const isRoundComplete = questions.length > 0 && answeredCount === questions.length;

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
