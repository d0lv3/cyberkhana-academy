import React, { createContext, useContext, useState, useEffect } from 'react';
import { AcademyUser } from '../types';
import { api } from '../services/api';
import {
  hydrateFromServer,
  setSyncEnabled,
  claimCachesFor,
  flushPendingSync,
  forgetServerBackedCaches,
} from '../services/syncService';
import { setOwnAuthor } from '../services/creatorDataService';
import { flushPendingFeedback } from '../services/feedbackService';

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
  /** Saves what is still waiting, signs out, then clears this account's
   *  caches. Resolves once the browser holds nothing of theirs to sync. */
  logout: () => Promise<void>;
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
  logout: async () => {},
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

  /* Adopt a session. The local caches are made this account's BEFORE the user
     is set: setting it renders the app, and some of what renders reads the
     caches or sends from them straight away (unsent feedback is retried the
     moment someone is signed in). */
  const adopt = (serverUser: ServerUser) => {
    const next = mapServerUser(serverUser);
    const account = { id: next._id, displayName: next.displayName };
    claimCachesFor(account);
    setUser(next);
    return account;
  };

  // Restore the session from the httpOnly cookie on boot.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { user: serverUser } = await api.get<{ user: ServerUser }>('/auth/me');
        if (cancelled) return;
        await hydrateFromServer(adopt(serverUser));
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
    await hydrateFromServer(adopt(serverUser));
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

  /* In this order, and each step waited for. The session saves what this
     account still has waiting while it still can; only then is it ended; only
     then are the caches cleared. Clearing first would let a late push send an
     empty snapshot, and the server replaces progress, points and all, with
     whatever it is sent. */
  const logout = async () => {
    await flushPendingSync();
    await flushPendingFeedback().catch(() => {
      /* offline: the answer stays queued for this account's next sign-in */
    });
    setSyncEnabled(false);
    await api.post('/auth/logout').catch(() => {});
    forgetServerBackedCaches();
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
