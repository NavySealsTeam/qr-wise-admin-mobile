import * as Device from 'expo-device';
import * as SecureStore from 'expo-secure-store';
import { User as FUser, onAuthStateChanged } from 'firebase/auth';
import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import { createContext, PropsWithChildren, useContext, useEffect, useMemo, useState } from 'react';
import { SharedValue, useSharedValue } from 'react-native-reanimated';
import { useFirestoreWrite } from '~/hooks/useFirestoreWrite';
import { registerForPushNotificationsAsync } from '~/hooks/useRegisterPushToken';
import { SESSION_KEY, SESSION_STORE_ID } from '~/lib/constants';
import { auth, db } from '~/lib/firebase';
import { getLast10Digits } from '~/lib/utils';
import { Store, User } from '~/types';

type AuthContextType = {
  fUser: FUser | null;
  user: User | null | undefined;
  setUser: (user: User | null | undefined) => void;
  loginUser: (user: User) => Promise<void>;
  logoutUser: () => Promise<void>;
  updateUser: (updates: Partial<User>) => Promise<void>;
  stores: Store[];
  store: Store | null;
  getStore: (storeId?: string) => Promise<void>;
  setStoreId: (storeId: string) => void;
  isPremiumUser: boolean;
  setIsPremiumUser: (isPremiumUser: boolean) => void;
  openSheet: SharedValue<boolean>;
  toggleSheet: () => void;
};

const AuthContext = createContext<AuthContextType>({
  fUser: null,
  user: null,
  setUser: () => {
    throw new Error();
  },
  loginUser: () => {
    throw new Error();
  },
  logoutUser: () => {
    throw new Error();
  },
  updateUser: () => {
    throw new Error();
  },
  stores: [],
  store: null,
  getStore: () => {
    throw new Error();
  },
  setStoreId: () => {
    throw new Error();
  },
  isPremiumUser: false,
  setIsPremiumUser: () => {
    throw new Error();
  },
  openSheet: {} as SharedValue<boolean>,
  toggleSheet: () => {
    throw new Error();
  },
});

export function AuthProvider({ children }: PropsWithChildren) {
  const { updateWithMeta } = useFirestoreWrite();

  const [fUser, setFUser] = useState<any>(null);
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [stores, setStores] = useState<Store[]>([]);
  const [store, setStore] = useState<Store | null>(null);
  const [storeId, setStoreId] = useState<string | null>(null);
  const [isPremiumUser, setIsPremiumUser] = useState<boolean>(false);

  const openSheet = useSharedValue<boolean>(false);

  useEffect(() => {
    getStores();
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('🔥 Firebase auth state changed:', user);

      setFUser(user || null);

      if (user) {
        await registerDevice(user.phoneNumber!);
      } else if (user === null) {
        await logoutUser();
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (stores.length === 0) return;

    const checkStore = async () => {
      const storeId = await SecureStore.getItemAsync(SESSION_STORE_ID);
      if (storeId) {
        setStoreId(storeId);
      } else {
        setStoreId(stores[0].id!);
        await SecureStore.setItemAsync(SESSION_STORE_ID, stores[0].id!);
      }
    };

    const checkSession = async () => {
      try {
        const session = await SecureStore.getItemAsync(SESSION_KEY);
        if (session) {
          const userData = JSON.parse(session);
          setUser(userData);
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('Session check failed:', error);
        setUser(null);
      }
    };

    checkStore();
    checkSession();
  }, [stores]);

  useEffect(() => {
    if (!storeId) return;
    getStore();
  }, [storeId]);

  async function getStores() {
    const querySnapshot = await getDocs(collection(db, 'stores'));
    const stores = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Store[];
    setStores(stores);
  }

  async function getStore(id?: string) {
    const storeSnapshot = await getDoc(doc(db, 'stores', id || storeId!));
    if (storeSnapshot.exists()) {
      setStore({
        id: storeSnapshot.id,
        ...storeSnapshot.data(),
      } as Store);
    }
  }

  async function loginUser(user: User) {
    await SecureStore.setItemAsync(SESSION_KEY, JSON.stringify(user));
    setUser(user);
  }

  async function logoutUser() {
    await auth.signOut();
    await SecureStore.deleteItemAsync(SESSION_KEY);
    setUser(null);
  }

  async function updateUser(updates: Partial<User>) {
    const stored = await SecureStore.getItemAsync(SESSION_KEY);
    if (!stored) {
      throw new Error('No user data found');
    }

    const currentUser = JSON.parse(stored);
    const updatedUser = { ...currentUser, ...updates };

    await SecureStore.setItemAsync(SESSION_KEY, JSON.stringify(updatedUser));
    setUser(updatedUser);
  }

  const registerDevice = async (phone: string) => {
    if (!Device.isDevice) {
      console.log('⚠️ Must use a physical device for Push Notifications.');
      return;
    }

    try {
      const token = await registerForPushNotificationsAsync();
      if (!token) return;

      const q = query(collection(db, 'managers-pin'), where('phone', '==', getLast10Digits(phone)));
      const querySnapshot = await getDocs(q);
      if (querySnapshot.empty) {
        console.log('❌ No matching user document found for push token registration.');
        return;
      }

      const ref = querySnapshot.docs[0].ref;
      const data = querySnapshot.docs[0].data();

      if (data.deviceToken === token) {
        console.log('ℹ️ Device already registered with this push token.');
        return;
      }

      await updateWithMeta(ref, {
        deviceToken: token,
      });
      updateUser({ deviceToken: token });
      console.log('✅ Device registered with push token.');
    } catch (err) {
      console.error('❌ Error registering device:', err);
    }
  };

  const toggleSheet = () => {
    openSheet.value = !openSheet.value;
  };

  const value = useMemo(
    () => ({
      fUser,
      user,
      setUser,
      loginUser,
      logoutUser,
      updateUser,
      stores,
      store,
      getStore,
      setStoreId,
      isPremiumUser,
      setIsPremiumUser,
      openSheet,
      toggleSheet,
    }),
    [fUser, user, store, isPremiumUser, openSheet],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
