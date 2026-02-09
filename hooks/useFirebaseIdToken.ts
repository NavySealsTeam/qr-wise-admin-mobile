import { onIdTokenChanged, User } from 'firebase/auth';
import { useEffect, useState } from 'react';
import { auth } from '~/lib/firebase';

type UseFirebaseIdTokenOptions = {
  onToken?: (token: string | null, user: User | null) => void;
};

export function useFirebaseIdToken(options?: UseFirebaseIdTokenOptions) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onIdTokenChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);

      if (!firebaseUser) {
        setToken(null);
        setLoading(false);
        options?.onToken?.(null, null);
        return;
      }

      try {
        const newToken = await firebaseUser.getIdToken();
        setToken(newToken);
        options?.onToken?.(newToken, firebaseUser);
      } catch (err) {
        console.error('Failed to get ID token', err);
        setToken(null);
      }

      setLoading(false);
    });

    return () => unsub();
  }, []);

  return { token, user, loading };
}
