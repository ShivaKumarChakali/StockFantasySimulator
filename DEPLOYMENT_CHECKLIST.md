# Render Deployment Checklist

Use this checklist to ensure a smooth deployment to Render.

## Pre-Deployment

- [ ] Code is pushed to GitHub
- [ ] All environment variables documented in `env.example`
- [ ] Build works locally: `npm run build`
- [ ] Start works locally: `npm start` (after build)
- [ ] Database migrations are ready

## Render Setup

### 1. PostgreSQL Database
- [ ] Created PostgreSQL database on Render
- [ ] Copied **Internal Database URL** (not external)
- [ ] Database is running and accessible

### 2. Web Service
- [ ] Connected GitHub repository
- [ ] Set build command: `npm ci && npm run build`
- [ ] Set start command: `npm start`
- [ ] Selected appropriate plan (Free/Starter/Standard)

### 3. Environment Variables
- [ ] `NODE_ENV=production`
- [ ] `PORT=10000` (Render sets this automatically, but good to have)
- [ ] `DATABASE_URL` = Internal PostgreSQL URL from step 1
- [ ] `SESSION_SECRET` = Generated with `openssl rand -base64 32`
- [ ] `FIREBASE_PROJECT_ID` = `stockfantasysimulator`
- [ ] `FIREBASE_SERVICE_ACCOUNT` = Full JSON as single line
- [ ] `CORS_ORIGIN` = Your Render URL (e.g., `https://your-app.onrender.com`)

### 4. Firebase Setup
- [ ] Downloaded Firebase service account JSON
- [ ] Copied entire JSON content
- [ ] Pasted as `FIREBASE_SERVICE_ACCOUNT` environment variable
- [ ] Verified `FIREBASE_PROJECT_ID` matches Firebase console

## Post-Deployment

### Verification
- [ ] Build completed successfully (check logs)
- [ ] Service is running (green status)
- [ ] Can access app at Render URL
- [ ] API endpoint works: `https://your-app.onrender.com/api/stocks`
- [ ] Database connection successful (check logs)
- [ ] Firebase authentication works
- [ ] CORS errors resolved

### Mobile App Update
- [ ] Updated `capacitor.config.ts` with Render URL
- [ ] Rebuilt mobile app: `npm run build:mobile && npm run cap:sync`
- [ ] Tested mobile app connects to Render server
- [ ] Verified API calls work from mobile app

### Monitoring
- [ ] Set up alerts for downtime
- [ ] Monitor logs for errors
- [ ] Check metrics (CPU, memory, requests)

## Troubleshooting

### Build Fails
- [ ] Check build logs in Render dashboard
- [ ] Verify all dependencies in `package.json`
- [ ] Ensure `npm ci` works locally
- [ ] Check Node.js version compatibility

### Runtime Errors
- [ ] Check service logs in Render dashboard
- [ ] Verify all environment variables are set
- [ ] Test database connection
- [ ] Verify Firebase credentials

### API Returns 404
- [ ] Verify `startCommand` is `npm start`
- [ ] Check `dist/index.js` exists
- [ ] Verify `dist/public/index.html` exists
- [ ] Check server logs for routing errors

### CORS Errors
- [ ] Update `CORS_ORIGIN` to match Render URL
- [ ] Include protocol: `https://`
- [ ] Add custom domain if using one
- [ ] Check browser console for specific error

## Performance

- [ ] Free tier: Expect 15-30 second cold starts
- [ ] Consider upgrading to Starter ($7/month) for always-on
- [ ] Monitor response times
- [ ] Optimize database queries if slow

## Security

- [ ] `SESSION_SECRET` is strong and random
- [ ] `DATABASE_URL` uses Internal URL (not exposed)
- [ ] `FIREBASE_SERVICE_ACCOUNT` is kept secure
- [ ] HTTPS is enabled (automatic on Render)
- [ ] CORS is properly configured

## Documentation

- [ ] Update README with Render URL
- [ ] Document environment variables
- [ ] Update mobile app configuration docs
- [ ] Note any custom domain setup

## Next Steps

- [ ] Set up custom domain (optional)
- [ ] Configure monitoring and alerts
- [ ] Set up automated backups
- [ ] Plan for scaling if needed

