"use client";

import React, { useMemo, useState } from "react";

import { useQuestionReport } from "@/hooks/use-question-report";
import { recordQuestionManualReview, type ManualReviewVote } from "@/lib/firebase/quiz-history";

import styles from "./report.styles.module.css";

type Props = {
  userId: string | null;
};

const formatAnswer = (value: boolean | null) => {
  if (value === null) return "No answer";
  return value ? "True" : "False";
};

const formatStatus = (status: string) => {
  if (status === "timed_out") return "Timed out";
  if (status === "answered") return "Answered";
  return "Pending";
};

const voteLabel = (vote: ManualReviewVote) => {
  if (vote === "up") return "Approved";
  if (vote === "down") return "Flagged";
  return "Unreviewed";
};

const Report: React.FC<Props> = ({ userId }) => {
  const { rows, status, errorMessage } = useQuestionReport(userId);
  const [pendingVoteKey, setPendingVoteKey] = useState<string | null>(null);

  const metrics = useMemo(() => {
    const totalQuestions = rows.length;
    const positiveVotes = rows.filter((row) => row.manualReviewVote === "up").length;
    const negativeVotes = rows.filter((row) => row.manualReviewVote === "down").length;
    const answeredQuestions = rows.filter((row) => row.userAnswer !== null).length;
    const averageConfidence =
      totalQuestions > 0
        ? rows.reduce((total, row) => total + row.confidenceScore, 0) / totalQuestions
        : 0;

    return {
      totalQuestions,
      positiveVotes,
      negativeVotes,
      answeredQuestions,
      averageConfidence,
    };
  }, [rows]);

  const onVote = async (
    sessionId: string,
    questionId: number,
    currentVote: ManualReviewVote,
    nextVote: Exclude<ManualReviewVote, null>,
  ) => {
    if (!userId) {
      return;
    }

    const voteKey = `${sessionId}:${questionId}`;
    setPendingVoteKey(voteKey);

    try {
      await recordQuestionManualReview({
        userId,
        sessionId,
        questionId,
        vote: currentVote === nextVote ? null : nextVote,
      });
    } catch (error) {
      console.error("Failed to save manual question review", error);
    } finally {
      setPendingVoteKey(null);
    }
  };

  return (
    <section className={styles.shell}>
      <div className={styles.summaryCard}>
        <p className={styles.eyebrow}>Integrity Report</p>
        <h2 className={styles.title}>AI-generated question integrity and learner validation</h2>
        <p className={styles.summary}>
          This report captures the generated question, the expected result, the learner answer,
          and a confidence signal for how well the item appears to align with its topic. We are
          collecting this data so the project can quantify whether AI-generated cybersecurity
          content is accurate, reviewable, and reliable over time.
        </p>
        <p className={styles.summary}>
          The confidence metric is a heuristic built from topic alignment, explanation strength,
          learner outcome, and manual thumbs up or thumbs down feedback. Sessions shorter than 10
          seconds are excluded so fast bounces do not distort the dataset.
        </p>

        <div className={styles.metricGrid}>
          <div className={styles.metricCard}>
            <span className={styles.metricLabel}>Saved Questions</span>
            <strong className={styles.metricValue}>{metrics.totalQuestions}</strong>
          </div>
          <div className={styles.metricCard}>
            <span className={styles.metricLabel}>Avg Confidence</span>
            <strong className={styles.metricValue}>
              {metrics.averageConfidence.toFixed(0)}
            </strong>
          </div>
          <div className={styles.metricCard}>
            <span className={styles.metricLabel}>Manual Approvals</span>
            <strong className={styles.metricValue}>{metrics.positiveVotes}</strong>
          </div>
          <div className={styles.metricCard}>
            <span className={styles.metricLabel}>Manual Flags</span>
            <strong className={styles.metricValue}>{metrics.negativeVotes}</strong>
          </div>
          <div className={styles.metricCard}>
            <span className={styles.metricLabel}>Answered</span>
            <strong className={styles.metricValue}>{metrics.answeredQuestions}</strong>
          </div>
        </div>
      </div>

      {!userId && (
        <p className={styles.message}>
          Sign in first. The report only reads questions stored against the authenticated user.
        </p>
      )}

      {userId && status === "loading" && (
        <p className={styles.message}>Loading saved question integrity data...</p>
      )}

      {userId && errorMessage && <p className={`${styles.message} ${styles.error}`}>{errorMessage}</p>}

      {userId && status === "ready" && rows.length === 0 && (
        <p className={styles.message}>
          No qualified sessions have been saved yet. Runs need to stay active for at least 10
          seconds before they enter this report.
        </p>
      )}

      {userId && rows.length > 0 && (
        <div className={styles.tableShell}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Topic</th>
                <th>Generated Question</th>
                <th>Correct</th>
                <th>User</th>
                <th>Status</th>
                <th>AI Confidence</th>
                <th>Manual Review</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const voteKey = `${row.sessionId}:${row.questionId}`;
                const isSavingVote = pendingVoteKey === voteKey;

                return (
                  <tr key={`${row.sessionId}-${row.questionId}`}>
                    <td>
                      <div className={styles.topicCell}>
                        <strong>{row.topic}</strong>
                        <span>{row.quizType === "avatar" ? "Avatar Walk" : "Question Cards"}</span>
                      </div>
                    </td>
                    <td>
                      <div className={styles.questionCell}>
                        <strong>{row.statement}</strong>
                        <span>{row.explanation}</span>
                      </div>
                    </td>
                    <td>{row.correctAnswer ? "True" : "False"}</td>
                    <td>{formatAnswer(row.userAnswer)}</td>
                    <td>{formatStatus(row.status)}</td>
                    <td>
                      <div className={styles.confidenceCell}>
                        <strong>{row.confidenceScore} / 100</strong>
                        <span>{row.confidenceLabel}</span>
                        <p>{row.confidenceSynopsis}</p>
                      </div>
                    </td>
                    <td>
                      <div className={styles.reviewCell}>
                        <span className={styles.voteStatus}>{voteLabel(row.manualReviewVote)}</span>
                        <div className={styles.voteActions}>
                          <button
                            type="button"
                            className={`${styles.voteButton} ${
                              row.manualReviewVote === "up" ? styles.voteActiveUp : ""
                            }`}
                            disabled={isSavingVote}
                            onClick={() =>
                              void onVote(row.sessionId, row.questionId, row.manualReviewVote, "up")
                            }
                          >
                            Thumbs Up
                          </button>
                          <button
                            type="button"
                            className={`${styles.voteButton} ${
                              row.manualReviewVote === "down" ? styles.voteActiveDown : ""
                            }`}
                            disabled={isSavingVote}
                            onClick={() =>
                              void onVote(
                                row.sessionId,
                                row.questionId,
                                row.manualReviewVote,
                                "down",
                              )
                            }
                          >
                            Thumbs Down
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
};

export default Report;
