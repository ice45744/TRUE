import { useState, useCallback, useEffect } from "react";
import {
  getDocument,
  getDocuments,
  setDocument,
  addDocument,
  updateDocument,
  deleteDocument,
} from "@/lib/firebaseUtils";
import { QueryConstraint } from "firebase/firestore";

export function useFirestoreDocument<T>(collectionName: string, docId: string | null) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!docId) return;
    setLoading(true);
    setError(null);
    const result = await getDocument<T>(collectionName, docId);
    setData(result);
    setLoading(false);
  }, [collectionName, docId]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  const updateData = useCallback(
    async (newData: Partial<T>) => {
      if (!docId) return false;
      const success = await updateDocument(collectionName, docId, newData);
      if (success) {
        setData((prev) => (prev ? { ...prev, ...newData } : null));
      }
      return success;
    },
    [collectionName, docId]
  );

  const deleteData = useCallback(async () => {
    if (!docId) return false;
    const success = await deleteDocument(collectionName, docId);
    if (success) {
      setData(null);
    }
    return success;
  }, [collectionName, docId]);

  return { data, loading, error, updateData, deleteData, refetch: fetch };
}

export function useFirestoreCollection<T>(
  collectionName: string,
  ...constraints: QueryConstraint[]
) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    const result = await getDocuments<T>(collectionName, ...constraints);
    setData(result);
    setLoading(false);
  }, [collectionName, constraints]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  const addData = useCallback(
    async (newData: T) => {
      const id = await addDocument(collectionName, newData);
      if (id) {
        setData((prev) => [...prev, { ...newData, id } as T]);
        return id;
      }
      return null;
    },
    [collectionName]
  );

  return { data, loading, error, addData, refetch: fetch };
}
