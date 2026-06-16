# 404 Errors Fix Plan - Production Deployment Issue

**Issue**: Application works on localhost but returns 404 errors on Vercel production deployment (joblet-eight.vercel.app)

**Root Cause**: Client and server are not properly integrated. Server doesn't serve client assets or handle SPA routing fallback.

---

## 📋 Executive Summary

| Issue | Severity | Impact | Status |
|-------|----------|--------|--------|
| Server not serving client static files | 🔴 CRITICAL | All page routes return 404 | Not Fixed |
| Server missing SPA routing fallback | 🔴 CRITICAL | Client-side routing broken | Not Fixed |
| Backend URL hardcoded to localhost | 🔴 CRITICAL | API calls fail in production | Not Fixed |
| Root vercel.json not configured for monorepo | 🔴 CRITICAL | Client build never runs | Not Fixed |
| Environment variables not set for production | 🟡 HIGH | API integration issues | Needs Review |

---

## 🔍 Why Localhost Works vs Production Fails

### On Localhost ✅
```
Client (http://localhost:5173)    ← Vite dev server with SPA routing
                    ↓ (separate process)
Server (http://localhost:3000)    ← Express serving only /api routes
```
- Vite dev server handles all client routes
- Server only handles `/api` routes
- No conflict because they're on different ports

### In Production ❌
```
https://joblet-eight.vercel.app
        ↓ (ALL requests)
        Express Server (serving only /api)
                ↓
Routes like /dashboard, /apply-job/123 → 404
Assets like /assets/logo.png → 404
```
- Everything goes to Express server
- Server doesn't know how to serve SPA routes or client files
- No static file serving configured
- No fallback to index.html for client-side routing

---

## 📂 Project Structure Analysis

```
job-main/
├── client/                    (React + Vite)
│   ├── vite.config.js         → Builds to client/dist/
│   ├── .env                   → VITE_BACKEND_URL=http://localhost:3000 ❌
│   ├── vercel.json            → Has SPA config but not used
│   └── src/
│
├── server/                    (Node.js + Express)
│   ├── server.js              → Missing static + catch-all route ❌
│   ├── vercel.json            → References wrong paths
│   └── config/
│
├── vercel.json                → Root config (only config that matters)
├── package.json               → Missing build scripts
└── FoloUp/                    (Next.js project - separate)
```

---

## 🔧 Issues in Detail

### Issue #1: Server Not Serving Client Static Files

**File**: [server/server.js](server/server.js)

**Problem**: 
```javascript
// Current: Only serves uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Missing: Client static files and SPA fallback
// Missing: app.use(express.static(path.join(__dirname, '../client/dist')));
// Missing: app.get('*', (req, res) => res.sendFile(..., 'index.html'));
```

**Why it breaks**:
- Request to `/apply-job/123` → Express doesn't match any route → 404
- Request to `/assets/logo.png` → No static middleware → 404
- Assets bundled in `client/dist` are never served

**Fix Required**: Add static middleware and catch-all SPA route

---

### Issue #2: Backend URL Hardcoded to Localhost

**File**: [client/.env](client/.env)

**Problem**:
```
VITE_BACKEND_URL=http://localhost:3000
```

**Why it breaks**:
- In production, client code tries to call `http://localhost:3000` (doesn't exist)
- Should call `/api` (same origin, relative path)
- API calls from browser console show `http://localhost:3000/api/...` → fails

**Fix Required**: Remove hardcoded URL for production

---

### Issue #3: Vercel Configuration Not Monorepo-Ready

**File**: [vercel.json](vercel.json)

**Problem**:
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "server",  // Wrong! Should build client first
  "rewrites": [{
    "source": "/api/(.*)",
    "destination": "/server/:1"
  }]
}
```

**Why it breaks**:
- Only Vercel root config is read (client/vercel.json is ignored)
- `npm run build` in root doesn't build client
- outputDirectory points to server folder, not dist folder
- Client build never happens, so no static files exist

**Fix Required**: Configure root vercel.json for monorepo setup

---

### Issue #4: Missing Build Scripts

**File**: [package.json](package.json)

**Problem**:
```json
{
  "scripts": {
    // Missing: "build" command that builds both client and server
    // Missing: "start" command that serves everything
  }
}
```

**Why it breaks**:
- Vercel runs `npm run build` but no build script exists or it doesn't build client
- Server can't serve client files because they don't exist

**Fix Required**: Add build and start scripts

---

### Issue #5: Environment Variables Not Set

**Files**: 
- [server/config/loadEnv.js](server/config/loadEnv.js)
- [client/.env](client/.env)

**Problem**:
- No production environment variables configured in Vercel
- Firebase/Supabase credentials may not be loaded
- API keys missing

**Fix Required**: Add environment variables to Vercel project settings

---

## ✅ Step-by-Step Fix Plan

### Phase 1: Fix Client-Server Integration (CRITICAL)

#### Step 1.1: Update Root package.json
**File**: [package.json](package.json)

Add build and start scripts:
```json
{
  "scripts": {
    "build": "cd client && npm run build && cd ../server && npm install",
    "start": "node server/server.js",
    "dev": "concurrently \"cd client && npm run dev\" \"cd server && npm run dev\""
  }
}
```

**Why**: Vercel needs to know how to build the entire project

---

#### Step 1.2: Update Server to Serve Client Files
**File**: [server/server.js](server/server.js)

Add after express middleware setup (around line 68):

```javascript
// Serve client static files
const path = require('path');
app.use(express.static(path.join(__dirname, '../client/dist')));

// SPA fallback - route all non-API requests to index.html
app.get('*', (req, res) => {
    if (!req.path.startsWith('/api') && !req.path.startsWith('/uploads')) {
        res.sendFile(path.join(__dirname, '../client/dist/index.html'));
    } else {
        res.status(404).send('Not Found');
    }
});
```

**Why**: 
- Serves static assets (JS, CSS, images) from client/dist
- Falls back to index.html for client-side routes
- Preserves /api and /uploads special routing

---

#### Step 1.3: Fix Client Backend URL
**File**: [client/.env](client/.env)

Change from:
```
VITE_BACKEND_URL=http://localhost:3000
```

To:
```
VITE_BACKEND_URL=
```

**Note**: Empty string = use relative paths (same origin)

**Also check**: [client/src/config](client/src/config) or wherever API base URL is configured

Update API client config to:
```javascript
// If using environment variable
const baseURL = process.env.VITE_BACKEND_URL || '/api';

// Or hardcode for production
const baseURL = window.location.origin + '/api';
```

---

#### Step 1.4: Update Root vercel.json
**File**: [vercel.json](vercel.json)

Replace with:
```json
{
  "version": 2,
  "buildCommand": "npm run build",
  "outputDirectory": "server",
  "env": {
    "NODE_ENV": "production"
  },
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": "/server/:1"
    },
    {
      "source": "/(.*)",
      "destination": "/server/$1"
    }
  ]
}
```

**Why**: Routes all requests through server, which now serves client static files

---

### Phase 2: Set Environment Variables (HIGH)

#### Step 2.1: Add Vercel Environment Variables

In Vercel Project Settings → Environment Variables, add:

```
NODE_ENV=production
FIREBASE_PROJECT_ID=jobfinder-b817d
GEMINI_API_KEY=<your-key>
CLOUDINARY_NAME=<your-name>
CLOUDINARY_API_KEY=<your-key>
CLOUDINARY_API_SECRET=<your-secret>
SUPABASE_URL=<your-url>
SUPABASE_KEY=<your-key>
```

**Check** [server/config/loadEnv.js](server/config/loadEnv.js) for required variables

---

#### Step 2.2: Client Environment Variables

In Vercel, ensure these are also set:
```
VITE_BACKEND_URL=
VITE_FIREBASE_PROJECT_ID=jobfinder-b817d
```

---

### Phase 3: Testing & Verification

#### Step 3.1: Test Locally with Production Build
```bash
# Build client
cd client
npm run build

# Test server serves client
cd ../server
npm start

# Visit http://localhost:3000
# - Check /dashboard loads (not 404)
# - Check /assets/*.png loads
# - Check API calls work
# - Check console for errors
```

---

#### Step 3.2: Verify File Structure Before Deploy
```bash
# Check if these exist:
ls client/dist/          # Should contain index.html, js/, css/
ls client/dist/index.html  # Critical file

# Check server can require client
node -e "require('path').join(__dirname, '../client/dist/index.html')"
```

---

#### Step 3.3: Check Network Requests
Open DevTools → Network tab, verify:
- ✅ `GET /` → 200 (index.html)
- ✅ `GET /assets/*.js` → 200 (bundled JS)
- ✅ `GET /assets/*.css` → 200 (bundled CSS)
- ✅ `GET /api/jobs` → 200 or appropriate code (API calls work)
- ❌ None return 404

---

### Phase 4: Deploy to Production

#### Step 4.1: Commit Changes
```bash
git add .
git commit -m "Fix: Configure monorepo for production deployment - serve client from server"
git push
```

---

#### Step 4.2: Trigger Vercel Deploy
- Push to main branch, or
- Redeploy from Vercel dashboard

---

#### Step 4.3: Monitor Production
- Check [joblet-eight.vercel.app](https://joblet-eight.vercel.app)
- Open DevTools → Console, Network
- Test navigation to various routes
- Check API calls in Network tab

---

## 🐛 Debugging Checklist

When 404 still occurs, check:

| Check | Command | Expected |
|-------|---------|----------|
| Client built? | `ls client/dist/` | Has index.html, js/, css/ |
| Server config correct? | Check server.js | Has static + catch-all |
| Backend URL? | DevTools Console → API call URL | Should be `/api/*` not `http://localhost` |
| Environment vars? | Vercel Settings | All set for production |
| Express.static path? | Check server.js line | Correct relative path to dist |
| Vite build output? | `cat client/dist/index.html` | Valid HTML, no errors |

---

## 📊 File Changes Summary

| File | Current Status | Required Changes | Priority |
|------|---|---|---|
| [server/server.js](server/server.js) | Missing static serve | Add 5 lines | 🔴 CRITICAL |
| [client/.env](client/.env) | Hardcoded localhost | Remove localhost URL | 🔴 CRITICAL |
| [vercel.json](vercel.json) | Incomplete | Update rewrite rules | 🔴 CRITICAL |
| [package.json](package.json) | Missing scripts | Add build script | 🔴 CRITICAL |
| [client/vite.config.js](client/vite.config.js) | Check OK | May need review | 🟢 OK |
| [server/config/loadEnv.js](server/config/loadEnv.js) | Check OK | Verify env vars | 🟡 HIGH |

---

## 🎯 Success Criteria

✅ Issue resolved when:
1. Navigation to `/dashboard` returns 200, not 404
2. API calls to `/api/jobs` work from production
3. Static assets (CSS, JS, images) load without 404
4. Console has no 404 errors
5. Application functions identically to localhost

---

## 📝 Additional Notes

### Why This Happens
- **Monorepo Complexity**: Having client and server in one repo requires careful Vercel configuration
- **SPA Routing**: Single Page Apps need all non-API routes to return index.html
- **Localhost Deception**: Vite dev server masks the issue by running separately

### Common Mistakes to Avoid
- ❌ Don't delete `client/dist` - needed for production
- ❌ Don't commit `node_modules` to git
- ❌ Don't use absolute URLs for API calls (use relative paths)
- ❌ Don't forget `npm install` in server directory

### FoloUp Project Note
The `FoloUp/` folder contains a separate Next.js project. This should be:
- Deployed separately to Vercel, OR
- Removed from this deployment

For now, focus on fixing the main client-server integration.

---

## 🔄 Post-Fix Verification

After implementing all fixes, run:

```bash
# 1. Clean build
rm -rf client/dist server/node_modules

# 2. Fresh install and build
npm install
npm run build

# 3. Start server
npm start

# 4. Test all routes
# - http://localhost:3000/             → Dashboard loads
# - http://localhost:3000/apply-job/1  → Page loads
# - http://localhost:3000/api/jobs     → JSON response
# - http://localhost:3000/admin        → Page loads
```

---

**Last Updated**: 2026-06-16  
**Status**: Ready for Implementation  
**Estimated Fix Time**: 30-45 minutes  

