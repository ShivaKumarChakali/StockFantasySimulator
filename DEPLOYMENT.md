# Deployment Guide

## Pre-Deployment Checklist

### 1. Environment Variables
Ensure all required environment variables are set on your hosting platform:

```env
DATABASE_URL=postgresql://...
FIREBASE_PROJECT_ID=stockfantasysimulator
FIREBASE_SERVICE_ACCOUNT={"type":"service_account",...}
SESSION_SECRET=your-strong-random-secret
PORT=8081
NODE_ENV=production
CORS_ORIGIN=https://yourdomain.com
```

### 2. Database Setup
1. Run migrations: `npm run db:push`
2. Verify tables are created
3. Check default data (colleges) are initialized

### 3. Build Verification
```bash
npm run build
npm run start  # Test production build locally
```

## GitHub Actions Setup

### Required Secrets
Add these secrets in GitHub: Settings > Secrets and variables > Actions

1. **DATABASE_URL**: Your PostgreSQL connection string
2. **SESSION_SECRET**: Strong random secret (generate with `openssl rand -base64 32`)
3. **FIREBASE_PROJECT_ID**: `stockfantasysimulator`
4. **FIREBASE_SERVICE_ACCOUNT**: Firebase service account JSON (optional)

### Workflow Files
- `.github/workflows/ci.yml` - Continuous Integration
- `.github/workflows/deploy.yml` - Deployment (configure for your platform)

## Deployment Platforms

### Option 1: Railway

1. **Connect Repository**
   - Go to Railway dashboard
   - New Project > Deploy from GitHub
   - Select your repository

2. **Configure Environment Variables**
   - Add all required env vars in Railway dashboard
   - Set `NODE_ENV=production`

3. **Build Settings**
   - Build Command: `npm run build`
   - Start Command: `npm run start`
   - Root Directory: `.`

4. **Database**
   - Railway provides PostgreSQL
   - Use the connection string as `DATABASE_URL`

### Option 2: Render

1. **Create Web Service**
   - New > Web Service
   - Connect GitHub repository

2. **Configure**
   - Build Command: `npm run build`
   - Start Command: `npm run start`
   - Environment: `Node`

3. **Environment Variables**
   - Add all required env vars
   - Set `NODE_ENV=production`

4. **Database**
   - Create PostgreSQL database
   - Use connection string as `DATABASE_URL`

### Option 3: Vercel (Frontend) + Railway/Render (Backend)

**Frontend (Vercel):**
- Deploy `client/` directory
- Set build command: `npm run build` (from root)
- Output directory: `dist/public`

**Backend (Railway/Render):**
- Deploy entire project
- Set start command: `npm run start`
- Configure environment variables

### Option 4: Docker

1. **Create Dockerfile**
```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY --from=builder /app/dist ./dist
EXPOSE 8081
CMD ["npm", "run", "start"]
```

2. **Build and Run**
```bash
docker build -t stock-fantasy-simulator .
docker run -p 8081:8081 --env-file .env stock-fantasy-simulator
```

## Post-Deployment

### 1. Verify Deployment
- [ ] Check server is running
- [ ] Test API endpoints
- [ ] Verify database connection
- [ ] Test authentication
- [ ] Check WebSocket connection
- [ ] Verify static files are served

### 2. Monitoring
- Set up error tracking (Sentry, LogRocket)
- Configure uptime monitoring
- Set up database backups
- Monitor performance metrics

### 3. SSL/TLS
- Ensure HTTPS is enabled
- Update CORS_ORIGIN to use HTTPS
- Set secure cookies in production

## Troubleshooting

### Build Fails
- Check Node.js version (requires 20.x)
- Verify all dependencies are installed
- Check for TypeScript errors: `npm run check`

### Database Connection Issues
- Verify `DATABASE_URL` is correct
- Check SSL mode is set correctly
- Verify database is accessible from hosting platform

### Firebase Issues
- Verify `FIREBASE_PROJECT_ID` is correct
- Check service account JSON is valid
- Ensure Firebase project is active

### Port Issues
- Default port is 8081
- Some platforms require `PORT` env var
- Check platform-specific port configuration

## CI/CD Workflow

### On Push to Main/Master
1. ✅ Lint and type check
2. ✅ Build application
3. ✅ Run security audit
4. ✅ Deploy to production (if configured)

### On Pull Request
1. ✅ Lint and type check
2. ✅ Build application
3. ✅ Security audit

## Environment-Specific Configuration

### Development
```env
NODE_ENV=development
PORT=8081
CORS_ORIGIN=*
```

### Production
```env
NODE_ENV=production
PORT=8081
CORS_ORIGIN=https://yourdomain.com
SESSION_SECRET=<strong-random-secret>
```

## Security Checklist

- [ ] Strong `SESSION_SECRET` set
- [ ] `CORS_ORIGIN` restricted to your domain
- [ ] Database uses SSL
- [ ] HTTPS enabled
- [ ] Environment variables secured
- [ ] No secrets in code
- [ ] Regular dependency updates

## Performance Optimization

1. **Enable Caching**
   - Static assets caching
   - API response caching (if applicable)

2. **Database Optimization**
   - Connection pooling (already configured)
   - Index optimization

3. **Build Optimization**
   - Minification (already enabled)
   - Code splitting (Vite handles this)

## Rollback Procedure

1. Revert to previous commit
2. Push to trigger deployment
3. Or manually deploy previous build artifact

## Support

For issues:
1. Check server logs
2. Review error tracking
3. Check database connection
4. Verify environment variables

