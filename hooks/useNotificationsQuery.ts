import { useQuery } from '@tanstack/react-query';
import { collection, getDocs, orderBy, query, QueryConstraint, where } from 'firebase/firestore';
import { useAuth } from '~/context/AuthUserContext';
import { db } from '~/lib/firebase';
import { Note } from '~/types';

const fetchNotifications = async ({ storeId }: { storeId: string }) => {
  const queryConstraints: QueryConstraint[] = [where('storeId', '==', storeId), orderBy('timestamp', 'desc')];

  const q = query(collection(db, 'notifications'), ...queryConstraints);
  const querySnapshot = await getDocs(q);

  const notifications = await Promise.all(
    querySnapshot.docs.map(async (docSnap) => {
      const notificationData = { ...docSnap.data(), id: docSnap.id } as Note;
      return notificationData;
    }),
  );

  return notifications;
};

export const useNotificationsQuery = (key: string) => {
  const { store } = useAuth();

  return useQuery({
    queryKey: [key, store?.id],
    queryFn: () => fetchNotifications({ storeId: store?.id! }),
    enabled: !!store?.id, // Only run if store is available
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};
