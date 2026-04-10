import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const readEnvString = (value: string | undefined): string | null => {
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
};

const apiKey = readEnvString(process.env.NEXT_PUBLIC_FIREBASE_API_KEY);
const authDomain = readEnvString(process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN);
const projectId = readEnvString(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID);
const appId = readEnvString(process.env.NEXT_PUBLIC_FIREBASE_APP_ID);
const storageBucket = readEnvString(process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET);
const messagingSenderId = readEnvString(
  process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
);
const measurementId = readEnvString(process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID);

export const isFirebaseConfigured = Boolean(apiKey && authDomain && projectId && appId);

const firebaseConfig = isFirebaseConfigured
  ? {
      apiKey: apiKey as string,
      authDomain: authDomain as string,
      projectId: projectId as string,
      appId: appId as string,
      ...(storageBucket ? { storageBucket } : {}),
      ...(messagingSenderId ? { messagingSenderId } : {}),
      ...(measurementId ? { measurementId } : {}),
    }
  : null;

const firebaseApp = firebaseConfig
  ? getApps().length > 0
    ? getApp()
    : initializeApp(firebaseConfig)
  : null;

export const firebaseAuth = firebaseApp ? getAuth(firebaseApp) : null;
export const firebaseDb = firebaseApp ? getFirestore(firebaseApp) : null;
