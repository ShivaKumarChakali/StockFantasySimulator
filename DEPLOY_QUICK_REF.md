# 🚀 Quick Deployment Reference Card

## Step-by-Step Checklist

### 1️⃣ Create Database
- [ ] Render Dashboard → New + → PostgreSQL
- [ ] Name: `stock-fantasy-db`
- [ ] Copy **Internal Database URL**

### 2️⃣ Create Web Service
- [ ] Render Dashboard → New + → Web Service
- [ ] Connect GitHub repo
- [ ] Build Command: `npm ci && npm run build`
- [ ] Start Command: `npm start`

### 3️⃣ Set Environment Variables
Add these 7 variables in Environment tab:

```
NODE_ENV=production
PORT=10000
DATABASE_URL=<internal-db-url>
SESSION_SECRET=<generate-with-openssl-rand-base64-32>
FIREBASE_PROJECT_ID=stockfantasysimulator
FIREBASE_SERVICE_ACCOUNT=<firebase-json>
CORS_ORIGIN=https://your-service-name.onrender.com
```

### 4️⃣ Deploy
- [ ] Click "Create Web Service"
- [ ] Wait 5-10 minutes
- [ ] Check logs for success

### 5️⃣ Verify
- [ ] Visit: `https://your-service-name.onrender.com`
- [ ] Test: `https://your-service-name.onrender.com/api/stocks`

---

## Quick Commands

**Generate Session Secret:**
```bash
openssl rand -base64 32
```

**Get Firebase Service Account:**
1. Firebase Console → ⚙️ Settings → Project settings → Service accounts tab
2. Click "Generate new private key"
3. Download JSON file
4. Copy entire JSON content
5. See `HOW_TO_GET_FIREBASE_SERVICE_ACCOUNT.md` for detailed guide

**Update Mobile App:**
```typescript
// capacitor.config.ts
server: {
  url: 'https://your-service-name.onrender.com',
  cleartext: false,
}
```

---

## Common Issues

| Issue | Solution |
|-------|----------|
| Build fails | Check logs, verify `npm ci` works locally |
| Database error | Use **Internal** Database URL |
| CORS error | Update `CORS_ORIGIN` to Render URL |
| 404 error | Verify `startCommand` is `npm start` |

---

**Full Guide:** See `MANUAL_DEPLOY_RENDER.md`

