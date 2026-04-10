"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  MIN_SESSION_DURATION_MS,
  createQuizSession,
  recordQuestionResponse,
  recordTimedOutQuestions,
  type QuizSource,
} from "@/lib/firebase/quiz-history";

import styles from "./avatar.styles.module.css";

type Props = {
  topicOptions: string[];
  userId: string | null;
  historyPanel: React.ReactNode;
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
  stationId?: number;
};
type PendingSession = {
  topic: string;
  round: number;
  questions: Question[];
  source: QuizSource;
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
const STATION_TIME_LIMIT_MS = 60_000;
const TARGET_STOP_DISTANCE_PX = 8;

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

const formatSeconds = (milliseconds: number): string => {
  return `${Math.max(0, Math.ceil(milliseconds / 1000))}s`;
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
    return limited.map((question, index) => ({
      ...question,
      stationId: STATIONS[Math.floor(index / QUESTIONS_PER_STATION)]?.id ?? question.stationId,
    }));
  }

  const existing = new Set(limited.map((q) => q.id));
  const missingFallback = FALLBACK_QUESTIONS.filter((q) => !existing.has(q.id));

  return [...limited, ...missingFallback].slice(0, QUESTION_COUNT).map((question, index) => ({
    ...question,
    stationId: STATIONS[Math.floor(index / QUESTIONS_PER_STATION)]?.id ?? question.stationId,
  }));
};

const AvatarDemo: React.FC<Props> = ({ topicOptions, userId, historyPanel }) => {
  const [topic, setTopic] = useState(topicOptions[0] ?? "Phishing Awareness");
  const [questions, setQuestions] = useState<Question[]>(() =>
    normalizeQuestions(FALLBACK_QUESTIONS),
  );
  const [answers, setAnswers] = useState<Record<number, boolean>>({});
  const [answerSelection, setAnswerSelection] = useState("");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [pendingSession, setPendingSession] = useState<PendingSession | null>(null);
  const [sessionStartedAtMs, setSessionStartedAtMs] = useState<number | null>(null);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [stationTimeLeftMs, setStationTimeLeftMs] = useState<number[]>(
    STATIONS.map(() => STATION_TIME_LIMIT_MS),
  );
  const [timedOutQuestionIds, setTimedOutQuestionIds] = useState<number[]>([]);
  const [timedOutStationIds, setTimedOutStationIds] = useState<number[]>([]);
  const [moveTarget, setMoveTarget] = useState<Position | null>(null);

  const [position, setPosition] = useState<Position>(centerPositionForBounds(DEFAULT_BOUNDS));
  const [bounds, setBounds] = useState<Bounds>(DEFAULT_BOUNDS);
  const [pressedKeys, setPressedKeys] = useState<KeyState>({});
  const [facingLeft, setFacingLeft] = useState(false);
  const [pausedSrc, setPausedSrc] = useState<string | null>(null);

  const playfieldRef = useRef<HTMLDivElement | null>(null);
  const questionsRef = useRef<Question[]>(normalizeQuestions(FALLBACK_QUESTIONS));
  const answersRef = useRef<Record<number, boolean>>({});
  const pendingSessionRef = useRef<PendingSession | null>(null);
  const currentSessionIdRef = useRef<string | null>(null);
  const sessionStartedAtRef = useRef<number | null>(null);
  const timedOutQuestionIdsRef = useRef<number[]>([]);
  const timedOutStationIdsRef = useRef<number[]>([]);
  const persistedAnswerIdsRef = useRef<Set<number>>(new Set());
  const persistedTimedOutIdsRef = useRef<Set<number>>(new Set());
  const answerSyncInFlightRef = useRef(false);
  const timeoutSyncInFlightRef = useRef(false);
  const sessionCreateInFlightRef = useRef(false);
  const positionRef = useRef<Position>(centerPositionForBounds(DEFAULT_BOUNDS));
  const pressedKeysRef = useRef<KeyState>({});
  const boundsRef = useRef<Bounds>(DEFAULT_BOUNDS);
  const moveTargetRef = useRef<Position | null>(null);
  const frameRef = useRef<number | null>(null);
  const lastTickRef = useRef<number | null>(null);
  const stationTimerRef = useRef<number | null>(null);

  const questionGroups = useMemo(() => {
    return STATIONS.map((_, index) => {
      const start = index * QUESTIONS_PER_STATION;
      return questions.slice(start, start + QUESTIONS_PER_STATION);
    });
  }, [questions]);

  const timedOutQuestionIdSet = useMemo(() => new Set(timedOutQuestionIds), [timedOutQuestionIds]);
  const timedOutStationIdSet = useMemo(() => new Set(timedOutStationIds), [timedOutStationIds]);

  const answeredCounts = useMemo(() => {
    return questionGroups.map((group) => group.filter((question) => question.id in answers).length);
  }, [questionGroups, answers]);

  const timedOutCounts = useMemo(() => {
    return questionGroups.map(
      (group) => group.filter((question) => timedOutQuestionIdSet.has(question.id)).length,
    );
  }, [questionGroups, timedOutQuestionIdSet]);

  const activeStationIndex = useMemo(() => {
    for (let index = 0; index < questionGroups.length; index += 1) {
      if (timedOutStationIdSet.has(STATIONS[index].id)) {
        continue;
      }

      if (answeredCounts[index] + timedOutCounts[index] < questionGroups[index].length) {
        return index;
      }
    }
    return -1;
  }, [answeredCounts, questionGroups, timedOutCounts, timedOutStationIdSet]);

  const currentQuestion = useMemo(() => {
    if (activeStationIndex < 0) return null;
    const group = questionGroups[activeStationIndex] || [];
    return (
      group.find(
        (question) => !(question.id in answers) && !timedOutQuestionIdSet.has(question.id),
      ) ?? null
    );
  }, [questionGroups, activeStationIndex, answers, timedOutQuestionIdSet]);

  const totalQuestions = questions.length;
  const answeredCount = Object.keys(answers).length;
  const timedOutCount = timedOutQuestionIds.length;
  const score = useMemo(() => {
    return questions.reduce((total, question) => {
      return answers[question.id] === question.answer ? total + 1 : total;
    }, 0);
  }, [questions, answers]);

  const resolvedQuestionCount = answeredCount + timedOutCount;
  const isGameOver = timedOutStationIds.length === STATIONS.length;
  const isRunResolved = totalQuestions > 0 && resolvedQuestionCount === totalQuestions;

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
    if (activeStationIndex < 0 || isRunResolved || !currentQuestion) return false;
    const targetCenter = stationCenters[activeStationIndex];
    if (!targetCenter) return false;

    const distance = Math.hypot(
      avatarCenter.x - targetCenter.x,
      avatarCenter.y - targetCenter.y,
    );

    return distance <= INTERACTION_RADIUS;
  }, [activeStationIndex, avatarCenter, currentQuestion, isRunResolved, stationCenters]);

  const canSubmitAnswer =
    !isLoading &&
    !isRunResolved &&
    !isGameOver &&
    Boolean(currentQuestion) &&
    isNearActiveStation &&
    activeStationIndex >= 0 &&
    stationTimeLeftMs[activeStationIndex] > 0;
  const activeStationId = activeStationIndex >= 0 ? STATIONS[activeStationIndex].id : null;

  useEffect(() => {
    questionsRef.current = questions;
  }, [questions]);

  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  useEffect(() => {
    pendingSessionRef.current = pendingSession;
  }, [pendingSession]);

  useEffect(() => {
    currentSessionIdRef.current = currentSessionId;
  }, [currentSessionId]);

  useEffect(() => {
    sessionStartedAtRef.current = sessionStartedAtMs;
  }, [sessionStartedAtMs]);

  useEffect(() => {
    timedOutQuestionIdsRef.current = timedOutQuestionIds;
  }, [timedOutQuestionIds]);

  useEffect(() => {
    timedOutStationIdsRef.current = timedOutStationIds;
  }, [timedOutStationIds]);

  const syncUnsavedAvatarAnswers = useCallback(async (sessionId: string, actorUserId: string) => {
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
        const sessionResolved =
          nextAnsweredCount + timedOutQuestionIdsRef.current.length >= questionsRef.current.length;

        await recordQuestionResponse({
          userId: actorUserId,
          sessionId,
          question,
          userAnswer: answersRef.current[question.id],
          questionCount: questionsRef.current.length,
          nextAnsweredCount,
          sessionResolved,
        });

        persistedAnswerIdsRef.current.add(question.id);
      }

      setSyncMessage(null);
    } catch (error) {
      console.error("Failed to persist avatar quiz answer", error);
      setSyncMessage("The latest answer stayed local because Firebase sync failed.");
    } finally {
      answerSyncInFlightRef.current = false;
    }
  }, []);

  const syncUnsavedAvatarTimeouts = useCallback(async (sessionId: string, actorUserId: string) => {
    if (timeoutSyncInFlightRef.current) {
      return;
    }

    const timedOutIdSet = new Set(timedOutQuestionIdsRef.current);
    const unsavedTimedOutQuestions = questionsRef.current.filter(
      (question) =>
        timedOutIdSet.has(question.id) && !persistedTimedOutIdsRef.current.has(question.id),
    );

    if (unsavedTimedOutQuestions.length === 0) {
      return;
    }

    timeoutSyncInFlightRef.current = true;

    try {
      const sessionResolved =
        Object.keys(answersRef.current).length + timedOutQuestionIdsRef.current.length >=
        questionsRef.current.length;
      const gameOver = timedOutStationIdsRef.current.length === STATIONS.length;

      await recordTimedOutQuestions({
        userId: actorUserId,
        sessionId,
        questions: unsavedTimedOutQuestions,
        sessionResolved,
        gameOver,
      });

      for (const question of unsavedTimedOutQuestions) {
        persistedTimedOutIdsRef.current.add(question.id);
      }

      setSyncMessage(null);
    } catch (error) {
      console.error("Failed to persist timed out avatar questions", error);
      setSyncMessage("Timed-out questions stayed local because Firebase sync failed.");
    } finally {
      timeoutSyncInFlightRef.current = false;
    }
  }, []);

  const persistQualifiedAvatarSession = useCallback(async () => {
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
        quizType: "avatar",
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
      await syncUnsavedAvatarAnswers(sessionId, userId);
      await syncUnsavedAvatarTimeouts(sessionId, userId);
      setSyncMessage(null);
    } catch (error) {
      console.error("Failed to persist avatar quiz session", error);
      currentSessionIdRef.current = null;
      setCurrentSessionId(null);
      setSyncMessage("Firebase could not save this run. Local gameplay remains available.");
    } finally {
      sessionCreateInFlightRef.current = false;
    }
  }, [syncUnsavedAvatarAnswers, syncUnsavedAvatarTimeouts, userId]);

  useEffect(() => {
    if (!userId || !pendingSession || currentSessionId) {
      return;
    }

    void persistQualifiedAvatarSession();

    const intervalId = window.setInterval(() => {
      void persistQualifiedAvatarSession();
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [currentSessionId, pendingSession, persistQualifiedAvatarSession, userId]);

  const loadQuestions = useCallback(async (selectedTopic: string) => {
    setIsLoading(true);
    setAnswers({});
    setAnswerSelection("");
    setStatusMessage(null);
    setPosition(centerPositionForBounds(boundsRef.current));
    setCurrentSessionId(null);
    setPendingSession(null);
    setSessionStartedAtMs(null);
    setSyncMessage(null);
    setStationTimeLeftMs(STATIONS.map(() => STATION_TIME_LIMIT_MS));
    setTimedOutQuestionIds([]);
    setTimedOutStationIds([]);
    setMoveTarget(null);
    answersRef.current = {};
    pendingSessionRef.current = null;
    currentSessionIdRef.current = null;
    sessionStartedAtRef.current = null;
    timedOutQuestionIdsRef.current = [];
    timedOutStationIdsRef.current = [];
    persistedAnswerIdsRef.current = new Set();
    persistedTimedOutIdsRef.current = new Set();

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

      const normalizedQuestions = normalizeQuestions(payload.questions);

      setQuestions(normalizedQuestions);
      questionsRef.current = normalizedQuestions;
      setSessionStartedAtMs(Date.now());
      setPendingSession({
        topic: selectedTopic,
        round: 1,
        questions: normalizedQuestions,
        source: "openai",
      });
      setStatusMessage("New run generated. Walk to Station 1 to begin.");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unexpected error while generating questions.";

      const fallbackQuestions = normalizeQuestions(FALLBACK_QUESTIONS);

      setQuestions(fallbackQuestions);
      questionsRef.current = fallbackQuestions;
      setSessionStartedAtMs(Date.now());
      setPendingSession({
        topic: selectedTopic,
        round: 1,
        questions: fallbackQuestions,
        source: "fallback",
      });
      setStatusMessage(`Using fallback questions: ${message}`);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    pressedKeysRef.current = pressedKeys;
  }, [pressedKeys]);

  useEffect(() => {
    positionRef.current = position;
  }, [position]);

  useEffect(() => {
    moveTargetRef.current = moveTarget;
  }, [moveTarget]);

  useEffect(() => {
    boundsRef.current = bounds;
  }, [bounds]);

  useEffect(() => {
    const keyDownHandler = (event: KeyboardEvent) => {
      const normalizedKey = event.key.toLowerCase();
      if (!MOVEMENT_KEYS.has(normalizedKey)) return;
      if (isInteractiveTarget(event.target)) return;

      event.preventDefault();
      setMoveTarget(null);
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
      setMoveTarget(null);
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
      const target = moveTargetRef.current;

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
      } else if (target) {
        const distanceToTarget = Math.hypot(
          target.x - positionRef.current.x,
          target.y - positionRef.current.y,
        );

        if (distanceToTarget <= TARGET_STOP_DISTANCE_PX) {
          setPosition(target);
          setMoveTarget(null);
        } else {
          setPosition((current) => {
            const deltaX = target.x - current.x;
            const deltaY = target.y - current.y;
            const distance = Math.hypot(deltaX, deltaY);
            const travelDistance = WALK_SPEED_PX_PER_SECOND * deltaSeconds;
            const normalizedX = deltaX / distance;
            const normalizedY = deltaY / distance;
            const maxX = Math.max(0, boundsRef.current.width - AVATAR_SIZE);
            const maxY = Math.max(0, boundsRef.current.height - AVATAR_SIZE);

            return {
              x: clamp(current.x + normalizedX * travelDistance, 0, maxX),
              y: clamp(current.y + normalizedY * travelDistance, 0, maxY),
            };
          });
        }
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
    if (dx < 0) {
      setFacingLeft(true);
      return;
    }

    if (dx > 0) {
      setFacingLeft(false);
      return;
    }

    if (moveTarget) {
      if (moveTarget.x < position.x) setFacingLeft(true);
      if (moveTarget.x > position.x) setFacingLeft(false);
    }
  }, [moveTarget, position.x, pressedKeys]);

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

  useEffect(() => {
    if (
      isLoading ||
      isRunResolved ||
      isGameOver ||
      activeStationIndex < 0 ||
      !isNearActiveStation ||
      timedOutStationIdSet.has(STATIONS[activeStationIndex].id)
    ) {
      stationTimerRef.current = null;
      return;
    }

    stationTimerRef.current = performance.now();

    const intervalId = window.setInterval(() => {
      const now = performance.now();
      const lastTick = stationTimerRef.current ?? now;
      const delta = now - lastTick;
      stationTimerRef.current = now;

      setStationTimeLeftMs((current) => {
        const next = [...current];
        next[activeStationIndex] = Math.max(0, next[activeStationIndex] - delta);
        return next;
      });
    }, 120);

    return () => {
      window.clearInterval(intervalId);
      stationTimerRef.current = null;
    };
  }, [
    activeStationIndex,
    isGameOver,
    isLoading,
    isNearActiveStation,
    isRunResolved,
    timedOutStationIdSet,
  ]);

  useEffect(() => {
    if (activeStationIndex < 0 || activeStationId === null) {
      return;
    }

    if (timedOutStationIdSet.has(activeStationId)) {
      return;
    }

    if (stationTimeLeftMs[activeStationIndex] > 0) {
      return;
    }

    const unansweredQuestions = (questionGroups[activeStationIndex] || []).filter(
      (question) => !(question.id in answers) && !timedOutQuestionIdSet.has(question.id),
    );

    if (unansweredQuestions.length === 0) {
      return;
    }

    const nextTimedOutStationIds = Array.from(
      new Set([...timedOutStationIds, activeStationId]),
    );
    const nextTimedOutQuestionIds = Array.from(
      new Set([
        ...timedOutQuestionIds,
        ...unansweredQuestions.map((question) => question.id),
      ]),
    );
    const gameOver = nextTimedOutStationIds.length === STATIONS.length;

    timedOutStationIdsRef.current = nextTimedOutStationIds;
    timedOutQuestionIdsRef.current = nextTimedOutQuestionIds;
    setTimedOutStationIds(nextTimedOutStationIds);
    setTimedOutQuestionIds(nextTimedOutQuestionIds);

    if (gameOver) {
      setStatusMessage("Game over. All three station timers expired.");
    } else {
      setStatusMessage(
        `Station ${activeStationId} timed out. ${unansweredQuestions.length} unanswered question${
          unansweredQuestions.length === 1 ? "" : "s"
        } recorded.`,
      );
    }

    if (!userId) {
      return;
    }

    if (currentSessionIdRef.current) {
      void syncUnsavedAvatarTimeouts(currentSessionIdRef.current, userId);
      return;
    }

    void persistQualifiedAvatarSession();
  }, [
    activeStationId,
    activeStationIndex,
    answeredCount,
    answers,
    persistQualifiedAvatarSession,
    questionGroups,
    stationTimeLeftMs,
    syncUnsavedAvatarTimeouts,
    timedOutQuestionIdSet,
    timedOutQuestionIds,
    timedOutStationIdSet,
    timedOutStationIds,
    userId,
  ]);

  const direction = useMemo(() => getDirection(pressedKeys), [pressedKeys]);
  const isMoving = direction.dx !== 0 || direction.dy !== 0 || moveTarget !== null;
  const avatarSource = isMoving ? "/avatar-walk.gif" : pausedSrc ?? "/avatar-walk.gif";
  const sessionTrackingMessage = currentSessionId
    ? "This run now qualifies for Firebase reporting."
    : sessionStartedAtMs
      ? "This run will only be saved after 10 seconds of active session time."
      : "Generate a run to begin a reportable session.";

  const onPlayfieldPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "mouse" && event.button !== 0) {
      return;
    }

    event.preventDefault();

    const boundsNode = playfieldRef.current;
    if (!boundsNode) return;

    const rect = boundsNode.getBoundingClientRect();
    const maxX = Math.max(0, bounds.width - AVATAR_SIZE);
    const maxY = Math.max(0, bounds.height - AVATAR_SIZE);
    const nextTarget = {
      x: clamp(event.clientX - rect.left - AVATAR_SIZE / 2, 0, maxX),
      y: clamp(event.clientY - rect.top - AVATAR_SIZE / 2, 0, maxY),
    };

    setPressedKeys({});
    setMoveTarget(nextTarget);
  };

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

    answersRef.current = {
      ...answersRef.current,
      [currentQuestion.id]: userAnswer,
    };
    setAnswers((current) => ({
      ...current,
      [currentQuestion.id]: userAnswer,
    }));
    setAnswerSelection("");
    setStatusMessage(`${isCorrect ? "Correct" : "Incorrect"}: ${currentQuestion.explanation}`);

    if (!userId) {
      return;
    }

    if (currentSessionIdRef.current) {
      void syncUnsavedAvatarAnswers(currentSessionIdRef.current, userId);
      return;
    }

    void persistQualifiedAvatarSession();
  };

  return (
    <section className={styles.shell}>
      <h2 className={styles.title}>Avatar Cyber Walk Quiz</h2>
      <p className={styles.instructions}>
        Use WASD, arrow keys, or tap the playfield to move. Each station has 60 seconds of
        active time while your avatar is inside its radius.
      </p>
      <p className={styles.instructions}>{sessionTrackingMessage}</p>

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
          Progress: {resolvedQuestionCount}/{totalQuestions}
        </span>
        <span>Timed out: {timedOutCount}</span>
        <span>
          {isGameOver
            ? "Game over."
            : isRunResolved
              ? "Run complete."
              : activeStationId
                ? `Current station: ${activeStationId}`
                : "No active station"}
        </span>
      </div>

      <div
        ref={playfieldRef}
        className={styles.playfield}
        onPointerDown={onPlayfieldPointerDown}
      >
        {STATIONS.map((station, index) => {
          const answered = answeredCounts[index] ?? 0;
          const total = questionGroups[index]?.length ?? 0;
          const timedOut = timedOutCounts[index] ?? 0;
          const isDone = total > 0 && answered + timedOut >= total;
          const isTimedOut = timedOutStationIdSet.has(station.id);
          const isActive = !isRunResolved && !isGameOver && index === activeStationIndex;

          const stationClass = isTimedOut
            ? styles.stationTimedOut
            : isDone
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
                {answered}/{total} answered | {formatSeconds(stationTimeLeftMs[index] ?? 0)}
              </div>
              {timedOut > 0 && (
                <div className={styles.stationMeta}>
                  {timedOut} timed out
                </div>
              )}
              {isTimedOut && (
                <div className={styles.stationMeta}>
                  Locked
                </div>
              )}
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
            : isGameOver
              ? "Game Over"
              : isRunResolved
                ? "Run Complete"
                : "Awaiting Station Access"}
        </h3>

        <p className={styles.questionStatement}>
          {currentQuestion
            ? currentQuestion.statement
            : isGameOver
              ? "Every station timer expired. Generate another set to try again."
              : isRunResolved
                ? "Great run. Generate another set of questions to keep playing."
                : "Move into the active station radius to continue the run."}
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

        {!isRunResolved && activeStationId !== null && !isNearActiveStation && (
          <p className={styles.helperText}>
            Move closer to Station {activeStationId} to unlock the answer dropdown.
          </p>
        )}
        {statusMessage && <p className={styles.helperText}>{statusMessage}</p>}
        {syncMessage && <p className={`${styles.helperText} ${styles.syncWarning}`}>{syncMessage}</p>}
      </div>

      {historyPanel}
    </section>
  );
};

export default AvatarDemo;
