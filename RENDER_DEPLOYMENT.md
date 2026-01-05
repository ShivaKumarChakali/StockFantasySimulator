# Deploying to Render

This guide will help you deploy your Stock Fantasy Simulator server to Render.

## Prerequisites

1. **Render Account**: Sign up at [render.com](https://render.com)
2. **GitHub Repository**: Your code should be pushed to GitHub
3. **PostgreSQL Database**: You'll need a database (Render provides PostgreSQL)
4. **Firebase Credentials**: Your Firebase project ID and service account JSON

## Step 1: Create PostgreSQL Database on Render

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click **"New +"** → **"PostgreSQL"**
3. Configure:
   - **Name**: `stock-fantasy-db` (or your preferred name)
   - **Database**: `stockfantasy` (or your preferred name)
   - **User**: Auto-generated
   - **Region**: Choose closest to your users
   - **Plan**: Free tier is fine for development
4. Click **"Create Database"**
5. **Copy the Internal Database URL** (you'll need this)

## Step 2: Deploy Web Service

### Option A: Using Render Dashboard (Recommended)

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository
4. Configure the service:
   - **Name**: `stock-fantasy-simulator`
   - **Region**: Same as your database
   - **Branch**: `main` (or your default branch)
   - **Root Directory**: Leave empty (root of repo)
   - **Environment**: `Node`
   - **Build Command**: `npm ci && npm run build`
   - **Start Command**: `npm start`
   - **Plan**: Free tier is fine for development

5. **Add Environment Variables**:
   Click **"Advanced"** → **"Add Environment Variable"** and add:

   ```
   NODE_ENV=production
   PORT=10000
   DATABASE_URL=<your-postgres-internal-url-from-step-1>
   SESSION_SECRET=<generate-with-openssl-rand-base64-32>
   FIREBASE_PROJECT_ID=stockfantasysimulator
   FIREBASE_SERVICE_ACCOUNT=<your-firebase-service-account-json>
   CORS_ORIGIN=https://your-app-name.onrender.com
   ```

   **Important Notes:**
   - `DATABASE_URL`: Use the **Internal Database URL** from your PostgreSQL service
   - `SESSION_SECRET`: Generate with `openssl rand -base64 32`
   - `FIREBASE_SERVICE_ACCOUNT`: Paste the entire JSON as a single line (or use Render's secret file feature)
   - `CORS_ORIGIN`: Set to your Render app URL (will be `https://your-app-name.onrender.com`)

6. Click **"Create Web Service"**

### Option B: Using Render Blueprint (render.yaml)

1. Push `render.yaml` to your repository
2. Go to [Render Dashboard](https://dashboard.render.com)
3. Click **"New +"** → **"Blueprint"**
4. Connect your GitHub repository
5. Render will detect `render.yaml` and create services automatically
6. **Still need to set environment variables** in the dashboard:
   - `DATABASE_URL`
   - `FIREBASE_SERVICE_ACCOUNT`
   - `CORS_ORIGIN`

## Step 3: Get Firebase Service Account

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project: `stockfantasysimulator`
3. Go to **Project Settings** → **Service Accounts**
4. Click **"Generate New Private Key"**
5. Download the JSON file
6. **For Render**: Copy the entire JSON content and paste it as the `FIREBASE_SERVICE_ACCOUNT` environment variable
   - **Tip**: Remove all newlines and format as a single line, or use Render's secret file feature

## Step 4: Configure CORS

1. In your Render Web Service dashboard
2. Go to **Environment** tab
3. Set `CORS_ORIGIN` to your Render URL:
   ```
   https://your-app-name.onrender.com
   ```
4. If you have a custom domain, add both:
   ```
   https://your-app-name.onrender.com,https://yourdomain.com
   ```

## Step 5: Update Mobile App Configuration

After deployment, update your mobile app to use the Render URL:

1. **Update `capacitor.config.ts`**:
   ```typescript
   server: {
     url: 'https://your-app-name.onrender.com',
     cleartext: false, // Use HTTPS
   },
   ```

2. **Or set environment variable**:
   ```bash
   VITE_API_URL=https://your-app-name.onrender.com npm run build:mobile
   ```

## Step 6: Verify Deployment

1. Wait for the build to complete (first build takes 5-10 minutes)
2. Check the **Logs** tab for any errors
3. Visit your app URL: `https://your-app-name.onrender.com`
4. Test API endpoints:
   - `https://your-app-name.onrender.com/api/stocks`
   - Should return JSON with stock data

## Troubleshooting

### Build Fails

**Error: "Cannot find module"**
- Ensure all dependencies are in `package.json` (not just `devDependencies`)
- Check that `npm ci` runs successfully

**Error: "Build command failed"**
- Check build logs in Render dashboard
- Verify `npm run build` works locally

### Runtime Errors

**Error: "Database connection failed"**
- Verify `DATABASE_URL` is set correctly
- Use **Internal Database URL** (not external)
- Check database is running in Render dashboard

**Error: "Firebase initialization failed"**
- Verify `FIREBASE_SERVICE_ACCOUNT` is valid JSON
- Check `FIREBASE_PROJECT_ID` matches your Firebase project

**Error: "CORS error"**
- Verify `CORS_ORIGIN` includes your app URL
- Check browser console for specific CORS error

### App Works but API Returns 404

- Verify `startCommand` is `npm start`
- Check that `dist/index.js` exists after build
- Review server logs in Render dashboard

### Slow Response Times

- Free tier has cold starts (15-30 seconds after inactivity)
- Upgrade to paid plan for always-on service
- Consider using Render's "Always On" feature (paid)

## Environment Variables Reference

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `NODE_ENV` | Yes | Environment mode | `production` |
| `PORT` | Yes | Server port | `10000` |
| `DATABASE_URL` | Yes | PostgreSQL connection string | `postgresql://user:pass@host/db` |
| `SESSION_SECRET` | Yes | Secret for session cookies | Generate with `openssl rand -base64 32` |
| `FIREBASE_PROJECT_ID` | Yes | Firebase project ID | `stockfantasysimulator` |
| `FIREBASE_SERVICE_ACCOUNT` | Recommended | Firebase service account JSON | `{"type":"service_account",...}` |
| `CORS_ORIGIN` | Recommended | Allowed CORS origins | `https://your-app.onrender.com` |
| `YAHOO_FINANCE_API_KEY` | Optional | Yahoo Finance API key | (optional) |

## Database Migrations

After deployment, you may need to run database migrations:

1. **Option 1: Automatic (on startup)**
   - The server automatically runs migrations on startup
   - Check logs to verify tables are created

2. **Option 2: Manual (via Render Shell)**
   ```bash
   # In Render dashboard, go to your service → Shell
   npm run db:push
   ```

## Custom Domain

1. In Render dashboard, go to your Web Service
2. Click **"Settings"** → **"Custom Domains"**
3. Add your domain
4. Update DNS records as instructed
5. Update `CORS_ORIGIN` to include your custom domain

## Monitoring

- **Logs**: View real-time logs in Render dashboard
- **Metrics**: Monitor CPU, memory, and request metrics
- **Alerts**: Set up alerts for downtime or errors

## Cost

- **Free Tier**: 
  - Web service spins down after 15 minutes of inactivity
  - PostgreSQL: 90 days free, then $7/month
- **Starter Plan**: $7/month (always on)
- **Standard Plan**: $25/month (better performance)

## Next Steps

1. ✅ Deploy to Render
2. ✅ Update mobile app with Render URL
3. ✅ Test all features
4. ✅ Set up custom domain (optional)
5. ✅ Configure monitoring and alerts

## Support

- [Render Documentation](https://render.com/docs)
- [Render Community](https://community.render.com)
- Check server logs in Render dashboard for detailed error messages




