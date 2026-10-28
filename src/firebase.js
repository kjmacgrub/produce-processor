import { initializeApp } from "firebase/app";
import { getDatabase, ref } from "firebase/database";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
export const storage = getStorage(app);

// Optional Realtime Database namespace. When VITE_DB_ROOT is set (e.g. "sandbox"
// in a git-ignored .env.local), every database path the app touches lives under
// that root — `sandbox/items`, `sandbox/completedItems`, … — so a local build can
// be exercised freely without reading or writing the production tree.
// Production builds leave it unset and use the bare paths as before.
// Storage (videos, CSVs) is NOT namespaced: the sandbox reads the same media.
export const DB_ROOT = (import.meta.env.VITE_DB_ROOT || '').replace(/^\/+|\/+$/g, '');

// Drop-in for `ref(db, path)` / `ref(db)` that applies the namespace.
// Paths starting with "." (e.g. ".info/connected") are Firebase-internal and
// are never prefixed.
export const dbRef = (path) => {
  if (path === undefined || path === null || path === '') return DB_ROOT ? ref(db, DB_ROOT) : ref(db);
  if (path.startsWith('.') || !DB_ROOT) return ref(db, path);
  return ref(db, `${DB_ROOT}/${path}`);
};
