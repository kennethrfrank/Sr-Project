"use client";

import React from "react";

import type { FirebaseAuthStatus } from "@/hooks/use-firebase-user";
import type { QuizAnalyticsStatus } from "@/hooks/use-quiz-analytics";
import type { QuizAnalytics } from "@/lib/firebase/quiz-history";

import styles from "./quiz-history-panel.styles.module.css";

type Props = {
  analytics: QuizAnalytics;
  analyticsStatus: QuizAnalyticsStatus;
  analyticsErrorMessage: string | null;
  authStatus: FirebaseAuthStatus;
  authErrorMessage: string | null;
  isFirebaseEnabled: boolean;
  userId: string | null;
};

const formatUserLabel = (userId: string | null) => {
  if (!userId) return "Waiting for auth";
  return `${userId.slice(0, 8)}...${userId.slice(-4)}`;
};

const formatTimestamp = (isoString: string | null) => {
  if (!isoString) return "Pending sync";

  return new Date(isoString).toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

const statusToneClass = (
  authStatus: FirebaseAuthStatus,
  analyticsStatus: QuizAnalyticsStatus,
) => {
  if (authStatus === "error" || analyticsStatus === "error") return styles.error;
  if (authStatus === "disabled" || analyticsStatus === "disabled") return styles.disabled;
  if (authStatus === "signed_out") return styles.disabled;
  if (authStatus === "loading" || analyticsStatus === "loading") return styles.loading;
  return styles.ready;
};

const statusLabel = (
  authStatus: FirebaseAuthStatus,
  analyticsStatus: QuizAnalyticsStatus,
) => {
  if (authStatus === "error" || analyticsStatus === "error") return "Attention";
  if (authStatus === "disabled" || analyticsStatus === "disabled") return "Disabled";
  if (authStatus === "signed_out") return "Signed Out";
  if (authStatus === "loading" || analyticsStatus === "loading") return "Syncing";
  return "Live";
};

const QuizHistoryPanel: React.FC<Props> = ({
  analytics,
  analyticsStatus,
  analyticsErrorMessage,
  authStatus,
  authErrorMessage,
  isFirebaseEnabled,
  userId,
}) => {
  const accuracyLabel =
    analytics.stats.totalAnswered > 0
      ? `${analytics.stats.accuracy.toFixed(1)}%`
      : "No answers yet";

  return (
    <aside className={styles.panel}>
      <div className={styles.headingRow}>
        <div className={styles.titleBlock}>
          <h3 className={styles.title}>Lifetime Quiz History</h3>
          <p className={styles.subtitle}>Authenticated user: {formatUserLabel(userId)}</p>
        </div>
        <span className={`${styles.pill} ${statusToneClass(authStatus, analyticsStatus)}`}>
          {statusLabel(authStatus, analyticsStatus)}
        </span>
      </div>

      {!isFirebaseEnabled && (
        <p className={styles.message}>
          Firebase is not configured. Add the public Firebase keys to persist generated
          questions and answers across sessions.
        </p>
      )}

      {authErrorMessage && (
        <p className={`${styles.message} ${styles.messageError}`}>{authErrorMessage}</p>
      )}

      {analyticsErrorMessage && (
        <p className={`${styles.message} ${styles.messageError}`}>
          {analyticsErrorMessage}
        </p>
      )}

      {isFirebaseEnabled && (
        <>
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <p className={styles.statLabel}>Sessions</p>
              <p className={styles.statValue}>{analytics.stats.totalSessions}</p>
            </div>
            <div className={styles.statCard}>
              <p className={styles.statLabel}>Questions</p>
              <p className={styles.statValue}>
                {analytics.stats.totalQuestionsGenerated}
              </p>
            </div>
            <div className={styles.statCard}>
              <p className={styles.statLabel}>Accuracy</p>
              <p className={styles.statValue}>{accuracyLabel}</p>
            </div>
            <div className={styles.statCard}>
              <p className={styles.statLabel}>Timed Out</p>
              <p className={styles.statValue}>{analytics.stats.totalTimedOut}</p>
            </div>
          </div>

          <div className={styles.metaRow}>
            <span>Total answered: {analytics.stats.totalAnswered}</span>
            <span>Total correct: {analytics.stats.totalCorrect}</span>
            {analytics.stats.lastTopic && <span>Last topic: {analytics.stats.lastTopic}</span>}
          </div>

          <div className={styles.sessionList}>
            {analytics.recentSessions.length === 0 ? (
              <p className={styles.message}>
                Generate a quiz run and answer questions to build the reporting history.
              </p>
            ) : (
              analytics.recentSessions.map((session) => (
                <article key={session.id} className={styles.sessionCard}>
                  <div className={styles.sessionTopRow}>
                    <span className={styles.sessionMode}>{session.quizType}</span>
                    <span className={styles.sessionScore}>
                      {session.correctCount}/{session.answeredCount || session.questionCount}
                    </span>
                  </div>
                  <p className={styles.sessionTopic}>{session.topic}</p>
                  <div className={styles.sessionMeta}>
                    <span>Round {session.round}</span>
                    {session.timedOutCount > 0 && <span>{session.timedOutCount} timed out</span>}
                    <span>{session.source === "fallback" ? "Fallback set" : "OpenAI set"}</span>
                    <span>{formatTimestamp(session.startedAt)}</span>
                  </div>
                </article>
              ))
            )}
          </div>
        </>
      )}
    </aside>
  );
};

export default QuizHistoryPanel;
