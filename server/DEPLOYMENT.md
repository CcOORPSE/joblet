# Deployment Guide for Render

## Your Backend URL
🔗 **https://backend-server-lzox.onrender.com**

## Issues Fixed

1. ✅ Changed `main` field in package.json from `index.js` to `server.js`
2. ✅ Created `render.yaml` configuration file
3. ✅ Updated `firebase-admin` from v10.3.0 to v13.10.0 (fixes 14 security vulnerabilities)
4. ✅ Removed MongoDB/Mongoose dependency - now using Firebase only
5. ✅ Documented all required environment variables

---

## 🚀 Quick Deployment Steps

### Step 1: Update Render Repository Settings

**IMPORTANT**: Your Render deployment is currently pointing to the wrong repository!

Current (wrong): `https://github.com/jayeshpandey01/backend`
Correct: `https://github.com/jayeshpandey01/job_server`

**To fix this:**
1. Go to your Render dashboard: https://dashboard.render.com
2. Select your service
3. Go to **Settings** → **Build & Deploy**
4. Update the **Repository** field to: `https://github.com/jayeshpandey01/job_server`
5. Click **Save Changes**

### Step 2: Update Dependencies Locally

```bash
cd server
npm install
```

This will update firebase-admin and remove mongoose dependency.

### Step 3: Configure Render Dashboard

Go to: https://dashboard.render.com/web/srv-YOUR-SERVICE-ID

#### Build & Deploy Settings:
- **Build Command**: `npm install`
- **Start Command**: `node server.js`
- **Node Version**: 24.14.1 (or leave as default)

### Step 4: Set Environment Variables in Render

Go to your Render service → **Environment** tab and add these:

#### ✅ Required Variables:

```env
PORT=3000
NODE_ENV=production

# Your Gemini API Key
GEMINI_API_KEY=your_actual_gemini_api_key_here

# Your Frontend URL (update with your actual frontend domain)
FRONTEND_URL=https://your-frontend-domain.com,http://localhost:5173

# Firebase Storage Bucket
FIREBASE_STORAGE_BUCKET=jobfinder-de280.firebasestorage.app
```

#### 🔧 Optional Variables:

```env
GEMINI_MODEL=gemini-2.0-flash
SENTRY_DSN=your_sentry_dsn_if_you_have_one

# Cloudinary (if you want to use it for company logos)
CLOUDINARY_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_SECRET_KEY=your_cloudinary_secret

# Supabase (for job scraper)
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### Step 5: Firebase Admin SDK Setup

⚠️ **IMPORTANT**: You need to add Firebase credentials to Render.

#### Option A: Environment Variables (Recommended)

Extract values from your `jobfinder-de280-firebase-adminsdk-fbsvc-9b2e4d657d.json` file and add to Render:

```env
FIREBASE_PROJECT_ID=jobfinder-de280
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@jobfinder-de280.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour_Private_Key_Here\n-----END PRIVATE KEY-----\n"
```

**Note**: The private key must include the `\n` characters and be wrapped in quotes.

#### Option B: Secret File (Alternative)

1. In Render Dashboard → **Environment** → **Secret Files**
2. Add file: `jobfinder-de280-firebase-adminsdk-fbsvc-9b2e4d657d.json`
3. Paste the entire JSON content

### Step 6: Push Changes to GitHub

```bash
# From the server directory
git add .
git commit -m "Fix: Remove MongoDB, use Firebase only"
git push origin main
```

Render will automatically detect changes and redeploy.

### Step 7: Update Client to Use Backend URL

Update your client `.env` file:

```env
VITE_API_URL=https://backend-server-lzox.onrender.com
```

---

## ✅ Verification Checklist

After deployment, verify these:

1. **Backend Health Check**
   - Visit: https://backend-server-lzox.onrender.com/
   - Should see: "API Working with Firebase"

2. **Build Logs**
   - Check Render logs for successful build
   - No "Cannot find module" errors
   - No MongoDB connection errors

3. **Environment Variables**
   - All required variables are set
   - Firebase credentials are properly configured

4. **Security**
   - Run `npm audit` - should show 0 vulnerabilities
   - All dependencies updated

5. **CORS Configuration**
   - Frontend can make requests to backend
   - No CORS errors in browser console

---

## 🐛 Troubleshooting

### Error: "MongoAPIError: URI must include hostname, domain name, and tld"
**✅ FIXED**: Removed mongoose dependency. Server now uses Firebase only.

### Error: "Cannot find module '/opt/render/project/src/index.js'"
**✅ FIXED**: Updated package.json main field to `server.js`

### Error: Firebase Admin SDK initialization failed
**Solution**: 
1. Check if Firebase credentials are set in Render environment variables
2. Verify `FIREBASE_STORAGE_BUCKET` matches your Firebase project
3. Ensure private key includes `\n` characters

### Error: CORS blocked
**Solution**: 
1. Add your frontend URL to `FRONTEND_URL` environment variable
2. Format: `https://your-frontend.com,http://localhost:5173`

### Error: npm vulnerabilities
**✅ FIXED**: Updated firebase-admin to v13.10.0

### Server crashes on startup
**Check**:
1. Render logs for specific error messages
2. All required environment variables are set
3. Firebase service account JSON is valid
4. Repository URL is correct in Render settings

---

## 📋 Environment Variables Reference

Copy this template and fill in your actual values:

```env
# Server Configuration
PORT=3000
NODE_ENV=production

# AI Configuration
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-2.0-flash

# Frontend URLs (comma-separated)
FRONTEND_URL=https://your-frontend.com,http://localhost:5173

# Firebase Configuration
FIREBASE_STORAGE_BUCKET=jobfinder-de280.firebasestorage.app
FIREBASE_PROJECT_ID=jobfinder-de280
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@jobfinder-de280.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour_Key\n-----END PRIVATE KEY-----\n"

# Optional: Error Monitoring
SENTRY_DSN=your_sentry_dsn

# Optional: Cloudinary (for company logos)
CLOUDINARY_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_SECRET_KEY=your_secret

# Optional: Supabase (for job scraper)
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

---

## 🔒 Security Best Practices

1. ✅ Never commit `.env` files to Git
2. ✅ Never commit Firebase service account JSON to Git
3. ✅ Use Render's environment variables for all secrets
4. ✅ Keep dependencies updated: `npm audit fix`
5. ✅ Enable HTTPS only (Render does this by default)
6. ✅ Restrict CORS to your actual frontend domains
7. ✅ Use strong API keys and rotate them regularly

---

## 📊 Post-Deployment Tasks

1. **Test API Endpoints**
   ```bash
   # Test health check
   curl https://backend-server-lzox.onrender.com/
   
   # Test specific endpoints
   curl https://backend-server-lzox.onrender.com/api/jobs
   ```

2. **Monitor Logs**
   - Check Render dashboard for any errors
   - Set up log alerts if needed

3. **Performance**
   - Monitor response times
   - Consider upgrading Render plan if needed

4. **Backups**
   - Ensure Firebase backups are configured
   - Document your environment variables securely

---

## 🆘 Need Help?

- **Render Docs**: https://render.com/docs
- **Firebase Admin SDK**: https://firebase.google.com/docs/admin/setup
- **Check Logs**: Render Dashboard → Your Service → Logs

---

## 📝 Summary of Changes Made

| File | Change | Reason |
|------|--------|--------|
| `package.json` | `"main": "server.js"` | Fixed entry point |
| `package.json` | `firebase-admin: ^13.10.0` | Security patches |
| `package.json` | Removed `mongoose` | Using Firebase instead of MongoDB |
| `render.yaml` | Created new file | Deployment config |
| `server.js` | Removed MongoDB connection | Using Firebase only |
| `DEPLOYMENT.md` | Created this guide | Documentation |

**All changes are ready to commit and push!**
