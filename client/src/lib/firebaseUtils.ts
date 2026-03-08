import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  setDoc,
  updateDoc,
  deleteDoc,
  addDoc,
  Query,
  QueryConstraint,
} from "firebase/firestore";
import {
  uploadBytes,
  getDownloadURL,
  ref,
  deleteObject,
} from "firebase/storage";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
} from "firebase/auth";
import { db, storage, auth } from "./firebase";

// Firestore utility functions
export async function getDocument<T>(collectionName: string, docId: string): Promise<T | null> {
  try {
    const docRef = doc(db, collectionName, docId);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? (docSnap.data() as T) : null;
  } catch (error) {
    console.error(`Error getting document from ${collectionName}:`, error);
    return null;
  }
}

export async function getDocuments<T>(collectionName: string, ...constraints: QueryConstraint[]): Promise<T[]> {
  try {
    const q = query(collection(db, collectionName), ...constraints);
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({ ...doc.data(), id: doc.id } as T));
  } catch (error) {
    console.error(`Error getting documents from ${collectionName}:`, error);
    return [];
  }
}

export async function setDocument<T>(collectionName: string, docId: string, data: T): Promise<boolean> {
  try {
    const docRef = doc(db, collectionName, docId);
    await setDoc(docRef, data);
    console.log(`Document set in ${collectionName}/${docId}`);
    return true;
  } catch (error) {
    console.error(`Error setting document in ${collectionName}:`, error);
    return false;
  }
}

export async function addDocument<T>(collectionName: string, data: T): Promise<string | null> {
  try {
    const docRef = await addDoc(collection(db, collectionName), data);
    console.log(`Document added to ${collectionName} with ID: ${docRef.id}`);
    return docRef.id;
  } catch (error) {
    console.error(`Error adding document to ${collectionName}:`, error);
    return null;
  }
}

export async function updateDocument<T>(collectionName: string, docId: string, data: Partial<T>): Promise<boolean> {
  try {
    const docRef = doc(db, collectionName, docId);
    await updateDoc(docRef, data as any);
    console.log(`Document updated in ${collectionName}/${docId}`);
    return true;
  } catch (error) {
    console.error(`Error updating document in ${collectionName}:`, error);
    return false;
  }
}

export async function deleteDocument(collectionName: string, docId: string): Promise<boolean> {
  try {
    const docRef = doc(db, collectionName, docId);
    await deleteDoc(docRef);
    console.log(`Document deleted from ${collectionName}/${docId}`);
    return true;
  } catch (error) {
    console.error(`Error deleting document from ${collectionName}:`, error);
    return false;
  }
}

// Storage utility functions
export async function uploadFile(file: File, path: string): Promise<string | null> {
  try {
    const storageRef = ref(storage, path);
    await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(storageRef);
    console.log(`File uploaded to ${path}:`, downloadURL);
    return downloadURL;
  } catch (error) {
    console.error(`Error uploading file to ${path}:`, error);
    return null;
  }
}

export async function deleteFile(path: string): Promise<boolean> {
  try {
    const fileRef = ref(storage, path);
    await deleteObject(fileRef);
    console.log(`File deleted from ${path}`);
    return true;
  } catch (error) {
    console.error(`Error deleting file from ${path}:`, error);
    return false;
  }
}

// Auth utility functions
export async function registerWithEmail(email: string, password: string): Promise<User | null> {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    console.log(`User registered: ${userCredential.user.email}`);
    return userCredential.user;
  } catch (error) {
    console.error("Error registering user:", error);
    return null;
  }
}

export async function signInWithEmail(email: string, password: string): Promise<User | null> {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    console.log(`User signed in: ${userCredential.user.email}`);
    return userCredential.user;
  } catch (error) {
    console.error("Error signing in:", error);
    return null;
  }
}

export async function signOutUser(): Promise<boolean> {
  try {
    await signOut(auth);
    console.log("User signed out");
    return true;
  } catch (error) {
    console.error("Error signing out:", error);
    return false;
  }
}

export function subscribeToAuthState(callback: (user: User | null) => void) {
  const unsubscribe = onAuthStateChanged(auth, callback);
  return unsubscribe;
}
