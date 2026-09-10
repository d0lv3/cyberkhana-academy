import React, { createContext, useContext, useState, useEffect } from 'react';
import { AcademyUser } from '../types';
import { api } from '../services/api';
import { hydrateFromServer, setSyncEnabled } from '../services/syncService';
import { setOwnAuthor } from '../services/creatorDataService';

interface ServerUser {
  id: string;
  email: string;
  username?: string;
  displayName: string;
  avatarUrl?: string;
  googlePhotoUrl?: string;
  role: AcademyUser['role'];
  permissions?: string[];
  preferredLang: 'en' | 'ar';
  university?: string;
  country?: string;
  bio?: string;
  showBio?: boolean;
  socials?: AcademyUser['socials'];
  createdAt: string;
  termsAccepted?: boolean;
  creatorAgreementAccepted?: boolean;
}

/** What the profile form may change in one save. */
export type ProfilePatch = Partial<
  Pick<AcademyUser, 'displayName' | 'bio' | 'university' | 'avatarUrl' | 'showBio'>
> & {
  /** Each platform mapped to what was typed; '' clears that link. */
  socials?: Record<string, string>;
};

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
  /** Claim or change the public handle. Awaited, and throws with the server's
   *  reason (taken / reserved / malformed) so the caller can show it. */
  updateUsername: (username: string) => Promise<void>;
  /** Save profile fields and wait for the server's answer, adopting the user
   *  it returns (social links come back normalised). Throws on refusal. */
  updateProfile: (patch: ProfilePatch) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  login: async () => {},
  loginWithGoogle: async () => {},
  logout: () => {},
  updateUser: () => {},
  updateUsername: async () => {},
  updateProfile: async () => {},
});

function mapServerUser(u: ServerUser): AcademyUser {
  return {
    _id: u.id,
    email: u.email,
    username: u.username,
    displayName: u.displayName,
    avatarUrl: u.avatarUrl,
    googlePhotoUrl: u.googlePhotoUrl,
    role: u.role,
    permissions: u.permissions,
    preferredLang: u.preferredLang,
    university: u.university,
    country: u.country,
    bio: u.bio,
    showBio: u.showBio ?? false,
    socials: u.socials ?? {},
    completedModulesCount: 0,
    completedLessonsCount: 0,
    totalLearningTimeMinutes: 0,
    createdAt: u.createdAt,
    termsAccepted: u.termsAccepted,
    creatorAgreementAccepted: u.creatorAgreementAccepted,
  };
}

/** Fields the server accepts on PATCH /auth/profile. */
const PROFILE_FIELDS = ['displayName', 'bio', 'university', 'preferredLang', 'avatarUrl'] as const;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AcademyUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  /* My own content is credited to whoever is signed in (see setOwnAuthor).
     Pages render behind AuthGate, which waits for the session, so this is in
     place before anything reads it. */
  useEffect(() => {
    setOwnAuthor(
      user
        ? {
            id: user._id,
            displayName: user.displayName,
            username: user.username,
            avatarUrl: user.avatarUrl,
          }
        : null
    );
  }, [user?._id, user?.displayName, user?.username, user?.avatarUrl]);

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

  /* Usernames are unique, so this one can't be optimistic like updateUser:
     the server is the only thing that knows whether a handle is free. We wait
     for its answer and adopt the user it returns. */
  const updateUsername = async (username: string) => {
    const { user: serverUser } = await api.patch<{ user: ServerUser }>('/auth/profile', {
      username,
    });
    setUser(mapServerUser(serverUser));
  };

  const updateProfile = async (patch: ProfilePatch) => {
    const { user: serverUser } = await api.patch<{ user: ServerUser }>('/auth/profile', patch);
    setUser(mapServerUser(serverUser));
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
        updateUsername,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
