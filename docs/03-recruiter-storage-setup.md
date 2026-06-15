# Recruiter registration — Firebase Storage setup

Recruiter sign-up uploads a **company logo**. The server stores it in **Firebase Storage** (or Cloudinary if configured).

If you see **"bucket is not created"** or **"Storage bucket not found"**, Firebase Storage has not been enabled yet for your project.

---

## Step-by-step fix (Firebase Storage)

### 1. Open Firebase Storage

Go to: [https://console.firebase.google.com/project/jobfinder-de280/storage](https://console.firebase.google.com/project/jobfinder-de280/storage)

(Replace `jobfinder-de280` with your project ID if different.)

### 2. Enable Storage

1. Click **Get started**
2. Choose **Start in production mode** (rules are deployed from this repo)
3. Pick a **location** close to your users (e.g. `asia-southeast1` for Singapore)
4. Click **Done**

### 3. Copy the bucket name

On the Storage page, note the bucket URL. It is usually one of:

- `jobfinder-de280.firebasestorage.app` (newer projects)
- `jobfinder-de280.appspot.com` (older projects)

### 4. Update `server/.env`

```env
FIREBASE_STORAGE_BUCKET=jobfinder-de280.firebasestorage.app
```

Use the **exact** name shown in Firebase Console.

### 5. Deploy storage rules (optional but recommended)

From the project root:

```bash
firebase login
firebase use jobfinder-de280
firebase deploy --only storage
```

### 6. Restart the server

```bash
cd server
npm run server
```

You should see in the terminal:

```
Firebase Storage ready: jobfinder-de280.firebasestorage.app
```

### 7. Register again

Open the app → Recruiter → Sign Up → upload logo → submit.

---

## Alternative: Cloudinary (no Firebase Storage)

Add to `server/.env`:

```env
CLOUDINARY_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_SECRET_KEY=your_api_secret
```

Restart the server. Logos upload to Cloudinary instead of Firebase Storage.

---

## Verify service account permissions

The file `server/*firebase-adminsdk*.json` must belong to project `jobfinder-de280`.

In [Google Cloud IAM](https://console.cloud.google.com/iam-admin/iam?project=jobfinder-de280), the service account needs:

- **Firebase Admin SDK Administrator Service Agent** (or Editor), and
- **Storage Admin** (or at least create objects in the default bucket)

Usually the default Firebase Admin service account already has this once Storage is enabled.

---

## Still failing?

Check the **server terminal** when you start it:

- `WARNING: Firebase Storage is not available` → Storage not enabled or wrong bucket name
- `Firebase Storage ready: ...` → Storage is OK; retry registration

If the server log shows `ready` but sign-up still fails, share the exact error message from the browser toast or Network tab (`POST /api/company/register`).
