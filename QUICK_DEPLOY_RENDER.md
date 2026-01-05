# Quick Deploy to Render - Step by Step

## 🚀 Quick Start (5 minutes)

### 1. Create PostgreSQL Database
1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click **"New +"** → **"PostgreSQL"**
3. Name it: `stock-fantasy-db`
4. Click **"Create Database"**
5. **Copy the Internal Database URL** (starts with `postgresql://`)

### 2. Deploy Web Service
1. Click **"New +"** → **"Web Service"**
2. Connect your GitHub repo
3. Configure:
   - **Name**: `stock-fantasy-simulator`
   - **Build Command**: `npm ci && npm run build`
   - **Start Command**: `npm start`
   - **Plan**: Free (or Starter for always-on)

### 3. Set Environment Variables
Click **"Environment"** tab and add:

```
NODE_ENV=production
PORT=10000
DATABASE_URL=<paste-internal-db-url-from-step-1>
SESSION_SECRET=<generate-with-openssl-rand-base64-32>
FIREBASE_PROJECT_ID=stockfantasysimulator
FIREBASE_SERVICE_ACCOUNT=<your-firebase-json>
CORS_ORIGIN=https://stock-fantasy-simulator.onrender.com
```

**Generate SESSION_SECRET:**
```bash
openssl rand -base64 32
```

**Get FIREBASE_SERVICE_ACCOUNT:**
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Project Settings → Service Accounts
3. Generate New Private Key
4. Copy entire JSON and paste as single line

### 4. Deploy!
1. Click **"Create Web Service"**
2. Wait 5-10 minutes for first build
3. Your app will be at: `https://stock-fantasy-simulator.onrender.com`

### 5. Update Mobile App
Edit `capacitor.config.ts`:
```typescript
server: {
  url: 'https://stock-fantasy-simulator.onrender.com',
  cleartext: false,
},
```

Then rebuild:
```bash
npm run build:mobile
npm run cap:sync
```

## ✅ Done!

Your server is now live. Test it:
- Visit: `https://stock-fantasy-simulator.onrender.com`
- API: `https://stock-fantasy-simulator.onrender.com/api/stocks`

## ⚠️ Important Notes

- **Free tier**: App sleeps after 15 min inactivity (takes 30s to wake)
- **Database**: Use **Internal Database URL** (not external)
- **CORS**: Update `CORS_ORIGIN` to match your Render URL
- **First build**: Takes 5-10 minutes, subsequent builds are faster

## 🐛 Troubleshooting

**Build fails?**
- Check logs in Render dashboard
- Ensure all dependencies are in `package.json`

**Database connection error?**
- Use Internal Database URL (not external)
- Check database is running

**API returns 404?**
- Verify `startCommand` is `npm start`
- Check `dist/index.js` exists after build

**CORS errors?**
- Update `CORS_ORIGIN` to your Render URL
- Include protocol: `https://your-app.onrender.com`

For detailed instructions, see `RENDER_DEPLOYMENT.md`




