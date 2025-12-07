# Manual Deployment to Render - Step by Step

This guide walks you through manually deploying your server to Render without using Blueprints.

## Prerequisites

- ✅ GitHub account with your code pushed
- ✅ Render account ([sign up here](https://render.com))
- ✅ Firebase project set up
- ✅ PostgreSQL database (we'll create one on Render)

---

## Step 1: Create PostgreSQL Database

1. **Go to Render Dashboard**
   - Visit [dashboard.render.com](https://dashboard.render.com)
   - Sign in or create an account

2. **Create New PostgreSQL Database**
   - Click **"New +"** button (top right)
   - Select **"PostgreSQL"**

3. **Configure Database**
   - **Name**: `stock-fantasy-db` (or your preferred name)
   - **Database**: `stockfantasy` (or your preferred name)
   - **User**: Leave default (auto-generated)
   - **Region**: Choose closest to your users (e.g., `Oregon (US West)` for US, `Frankfurt (EU)` for Europe)
   - **PostgreSQL Version**: `16` (latest)
   - **Plan**: 
     - **Free**: 90 days free, then $7/month (good for development)
     - **Starter**: $7/month (always on, better for production)

4. **Create Database**
   - Click **"Create Database"**
   - Wait 1-2 minutes for provisioning

5. **Copy Database URL**
   - Once created, go to database dashboard
   - Find **"Internal Database URL"** (starts with `postgresql://`)
   - **IMPORTANT**: Copy the **Internal** URL, not External
   - Format: `postgresql://user:password@hostname:5432/database`
   - **Save this URL** - you'll need it in Step 3

---

## Step 2: Create Web Service

1. **Go to Render Dashboard**
   - Click **"New +"** button
   - Select **"Web Service"**

2. **Connect Repository**
   - Click **"Connect account"** if not connected
   - Authorize Render to access your GitHub
   - Select your repository: `StockFantasySimulator` (or your repo name)
   - Click **"Connect"**

3. **Configure Service**
   - **Name**: `stock-fantasy-simulator` (or your preferred name)
   - **Region**: Same as your database (for lower latency)
   - **Branch**: `main` (or your default branch)
   - **Root Directory**: Leave empty (root of repo)
   - **Environment**: Select **"Node"**
   - **Build Command**: 
     ```
     npm ci && npm run build
     ```
   - **Start Command**: 
     ```
     npm start
     ```
   - **Plan**: 
     - **Free**: Spins down after 15 min inactivity (30s wake time)
     - **Starter**: $7/month (always on, no cold starts)

4. **Click "Create Web Service"**
   - Don't worry about environment variables yet - we'll add them next

---

## Step 3: Configure Environment Variables

1. **Go to Your Web Service**
   - Click on your service name in the dashboard
   - Click **"Environment"** tab (left sidebar)

2. **Add Environment Variables**
   Click **"Add Environment Variable"** for each:

   ### Required Variables:

   **NODE_ENV**
   - Key: `NODE_ENV`
   - Value: `production`
   - Click **"Save Changes"**

   **PORT**
   - Key: `PORT`
   - Value: `10000`
   - (Render sets this automatically, but good to have)
   - Click **"Save Changes"**

   **DATABASE_URL**
   - Key: `DATABASE_URL`
   - Value: `<paste-internal-database-url-from-step-1>`
   - Example: `postgresql://user:pass@dpg-xxxxx-a.oregon-postgres.render.com/stockfantasy`
   - Click **"Save Changes"**

   **SESSION_SECRET**
   - Key: `SESSION_SECRET`
   - Value: Generate with:
     ```bash
     openssl rand -base64 32
     ```
   - Or use: `your-very-long-random-secret-key-change-this-in-production`
   - Click **"Save Changes"**

   **FIREBASE_PROJECT_ID**
   - Key: `FIREBASE_PROJECT_ID`
   - Value: `stockfantasysimulator`
   - (Or your Firebase project ID)
   - Click **"Save Changes"**

   **FIREBASE_SERVICE_ACCOUNT**
   - Key: `FIREBASE_SERVICE_ACCOUNT`
   - Value: `<your-firebase-service-account-json>`
   - See "Get Firebase Service Account" section below
   - Click **"Save Changes"**

   **CORS_ORIGIN**
   - Key: `CORS_ORIGIN`
   - Value: `https://your-service-name.onrender.com`
   - Replace `your-service-name` with your actual service name
   - Example: `https://stock-fantasy-simulator.onrender.com`
   - Click **"Save Changes"**

3. **Verify All Variables**
   You should have 7 environment variables:
   - ✅ NODE_ENV
   - ✅ PORT
   - ✅ DATABASE_URL
   - ✅ SESSION_SECRET
   - ✅ FIREBASE_PROJECT_ID
   - ✅ FIREBASE_SERVICE_ACCOUNT
   - ✅ CORS_ORIGIN

---

## Step 4: Get Firebase Service Account

**📖 Detailed Guide:** See `HOW_TO_GET_FIREBASE_SERVICE_ACCOUNT.md` for step-by-step instructions with screenshots.

**Quick Steps:**

1. **Go to Firebase Console**
   - Visit [console.firebase.google.com](https://console.firebase.google.com)
   - Select your project: `stockfantasysimulator`

2. **Navigate to Service Accounts**
   - Click **⚙️ Settings** (gear icon) → **"Project settings"**
   - Click **"Service accounts"** tab

3. **Generate Private Key**
   - Click **"Generate new private key"** button
   - Click **"Generate key"** in the popup
   - JSON file will download

4. **Copy JSON Content**
   - Open the downloaded JSON file
   - Copy the **entire JSON content** (all of it, including curly braces)
   - It looks like:
     ```json
     {
       "type": "service_account",
       "project_id": "stockfantasysimulator",
       "private_key_id": "...",
       "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
       "client_email": "...",
       ...
     }
     ```

5. **Paste in Render**
   - Go back to Render → Your Service → Environment tab
   - Find `FIREBASE_SERVICE_ACCOUNT`
   - Paste the **entire JSON** (you can keep it as multi-line or single line)
   - Click **"Save Changes"**

**Direct Link:** [Firebase Service Accounts](https://console.firebase.google.com/project/stockfantasysimulator/settings/serviceaccounts/adminsdk)

---

## Step 5: Deploy

1. **Trigger Manual Deploy**
   - Go to your service dashboard
   - Click **"Manual Deploy"** → **"Deploy latest commit"**
   - Or push a new commit to trigger auto-deploy

2. **Monitor Build**
   - Click **"Logs"** tab to watch the build
   - First build takes 5-10 minutes
   - You'll see:
     ```
     ==> Cloning from https://github.com/...
     ==> Building...
     ==> Installing dependencies...
     ==> Building application...
     ==> Starting...
     ```

3. **Wait for Success**
   - Look for: `serving on port 10000`
   - Status should turn **green** ✅
   - Your app URL: `https://your-service-name.onrender.com`

---

## Step 6: Verify Deployment

1. **Test Your App**
   - Visit: `https://your-service-name.onrender.com`
   - Should see your app homepage

2. **Test API Endpoints**
   - Visit: `https://your-service-name.onrender.com/api/stocks`
   - Should return JSON with stock data
   - If you see data, API is working! ✅

3. **Check Logs**
   - Go to **"Logs"** tab in Render
   - Look for any errors
   - Common issues:
     - Database connection errors → Check `DATABASE_URL`
     - Firebase errors → Check `FIREBASE_SERVICE_ACCOUNT`
     - CORS errors → Check `CORS_ORIGIN`

---

## Step 7: Update Mobile App

1. **Update Capacitor Config**
   Edit `capacitor.config.ts`:
   ```typescript
   server: {
     url: 'https://your-service-name.onrender.com',
     cleartext: false, // Use HTTPS
   },
   ```

2. **Rebuild Mobile App**
   ```bash
   npm run build:mobile
   npm run cap:sync
   ```

3. **Test Mobile App**
   - Install APK on device
   - Verify it connects to Render server
   - Test API calls

---

## Troubleshooting

### Build Fails

**Error: "Cannot find module"**
- Check `package.json` has all dependencies
- Verify `npm ci` works locally
- Check build logs for specific missing module

**Error: "Build command failed"**
- Verify build command: `npm ci && npm run build`
- Test locally: `npm run build`
- Check Node.js version compatibility

### Runtime Errors

**Error: "Database connection failed"**
- ✅ Verify `DATABASE_URL` uses **Internal URL** (not External)
- ✅ Check database is running in Render dashboard
- ✅ Verify database credentials are correct

**Error: "Firebase initialization failed"**
- ✅ Check `FIREBASE_SERVICE_ACCOUNT` JSON is valid
- ✅ Verify `FIREBASE_PROJECT_ID` matches Firebase console
- ✅ Ensure service account has proper permissions

**Error: "CORS error"**
- ✅ Update `CORS_ORIGIN` to match your Render URL
- ✅ Include protocol: `https://your-app.onrender.com`
- ✅ Check browser console for specific CORS error

**Error: "404 Not Found"**
- ✅ Verify `startCommand` is `npm start`
- ✅ Check `dist/index.js` exists after build
- ✅ Review server logs for routing errors

### App Works but Slow

**Cold Starts (Free Tier)**
- Free tier spins down after 15 min inactivity
- First request takes 15-30 seconds to wake
- **Solution**: Upgrade to Starter plan ($7/month) for always-on

**Slow Response Times**
- Check Render metrics (CPU, memory)
- Review database query performance
- Consider upgrading plan if needed

---

## Environment Variables Reference

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `NODE_ENV` | ✅ Yes | Environment mode | `production` |
| `PORT` | ✅ Yes | Server port | `10000` |
| `DATABASE_URL` | ✅ Yes | PostgreSQL connection | `postgresql://user:pass@host/db` |
| `SESSION_SECRET` | ✅ Yes | Session cookie secret | Generate with `openssl rand -base64 32` |
| `FIREBASE_PROJECT_ID` | ✅ Yes | Firebase project ID | `stockfantasysimulator` |
| `FIREBASE_SERVICE_ACCOUNT` | ✅ Yes | Firebase service account JSON | `{"type":"service_account",...}` |
| `CORS_ORIGIN` | ✅ Yes | Allowed CORS origins | `https://your-app.onrender.com` |
| `YAHOO_FINANCE_API_KEY` | ❌ Optional | Yahoo Finance API key | (optional) |

---

## Next Steps

1. ✅ **Test all features** on deployed server
2. ✅ **Update mobile app** with Render URL
3. ✅ **Set up custom domain** (optional)
4. ✅ **Configure monitoring** and alerts
5. ✅ **Set up backups** for database

---

## Quick Commands Reference

**Generate Session Secret:**
```bash
openssl rand -base64 32
```

**Test Build Locally:**
```bash
npm ci
npm run build
npm start
```

**Check Render Logs:**
- Go to Render Dashboard → Your Service → Logs tab

**Redeploy:**
- Push new commit to GitHub (auto-deploy)
- Or: Manual Deploy → Deploy latest commit

---

## Support

- **Render Docs**: [render.com/docs](https://render.com/docs)
- **Render Community**: [community.render.com](https://community.render.com)
- **Check Logs**: Always check Render logs first for errors

---

## Summary Checklist

- [ ] PostgreSQL database created
- [ ] Internal Database URL copied
- [ ] Web service created
- [ ] Build command: `npm ci && npm run build`
- [ ] Start command: `npm start`
- [ ] All 7 environment variables set
- [ ] Firebase service account JSON added
- [ ] CORS_ORIGIN set to Render URL
- [ ] Build successful (green status)
- [ ] App accessible at Render URL
- [ ] API endpoints working
- [ ] Mobile app updated with Render URL
- [ ] Tested on mobile device

**You're all set! 🎉**

