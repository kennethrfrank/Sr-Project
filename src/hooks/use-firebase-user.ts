"use client";

import {
  GoogleAuthProvider,
  getRedirectResult,
  linkWithPopup,
  linkWithRedirect,
  onAuthStateChanged,
  signInAnonymously,
  signInWithPopup,
  signInWithRedirect,
  signOut,
  updateProfile,
  type User,
} from "firebase/auth";
import { useEffect, useState } from "react";

import { firebaseAuth, isFirebaseConfigured } from "@/lib/firebase/firebase-client";
import { ensureUserRecord } from "@/lib/firebase/quiz-history";

export type FirebaseAuthStatus =
  | "loading"
  | "ready"
  | "signed_out"
  | "disabled"
  | "error";

export type FirebaseAccountKind =
  | "signed-out"
  | "anonymous"
  | "pseudo-anonymous"
  | "google";

type FirebaseAccount = {
  uid: string | null;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  kind: FirebaseAccountKind;
};

const EMPTY_ACCOUNT: FirebaseAccount = {
  uid: null,
  displayName: null,
  email: null,
  photoURL: null,
  kind: "signed-out",
};

const buildAccount = (user: User | null): FirebaseAccount => {
  if (!user) {
    return EMPTY_ACCOUNT;
  }

  const displayName = user.displayName?.trim() || null;
  const providerIds = user.providerData.map((provider) => provider.providerId);
  const isGoogle = providerIds.includes("google.com");
  const kind: FirebaseAccountKind = isGoogle
    ? "google"
    : user.isAnonymous
      ? displayName
        ? "pseudo-anonymous"
        : "anonymous"
      : "signed-out";

  return {
    uid: user.uid,
    displayName,
    email: user.email || null,
    photoURL: user.photoURL || null,
    kind,
  };
};

const createGoogleProvider = () => {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  return provider;
};

const shouldUseRedirect = () => {
  if (typeof window === "undefined") {
    return false;
  }

  return (
    window.matchMedia("(pointer: coarse)").matches ||
    window.matchMedia("(max-width: 820px)").matches
  );
};

export const useFirebaseUser = () => {
  const [account, setAccount] = useState<FirebaseAccount>(EMPTY_ACCOUNT);
  const [status, setStatus] = useState<FirebaseAuthStatus>(
    isFirebaseConfigured ? "loading" : "disabled",
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  useEffect(() => {
    if (!firebaseAuth || !isFirebaseConfigured) {
      return;
    }

    const auth = firebaseAuth;

    void getRedirectResult(auth).catch((error) => {
      console.error("Firebase redirect sign-in failed", error);
      setErrorMessage("Google sign-in could not be completed.");
      setStatus("error");
      setIsBusy(false);
    });

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setIsBusy(false);

      if (!currentUser) {
        setAccount(EMPTY_ACCOUNT);
        setStatus("signed_out");
        return;
      }

      try {
        await ensureUserRecord(currentUser);
        setErrorMessage(null);
      } catch (error) {
        console.error("Failed to bootstrap Firestore user record", error);
        setErrorMessage("Firebase auth succeeded, but Firestore setup failed.");
      }

      setAccount(buildAccount(currentUser));
      setStatus("ready");
    });

    return () => unsubscribe();
  }, []);

  const continueAsGuest = async (alias?: string): Promise<boolean> => {
    if (!firebaseAuth || !isFirebaseConfigured) {
      return false;
    }

    const trimmedAlias = alias?.trim() || "";

    setIsBusy(true);
    setErrorMessage(null);

    try {
      let activeUser = firebaseAuth.currentUser;

      if (!activeUser) {
        const credential = await signInAnonymously(firebaseAuth);
        activeUser = credential.user;
      }

      if (!activeUser.isAnonymous) {
        throw new Error("Sign out before switching to an anonymous session.");
      }

      if (trimmedAlias && activeUser.displayName !== trimmedAlias) {
        await updateProfile(activeUser, { displayName: trimmedAlias });
      }

      await ensureUserRecord(activeUser);
      setAccount(buildAccount(activeUser));
      setStatus("ready");
      return true;
    } catch (error) {
      console.error("Anonymous Firebase sign-in failed", error);
      setErrorMessage(
        error instanceof Error ? error.message : "Anonymous sign-in failed.",
      );
      setStatus("error");
      return false;
    } finally {
      setIsBusy(false);
    }
  };

  const signInWithGoogleAccount = async (): Promise<boolean> => {
    if (!firebaseAuth || !isFirebaseConfigured) {
      return false;
    }

    const provider = createGoogleProvider();
    const preferRedirect = shouldUseRedirect();

    setIsBusy(true);
    setErrorMessage(null);

    try {
      const activeUser = firebaseAuth.currentUser;

      if (activeUser?.isAnonymous) {
        if (preferRedirect) {
          await linkWithRedirect(activeUser, provider);
          return true;
        }

        const result = await linkWithPopup(activeUser, provider);
        await ensureUserRecord(result.user);
        setAccount(buildAccount(result.user));
        setStatus("ready");
        setIsBusy(false);
        return true;
      }

      if (preferRedirect) {
        await signInWithRedirect(firebaseAuth, provider);
        return true;
      }

      const result = await signInWithPopup(firebaseAuth, provider);
      await ensureUserRecord(result.user);
      setAccount(buildAccount(result.user));
      setStatus("ready");
      setIsBusy(false);
      return true;
    } catch (error) {
      console.error("Google Firebase sign-in failed", error);
      setErrorMessage(error instanceof Error ? error.message : "Google sign-in failed.");
      setStatus("error");
      setIsBusy(false);
      return false;
    }

    setIsBusy(false);
    return false;
  };

  const signOutUser = async (): Promise<boolean> => {
    if (!firebaseAuth || !isFirebaseConfigured) {
      return false;
    }

    setIsBusy(true);
    setErrorMessage(null);

    try {
      await signOut(firebaseAuth);
      setAccount(EMPTY_ACCOUNT);
      setStatus("signed_out");
      return true;
    } catch (error) {
      console.error("Firebase sign-out failed", error);
      setErrorMessage(error instanceof Error ? error.message : "Sign-out failed.");
      setStatus("error");
      return false;
    } finally {
      setIsBusy(false);
    }
  };

  const accountLabel =
    account.kind === "google"
      ? account.displayName || account.email || "Google User"
      : account.kind === "pseudo-anonymous"
        ? account.displayName || "Alias User"
        : account.kind === "anonymous"
          ? "Anonymous User"
          : "Not Signed In";

  return {
    userId: account.uid,
    account,
    accountLabel,
    status,
    errorMessage,
    isBusy,
    isEnabled: isFirebaseConfigured,
    continueAsGuest,
    signInWithGoogle: signInWithGoogleAccount,
    signOutUser,
  };
};
