"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import styles from "./avatar.styles.module.css";

const AVATAR_SIZE = 72;
const WALK_SPEED_PX_PER_SECOND = 240;

type Position = {
  x: number;
  y: number;
};

type Bounds = {
  width: number;
  height: number;
};

type KeyState = Record<string, boolean>;

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

const AvatarDemo: React.FC = () => {
  const [position, setPosition] = useState<Position>({
    x: (DEFAULT_BOUNDS.width - AVATAR_SIZE) / 2,
    y: (DEFAULT_BOUNDS.height - AVATAR_SIZE) / 2,
  });
  const [bounds, setBounds] = useState<Bounds>(DEFAULT_BOUNDS);
  const [pressedKeys, setPressedKeys] = useState<KeyState>({});
  const [facingLeft, setFacingLeft] = useState(false);
  const [pausedSrc, setPausedSrc] = useState<string | null>(null);

  const playfieldRef = useRef<HTMLDivElement | null>(null);
  const pressedKeysRef = useRef<KeyState>({});
  const boundsRef = useRef<Bounds>(DEFAULT_BOUNDS);
  const frameRef = useRef<number | null>(null);
  const lastTickRef = useRef<number | null>(null);

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

      event.preventDefault();
      setPressedKeys((current) => {
        if (current[normalizedKey]) return current;
        return { ...current, [normalizedKey]: true };
      });
    };

    const keyUpHandler = (event: KeyboardEvent) => {
      const normalizedKey = event.key.toLowerCase();
      if (!MOVEMENT_KEYS.has(normalizedKey)) return;

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
      if (observer) {
        observer.disconnect();
      }
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

  const direction = useMemo(() => getDirection(pressedKeys), [pressedKeys]);
  const isMoving = direction.dx !== 0 || direction.dy !== 0;
  const avatarSource = isMoving ? "/avatar-walk.gif" : pausedSrc ?? "/avatar-walk.gif";

  return (
    <section className={styles.shell}>
      <h2 className={styles.title}>Avatar Movement Demo</h2>
      <p className={styles.instructions}>
        Use <strong>W/A/S/D</strong> or arrow keys to move the avatar around the playfield.
      </p>

      <div ref={playfieldRef} className={styles.playfield}>
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
    </section>
  );
};

export default AvatarDemo;

