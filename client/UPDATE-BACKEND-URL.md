# 🔗 Update Backend URL in Client

## Current Configuration
Your client is currently pointing to: `http://localhost:3000`

## Production Configuration

Update your `client/.env` file:

```env
# Change this line:
VITE_BACKEND_URL=http://localhost:3000

# To this:
VITE_BACKEND_URL=https://backend-server-lzox.onrender.com
```

---

## 📝 Full .env Configuration

Your complete `client/.env` should look like:

```env
# Backend API URL
VITE_BACKEND_URL=https://backend-server-lzox.onrender.com

# Firebase Configuration
VITE_FIREBASE_API_KEY=AIzaSyDYdR_SrTI1FxsGQQ5j52yw0v_pMDbd56U
VITE_FIREBASE_AUTH_DOMAIN=jobfinder-b817d.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=jobfinder-b817d
VITE_FIREBASE_STORAGE_BUCKET=jobfinder-b817d.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=713946545662
VITE_FIREBASE_APP_ID=1:713946545662:web:b6ff8841699e2de3ad14af
VITE_FIREBASE_MEASUREMENT_ID=G-JFCCE6XE9T
```

---

## 🔄 For Development vs Production

### Option 1: Separate .env files (Recommended)

Create two files:

**`.env.development`** (for local development):
```env
VITE_BACKEND_URL=http://localhost:3000
```

**`.env.production`** (for production build):
```env
VITE_BACKEND_URL=https://backend-server-lzox.onrender.com
```

Vite will automatically use the correct file based on the mode.

### Option 2: Single .env file

Just update the URL based on what you're working on:
- Local development: `http://localhost:3000`
- Production: `https://backend-server-lzox.onrender.com`

---

## 🚀 After Updating

1. **Restart your dev server**:
   ```bash
   npm run dev
   ```

2. **For production build**:
   ```bash
   npm run build
   ```

3. **Test the connection**:
   - Open browser console
   - Check network tab for API calls
   - Should see requests going to `backend-server-lzox.onrender.com`

---

## ⚠️ Important Notes

1. **CORS Configuration**: Make sure your backend `FRONTEND_URL` environment variable includes your frontend domain
   
2. **HTTPS**: Production backend uses HTTPS, so your frontend should too

3. **Don't commit sensitive data**: Add `.env` to `.gitignore` (already done)

---

## ✅ Verification

Test if backend is accessible:

```bash
# From your terminal
curl https://backend-server-lzox.onrender.com/

# Should return: "API Working with Firebase"
```

Or visit in browser: https://backend-server-lzox.onrender.com/

---

**Done! Your client will now connect to the production backend.** 🎉
