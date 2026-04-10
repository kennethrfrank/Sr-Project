"use client";

import React, { useMemo, useState } from "react";

import type {
  FirebaseAccountKind,
  FirebaseAuthStatus,
} from "@/hooks/use-firebase-user";

import styles from "./logo-tag-site-starter.styles.module.css";
import type { ViewKey } from "../routes/home/app.component";

type PlatformLink = {
  label: string;
  href: string;
};

type AuthControls = {
  accountKind: FirebaseAccountKind;
  accountLabel: string;
  authStatus: FirebaseAuthStatus;
  email: string | null;
  errorMessage: string | null;
  isBusy: boolean;
  isEnabled: boolean;
  photoURL: string | null;
  continueAsGuest: (alias?: string) => Promise<boolean>;
  signInWithGoogle: () => Promise<boolean>;
  signOutUser: () => Promise<boolean>;
};

type Props = {
  logoLabel?: string;
  tagline: string;
  platformLinks: PlatformLink[];
  teamContactHref: string;
  onNavigate: (view: ViewKey) => void;
  auth: AuthControls;
};

const accountTone = (kind: FirebaseAccountKind, status: FirebaseAuthStatus) => {
  if (status === "error") return styles.accountError;
  if (status === "disabled") return styles.accountDisabled;
  if (kind === "google") return styles.accountGoogle;
  if (kind === "pseudo-anonymous") return styles.accountAlias;
  if (kind === "anonymous") return styles.accountAnonymous;
  return styles.accountSignedOut;
};

const accountModeLabel = (kind: FirebaseAccountKind, status: FirebaseAuthStatus) => {
  if (status === "loading") return "Checking session";
  if (status === "disabled") return "Auth offline";
  if (status === "error") return "Auth issue";
  if (kind === "google") return "Google";
  if (kind === "pseudo-anonymous") return "Alias";
  if (kind === "anonymous") return "Anonymous";
  return "Sign in";
};

const LogoTagSiteStarter: React.FC<Props> = ({
  logoLabel = "TSU Cyber Edu",
  tagline,
  platformLinks,
  teamContactHref,
  onNavigate,
  auth,
}) => {
  const [isAuthPanelOpen, setIsAuthPanelOpen] = useState(false);
  const [aliasInput, setAliasInput] = useState("");

  const authButtonLabel = useMemo(() => {
    if (auth.authStatus === "loading") return "Connecting...";
    if (auth.accountKind === "google") return auth.accountLabel;
    if (auth.accountKind === "pseudo-anonymous") return auth.accountLabel;
    if (auth.accountKind === "anonymous") return "Anonymous";
    return "Login";
  }, [auth.accountKind, auth.accountLabel, auth.authStatus]);

  const guestButtonLabel =
    auth.accountKind === "anonymous" || auth.accountKind === "pseudo-anonymous"
      ? aliasInput.trim()
        ? "Save Alias"
        : "Stay Anonymous"
      : aliasInput.trim()
        ? "Login With Alias"
        : "Continue Anonymous";

  const authHint =
    auth.accountKind === "google"
      ? auth.email || "Google account linked"
      : auth.accountKind === "pseudo-anonymous"
        ? "Anonymous Firebase account with a saved alias"
        : auth.accountKind === "anonymous"
          ? "Anonymous Firebase account"
          : "Choose a guest alias or use Google";

  const onGuestSubmit = async () => {
    const nextAlias =
      aliasInput.trim() ||
      (auth.accountKind === "pseudo-anonymous" ? auth.accountLabel : undefined);

    const didSignIn = await auth.continueAsGuest(nextAlias);
    if (!didSignIn) return;

    setAliasInput("");
    setIsAuthPanelOpen(false);
  };

  const onGoogleSubmit = async () => {
    const didStartOrComplete = await auth.signInWithGoogle();
    if (!didStartOrComplete) return;

    setIsAuthPanelOpen(false);
  };

  const onSignOut = async () => {
    const didSignOut = await auth.signOutUser();
    if (!didSignOut) return;

    setAliasInput("");
    setIsAuthPanelOpen(false);
  };

  return (
    <header className={styles.shell}>
      <div className={styles.topRow}>
        <button
          className={styles.brandButton}
          onClick={() => onNavigate("home")}
          type="button"
        >
          <span className={styles.logoText}>{logoLabel}</span>
          <span className={styles.tagline}>{tagline}</span>
        </button>

        <div className={styles.controlCluster}>
          <button
            className={`${styles.accountButton} ${accountTone(
              auth.accountKind,
              auth.authStatus,
            )}`}
            aria-expanded={isAuthPanelOpen}
            onClick={() => setIsAuthPanelOpen((current) => !current)}
            type="button"
          >
            <span className={styles.accountMode}>
              {accountModeLabel(auth.accountKind, auth.authStatus)}
            </span>
            <span className={styles.accountLabel}>{authButtonLabel}</span>
          </button>
        </div>
      </div>

      <div className={styles.bottomRow}>
        <div className={styles.linkScroller}>
          {platformLinks.map((link) => (
            <a
              key={link.href}
              className={styles.smallLink}
              href={link.href}
              rel="noopener noreferrer"
              target="_blank"
            >
              {link.label}
            </a>
          ))}
          <a className={styles.contactLink} href={teamContactHref}>
            Email Team
          </a>
        </div>
      </div>

      {isAuthPanelOpen && (
        <div className={styles.authPanel}>
          <div className={styles.authSummary}>
            <div>
              <p className={styles.authTitle}>Account Access</p>
              <p className={styles.authHint}>{authHint}</p>
            </div>
            {auth.photoURL ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                alt={auth.accountLabel}
                className={styles.accountAvatar}
                src={auth.photoURL}
              />
            ) : (
              <div className={styles.accountBadge}>
                {auth.accountLabel.slice(0, 1).toUpperCase()}
              </div>
            )}
          </div>

          <div className={styles.authGrid}>
            <label className={styles.aliasLabel}>
              Alias
              <input
                className={styles.aliasInput}
                disabled={
                  auth.isBusy || auth.authStatus === "disabled" || auth.accountKind === "google"
                }
                onChange={(event) => setAliasInput(event.target.value)}
                placeholder={
                  auth.accountKind === "pseudo-anonymous"
                    ? auth.accountLabel
                    : "Enter a guest username"
                }
                value={aliasInput}
              />
            </label>

            <div className={styles.authActions}>
              <button
                className={styles.primaryAuthButton}
                disabled={
                  auth.isBusy ||
                  auth.authStatus === "disabled" ||
                  auth.accountKind === "google"
                }
                onClick={() => void onGuestSubmit()}
                type="button"
              >
                {auth.isBusy ? "Working..." : guestButtonLabel}
              </button>

              <button
                className={styles.secondaryAuthButton}
                disabled={
                  auth.isBusy ||
                  auth.authStatus === "disabled" ||
                  auth.accountKind === "google"
                }
                onClick={() => void onGoogleSubmit()}
                type="button"
              >
                {auth.accountKind === "google" ? "Google Linked" : "Sign In With Google"}
              </button>

              {auth.accountKind !== "signed-out" && (
                <button
                  className={styles.ghostAuthButton}
                  disabled={auth.isBusy || auth.authStatus === "disabled"}
                  onClick={() => void onSignOut()}
                  type="button"
                >
                  Sign Out
                </button>
              )}
            </div>
          </div>

          {auth.errorMessage && <p className={styles.authError}>{auth.errorMessage}</p>}
        </div>
      )}
    </header>
  );
};

export default LogoTagSiteStarter;
