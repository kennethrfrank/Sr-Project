"use client";

import { useMemo, useState } from "react";
import styles from "./ai-quiz.styles.module.css";
import type { QuizQuestion } from "@/lib/quiz/fallback";
import SectionShell from "../section-shell/section-shell.component";

type Difficulty = QuizQuestion["difficulty"];

type ApiResponse = {
  source: "openai" | "fallback";
  message: string;
  questions: QuizQuestion[];
};

const topics = [
  "General Cybersecurity",
  "Phishing",
  "Password Safety",
  "Privacy & Data Protection",
  "Incident Response",
  "Social Engineering",
];

const AIQuiz = () => {
  const [topic, setTopic] = useState("Phishing");
  const [difficulty, setDifficulty] = useState<Difficulty>("beginner");
  const [count, setCount] = useState(5);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [status, setStatus] = useState("Choose a topic and generate a quiz to begin.");
  const [source, setSource] = useState<"openai" | "fallback" | null>(null);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const score = useMemo(() => {
    return questions.reduce((total, question) => {
      return total + (selectedAnswers[question.id] === question.answer ? 1 : 0);
    }, 0);
  }, [questions, selectedAnswers]);

  const answeredCount = useMemo(() => Object.keys(selectedAnswers).length, [selectedAnswers]);

  const generateQuiz = async () => {
    try {
      setLoading(true);
      setShowResults(false);
      setSelectedAnswers({});
      setStatus("Generating quiz questions...");

      const response = await fetch("/api/generate-quiz", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ topic, difficulty, count }),
      });

      const data = (await response.json()) as ApiResponse;
      setQuestions(data.questions || []);
      setSource(data.source || null);
      setStatus(data.message || "Quiz generated.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to generate quiz right now.";
      setStatus(message);
      setQuestions([]);
      setSource(null);
    } finally {
      setLoading(false);
    }
  };

  const submitQuiz = () => {
    setShowResults(true);
    setStatus(`Quiz submitted. You scored ${score} out of ${questions.length}.`);
  };

  return (
    <SectionShell
      eyebrow="AI Quiz Generator"
      title="Dynamic cybersecurity questions"
      description="This section turns the OpenAI integration into a working feature. Users can generate topic-based questions, answer them inside the platform, and instantly review explanations. If an API key is not available, the app safely falls back to built-in questions so the demo still works."
    >
      <div className={styles.toolbar}>
        <label className={styles.field}>
          <span>Topic</span>
          <select value={topic} onChange={(event) => setTopic(event.target.value)}>
            {topics.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>

        <label className={styles.field}>
          <span>Difficulty</span>
          <select value={difficulty} onChange={(event) => setDifficulty(event.target.value as Difficulty)}>
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
        </label>

        <label className={styles.field}>
          <span>Questions</span>
          <select value={count} onChange={(event) => setCount(Number(event.target.value))}>
            <option value={3}>3</option>
            <option value={5}>5</option>
            <option value={7}>7</option>
          </select>
        </label>

        <button type="button" className={styles.primaryButton} onClick={generateQuiz} disabled={loading}>
          {loading ? "Generating..." : "Generate quiz"}
        </button>
      </div>

      <div className={styles.statusRow}>
        <p>{status}</p>
        {source ? <span className={source === "openai" ? styles.liveBadge : styles.fallbackBadge}>{source === "openai" ? "Live AI" : "Fallback Mode"}</span> : null}
      </div>

      {questions.length ? (
        <>
          <div className={styles.metrics}>
            <div className={styles.metricCard}>
              <strong>{questions.length}</strong>
              <span>questions generated</span>
            </div>
            <div className={styles.metricCard}>
              <strong>{answeredCount}</strong>
              <span>questions answered</span>
            </div>
            <div className={styles.metricCard}>
              <strong>{showResults ? `${score}/${questions.length}` : "—"}</strong>
              <span>current score</span>
            </div>
          </div>

          <div className={styles.questionList}>
            {questions.map((question, index) => {
              const selected = selectedAnswers[question.id];
              const isCorrect = selected === question.answer;

              return (
                <article key={question.id} className={styles.questionCard}>
                  <div className={styles.questionHeader}>
                    <span className={styles.questionNumber}>Question {index + 1}</span>
                    <span className={styles.questionTopic}>{question.topic}</span>
                  </div>
                  <h3>{question.question}</h3>
                  <div className={styles.optionGrid}>
                    {question.options.map((option) => {
                      const isSelected = selected === option;
                      const shouldHighlightCorrect = showResults && option === question.answer;
                      const shouldHighlightWrong = showResults && isSelected && option !== question.answer;

                      return (
                        <button
                          key={option}
                          type="button"
                          className={`${styles.optionButton} ${isSelected ? styles.selectedOption : ""} ${
                            shouldHighlightCorrect ? styles.correctOption : ""
                          } ${shouldHighlightWrong ? styles.wrongOption : ""}`}
                          onClick={() =>
                            setSelectedAnswers((current) => ({
                              ...current,
                              [question.id]: option,
                            }))
                          }
                        >
                          {option}
                        </button>
                      );
                    })}
                  </div>

                  {showResults ? (
                    <div className={styles.explanationBox}>
                      <p>
                        <strong>{isCorrect ? "Correct." : "Review:"}</strong> {question.explanation}
                      </p>
                    </div>
                  ) : null}
                </article>
              );
            })}
          </div>

          <div className={styles.actionRow}>
            <button type="button" className={styles.secondaryButton} onClick={generateQuiz} disabled={loading}>
              Regenerate questions
            </button>
            <button type="button" className={styles.primaryButton} onClick={submitQuiz} disabled={!questions.length}>
              Submit quiz
            </button>
          </div>
        </>
      ) : null}
    </SectionShell>
  );
};

export default AIQuiz;
