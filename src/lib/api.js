const BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

const ACCESS_KEY = 'rkt.access';
const REFRESH_KEY = 'rkt.refresh';
const USER_KEY = 'rkt.user';

/* ------------------------------------------------------------------
   Token store.
   Kept in localStorage so a page reload keeps you signed in. That is a
   deliberate dev-time trade-off: any XSS on this origin can read it.
   For production, move the refresh token to an HttpOnly cookie and keep
   the access token in memory only.
------------------------------------------------------------------ */
/**
 * Reads the `exp` claim out of a JWT without verifying it.
 *
 * This is not a security check — the server verifies the signature and is the
 * only thing that decides whether a token is good. It exists so the app can
 * tell, before making a request, that a stored token is already dead. Firing a
 * request we know will 401 costs a round trip and paints a red error in the
 * console on every page load, which is exactly what this avoids.
 */
function expiryOf(jwt) {
  try {
    const payload = jwt.split('.')[1];
    if (!payload) return null;
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    const { exp } = JSON.parse(json);
    return typeof exp === 'number' ? exp * 1000 : null;
  } catch {
    return null; // malformed — treat as "unknown", let the server decide
  }
}

/** A token is usable if it parses and has more than 5s of life left. */
function usable(jwt) {
  if (!jwt) return false;
  const exp = expiryOf(jwt);
  return exp === null ? true : exp - Date.now() > 5000;
}

export const tokens = {
  get access() {
    return localStorage.getItem(ACCESS_KEY);
  },
  get refresh() {
    return localStorage.getItem(REFRESH_KEY);
  },
  /** True when there is a session worth trying to restore on boot. */
  get hasLiveSession() {
    return usable(localStorage.getItem(ACCESS_KEY)) || usable(localStorage.getItem(REFRESH_KEY));
  },
  /** The access token, but only if it has not already expired. */
  get liveAccess() {
    const t = localStorage.getItem(ACCESS_KEY);
    return usable(t) ? t : null;
  },
  get liveRefresh() {
    const t = localStorage.getItem(REFRESH_KEY);
    return usable(t) ? t : null;
  },
  get user() {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  },
  save({ accessToken, refreshToken, user }) {
    if (accessToken) localStorage.setItem(ACCESS_KEY, accessToken);
    if (refreshToken) localStorage.setItem(REFRESH_KEY, refreshToken);
    if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
  },
  clear() {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
    localStorage.removeItem(USER_KEY);
  },
};

/** Thrown for any non-2xx response. Carries the backend's ApiError shape. */
export class ApiError extends Error {
  constructor(status, message, fieldErrors) {
    super(message);
    this.status = status;
    this.fieldErrors = fieldErrors || null;
  }
}

let onSignedOut = () => {};
export function setSignedOutHandler(fn) {
  onSignedOut = fn;
}

async function readError(res) {
  let body = null;
  try {
    body = await res.json();
  } catch {
    /* endpoint returned no body */
  }
  const message =
    body?.message ||
    (res.status === 401
      ? 'Your session has expired. Sign in again.'
      : `Request failed (${res.status})`);
  return new ApiError(res.status, message, body?.fieldErrors);
}

/* Only one refresh may be in flight; parallel 401s all wait on it. */
let refreshInFlight = null;

async function refreshAccessToken() {
  // An expired refresh token can only produce a 400 and a signed-out user;
  // skip the round trip and go straight to signed out.
  const refreshToken = tokens.liveRefresh;
  if (!refreshToken) return null;

  if (!refreshInFlight) {
    refreshInFlight = fetch(`${BASE}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    })
      .then(async (res) => {
        if (!res.ok) throw await readError(res);
        const data = await res.json();
        tokens.save(data);
        return data.accessToken;
      })
      .catch(() => {
        tokens.clear();
        onSignedOut();
        return null;
      })
      .finally(() => {
        refreshInFlight = null;
      });
  }
  return refreshInFlight;
}

/**
 * Core request helper.
 * `body` may be a plain object (sent as JSON) or a FormData (sent as-is,
 * letting the browser set the multipart boundary).
 */
async function request(
  path,
  { method = 'GET', body, auth = true, raw = false, optionalAuth = false } = {},
) {
  const send = async (token) => {
    const headers = {};
    if (auth && token) headers.Authorization = `Bearer ${token}`;

    let payload;
    if (body instanceof FormData) {
      payload = body;
    } else if (body !== undefined) {
      headers['Content-Type'] = 'application/json';
      payload = JSON.stringify(body);
    }

    return fetch(`${BASE}${path}`, { method, headers, body: payload });
  };

  // If the stored access token is already past its expiry, refresh up front
  // rather than sending a request that is guaranteed to come back 401.
  let token = tokens.liveAccess;
  if (auth && !token && tokens.liveRefresh) {
    token = await refreshAccessToken();
  }

  let res = await send(token);

  // Access token rejected mid-session: refresh once, then replay.
  if (res.status === 401 && auth && tokens.liveRefresh) {
    const fresh = await refreshAccessToken();
    if (fresh) res = await send(fresh);
  }

  if (!res.ok) {
    const err = await readError(res);
    // `optionalAuth` marks a call that works signed in or signed out — the
    // gallery, for instance. A 401 there is not a reason to end the session.
    if (err.status === 401 && auth && !optionalAuth) {
      tokens.clear();
      onSignedOut();
    }
    throw err;
  }

  if (raw) return res;
  if (res.status === 204) return null;
  return res.json();
}

/* Shared across every caller of templeInfoCached; see below. */
let templeInfoPromise = null;

/* ---------------------------- endpoints ---------------------------- */

export const api = {
  // auth
  login: (email, password) =>
    request('/api/auth/login', { method: 'POST', body: { email, password }, auth: false }),

  register: (name, email, password, role) =>
    request('/api/auth/register', {
      method: 'POST',
      body: { name, email, password, role },
      auth: false,
    }),

  google: (idToken, role) =>
    request('/api/auth/google', { method: 'POST', body: { idToken, role }, auth: false }),

  // users
  me: () => request('/api/users/me'),

  // photos
  /* The gallery is public now — the admin posts, everyone looks. Sent with
     optionalAuth so a stale token cannot turn a public read into a sign-out. */
  gallery: (page = 0, size = 20, category = null) =>
    request(
      `/api/photos?page=${page}&size=${size}${category ? `&category=${category}` : ''}`,
      { optionalAuth: true },
    ),

  myPhotos: (page = 0, size = 20, category = null) =>
    request(
      `/api/photos/me?page=${page}&size=${size}${category ? `&category=${category}` : ''}`,
    ),

  /**
   * Upload.
   *
   * `category` decides where the photograph lands. Only an explicit 'ADMIN'
   * moves the account portrait — a Founder, Co-founder, Committee member or
   * plain gallery upload leaves it alone. That is the whole point of the
   * field: before it existed the newest upload silently became the avatar.
   */
  upload: (file, { caption, category, personName, personTitle } = {}) => {
    const fd = new FormData();
    fd.append('file', file);
    if (caption) fd.append('caption', caption);
    if (category) fd.append('category', category);
    if (personName) fd.append('personName', personName);
    if (personTitle) fd.append('personTitle', personTitle);
    return request('/api/photos', { method: 'POST', body: fd });
  },

  photoCategories: () => request('/api/photos/categories', { auth: false }),

  updatePhoto: (id, { caption, category, personName, personTitle, file }) => {
    const fd = new FormData();
    // Undefined means "leave it alone"; empty string means "clear it". The
    // backend trims blanks to null, so both ends agree.
    if (caption !== undefined && caption !== null) fd.append('caption', caption);
    if (category) fd.append('category', category);
    if (personName !== undefined && personName !== null) fd.append('personName', personName);
    if (personTitle !== undefined && personTitle !== null) fd.append('personTitle', personTitle);
    if (file) fd.append('file', file);
    return request(`/api/photos/${id}`, { method: 'PUT', body: fd });
  },

  setAsProfilePhoto: (id) =>
    request(`/api/photos/${id}/set-as-profile`, { method: 'PATCH' }),

  deletePhoto: (id) => request(`/api/photos/${id}`, { method: 'DELETE' }),

  /**
   * The image endpoint sits behind the JWT filter, so a plain <img src>
   * would be rejected — the browser never attaches an Authorization
   * header. We fetch the bytes ourselves and hand back an object URL.
   */
  photoBlobUrl: async (id) => {
    const res = await request(`/api/photos/${id}/file`, { raw: true, optionalAuth: true });
    const blob = await res.blob();
    return URL.createObjectURL(blob);
  },

  /* ---- public: readable with no account ----
     auth:false so a stale token in localStorage can never turn a public
     read into a 401 that signs the visitor out. */

  templeInfo: () => request('/api/public/temple-info', { auth: false }),

  /**
   * The same call, but shared.
   *
   * The footer and the floating WhatsApp button sit on every page and both
   * want the contact block, and the front page wants the timings from the very
   * same payload — three identical requests per navigation. One in-flight
   * promise serves all of them. A failure clears the cache so the next caller
   * genuinely retries rather than being handed the old rejection forever.
   */
  templeInfoCached: () => {
    if (!templeInfoPromise) {
      templeInfoPromise = request('/api/public/temple-info', { auth: false }).catch((err) => {
        templeInfoPromise = null;
        throw err;
      });
    }
    return templeInfoPromise;
  },

  announcements: () => request('/api/public/announcements', { auth: false }),

  /** The committee board: admin, founder, co-founder, committee members. */
  team: () => request('/api/public/team', { auth: false }),

  panchangToday: () => request('/api/public/panchang/today', { auth: false }),

  panchangDay: (isoDate) =>
    request(`/api/public/panchang/day?date=${isoDate}`, { auth: false }),

  panchangMonth: (year, month) =>
    request(`/api/public/panchang/month?year=${year}&month=${month}`, { auth: false }),

  /* ---- public: puja booking ---- */

  pujaTypes: () => request('/api/public/puja-types', { auth: false }),

  bookPuja: (payload) =>
    request('/api/public/puja-bookings', { method: 'POST', body: payload, auth: false }),

  /* ---- admin: puja bookings ---- */

  adminPujaBookings: () => request('/api/admin/puja-bookings'),

  setBookingContacted: (id, contacted) =>
    request(`/api/admin/puja-bookings/${id}/contacted?contacted=${contacted}`, {
      method: 'PATCH',
    }),

  deleteBooking: (id) => request(`/api/admin/puja-bookings/${id}`, { method: 'DELETE' }),

  /* ---- admin: announcements ---- */

  adminAnnouncements: () => request('/api/admin/announcements'),

  createAnnouncement: (payload) =>
    request('/api/admin/announcements', { method: 'POST', body: payload }),

  updateAnnouncement: (id, payload) =>
    request(`/api/admin/announcements/${id}`, { method: 'PUT', body: payload }),

  publishAnnouncement: (id, published) =>
    request(`/api/admin/announcements/${id}/publish?published=${published}`, { method: 'PATCH' }),

  pinAnnouncement: (id, pinned) =>
    request(`/api/admin/announcements/${id}/pin?pinned=${pinned}`, { method: 'PATCH' }),

  deleteAnnouncement: (id) =>
    request(`/api/admin/announcements/${id}`, { method: 'DELETE' }),

  // admin
  listUsers: (role) =>
    request(`/api/admin/users${role ? `?role=${role}` : ''}`),

  setUserEnabled: (id, enabled) =>
    request(`/api/admin/users/${id}/status?enabled=${enabled}`, { method: 'PATCH' }),

  setUserRole: (id, role) =>
    request(`/api/admin/users/${id}/role?role=${role}`, { method: 'PATCH' }),

  deleteUser: (id) => request(`/api/admin/users/${id}`, { method: 'DELETE' }),

  adminDeletePhoto: (id) => request(`/api/admin/photos/${id}`, { method: 'DELETE' }),
};
