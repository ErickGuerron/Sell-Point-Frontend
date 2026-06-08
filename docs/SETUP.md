# Sell-Point Frontend — Critical Setup & Operation Guide

## 1. Prerequisites

| Tool | Version | Notes |
|------|---------|-------|
| Node.js | `>= 22.12.0` | Required by the `package.json` engines field |
| npm | Comes with Node | Project uses `package-lock.json` |

## 2. Environment Variables

The frontend uses [Astro's public env vars](https://docs.astro.build/en/guides/environment-files/). Only variables prefixed with `PUBLIC_` are exposed to the browser.

### Required

| Variable | Description |
|----------|-----------|
| `PUBLIC_API_BASE_URL` | Base URL for the backend API (e.g., `http://localhost:3000`; Docker proxy can use `/api`) |

### Firebase Client SDK
 Used for Google Sign-In (Authentication).

| Variable | Description |
|----------|-------------|
| `PUBLIC_FIREBASE_API_KEY` | Firebase API key |
| `PUBLIC_FIREBASE_AUTH_DOMAIN` | Firebase auth domain |
| `PUBLIC_FIREBASE_PROJECT_ID` | Firebase project ID |
| `PUBLIC_FIREBASE_STORAGE_BUCKET` | Firebase storage bucket |
| `PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Firebase messaging sender ID |
| `PUBLIC_FIREBASE_APP_ID` | Firebase app ID |

> Copy `firebase.env.example` to `.env` and fill in the values from your Firebase Console.

## 3. Firebase Setup

### Steps

1. Go to the [Firebase Console](https://console.firebase.google.com) and create a project (or use the same one as the backend)
2. **Enable Google Sign-In** in Authentication → Sign-in providers
3. Register a **Web App** in Project Settings → Your apps
4. Copy the Firebase config values into `.env` (all `PUBLIC_FIREBASE_*` variables)

### What Uses Firebase
- **Google Sign-In** on the login page
- **Profile page "Link Google" button** — uses Firebase `idToken` sent to backend

### If Firebase Config Is Missing
The app will fail to initialize Firebase and Google Sign-In will be non-functional. Users won't be able to log in via Google.

## 4. Connecting to Backend

Set `PUBLIC_API_BASE_URL` to point to the backend:

```bash
# Local development
PUBLIC_API_BASE_URL=http://localhost:3000

# Production
PUBLIC_API_BASE_URL=https://api.yourdomain.com

# Docker (frontend container behind nginx proxy)
PUBLIC_API_BASE_URL=/api
```

### CORS
The backend must have your frontend URL in its `CORS_ALLOWED_ORIGINS` list. If you see CORS errors, make sure the backend's allowed origins include `http://localhost:4321` (local dev) or your production domain.

## 5. Running Locally

```bash
cd Sell-Point-Frontend
npm install
npm run dev        # Dev server on http://localhost:4321
npm run build      # Production build
npm run preview    # Preview production build
```

## 6. Common Issues & Troubleshooting

| Issue | Likely Cause | Fix |
|-------|-------------|-----|
| CORS errors on API calls | Backend CORS doesn't include the frontend origin | Add frontend URL to `CORS_ALLOWED_ORIGINS` in backend `.env` |
| Google Sign-In button doesn't appear | Firebase not initialized | Check all `PUBLIC_FIREBASE_*` variables are set |
| "Link Google" button stays disabled | `googleLinked()` signal is never `true` | Check the browser console + network tab: is `/auth/me` returning `googleId`? |
| Page loads but data is stale | Astro static page cached | Hard refresh (`Ctrl+Shift+R`) or restart dev server |
| Build fails | Missing env vars | Run `npm run build` with all required `PUBLIC_` variables set |

## 7. Architecture Notes

### How the App Is Built
- **Astro** provides the routing, layout, and static pages
- **Angular** (`@analogjs/astro-angular`) provides the interactive components — especially the profile page and POS
- **Nano Stores** (`nanostores`) handles reactive state sharing between Astro and Angular contexts

### Key Directories
```
src/
├── presentation/
│   ├── features/          # Angular feature components (profile, POS, etc.)
│   ├── layouts/           # Astro layouts
│   └── pages/             # Astro page routes
├── infrastructure/
│   ├── api/               # HTTP client and API service wrappers
│   └── auth/              # Auth state management
└── env.d.ts               # TypeScript env var declarations
```

### Auth Flow
1. User logs in via Firebase Google Sign-In or email/password
2. Firebase returns an `idToken` (or the backend issues a JWT after email/password auth)
3. Frontend stores the token (in memory or signal) and sends it as `Bearer` in `Authorization` header
4. `/auth/me` returns the current user profile including `googleId` if Google is linked
5. Profile page reads `googleLinked = !!googleId` to enable/disable the Link/Unlink button
