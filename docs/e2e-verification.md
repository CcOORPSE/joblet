# E2E verification checklist

Manual test scripts for Phase 6 QA. Run on Chrome desktop (1280px) and mobile emulator (375px).

**Prerequisites:** Client + server running, Firebase Auth configured, `GEMINI_API_KEY` set.

```bash
cd server && npm run server
cd client && npm run dev
```

---

## Applicant flow

| Step | Action | Expected |
|------|--------|----------|
| A1 | Sign in with Google (candidate tab) | Lands on `/app/chat` |
| A2 | Tap **Find remote jobs** chip | Bot reply with job cards |
| A3 | Attach PDF, ask "What's my ATS score?" | Score gauge renders |
| A4 | Open **Activity** tab | Events or application summary visible |
| A5 | Settings → **Sign out** | Redirect to `/`, session cleared |
| A6 | **Quick Apply** on a job card | `/apply-job/:id` loads |
| A7 | Visit `/chatbot` | Redirects to `/app/chat` |
| A8 | Reload `/app/chat` while signed in | Chat session restores |

---

## Recruiter flow

| Step | Action | Expected |
|------|--------|----------|
| R1 | Recruiter login | Dashboard → manage jobs |
| R2 | Open **AI Assistant** | HireBot welcome + chips |
| R3 | "Pipeline summary this week" | Metric cards, own data only |
| R4 | "Top applicants" or pending apps | Applicant cards with Open link |
| R5 | "Draft job post for Senior React" | JD text + **Use in Add Job** works |
| R6 | Open **Analytics** | Totals and top jobs list |
| R7 | Visit `/app/chat` while logged in as recruiter | Redirect to dashboard |

---

## Security

| Step | Action | Expected |
|------|--------|----------|
| S1 | Applicant token on `POST /api/chatbot/recruiter/chat` | 403 |
| S2 | Recruiter token on another company's application ID | 403 or empty |
| S3 | Unauthenticated `POST /api/chatbot/applicant/chat` | 401 |
| S4 | Rate limit: 60+ chat messages in 15 min | 429 with friendly message |

---

## Firestore indexes

Deploy before Activity/Chat session QA at scale:

```bash
firebase deploy --only firestore:indexes
```

Index definitions: [`firestore.indexes.json`](../firestore.indexes.json)

---

## Related

- [04 — Implementation roadmap](./04-e2e-implementation-roadmap.md)
- [05 — API & data model](./05-api-data-model.md)
