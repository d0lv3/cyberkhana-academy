import React, { createContext, useContext, useState, useEffect } from 'react';
import { AcademyUser } from '../types';
import { api } from '../services/api';
import { hydrateFromServer, setSyncEnabled } from '../services/syncService';

interface ServerUser {
  id: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
  role: AcademyUser['role'];
  permissions?: string[];
  preferredLang: 'en' | 'ar';
  university?: string;
  country?: string;
  bio?: string;
  createdAt: string;
}

interface AuthContextType {
  user: AcademyUser | null;
  isAuthenticated: boolean;
  /** True while the session is being restored or established. */
  isLoading: boolean;
  /** Dev-only fallback session (backend rejects it unless ALLOW_DEV_LOGIN). */
  login: () => Promise<void>;
  /** Real sign-in: exchanges a Google ID token for a cookie session. */
  loginWithGoogle: (credential: string) => Promise<void>;
  logout: () => void;
  updateUser: (patch: Partial<AcademyUser>) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  login: async () => {},
  loginWithGoogle: async () => {},
  logout: () => {},
  updateUser: () => {},
});

function mapServerUser(u: ServerUser): AcademyUser {
  return {
    _id: u.id,
    email: u.email,
    displayName: u.displayName,
    avatarUrl: u.avatarUrl,
    role: u.role,
    permissions: u.permissions,
    preferredLang: u.preferredLang,
    university: u.university,
    country: u.country,
    bio: u.bio,
    completedModulesCount: 0,
    completedLessonsCount: 0,
    totalLearningTimeMinutes: 0,
    createdAt: u.createdAt,
  };
}

/** Fields the server accepts on PATCH /auth/profile. */
const PROFILE_FIELDS = ['displayName', 'bio', 'university', 'preferredLang'] as const;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AcademyUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore the session from the httpOnly cookie on boot.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { user: serverUser } = await api.get<{ user: ServerUser }>('/auth/me');
        if (cancelled) return;
        setUser(mapServerUser(serverUser));
        await hydrateFromServer();
      } catch {
        if (!cancelled) setUser(null);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const establishSession = async (serverUser: ServerUser) => {
    setUser(mapServerUser(serverUser));
    await hydrateFromServer();
  };

  const login = async () => {
    setIsLoading(true);
    try {
      const { user: serverUser } = await api.post<{ user: ServerUser }>('/auth/dev-login', {});
      await establishSession(serverUser);
    } catch (err) {
      console.error('Login failed:', err);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithGoogle = async (credential: string) => {
    setIsLoading(true);
    try {
      const { user: serverUser } = await api.post<{ user: ServerUser }>('/auth/google', {
        credential,
      });
      await establishSession(serverUser);
    } catch (err) {
      console.error('Google login failed:', err);
      setUser(null);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    api.post('/auth/logout').catch(() => {});
    setSyncEnabled(false);
    setUser(null);
  };

  const updateUser = (patch: Partial<AcademyUser>) => {
    setUser((prev) => (prev ? { ...prev, ...patch } : prev));
    const serverPatch: Record<string, unknown> = {};
    for (const field of PROFILE_FIELDS) {
      if (patch[field] !== undefined) serverPatch[field] = patch[field];
    }
    if (Object.keys(serverPatch).length > 0) {
      api.patch('/auth/profile', serverPatch).catch((err) => {
        console.warn('Profile sync failed:', err);
      });
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: user !== null,
        isLoading,
        login,
        loginWithGoogle,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
