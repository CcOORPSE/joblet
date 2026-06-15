# Firebase security rules

This project includes Firestore and Storage rules that lock down client access.

## What the rules enforce

| Resource | Client access | Server access |
|----------|---------------|---------------|
| `jobs` (visible only) | Read via realtime listener | Full (Admin SDK) |
| `users`, `companies`, `applications`, `chat_sessions`, `activity_logs`, `resume_analyses` | Denied | Full (Admin SDK) |
| Storage `resumes/*` | Denied | Signed URLs via Admin SDK |

## Deploy rules

Install the Firebase CLI and log in:

```bash
npm install -g firebase-tools
firebase login
firebase use your-project-id
firebase deploy --only firestore:rules,storage
```

## Required Firestore index

The client jobs listener uses `where("visible", "==", true)` and sorts by `date` in memory — **no composite index is required** for local dev.

For large job collections in production, you may optionally add a composite index (`visible` + `date`) and switch the client query to use `orderBy("date", "desc")` for server-side sorting:

```bash
firebase deploy --only firestore:indexes
```

Index definition is in `firestore.indexes.json` (optional).

## Admin access

Set the Firebase custom claim for admin users:

```bash
cd server
node scripts/set-admin-claim.js admin@yourcompany.com
```

The user must sign out and sign back in. Admin API routes require `role: "admin"` in the ID token custom claims.
