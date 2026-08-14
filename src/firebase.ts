import { initializeApp } from "firebase/app";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  confirmPasswordReset,
  verifyPasswordResetCode,
  applyActionCode,
  checkActionCode,
  signOut,
  onAuthStateChanged,
  reload,
  GoogleAuthProvider,
  signInWithPopup,
  User as FirebaseUser
} from "firebase/auth";
import {
  getFirestore,
  setLogLevel,
  doc,
  setDoc,
  getDoc,
  getDocFromServer,
  updateDoc,
  onSnapshot,
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy
} from "firebase/firestore";

// Set Firestore log level to quiet offline reconnection warnings
try {
  setLogLevel("silent");
} catch {
  // ignore
}
import {
  getStorage,
  ref,
  uploadBytes,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
  listAll
} from "firebase/storage";
import {
  getFunctions,
  httpsCallable
} from "firebase/functions";
import firebaseConfig from "../firebase-applet-config.json";

const dummyConfig = {
  apiKey: "AIzaSyDummyKeyDisconnected",
  projectId: "disconnected-app",
  appId: "1:000000000000:web:0000000000000000000000",
  authDomain: "disconnected-app.firebaseapp.com",
  storageBucket: "disconnected-app.appspot.com",
  messagingSenderId: "000000000000",
};

// Resolve config prioritizing environment variables (VITE_FIREBASE_*)
const getEnv = (key: string) => {
  if (typeof import.meta !== "undefined" && import.meta && import.meta.env && import.meta.env[key]) {
    return import.meta.env[key];
  }
  if (typeof process !== "undefined" && process.env && process.env[key]) {
    return process.env[key];
  }
  return undefined;
};

const activeFirebaseConfig = {
  ...dummyConfig,
  ...firebaseConfig,
  apiKey: getEnv("VITE_FIREBASE_API_KEY") || firebaseConfig.apiKey || dummyConfig.apiKey,
  projectId: getEnv("VITE_FIREBASE_PROJECT_ID") || firebaseConfig.projectId || dummyConfig.projectId,
  appId: getEnv("VITE_FIREBASE_APP_ID") || firebaseConfig.appId || dummyConfig.appId,
  authDomain: getEnv("VITE_FIREBASE_AUTH_DOMAIN") || firebaseConfig.authDomain || dummyConfig.authDomain,
  firestoreDatabaseId: getEnv("VITE_FIREBASE_DATABASE_ID") || firebaseConfig.firestoreDatabaseId || "(default)",
  storageBucket: getEnv("VITE_FIREBASE_STORAGE_BUCKET") || firebaseConfig.storageBucket || dummyConfig.storageBucket,
  messagingSenderId: getEnv("VITE_FIREBASE_MESSAGING_SENDER_ID") || firebaseConfig.messagingSenderId || dummyConfig.messagingSenderId,
};

// Initialize Firebase App
export const firebaseApp = initializeApp(activeFirebaseConfig);

// Initialize Services
export const auth = getAuth(firebaseApp);
export const db = activeFirebaseConfig.firestoreDatabaseId && activeFirebaseConfig.firestoreDatabaseId !== "(default)"
  ? getFirestore(firebaseApp, activeFirebaseConfig.firestoreDatabaseId)
  : getFirestore(firebaseApp);
export const storage = getStorage(firebaseApp);
export const functions = getFunctions(firebaseApp);

/**
 * Check if Firebase is fully configured with real API credentials
 */
export const isFirebaseConfigured = Boolean(
  activeFirebaseConfig.apiKey &&
  !activeFirebaseConfig.apiKey.includes("Dummy") &&
  activeFirebaseConfig.apiKey.trim().length > 10 &&
  activeFirebaseConfig.projectId &&
  activeFirebaseConfig.appId
);

/**
 * Executes a promise with a fast fallback timeout to prevent UI hanging on slow network or unconfigured Firebase
 */
export function withTimeout<T>(promise: Promise<T>, timeoutMs: number = 2000): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error("FIREBASE_TIMEOUT")), timeoutMs)
    )
  ]);
}

/**
 * Uploads a file to Firebase Cloud Storage with automatic base64 fallback
 */
export async function uploadFileToStorage(
  storagePath: string,
  file: File | Blob
): Promise<string> {
  try {
    const storageRef = ref(storage, storagePath);
    const snapshot = await uploadBytes(storageRef, file);
    const downloadUrl = await getDownloadURL(snapshot.ref);
    return downloadUrl;
  } catch (error) {
    console.warn("Firebase Storage upload fallback to base64 Data URL:", error);
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }
}

/**
 * Calls a Firebase Cloud Function with fallback handling
 */
export async function callCloudFunction<TData = any, TResult = any>(
  functionName: string,
  data?: TData
): Promise<TResult> {
  try {
    const fn = httpsCallable<TData, TResult>(functions, functionName);
    const result = await fn(data);
    return result.data;
  } catch (error) {
    console.error(`Error calling Cloud Function '${functionName}':`, error);
    throw error;
  }
}

export {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  confirmPasswordReset,
  verifyPasswordResetCode,
  applyActionCode,
  checkActionCode,
  signOut,
  onAuthStateChanged,
  reload,
  GoogleAuthProvider,
  signInWithPopup,
  doc,
  setDoc,
  getDoc,
  getDocFromServer,
  updateDoc,
  onSnapshot,
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  ref,
  uploadBytes,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
  listAll,
  httpsCallable
};
export type { FirebaseUser };

