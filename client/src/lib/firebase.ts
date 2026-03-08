import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyBHZHX-Mw8rikfAuA7XnqBO1As6x0wZ_9I",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "council-4b6d2.firebaseapp.com",
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || "https://council-4b6d2-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "council-4b6d2",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "council-4b6d2.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "644298343852",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:644298343852:web:4ff79baa7f199c5358a609",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-4M1N1G3Y49",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const realtimeDb = getDatabase(app);

export default app;
