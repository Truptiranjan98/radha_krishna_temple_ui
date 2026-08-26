import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useCallback,
  useRef,
} from 'react';
import { api, tokens, setSignedOutHandler } from './api';

const AuthContext = createContext(null);

/**
 * Boot verification runs once per page load, not once per mount.
 *
 * React StrictMode mounts every effect twice in development, which fired
 * `GET /api/users/me` twice — the pair of 401s in the console. Hoisting the
 * promise out of the component means the second mount joins the first request
 * instead of starting another.
 */
let bootPromise = null;

function verifyStoredSession() {
  if (!bootPromise) {
    bootPromise = api.me().catch((err) => {
      bootPromise = null; // let a later sign-in try again
      throw err;
    });
  }
  return bootPromise;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => tokens.user);
  // Only "booting" when there is actually a live session worth restoring.
  // Previously this was true whenever *any* access token sat in storage, even
  // a long-expired one, which guaranteed a 401 on every cold load.
  const [booting, setBooting] = useState(() => tokens.hasLiveSession);

  const [avatarUrl, setAvatarUrl] = useState(null);
  const avatarObjectUrl = useRef(null);

  const releaseAvatar = useCallback(() => {
    if (avatarObjectUrl.current) {
      URL.revokeObjectURL(avatarObjectUrl.current);
      avatarObjectUrl.current = null;
    }
    setAvatarUrl(null);
  }, []);

  const signOut = useCallback(() => {
    tokens.clear();
    releaseAvatar();
    setUser(null);
  }, [releaseAvatar]);

  useEffect(() => {
    setSignedOutHandler(() => {
      releaseAvatar();
      setUser(null);
    });
  }, [releaseAvatar]);

  /**
   * The avatar is the portrait the account deliberately chose.
   *
   * This used to be "the most recent photo you uploaded", standing in for a
   * profile-picture column that did not exist. It meant posting a festival
   * photograph to the gallery replaced the admin's own face with it — the bug
   * this replaces. The account now carries a `profilePhotoId`, set only by
   * uploading under the Admin category or by picking a photo on the profile
   * page, so gallery uploads leave the portrait alone.
   *
   * Takes the freshly-fetched user when there is one: `user` in state may be a
   * render behind after a sign-in or an upload.
   */
  const refreshAvatar = useCallback(
    async (known) => {
      try {
        const account = known ?? (await api.me());
        const photoId = account?.profilePhotoId;

        if (!photoId) {
          // No portrait chosen. A Google account still has its pictureUrl,
          // which the Avatar component falls back to on its own.
          releaseAvatar();
          return;
        }

        const url = await api.photoBlobUrl(photoId);
        if (avatarObjectUrl.current) URL.revokeObjectURL(avatarObjectUrl.current);
        avatarObjectUrl.current = url;
        setAvatarUrl(url);
      } catch {
        /* portrait deleted, or not signed in — fall back to the initial */
      }
    },
    [releaseAvatar],
  );

  // Re-verify the stored token on load so a revoked or expired session
  // doesn't leave a stale name in the header.
  useEffect(() => {
    if (!tokens.hasLiveSession) {
      // Stale junk in localStorage: clear it now rather than leaving it to
      // 401 on the first authenticated action the user takes.
      if (tokens.access || tokens.refresh) tokens.clear();
      setBooting(false);
      return undefined;
    }

    let cancelled = false;
    verifyStoredSession()
      .then((fresh) => {
        if (cancelled) return;
        tokens.save({ user: fresh });
        setUser(fresh);
        refreshAvatar(fresh);
      })
      .catch(() => {
        if (!cancelled) signOut();
      })
      .finally(() => {
        if (!cancelled) setBooting(false);
      });

    return () => {
      cancelled = true;
    };
  }, [signOut, refreshAvatar]);

  // Revoke the last object URL when the provider itself goes away.
  useEffect(
    () => () => {
      if (avatarObjectUrl.current) URL.revokeObjectURL(avatarObjectUrl.current);
    },
    [],
  );

  const adopt = useCallback(
    (auth) => {
      tokens.save(auth);
      setUser(auth.user);
      refreshAvatar(auth.user);
      return auth.user;
    },
    [refreshAvatar],
  );

  /**
   * Re-reads the account and repaints the portrait. Called after anything that
   * could have changed it — an Admin-category upload, or picking a photo on
   * the profile page.
   */
  const reloadAccount = useCallback(async () => {
    const fresh = await api.me();
    tokens.save({ user: fresh });
    setUser(fresh);
    await refreshAvatar(fresh);
    return fresh;
  }, [refreshAvatar]);

  const value = useMemo(
    () => ({
      user,
      booting,
      isAdmin: user?.role === 'ADMIN',
      avatarUrl,
      refreshAvatar,
      reloadAccount,
      signIn: async (email, password) => adopt(await api.login(email, password)),
      signInWithGoogle: async (idToken) => adopt(await api.google(idToken)),
      signOut,
    }),
    [user, booting, avatarUrl, refreshAvatar, reloadAccount, adopt, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}

export const ROLE_LABEL = {
  ADMIN: 'Admin',
  PRIEST: 'Priest',
  DEVOTEE: 'Devotee',
};

export const ROLE_STYLE = {
  ADMIN: 'bg-rose-temple/10 text-rose-temple',
  PRIEST: 'bg-marigold-500/15 text-[#9a6512]',
  DEVOTEE: 'bg-peacock-600/10 text-peacock-600',
};
