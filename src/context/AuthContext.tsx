import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { isFirebaseConfigured } from '../firebase';
import { isSuperadminRole } from '../constants/accessControl';
import {
  logOut,
  refreshAppUser,
  signInWithEmail,
  subscribeToAuth,
  type AppUser,
} from '../services/auth';

interface AuthContextValue {
  user: AppUser | null;
  loading: boolean;
  firebaseReady: boolean;
  isSuperadmin: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const firebaseReady = isFirebaseConfigured();

  useEffect(() => {
    if (!firebaseReady) {
      setUser(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = subscribeToAuth((nextUser) => {
      setUser(nextUser);
      setLoading(false);
    });
    return unsubscribe;
  }, [firebaseReady]);

  const signIn = useCallback(async (email: string, password: string) => {
    const nextUser = await signInWithEmail(email, password);
    setUser(nextUser);
  }, []);

  const logout = useCallback(async () => {
    await logOut();
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    if (!user) return;
    const updated = await refreshAppUser(user.uid);
    if (updated) setUser(updated);
  }, [user]);

  const isSuperadmin = user ? isSuperadminRole(user.role) : false;

  const value = useMemo(
    () => ({
      user,
      loading,
      firebaseReady,
      isSuperadmin,
      signIn,
      logout,
      refreshUser,
    }),
    [user, loading, firebaseReady, isSuperadmin, signIn, logout, refreshUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
