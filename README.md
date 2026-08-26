# RadhaKrishna Temple — Web UI

React 18 · Vite 8 · Tailwind v4 · React Router 7

Front end for the Spring Boot backend. Mobile-first, works down to 360px.

---

## Run it

The backend must be up first (`docker compose up -d`, then the Spring Boot app on :8080).

```powershell
npm install
npm run dev
```

Opens on **http://localhost:5173** — already in the backend's `app.cors.allowed-origins`, so no proxy is needed.

Sign in with the seeded admin:

```
admin@radhakrishnatemple.com / Admin@123
```

### Pointing at a different backend

`.env` (copied from `.env.example`):

```
VITE_API_BASE_URL=http://localhost:8080
```

---

## What's wired up

| Screen | Route | Backend |
|---|---|---|
| Sign in / register | `/signin` | `POST /api/auth/login`, `/register` |
| Gallery | `/gallery` | `GET /api/photos?page&size` |
| My photos | `/mine` | `GET /api/photos/me` |
| Upload | `/upload` | `POST /api/photos` (multipart) |
| Profile | `/profile` | `GET /api/users/me` |
| Manage people | `/admin` | `GET/PATCH/DELETE /api/admin/**` |

Role rules mirror the backend: everyone uploads and edits their own photos; the Manage tab and the delete-anyone's-photo action only appear for `ADMIN`. Admin rows have no action buttons, because `AdminService` refuses to touch another admin.

---

## Two things worth knowing

**Images are fetched, not linked.** `/api/photos/{id}/file` sits behind the JWT filter, and a browser never attaches an `Authorization` header to `<img src>`. `AuthedImage` pulls the bytes with `fetch`, wraps them in an object URL, and revokes it on unmount so blobs don't accumulate while scrolling.

**Token refresh is automatic.** Any 401 triggers one refresh against `/api/auth/refresh`, then replays the original request. Parallel 401s share a single in-flight refresh rather than stampeding. If the refresh itself fails, tokens are cleared and you land back on `/signin`.

Tokens live in `localStorage` so a reload keeps you signed in. That's a deliberate dev-time trade-off — anything that can run JS on this origin can read them. Before this goes anywhere real, move the refresh token to an `HttpOnly; Secure; SameSite=Strict` cookie and keep the access token in memory.

---

## Design notes

Palette comes from the subject rather than a default: night indigo for Krishna, peacock teal and marigold from the *mor-pankh*, rose for Radha. Surfaces are a cool paper (`#F6F5FA`), not cream.

The signature element is the **torana arch** — photo frames and the upload preview are cut with a temple doorway silhouette instead of a rectangle (`.arch` in `index.css`). The peacock-feather gradient (`.rail`) appears once as a hairline: vertical beside the desktop sidebar, horizontal atop the mobile header. Type is Marcellus for display, Karla for body.

Mobile specifics: bottom tab bar with 44px touch targets, `env(safe-area-inset-bottom)` padding for iPhone home indicators, and 16px inputs so iOS doesn't zoom on focus.

---

## Not built yet

- **Google Sign-In.** The backend exposes `POST /api/auth/google` and `api.google()` is ready in `src/lib/api.js`, but the button needs the Google Identity Services script and a real client ID. Set `VITE_GOOGLE_CLIENT_ID` and add the GIS script when you have one.
- Thumbnails — the gallery downloads full-size images. Once the backend generates thumbnails, point `AuthedImage` at the smaller variant.
