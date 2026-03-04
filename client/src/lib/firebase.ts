import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyCGnKFR-bmf4t0xXb53iOgp8mHB6RkIOeg",
  authDomain: "student-council-d3c27.firebaseapp.com",
  projectId: "student-council-d3c27",
  storageBucket: "student-council-d3c27.firebasestorage.app",
  messagingSenderId: "766262044382",
  appId: "1:766262044382:web:d86c252ca307a51580844f"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;
