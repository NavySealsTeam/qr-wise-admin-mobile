import {
  addDoc,
  CollectionReference,
  DocumentData,
  DocumentReference,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore';
import { useAuth } from '~/context/AuthUserContext';

export function useFirestoreWrite() {
  const { user, store } = useAuth();

  const addWithMeta = async (reference: CollectionReference<DocumentData, DocumentData>, data: Record<string, any>) => {
    const merged = {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      createdBy: user,
      storeId: store?.id,
      apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
    };
    return await addDoc(reference, merged);
  };

  const updateWithMeta = async (
    reference: DocumentReference<DocumentData, DocumentData>,
    data: Record<string, any>,
  ) => {
    const merged = {
      ...data,
      updatedAt: serverTimestamp(),
      updatedBy: user,
      apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
    };
    await updateDoc(reference, merged);
  };

  const withMeta = (data: Record<string, any>) => ({
    ...data,
    updatedAt: serverTimestamp(),
    updatedBy: user,
    apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  });

  return { addWithMeta, updateWithMeta, withMeta };
}
