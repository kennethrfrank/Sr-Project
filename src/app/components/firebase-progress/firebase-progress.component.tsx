"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "./firebase-progress.styles.module.css";
import {
  defaultProjectProgress,
  saveProjectProgress,
  subscribeToProjectProgress,
  type ProjectProgressRecord,
} from "@/lib/firebase/progress";
import { isFirebaseConfigured } from "@/lib/firebase/config";

const FirebaseProgressPanel = () => {
  const [form, setForm] = useState<ProjectProgressRecord>(defaultProjectProgress);
  const [savedRecord, setSavedRecord] = useState<ProjectProgressRecord | null>(null);
  const [status, setStatus] = useState("Firebase not connected yet.");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeToProjectProgress(
      (progress) => {
        if (progress) {
          setSavedRecord(progress);
          setForm({
            currentFocus: progress.currentFocus || defaultProjectProgress.currentFocus,
            openAiQuestionsReady: Boolean(progress.openAiQuestionsReady),
            firebaseIntegrationStarted: Boolean(progress.firebaseIntegrationStarted),
            spriteSystemPlanned: Boolean(progress.spriteSystemPlanned),
            notes: progress.notes || "",
          });
          setStatus("Connected to Firestore. Live progress is syncing.");
          return;
        }

        setStatus(
          isFirebaseConfigured
            ? "Firebase is configured. Save once to create the first project record."
            : "Add your Firebase env variables to enable saving."
        );
      },
      (error) => setStatus(error.message)
    );

    return unsubscribe;
  }, []);

  const completionText = useMemo(() => {
    const milestones = [form.openAiQuestionsReady, form.firebaseIntegrationStarted, form.spriteSystemPlanned];
    const completed = milestones.filter(Boolean).length;
    return `${completed}/3 milestones flagged`;
  }, [form]);

  const updateBoolean = (key: "openAiQuestionsReady" | "firebaseIntegrationStarted" | "spriteSystemPlanned") => {
    setForm((current) => ({
      ...current,
      [key]: !current[key],
    }));
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await saveProjectProgress(form);
      setStatus("Progress saved to Firebase successfully.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to save project progress.";
      setStatus(message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section className={styles.panel}>
      <div className={styles.headerRow}>
        <div>
          <p className={styles.eyebrow}>Firebase integration</p>
          <h3 className={styles.title}>Progress tracking and backend status</h3>
        </div>
        <span className={isFirebaseConfigured ? styles.badgeReady : styles.badgePending}>
          {isFirebaseConfigured ? "Configured" : "Missing env vars"}
        </span>
      </div>

      <p className={styles.description}>
        This panel shows that Firebase is no longer just planned. It stores project status data in Firestore and can be extended next to support saved quiz results, user sessions, and learning history.
      </p>

      <div className={styles.grid}>
        <label className={styles.field}>
          <span>Current focus</span>
          <input
            value={form.currentFocus}
            onChange={(event) => setForm((current) => ({ ...current, currentFocus: event.target.value }))}
            placeholder="Firebase integration"
          />
        </label>

        <label className={styles.field}>
          <span>Project notes</span>
          <textarea
            value={form.notes}
            onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
            placeholder="What is finished, what is being tested, and what comes next?"
            rows={5}
          />
        </label>
      </div>

      <div className={styles.checkboxRow}>
        <label>
          <input type="checkbox" checked={form.openAiQuestionsReady} onChange={() => updateBoolean("openAiQuestionsReady")} />
          AI question generation implemented
        </label>
        <label>
          <input type="checkbox" checked={form.firebaseIntegrationStarted} onChange={() => updateBoolean("firebaseIntegrationStarted")} />
          Firebase integration implemented
        </label>
        <label>
          <input type="checkbox" checked={form.spriteSystemPlanned} onChange={() => updateBoolean("spriteSystemPlanned")} />
          Sprite system planned
        </label>
      </div>

      <div className={styles.footerRow}>
        <div>
          <p className={styles.status}>{status}</p>
          <p className={styles.meta}>Current completion: {completionText}</p>
          {savedRecord?.updatedAt ? <p className={styles.meta}>A Firestore record has been created for this demo.</p> : null}
        </div>
        <button className={styles.saveButton} onClick={handleSave} disabled={!isFirebaseConfigured || isSaving} type="button">
          {isSaving ? "Saving..." : "Save progress to Firebase"}
        </button>
      </div>
    </section>
  );
};

export default FirebaseProgressPanel;
