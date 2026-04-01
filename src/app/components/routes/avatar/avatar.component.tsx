"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import styles from "./avatar.styles.module.css";

type Props = {
  topicOptions: string[];
};

type Position = {
  x: number;
  y: number;
};

type Bounds = {
  width: number;
  height: number;
};

type KeyState = Record<string, boolean>;

type Question = {
  id: number;
  statement: string;
  answer: boolean;
  explanation: string;
};

const AVATAR_SIZE = 72;
const WALK_SPEED_PX_PER_SECOND = 240;
const INTERACTION_RADIUS = 120;

const STATIONS = [
  { id: 1, xPercent: 16, yPercent: 62 },
  { id: 2, xPercent: 50, yPercent: 24 },
  { id: 3, xPercent: 82, yPercent: 62 },
] as const;

const QUESTIONS_PER_STATION = 2;
const QUESTION_COUNT = STATIONS.length * QUESTIONS_PER_STATION;

const MOVEMENT_KEYS = new Set([
  "w",
  "a",
  "s",
  "d",
  "arrowup",
  "arrowdown",
  "arrowleft",
  "arrowright",
]);

const DEFAULT_BOUNDS: Bounds = {
  width: 900,
  height: 520,
};

const FALLBACK_QUESTIONS: Question[] = [
  {
    id: 1,
    statement: "Using multi-factor authentication can reduce account takeover risk.",
    answer: true,
    explanation: "MFA adds an additional barrier even if a password is stolen.",
  },
  {
    id: 2,
    statement: "A strong password policy means everyone should share one team password.",
    answer: false,
    explanation: "Shared passwords remove accountability and increase breach impact.",
  },
  {
    id: 3,
    statement: "Unexpected urgent payment requests should be verified through a second channel.",
    answer: true,
    explanation: "Out-of-band verification helps stop phishing and impersonation fraud.",
  },
  {
    id: 4,
    statement: "Keeping software unpatched improves system stability and security.",
    answer: false,
    explanation: "Security patches close known vulnerabilities attackers actively exploit.",
  },
  {
    id: 5,
    statement: "Least privilege means users should only have access needed for their role.",
    answer: true,
    explanation: "Limiting access reduces blast radius if an account is compromised.",
  },
  {
    id: 6,
    statement: "Backups are unnecessary when files are stored in the cloud.",
    answer: false,
    explanation: "Independent backups protect against ransomware, deletion, and sync issues.",
  },
];

const clamp = (value: number, min: number, max: number): number => {
  return Math.min(max, Math.max(min, value));
};

const getDirection = (keys: KeyState): { dx: number; dy: number } => {
  let dx = 0;
  let dy = 0;

  if (keys.a || keys.arrowleft) dx -= 1;
  if (keys.d || keys.arrowright) dx += 1;
  if (keys.w || keys.arrowup) dy -= 1;
  if (keys.s || keys.arrowdown) dy += 1;

  return { dx, dy };
};

const isInteractiveTarget = (target: EventTarget | null): boolean => {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  if (target.isContentEditable) return true;
  return tag === "INPUT" || tag === "SELECT" || tag === "TEXTAREA" || tag === "BUTTON";
};

const centerPositionForBounds = (bounds: Bounds): Position => ({
  x: Math.max(0, (bounds.width - AVATAR_SIZE) / 2),
  y: Math.max(0, (bounds.height - AVATAR_SIZE) / 2),
});

const normalizeQuestions = (incoming: Question[]): Question[] => {
  const limited = incoming.slice(0, QUESTION_COUNT);
  if (limited.length === QUESTION_COUNT) {
    return limited;
  }

  const existing = new Set(limited.map((q) => q.id));
  const missingFallback = FALLBACK_QUESTIONS.filter((q) => !existing.has(q.id));

  return [...limited, ...missingFallback].slice(0, QUESTION_COUNT);
};

const AvatarDemo: React.FC<Props> = ({ topicOptions }) => {
  const [topic, setTopic] = useState(topicOptions[0] ?? "Phishing Awareness");
  const [questions, setQuestions] = useState<Question[]>(FALLBACK_QUESTIONS);
  const [answers, setAnswers] = useState<Record<number, boolean>>({});
  const [answerSelection, setAnswerSelection] = useState("");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const [position, setPosition] = useState<Position>(centerPositionForBounds(DEFAULT_BOUNDS));
  const [bounds, setBounds] = useState<Bounds>(DEFAULT_BOUNDS);
  const [pressedKeys, setPressedKeys] = useState<KeyState>({});
  const [facingLeft, setFacingLeft] = useState(false);
  const [pausedSrc, setPausedSrc] = useState<string | null>(null);

  const playfieldRef = useRef<HTMLDivElement | null>(null);
  const pressedKeysRef = useRef<KeyState>({});
  const boundsRef = useRef<Bounds>(DEFAULT_BOUNDS);
  const frameRef = useRef<number | null>(null);
  const lastTickRef = useRef<number | null>(null);

  const questionGroups = useMemo(() => {
    return STATIONS.map((_, index) => {
      const start = index * QUESTIONS_PER_STATION;
      return questions.slice(start, start + QUESTIONS_PER_STATION);
    });
  }, [questions]);

  const answeredCounts = useMemo(() => {
    return questionGroups.map((group) => group.filter((question) => question.id in answers).length);
  }, [questionGroups, answers]);

  const activeStationIndex = useMemo(() => {
    for (let index = 0; index < questionGroups.length; index += 1) {
      if (answeredCounts[index] < questionGroups[index].length) {
        return index;
      }
    }
    return questionGroups.length - 1;
  }, [questionGroups, answeredCounts]);

  const currentQuestion = useMemo(() => {
    const group = questionGroups[activeStationIndex] || [];
    return group.find((question) => !(question.id in answers)) ?? null;
  }, [questionGroups, activeStationIndex, answers]);

  const totalQuestions = questions.length;
  const answeredCount = Object.keys(answers).length;
  const score = useMemo(() => {
    return questions.reduce((total, question) => {
      return answers[question.id] === question.answer ? total + 1 : total;
    }, 0);
  }, [questions, answers]);

  const isComplete = totalQuestions > 0 && answeredCount === totalQuestions;

  const stationCenters = useMemo(() => {
    return STATIONS.map((station) => ({
      x: (station.xPercent / 100) * bounds.width,
      y: (station.yPercent / 100) * bounds.height,
    }));
  }, [bounds]);

  const avatarCenter = useMemo(
    () => ({
      x: position.x + AVATAR_SIZE / 2,
      y: position.y + AVATAR_SIZE / 2,
    }),
    [position],
  );

  const isNearActiveStation = useMemo(() => {
    if (isComplete || !currentQuestion) return false;
    const targetCenter = stationCenters[activeStationIndex];
    if (!targetCenter) return false;

    const distance = Math.hypot(
      avatarCenter.x - targetCenter.x,
      avatarCenter.y - targetCenter.y,
    );

    return distance <= INTERACTION_RADIUS;
  }, [activeStationIndex, avatarCenter, currentQuestion, isComplete, stationCenters]);

  const canSubmitAnswer = !isLoading && !isComplete && Boolean(currentQuestion) && isNearActiveStation;

  const loadQuestions = useCallback(async (selectedTopic: string) => {
    setIsLoading(true);
    setAnswers({});
    setAnswerSelection("");
    setStatusMessage(null);
    setPosition(centerPositionForBounds(boundsRef.current));

    try {
      const response = await fetch("/api/questions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          topic: selectedTopic,
          round: 1,
          count: QUESTION_COUNT,
        }),
      });

      const payload = (await response.json()) as {
        error?: string;
        questions?: Question[];
      };

      if (!response.ok) {
        throw new Error(payload.error || "Unable to generate questions for this run.");
      }

      if (!Array.isArray(payload.questions) || payload.questions.length === 0) {
        throw new Error("No questions were generated.");
      }

      setQuestions(normalizeQuestions(payload.questions));
      setStatusMessage("New run generated. Walk to Station 1 to begin.");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unexpected error while generating questions.";

      setQuestions(FALLBACK_QUESTIONS);
      setStatusMessage(`Using fallback questions: ${message}`);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    pressedKeysRef.current = pressedKeys;
  }, [pressedKeys]);

  useEffect(() => {
    boundsRef.current = bounds;
  }, [bounds]);

  useEffect(() => {
    const keyDownHandler = (event: KeyboardEvent) => {
      const normalizedKey = event.key.toLowerCase();
      if (!MOVEMENT_KEYS.has(normalizedKey)) return;
      if (isInteractiveTarget(event.target)) return;

      event.preventDefault();
      setPressedKeys((current) => {
        if (current[normalizedKey]) return current;
        return { ...current, [normalizedKey]: true };
      });
    };

    const keyUpHandler = (event: KeyboardEvent) => {
      const normalizedKey = event.key.toLowerCase();
      if (!MOVEMENT_KEYS.has(normalizedKey)) return;
      if (isInteractiveTarget(event.target)) return;

      event.preventDefault();
      setPressedKeys((current) => {
        if (!current[normalizedKey]) return current;
        const next = { ...current };
        delete next[normalizedKey];
        return next;
      });
    };

    const blurHandler = () => {
      setPressedKeys({});
      lastTickRef.current = null;
    };

    window.addEventListener("keydown", keyDownHandler);
    window.addEventListener("keyup", keyUpHandler);
    window.addEventListener("blur", blurHandler);

    return () => {
      window.removeEventListener("keydown", keyDownHandler);
      window.removeEventListener("keyup", keyUpHandler);
      window.removeEventListener("blur", blurHandler);
    };
  }, []);

  useEffect(() => {
    const updateBounds = () => {
      const node = playfieldRef.current;
      if (!node) return;

      const nextBounds: Bounds = {
        width: node.clientWidth,
        height: node.clientHeight,
      };

      setBounds(nextBounds);
      setPosition((current) => ({
        x: clamp(current.x, 0, Math.max(0, nextBounds.width - AVATAR_SIZE)),
        y: clamp(current.y, 0, Math.max(0, nextBounds.height - AVATAR_SIZE)),
      }));
    };

    updateBounds();

    let observer: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined" && playfieldRef.current) {
      observer = new ResizeObserver(updateBounds);
      observer.observe(playfieldRef.current);
    }

    window.addEventListener("resize", updateBounds);
    return () => {
      if (observer) observer.disconnect();
      window.removeEventListener("resize", updateBounds);
    };
  }, []);

  useEffect(() => {
    const animate = (timestamp: number) => {
      if (lastTickRef.current === null) {
        lastTickRef.current = timestamp;
      }

      const deltaSeconds = (timestamp - lastTickRef.current) / 1000;
      lastTickRef.current = timestamp;

      const { dx, dy } = getDirection(pressedKeysRef.current);
      if (dx !== 0 || dy !== 0) {
        setPosition((current) => {
          const magnitude = Math.hypot(dx, dy) || 1;
          const normalizedX = dx / magnitude;
          const normalizedY = dy / magnitude;
          const travelDistance = WALK_SPEED_PX_PER_SECOND * deltaSeconds;

          const maxX = Math.max(0, boundsRef.current.width - AVATAR_SIZE);
          const maxY = Math.max(0, boundsRef.current.height - AVATAR_SIZE);

          return {
            x: clamp(current.x + normalizedX * travelDistance, 0, maxX),
            y: clamp(current.y + normalizedY * travelDistance, 0, maxY),
          };
        });
      }

      frameRef.current = window.requestAnimationFrame(animate);
    };

    frameRef.current = window.requestAnimationFrame(animate);
    return () => {
      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const { dx } = getDirection(pressedKeys);
    if (dx < 0) setFacingLeft(true);
    if (dx > 0) setFacingLeft(false);
  }, [pressedKeys]);

  useEffect(() => {
    let cancelled = false;
    const image = new Image();
    image.src = "/avatar-walk.gif";

    image.onload = () => {
      if (cancelled) return;
      try {
        const canvas = document.createElement("canvas");
        canvas.width = image.naturalWidth;
        canvas.height = image.naturalHeight;
        const context = canvas.getContext("2d");
        if (!context) return;
        context.drawImage(image, 0, 0);
        setPausedSrc(canvas.toDataURL("image/png"));
      } catch (error) {
        console.error("Could not create paused avatar frame", error);
      }
    };

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    void loadQuestions(topic);
  }, [loadQuestions, topic]);

  const direction = useMemo(() => getDirection(pressedKeys), [pressedKeys]);
  const isMoving = direction.dx !== 0 || direction.dy !== 0;
  const avatarSource = isMoving ? "/avatar-walk.gif" : pausedSrc ?? "/avatar-walk.gif";

  const submitAnswer = () => {
    if (!currentQuestion) return;
    if (!canSubmitAnswer) {
      setStatusMessage(`Move closer to Station ${activeStationIndex + 1} to answer.`);
      return;
    }
    if (!answerSelection) {
      setStatusMessage("Select True or False before submitting.");
      return;
    }

    const userAnswer = answerSelection === "true";
    const isCorrect = userAnswer === currentQuestion.answer;

    setAnswers((current) => ({
      ...current,
      [currentQuestion.id]: userAnswer,
    }));
    setAnswerSelection("");
    setStatusMessage(`${isCorrect ? "Correct" : "Incorrect"}: ${currentQuestion.explanation}`);
  };

  return (
    <section className={styles.shell}>
      <h2 className={styles.title}>Avatar Cyber Walk Quiz</h2>
      <p className={styles.instructions}>
        Walk to each station, answer the question in the dropdown, then move to the next station.
      </p>

      <div className={styles.controlsRow}>
        <label className={styles.label}>
          Topic
          <select
            className={styles.topicSelect}
            value={topic}
            onChange={(event) => setTopic(event.target.value)}
            aria-label="Choose a cybersecurity topic"
          >
            {topicOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>

        <button
          type="button"
          className={styles.refreshButton}
          onClick={() => void loadQuestions(topic)}
          disabled={isLoading}
        >
          {isLoading ? "Generating..." : "Generate New Run"}
        </button>
      </div>

      <div className={styles.statusBar}>
        <span>Score: {score}/{totalQuestions}</span>
        <span>
          Progress: {answeredCount}/{totalQuestions}
        </span>
        <span>
          {isComplete
            ? "Run complete. Generate a new run to play again."
            : `Current station: ${activeStationIndex + 1}`}
        </span>
      </div>

      <div ref={playfieldRef} className={styles.playfield}>
        {STATIONS.map((station, index) => {
          const answered = answeredCounts[index] ?? 0;
          const total = questionGroups[index]?.length ?? 0;
          const isDone = total > 0 && answered >= total;
          const isActive = !isComplete && index === activeStationIndex;

          const stationClass = isDone
            ? styles.stationComplete
            : isActive
              ? styles.stationActive
              : styles.stationLocked;

          return (
            <div
              key={station.id}
              className={`${styles.station} ${stationClass}`}
              style={{
                left: `${station.xPercent}%`,
                top: `${station.yPercent}%`,
              }}
            >
              <div className={styles.stationTitle}>Station {station.id}</div>
              <div className={styles.stationMeta}>
                {answered}/{total} answered
              </div>
            </div>
          );
        })}

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={avatarSource}
          alt="Walking avatar"
          className={styles.avatar}
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scaleX(${facingLeft ? -1 : 1})`,
          }}
          draggable={false}
        />
      </div>

      <div className={styles.questionCard}>
        <h3 className={styles.questionTitle}>
          {currentQuestion
            ? `Station ${activeStationIndex + 1} Question`
            : "All questions answered"}
        </h3>

        <p className={styles.questionStatement}>
          {currentQuestion
            ? currentQuestion.statement
            : "Great run. Generate another set of questions to keep playing."}
        </p>

        <div className={styles.answerRow}>
          <select
            className={styles.answerSelect}
            value={answerSelection}
            onChange={(event) => setAnswerSelection(event.target.value)}
            disabled={!currentQuestion || !canSubmitAnswer}
            aria-label="Select true or false answer"
          >
            <option value="">Select answer...</option>
            <option value="true">True</option>
            <option value="false">False</option>
          </select>

          <button
            type="button"
            className={styles.submitButton}
            onClick={submitAnswer}
            disabled={!currentQuestion || !canSubmitAnswer}
          >
            Submit
          </button>
        </div>

        {!isComplete && !isNearActiveStation && (
          <p className={styles.helperText}>
            Move closer to Station {activeStationIndex + 1} to unlock the answer dropdown.
          </p>
        )}
        {statusMessage && <p className={styles.helperText}>{statusMessage}</p>}
      </div>
    </section>
  );
};

export default AvatarDemo;
