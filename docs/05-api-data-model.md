# 05 — API & data model

API contracts, Firestore schemas, indexes, and activity logging for the dual-role chatbot platform.

---

## API overview

```mermaid
flowchart LR
  subgraph applicant [Applicant APIs]
    AC[POST /chatbot/applicant/chat]
    AP[POST /chatbot/applicant/parse-resume]
    AS[GET /chatbot/applicant/sessions]
    AL[GET /activity]
  end

  subgraph recruiter [Recruiter APIs]
    RC[POST /chatbot/recruiter/chat]
    RS[GET /chatbot/recruiter/sessions]
    AN[GET /company/analytics]
  end

  subgraph existing [Existing APIs]
    JG[GET /api/jobs]
    US[GET/POST /api/users]
    CO[/api/company/*]
  end
```

**Base URL:** `VITE_BACKEND_URL` (default `http://localhost:3000`)

**Auth header (all protected routes):**

```
Authorization: Bearer <Firebase ID token>
```

---

## Applicant chatbot API

Middleware: `protectRoute("user")` on all routes below.

### POST `/api/chatbot/applicant/chat`

Process a chat message with optional resume context.

**Request body (JSON):**

```json
{
  "message": "Find remote React jobs",
  "history": [
    { "role": "user", "content": "Hi" },
    { "role": "assistant", "content": "Hello! How can I help?" }
  ],
  "resumeText": "optional parsed resume plain text",
  "sessionId": "optional firestore session id"
}
```

**Response 200:**

```json
{
  "success": true,
  "reply": "Here are some matches...\n[JOB_CARD:abc123]",
  "intent": "JOB_MATCH",
  "jobsAvailable": 15,
  "sessionId": "sess_xyz"
}
```

**Errors:**

| Status | Condition |
|--------|-----------|
| 400 | Missing `message` |
| 401 | Invalid/missing token |
| 403 | Token role is not `user` |
| 500 | Gemini or server error |

**Intents:** `ATS_SCAN` | `JOB_MATCH` | `CAREER_ADVICE` | `GENERAL`

**Side effects:**

- Append messages to `chat_sessions/{sessionId}` if provided
- `activityLogger.log(req.user.uid, 'chat_message', { intent, sessionId })`

---

### POST `/api/chatbot/applicant/parse-resume`

Parse uploaded PDF to plain text.

**Request:** `multipart/form-data`, field `resume` (PDF)

**Response 200:**

```json
{
  "success": true,
  "resumeText": "...",
  "pageCount": 2
}
```

Uses [`pdfUpload`](../server/config/multer.js) memory storage + [`parsePdfBuffer`](../server/utils/parsePdf.js).

---

### GET `/api/chatbot/applicant/sessions`

List chat sessions for current user.

**Query:** `limit` (default 20), `cursor` (optional doc id for pagination)

**Response 200:**

```json
{
  "success": true,
  "sessions": [
    {
      "id": "sess_xyz",
      "title": "Remote React jobs",
      "messageCount": 8,
      "createdAt": "2026-05-31T10:00:00.000Z",
      "updatedAt": "2026-05-31T10:15:00.000Z"
    }
  ]
}
```

---

### POST `/api/chatbot/applicant/sessions`

Create or update a session.

**Request:**

```json
{
  "sessionId": "optional — omit to create",
  "title": "optional — auto from first message",
  "messages": [
    { "role": "user", "content": "..." },
    { "role": "assistant", "content": "..." }
  ]
}
```

**Response 200:**

```json
{
  "success": true,
  "sessionId": "sess_xyz"
}
```

---

### Legacy alias (migration)

| Legacy | Target |
|--------|--------|
| `POST /api/chatbot/chat` | `POST /api/chatbot/applicant/chat` |
| `POST /api/chatbot/parse-resume` | `POST /api/chatbot/applicant/parse-resume` |

Remove legacy routes after client migration.

---

## Recruiter chatbot API

Middleware: `protectCompany` (requires `role === "recruiter"`).

### POST `/api/chatbot/recruiter/chat`

**Request body:**

```json
{
  "message": "How many applicants did I get this week?",
  "history": [],
  "sessionId": "optional"
}
```

**Response 200:**

```json
{
  "success": true,
  "reply": "This week you received...\n[METRIC_CARD:applications:12]\n[METRIC_CARD:pending:5]",
  "intent": "PIPELINE_SUMMARY",
  "sessionId": "sess_rec_abc"
}
```

**Intents:** `PIPELINE_SUMMARY` | `APPLICANT_SCREEN` | `JOB_PERFORMANCE` | `JD_GENERATOR` | `GENERAL_HR`

**Data scope:** All queries filter `companyId === req.company._id` (uid).

---

### GET `/api/chatbot/recruiter/sessions`

Same shape as applicant sessions; `role: "recruiter"` filter on `userId` (= company uid).

---

## Activity API

Middleware: `protectRoute("user")`.

### GET `/api/activity`

Applicant activity feed for Activity tab.

**Query:** `limit` (default 20), `cursor`

**Response 200:**

```json
{
  "success": true,
  "activities": [
    {
      "id": "act_123",
      "type": "application_submitted",
      "title": "Applied to Senior React Developer",
      "metadata": {
        "jobId": "job_abc",
        "applicationId": "app_xyz"
      },
      "timestamp": "2026-05-31T09:00:00.000Z"
    }
  ]
}
```

---

## Company analytics API

Middleware: `protectCompany`.

### GET `/api/company/analytics`

**Response 200:**

```json
{
  "success": true,
  "metrics": {
    "totalApplications": 48,
    "applicationsThisWeek": 12,
    "openJobs": 6,
    "pendingReview": 5
  },
  "topJobs": [
    { "jobId": "j1", "title": "Senior React Developer", "applicantCount": 18 }
  ],
  "cachedAt": "2026-05-31T10:00:00.000Z"
}
```

Optional: read through `recruiter_insights_cache` with 5-minute TTL.

---

## Rich token reference

### Applicant tokens (in `reply` text)

| Token | Example | UI component |
|-------|---------|--------------|
| Score badge | `[SCORE_BADGE:85]` | `ScoreGauge` |
| Job card | `[JOB_CARD:firestoreJobId]` | `ChatJobCard` |

### Recruiter tokens

| Token | Example | UI component |
|-------|---------|--------------|
| Metric | `[METRIC_CARD:applications:12]` | `MetricCard` |
| Applicant | `[APPLICANT_CARD:applicationId]` | `ApplicantCard` |
| Job performance | `[JOB_PERF:jobId]` | `JobPerfCard` |

**Parsing:** Client-side regex split before `dangerouslySetInnerHTML` for markdown segments (existing pattern in [`Chatbot.jsx`](../client/src/pages/Chatbot.jsx)).

---

## Firestore collections

### Existing (unchanged schema, documented for reference)

#### `users`

| Field | Type | Notes |
|-------|------|-------|
| `name` | string | |
| `email` | string | |
| `role` | string | `"user"` |
| `resume` | string | URL |
| `image` | string | Avatar URL |

#### `companies`

| Field | Type | Notes |
|-------|------|-------|
| `name` | string | |
| `email` | string | |
| `role` | string | `"recruiter"` |
| `image` | string | Logo URL |

#### `jobs`

| Field | Type | Notes |
|-------|------|-------|
| `title` | string | |
| `description` | string | HTML from Quill |
| `location` | string | |
| `level` | string | |
| `category` | string | |
| `salary` | number | |
| `visible` | boolean | |
| `companyId` | string | Recruiter uid |

#### `applications`

| Field | Type | Notes |
|-------|------|-------|
| `userId` | string | |
| `jobId` | string | |
| `companyId` | string | **Add if missing** — for recruiter scoping |
| `status` | string | Applied, Review, Interview, Rejected |
| `userDetails` | object | Denormalized name, email |
| `jobDetails` | object | Denormalized title |
| `date` | timestamp | |

#### `resume_analyses`

| Field | Type | Notes |
|-------|------|-------|
| `userId` | string | |
| `score` | number | |
| `report` | object | |
| `createdAt` | timestamp | |

---

### New collections

#### `chat_sessions`

| Field | Type | Notes |
|-------|------|-------|
| `userId` | string | Applicant uid or recruiter company uid |
| `role` | string | `"user"` \| `"recruiter"` |
| `title` | string | Auto-generated from first message |
| `messages` | array | `{ role, content, createdAt }[]` — cap at 100 messages |
| `createdAt` | timestamp | |
| `updatedAt` | timestamp | |

**Document ID:** Auto-generated

**Security rule (when added):** `request.auth.uid == resource.data.userId`

---

#### `activity_logs`

| Field | Type | Notes |
|-------|------|-------|
| `userId` | string | Applicant uid only |
| `type` | string | See event types below |
| `title` | string | Human-readable summary |
| `metadata` | map | ids, scores, etc. |
| `timestamp` | timestamp | |

**Event types:**

| type | When logged |
|------|-------------|
| `login` | Successful applicant auth |
| `chat_message` | Chat sent |
| `resume_uploaded` | Resume file saved to profile |
| `resume_analyzed` | ATS analysis completed |
| `application_submitted` | New application |
| `application_status_changed` | Recruiter updates status (appears in applicant feed) |
| `job_saved` | Bookmark feature (future) |

---

#### `recruiter_insights_cache`

| Field | Type | Notes |
|-------|------|-------|
| `companyId` | string | |
| `metric` | string | e.g. `pipeline_summary` |
| `value` | map | Precomputed aggregates |
| `computedAt` | timestamp | TTL check client/server |

**Document ID:** `{companyId}_{metric}`

---

## Firestore indexes

Deploy via Firebase console or `firestore.indexes.json`.

```json
{
  "indexes": [
    {
      "collectionGroup": "chat_sessions",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "userId", "order": "ASCENDING" },
        { "fieldPath": "role", "order": "ASCENDING" },
        { "fieldPath": "updatedAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "activity_logs",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "userId", "order": "ASCENDING" },
        { "fieldPath": "timestamp", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "applications",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "companyId", "order": "ASCENDING" },
        { "fieldPath": "date", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "applications",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "userId", "order": "ASCENDING" },
        { "fieldPath": "jobId", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "resume_analyses",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "userId", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "jobs",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "companyId", "order": "ASCENDING" },
        { "fieldPath": "visible", "order": "ASCENDING" }
      ]
    }
  ]
}
```

---

## Activity logger service

**Path:** `server/services/chat/activityLogger.js`

```javascript
// Pseudocode
export async function logActivity(userId, type, { title, metadata }) {
  await db.collection("activity_logs").add({
    userId,
    type,
    title: title || defaultTitle(type, metadata),
    metadata: metadata || {},
    timestamp: FieldValue.serverTimestamp()
  });
}
```

**Call sites:**

| Event | Location |
|-------|----------|
| `chat_message` | `applicantChatbotController` after successful reply |
| `resume_uploaded` | `userController` resume upload |
| `resume_analyzed` | `resumeController` after analysis |
| `application_submitted` | `userController` apply |
| `application_status_changed` | `comapanyController` change-status |

---

## Server route mounting (target)

```javascript
// server.js
import applicantChatbotRoutes from './routes/applicantChatbotRoutes.js';
import recruiterChatbotRoutes from './routes/recruiterChatbotRoutes.js';
import activityRoutes from './routes/activityRoutes.js';

app.use('/api/chatbot/applicant', protectRoute('user'), applicantChatbotRoutes);
app.use('/api/chatbot/recruiter', protectCompany, recruiterChatbotRoutes);
app.use('/api/activity', protectRoute('user'), activityRoutes);
```

---

## Gemini configuration

| Setting | Applicant | Recruiter |
|---------|-----------|-----------|
| Model | `gemini-1.5-flash` | `gemini-1.5-flash` |
| maxOutputTokens | 2048 | 2048 |
| temperature | 0.7 | 0.5 (more factual) |

**Env:** `GEMINI_API_KEY` required in `server/.env`

---

## Client API helpers (AppContext)

| Function | Endpoint |
|----------|----------|
| `sendChatMessage(msg, history, resumeText)` | `POST /api/chatbot/applicant/chat` |
| `parseResumeForChat(file)` | `POST /api/chatbot/applicant/parse-resume` |
| `fetchChatSessions()` | `GET /api/chatbot/applicant/sessions` |
| `fetchActivity()` | `GET /api/activity` |
| `sendRecruiterChatMessage(msg, history)` | `POST /api/chatbot/recruiter/chat` |
| `fetchRecruiterAnalytics()` | `GET /api/company/analytics` |

All use `Authorization: Bearer` from Firebase `user.getIdToken()` or `companyToken`.

---

## Migration checklist

- [ ] Add `companyId` to existing `applications` documents (batch script)
- [ ] Deploy Firestore indexes
- [ ] Mount split chat routes
- [ ] Update `AppContext` endpoints
- [ ] Keep legacy `/api/chatbot/chat` for 2 weeks
- [ ] Add `firestore.rules` mirroring server scoping (recommended)

---

## Related documents

- [01 — Architecture](./01-architecture-role-separation.md)
- [04 — Implementation roadmap](./04-e2e-implementation-roadmap.md)
- [02 — Applicant UX](./02-applicant-chatbot-ux.md)
- [03 — Recruiter UX](./03-recruiter-dashboard-chatbot-ux.md)
