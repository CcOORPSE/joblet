# 404 Error Analysis: Production vs Localhost

## Executive Summary

Your Vercel deployment is returning 404 errors on non-API routes because:
1. **Client build files are not served** - server.js doesn't serve static assets or fallback to index.html
2. **SPA routing is missing** - no catch-all route for client-side routing
3. **Backend URL misconfiguration** - client.env has localhost URL instead of empty string
4. **Monorepo build configuration incomplete** - root vercel.json doesn't coordinate client/server builds

---

## Critical Issues (Must Fix)

### 1. ❌ MISSING CLIENT BUILD SERVING & SPA ROUTING

**Location:** [server/server.js](server/server.js#L68-L224)

**Problem:**
- Server has ONLY these routes:
  - `GET /` → returns "API Working with Firebase" (plain text)
  - `/api/*` → API endpoints
  - `/uploads` → static files
  - **NO fallback for SPA routing**
  - **NO serving of client dist files**

**What's Missing:**
```javascript
// NOT IN SERVER.JS:
// 1. No static middleware for client/dist
// 2. No catch-all route that serves index.html
// 3. No SPA routing fallback
```

**Result:**
- Request: `GET /dashboard` → Returns 404 (no route)
- Request: `GET /apply-job/123` → Returns 404 (no route)
- Request: `GET /admin` → Returns 404 (no route)
- Localhost: Works because Vite dev server serves client separately
- Production: No separate Vite server, only Express API

**Line 68 shows:**
```javascript
app.use("/uploads", express.static("uploads"));
```
But NO line like:
```javascript
// MISSING: app.use(express.static('../client/dist'));
// MISSING: app.get('*', (req, res) => res.sendFile(path.join(..., 'index.html')));
```

---

### 2. ❌ INCORRECT BACKEND URL CONFIGURATION

**Location:** [client/.env](client/.env#L1)

**Current (WRONG for production):**
```
VITE_BACKEND_URL=http://localhost:3000
```

**Should be (for monorepo deployment):**
```
VITE_BACKEND_URL=
```

**Why This Causes 404s:**
- In [client/src/context/AppContext.jsx](client/src/context/AppContext.jsx#L11-L17):
  ```javascript
  let tempBackendUrl = (import.meta.env.VITE_BACKEND_URL || "").trim();
  if (typeof window !== "undefined" && window.location.hostname !== "localhost") {
    if (tempBackendUrl.includes("localhost")) {
      tempBackendUrl = "";  // Clears localhost URL on production
    }
  }
  ```
- On production, it becomes empty string `""`
- API calls use relative paths: `axios.get("" + "/api/jobs")` → `/api/jobs` ✓
- **BUT**: Built bundle hardcodes `VITE_BACKEND_URL=""` as shown in [client/dist/assets/index-DmDyWfUS.js](client/dist/assets/index-DmDyWfUS.js#L3305):
  ```javascript
  VITE_BACKEND_URL:""
  ```

**Verification from build output:**
- Built dist shows: `VITE_BACKEND_URL:""`
- This is actually correct, BUT the .env file is confusing for developers

---

### 3. ❌ MONOREPO BUILD NOT CONFIGURED

**Locations:**
- [Root vercel.json](vercel.json)
- [server/vercel.json](server/vercel.json)
- [Root package.json](package.json#L1-L13)

**Current Root vercel.json (INCOMPLETE):**
```json
{
  "version": 2,
  "builds": [
    {
      "src": "server/server.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/server/server.js"
    }
  ]
}
```

**Problems:**
- ✗ No client build configuration
- ✗ No static file serving configuration
- ✗ Routes ALL requests to server/server.js
- ✓ Server vercel.json has `"includeFiles": ["dist/**"]` but this refers to server/dist, not client/dist

**Root package.json missing:**
```json
{
  "scripts": {
    "build": "npm run build --prefix client && npm run install --prefix server"
  }
}
```

---

### 4. ❌ CLIENT VERCEL.JSON NEVER USED

**Location:** [client/vercel.json](client/vercel.json)

**Issue:**
```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

- This is the CORRECT config for SPA routing
- **BUT it's ignored** because:
  1. Root vercel.json routes everything to server/server.js
  2. This file is only used if client is deployed as separate app
  3. In monorepo, root vercel.json takes precedence

---

## Configuration Mismatch Details

### A. Localhost Architecture
```
┌─────────────────────────────────────┐
│ Browser on localhost:5173           │
│ (Vite dev server, separate process) │
└──────────┬──────────────────────────┘
           │
     ┌─────┴──────┬──────────────────┐
     │            │                  │
  Static      API Requests      WebSocket
  Assets      to :3000          (separate)
  (Vite)      (Express)
     │            │                  │
┌────▼──────┐ ┌──┴──────────────────┤
│ Localhost │ │ Localhost:3000       │
│ :5173     │ │ Express Server       │
│ Vite Dev  │ │ - /api/* routes      │
│ Serves:   │ │ - /uploads static    │
│ - .jsx    │ │ - CORS: localhost OK │
│ - CSS     │ │                      │
│ - Assets  │ │ VITE_BACKEND_URL=    │
└───────────┘ │ http://localhost:3000│
              └──────────────────────┘
```

**Result:** ✓ Works (separate Vite dev server + Express)

---

### B. Production Architecture (CURRENT - BROKEN)
```
┌──────────────────────────────────────────┐
│ Browser on https://joblet.vercel.app     │
└──────────────────┬───────────────────────┘
                   │
            All requests routed to:
                   │
        ┌──────────▼──────────────┐
        │  Vercel Serverless Fn   │
        │  /server/server.js      │
        │                         │
        │  app = Express app      │
        │  - GET / → "text"       │
        │  - /api/* → works ✓     │
        │  - *.jsx, .css → ✗ 404  │
        │  - /dashboard → ✗ 404   │
        │  - /apply-job/:id → ✗404│
        │                         │
        │  MISSING:               │
        │  - app.use(static(...)) │
        │  - app.get('*', sendF..)│
        └─────────────────────────┘
```

**Result:** ✗ Broken (no static serving, no SPA routing)

---

### C. Production Architecture (NEEDED)
```
┌──────────────────────────────────────────┐
│ Browser on https://joblet.vercel.app     │
└──────────────────┬───────────────────────┘
                   │
            All requests routed to:
                   │
        ┌──────────▼──────────────┐
        │  Vercel Serverless Fn   │
        │  /server/server.js      │
        │                         │
        │  app = Express app      │
        │  - Middleware:          │
        │    * static('dist')     │
        │  - Routes:              │
        │    * /api/* → works ✓   │
        │    * /uploads → works ✓ │
        │    * /* → index.html ✓  │
        │                         │
        │  Files served:          │
        │  - index.html           │
        │  - main.*.js            │
        │  - index.*.css          │
        │  - assets/*             │
        └─────────────────────────┘
```

**Result:** ✓ Works (integrated monorepo)

---

## File Structure Issues

### Directory Layout
```
job-main/
├── vercel.json ← ROOT CONFIG (routes to server only)
├── package.json ← ROOT (missing build scripts)
├── client/
│   ├── .env ← WRONG: has localhost URL
│   ├── .env.example ← CORRECT: has empty VITE_BACKEND_URL
│   ├── vercel.json ← UNUSED (only if separate deploy)
│   ├── vite.config.js ← OK (builds to dist/)
│   └── dist/ ← CLIENT BUILD (includes index.html, assets)
│       └── index.html ← ENTRY POINT
├── server/
│   ├── vercel.json ← includes wrong "dist/**"
│   ├── server.js ← INCOMPLETE (no static/SPA fallback)
│   └── config/
│       └── loadEnv.js ← loads from server/.env
```

---

## Specific Fixes Required

### FIX #1: Add Client Static Serving to Server

**File:** [server/server.js](server/server.js)

**Add after line 67 (after uploads middleware):**
```javascript
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const clientDistPath = path.join(__dirname, '../client/dist');

// Serve static files from client build
app.use(express.static(clientDistPath));

// SPA fallback: serve index.html for all non-API routes
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(clientDistPath, 'index.html'));
  } else {
    res.status(404).json({ success: false, message: 'API endpoint not found' });
  }
});
```

**Why:**
- `express.static()` serves /client/dist files (CSS, JS, images)
- `app.get('*')` catches all non-API routes and serves index.html
- React Router handles client-side navigation from index.html
- `/api/*` routes are handled by existing middleware before catch-all

---

### FIX #2: Update Client .env for Production

**File:** [client/.env](client/.env)

**Change from:**
```
VITE_BACKEND_URL=http://localhost:3000
```

**Change to:**
```
# Leave empty for monorepo Vercel deployment
# Set to http://localhost:3000 only for local dev with separate server
VITE_BACKEND_URL=
```

**For local development with separate server:**
- Revert to: `VITE_BACKEND_URL=http://localhost:3000`
- OR use `.env.development` file

**For Vercel production:**
- Must be empty string

---

### FIX #3: Update Root vercel.json

**File:** [vercel.json](vercel.json)

**Current (INCOMPLETE):**
```json
{
  "version": 2,
  "builds": [
    {
      "src": "server/server.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/server/server.js"
    }
  ]
}
```

**Change to:**
```json
{
  "version": 2,
  "builds": [
    {
      "src": "client/package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "client/dist"
      }
    },
    {
      "src": "server/server.js",
      "use": "@vercel/node",
      "config": {
        "includeFiles": ["client/dist/**"]
      }
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/server/server.js"
    }
  ]
}
```

**Alternative (simpler):** Remove builds entirely, rely on server.js to serve static files (requires Fix #1)

---

### FIX #4: Update Root package.json

**File:** [package.json](package.json)

**Add build scripts:**
```json
{
  "scripts": {
    "build": "npm run build --prefix client && npm install --prefix server",
    "vercel-build": "npm run build",
    "start": "node server/server.js"
  }
}
```

---

## Verification Checklist

### Localhost (should already work)
- [x] `npm run dev` (Vite serves client on 5173)
- [x] `npm run server` (Express serves API on 3000)
- [x] Navigate to `/apply-job/123` → Works (Vite serves index.html)
- [x] API call to `/api/jobs` → Works (Express routes it)

### Production (needs fixes)
- [ ] Client build: `npm run build --prefix client` → client/dist/
- [ ] Server starts: `node server/server.js` (or serverless handler)
- [ ] Static assets: GET `/assets/index-*.js` → 200 OK
- [ ] SPA routing: GET `/dashboard` → Serves index.html → React Router handles it
- [ ] API routing: GET `/api/jobs` → Express routes it correctly
- [ ] Non-existent API: GET `/api/fake` → 404 from Express (before fallback)

---

## Environment Variables

### What Needs to be Set on Vercel

**Required in Vercel Project Settings → Environment Variables:**

```
FIREBASE_PROJECT_ID=jobfinder-b817d
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-fbsvc-5227f2e092@jobfinder-b817d.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n
FIREBASE_STORAGE_BUCKET=jobfinder-b817d.firebasestorage.app
GEMINI_API_KEY=AIza...
FRONTEND_URL=https://joblet-gamma.vercel.app
NODE_ENV=production
```

**NOT needed on Vercel (already in code):**
- `VITE_*` vars → built into client/dist during `npm run build`

---

## Root Cause Analysis

### Why It Works on Localhost
1. `npm run client` starts Vite dev server (port 5173)
2. Vite serves React app including index.html
3. Vite has built-in SPA fallback (serves index.html for non-static routes)
4. `npm run server` starts Express server (port 3000)
5. React client makes API calls to `http://localhost:3000/api/*`
6. Two separate servers handle different concerns

### Why It Fails on Production
1. Vercel builds and bundles server/server.js
2. Client/dist is NOT automatically served by Vercel
3. All requests route to Express server
4. Express only has:
   - `/` → text response
   - `/api/*` → API routes
   - `/uploads` → static uploads
   - **NOTHING ELSE**
5. Request for `/apply-job/123` → No route → 404
6. Request for `/assets/main.js` → No route → 404
7. No fallback to serve index.html

---

## Additional Issues (Minor)

### Issue: server/vercel.json References Wrong dist
**Location:** [server/vercel.json](server/vercel.json#L7-L9)

```json
"config": {
  "includeFiles": ["dist/**"]
}
```

This refers to `server/dist/**` but there's no build step that creates it. Should be:
```json
"includeFiles": ["../client/dist/**"]
```

But this is moot if you fix root vercel.json properly.

---

### Issue: No Build Script in Root
**Location:** [package.json](package.json)

Missing scripts that Vercel needs:
- `npm run build` (or `vercel-build`)
- Should run: `npm run build --prefix client`

---

## Summary of Changes

| File | Issue | Fix |
|------|-------|-----|
| [server/server.js](server/server.js) | No static serving, no SPA routing | Add middleware for client/dist + catch-all |
| [client/.env](client/.env) | Hardcoded localhost URL | Use empty string for production |
| [vercel.json](vercel.json) | Incomplete monorepo config | Add client build, include dist files |
| [package.json](package.json) | Missing build scripts | Add build/vercel-build scripts |

---

## Testing Production Locally

Before deploying, test the production build locally:

```bash
# Build client
npm run build --prefix client

# Start server (production mode)
NODE_ENV=production node server/server.js

# In browser, test:
# - http://localhost:3000/ → Should show UI
# - http://localhost:3000/apply-job/123 → Should work
# - http://localhost:3000/api/jobs → Should return JSON
```

---

## References

- [Vite Documentation](https://vitejs.dev/)
- [Express Static Files](https://expressjs.com/en/starter/static-files.html)
- [Vercel Monorepo Deployment](https://vercel.com/docs/concepts/monorepos)
- [React Router SPA Routing](https://reactrouter.com/)
