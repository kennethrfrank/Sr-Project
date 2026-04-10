import { onAuthStateChanged, signInAnonymously, type User } from "firebase/auth";
import { doc, onSnapshot, serverTimestamp, setDoc } from "firebase/firestore";
import { firebaseAuth, firestoreDb, isFirebaseConfigured } from "./config";

export type ProjectProgressRecord = {
  currentFocus: string;
  openAiQuestionsReady: boolean;
  firebaseIntegrationStarted: boolean;
  spriteSystemPlanned: boolean;
  notes: string;
  updatedAt?: unknown;
};

export const defaultProjectProgress: ProjectProgressRecord = {
  currentFocus: "AI quiz experience and platform polish",
  openAiQuestionsReady: true,
  firebaseIntegrationStarted: true,
  spriteSystemPlanned: true,
  notes: "Firebase is live, the AI question route is in place, and the interface is being polished toward the final presentation build.",
};

async function ensureAnonymousUser(): Promise<User> {
  if (!isFirebaseConfigured || !firebaseAuth) {
    throw new Error("Firebase is not configured yet.");
  }

  if (firebaseAuth.currentUser) {
    return firebaseAuth.currentUser;
  }

  const credential = await signInAnonymously(firebaseAuth);
  return credential.user;
}

function buildProgressDocRef(uid: string) {
  if (!firestoreDb) {
    throw new Error("Firestore is not available.");
  }

  return doc(firestoreDb, "users", uid, "projectProgress", "midterm-demo");
}

export async function saveProjectProgress(progress: ProjectProgressRecord) {
  const user = await ensureAnonymousUser();
  const progressRef = buildProgressDocRef(user.uid);

  await setDoc(
    progressRef,
    {
      ...progress,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );

  return user;
}

export function subscribeToProjectProgress(
  onData: (progress: ProjectProgressRecord | null) => void,
  onError?: (error: Error) => void,
) {
  if (!isFirebaseConfigured || !firebaseAuth || !firestoreDb) {
    onData(null);
    return () => {};
  }

  let unsubscribeSnapshot: () => void = () => {};

  const unsubscribeAuth = onAuthStateChanged(
    firebaseAuth,
    async (user) => {
      try {
        const activeUser = user ?? (await ensureAnonymousUser());
        const progressRef = buildProgressDocRef(activeUser.uid);

        unsubscribeSnapshot();
        unsubscribeSnapshot = onSnapshot(
          progressRef,
          (snapshot) => {
            if (!snapshot.exists()) {
              onData(null);
              return;
            }

            onData(snapshot.data() as ProjectProgressRecord);
          },
          (error) => onError?.(error as Error),
        );
      } catch (error) {
        onError?.(error as Error);
      }
    },
    (error) => onError?.(error as Error),
  );

  return () => {
    unsubscribeSnapshot();
    unsubscribeAuth();
  };
}
