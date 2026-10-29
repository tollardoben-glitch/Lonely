import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';

import { api } from '@/data/api';
import type { Profile } from '@/data/types';

type SessionState = {
  loading: boolean;
  userId: string | null;
  profile: Profile | null;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
};

const SessionContext = createContext<SessionState | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);

  const loadProfile = useCallback(async (id: string | null) => {
    try {
      setProfile(id ? await api.getProfile(id) : null);
    } catch {
      setProfile(null);
    }
  }, []);

  useEffect(() => {
    let active = true;
    const handle = async (id: string | null) => {
      await loadProfile(id);
      if (!active) return;
      setUserId(id);
      setLoading(false);
    };
    api.getUserId().then(handle, () => handle(null));
    const unsubscribe = api.onAuthChange((id) => void handle(id));
    return () => {
      active = false;
      unsubscribe();
    };
  }, [loadProfile]);

  const refreshProfile = useCallback(() => loadProfile(userId), [loadProfile, userId]);
  const signOut = useCallback(() => api.signOut(), []);

  return (
    <SessionContext.Provider value={{ loading, userId, profile, refreshProfile, signOut }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession(): SessionState {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be used inside SessionProvider');
  return ctx;
}

/** The signed-in user's profile; only use on screens behind the profile guard. */
export function useProfile(): Profile {
  const { profile } = useSession();
  if (!profile) throw new Error('No profile loaded');
  return profile;
}
