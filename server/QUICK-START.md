# 🚀 Quick Start - Deploy to Render

## Your Backend URL
**https://backend-server-lzox.onrender.com**

---

## ⚡ 3-Step Deployment

### 1️⃣ Update Dependencies
```bash
cd server
npm install
```

### 2️⃣ Set Environment Variables in Render

Go to: https://dashboard.render.com → Your Service → Environment

**Copy and paste these** (replace with your actual values):

```env
PORT=3000
NODE_ENV=production
GEMINI_API_KEY=your_actual_gemini_key
FRONTEND_URL=https://your-frontend.com,http://localhost:5173
FIREBASE_STORAGE_BUCKET=jobfinder-de280.firebasestorage.app
FIREBASE_PROJECT_ID=jobfinder-de280
FIREBASE_CLIENT_EMAIL=your-firebase-email@jobfinder-de280.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour_Key\n-----END PRIVATE KEY-----\n"
```

### 3️⃣ Push to GitHub
```bash
git add .
git commit -m "Fix: Deployment configuration"
git push origin main
```

Render will auto-deploy! ✅

---

## ✅ Test Your Deployment

Visit: **https://backend-server-lzox.onrender.com/**

Should see: `"API Working with Firebase"`

---

## 🔧 Build Settings in Render

- **Build Command**: `npm install`
- **Start Command**: `node server.js`

---

## 📱 Update Your Frontend

In your client `.env`:
```env
VITE_API_URL=https://backend-server-lzox.onrender.com
```

---

## ❓ Still Getting Errors?

Check the full guide: `DEPLOYMENT.md`

Common fixes:
- ✅ Ensure all environment variables are set
- ✅ Check Firebase credentials format
- ✅ Verify FRONTEND_URL includes your domain
- ✅ Check Render logs for specific errors

---

**That's it! Your backend should be live now.** 🎉
