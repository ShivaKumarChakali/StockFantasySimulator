# Stock Learning Platform

**Educational stock market simulation platform for learning and skill development.**

> ⚠️ **LEGAL DISCLAIMER**: This platform is for educational and simulation purposes only. No real money trading, financial returns, or monetary prizes are involved. All trading activity is simulated using virtual currency for learning purposes.

## 🎓 What This Platform Does

- **Educational Simulation**: Learn stock market fundamentals through hands-on practice
- **Virtual Trading**: Create portfolios with virtual capital (₹10,00,000 starting capital)
- **Learning Contests**: Participate in daily simulation sessions during market hours (9:15 AM - 3:30 PM IST)
- **Performance Tracking**: Monitor your learning progress and analyze simulated performance
- **Leaderboards**: Track rankings and compare learning progress with others
- **Real-time Updates**: Live stock prices and portfolio performance via WebSocket
- **Authentication**: Email/Password and Google OAuth sign-in
- **Mobile-First**: Responsive design optimized for all devices

## 🚫 What This Platform Does NOT Do

- ❌ **NO real money trading**
- ❌ **NO financial returns or profits**
- ❌ **NO monetary prizes or rewards**
- ❌ **NO entry fees or payments**
- ❌ **NO gambling or betting**
- ❌ **NO real currency transactions**

This is purely an educational tool for learning stock market concepts in a risk-free environment.

## 📱 Mobile App

Build native Android APK using Capacitor - **No Android Studio needed!**

### 🚀 Quick Start (GitHub Actions - Recommended)

1. **Push code to GitHub**
2. **Go to Actions tab** → **Build Android APK** → **Run workflow**
3. **Download APK** from Artifacts (takes ~5-10 minutes)

See [BUILD_APK_WITHOUT_STUDIO.md](./BUILD_APK_WITHOUT_STUDIO.md) for all methods.

### Alternative: Local Build

```bash
# Build and open in Android Studio (if installed)
npm run cap:build:android

# Or step by step:
npm run build:mobile    # Build web app
npm run cap:sync        # Sync to Android
npm run cap:open:android # Open in Android Studio
```

See [MOBILE_APP.md](./MOBILE_APP.md) for detailed instructions.

## 🚀 Features

- **Virtual Trading**: Create portfolios with ₹10,00,000 starting capital (virtual)
- **Learning Contests**: Free participation in daily simulation sessions during market hours
- **Performance Analytics**: Track and analyze your simulated trading performance
- **Real-time Updates**: Live stock prices and portfolio performance via WebSocket
- **Leaderboards**: Track learning progress and compare with others
- **Authentication**: Email/Password and Google OAuth sign-in
- **Mobile-First**: Responsive design optimized for all devices

## 📋 Prerequisites

- Node.js 20.x or higher
- PostgreSQL database (Neon, Supabase, or self-hosted)
- Firebase project (for authentication)

## 🛠️ Setup

### 1. Clone Repository

```bash
git clone <your-repo-url>
cd StockFantasySimulator
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Variables

Copy `env.example` to `.env` and fill in your values:

```bash
cp env.example .env
```

Required variables:
- `DATABASE_URL` - PostgreSQL connection string
- `FIREBASE_PROJECT_ID` - Firebase project ID
- `SESSION_SECRET` - Strong random secret (generate with `openssl rand -base64 32`)

Optional but recommended:
- `FIREBASE_SERVICE_ACCOUNT` - Firebase service account JSON for production

See `env.example` for all available options.

### 4. Database Setup

```bash
npm run db:push
```

This creates all necessary tables and initializes default data.

**Important**: After setting up the database, run the migration to remove the `entry_fee` column:

```sql
ALTER TABLE contests DROP COLUMN IF EXISTS entry_fee;
```

See [HOW_TO_RUN_MIGRATION.md](./HOW_TO_RUN_MIGRATION.md) for detailed instructions.

### 5. Run Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:8081`

## 📦 Build for Production

```bash
npm run build
npm run start
```

## 🐳 Docker Deployment

Build and run with Docker:

```bash
# Build image
docker build -t stock-learning-platform .

# Run container
docker run -p 8081:8081 \
  -e DATABASE_URL=your-database-url \
  -e FIREBASE_PROJECT_ID=your-project-id \
  -e SESSION_SECRET=your-secret \
  stock-learning-platform
```

## ☁️ Cloud Deployment

### AWS Deployment

See [AWS_DEPLOYMENT.md](./AWS_DEPLOYMENT.md) for detailed AWS deployment instructions.

Quick options:
- **ECS Fargate**: Serverless container deployment (recommended)
- **Elastic Beanstalk**: Easy Node.js deployment
- **EC2**: Traditional VM deployment

### Other Platforms

The application can be deployed to:
- **Render**: See [RENDER_DEPLOYMENT.md](./RENDER_DEPLOYMENT.md)
- **Railway**: Connect GitHub repo, add env vars
- **Heroku**: Use Node.js buildpack
- **Any Node.js hosting**: Standard Node.js application

## 🏗️ Project Structure

```
StockFantasySimulator/
├── client/          # React frontend
│   └── src/
│       ├── pages/  # Page components
│       ├── components/  # Reusable components
│       └── contexts/    # React contexts
├── server/         # Express backend
│   ├── routes.ts   # API routes
│   ├── storage.ts  # Data storage abstraction
│   └── ...
├── shared/         # Shared code (schema, types)
│   └── schema.ts   # Database schema
└── dist/           # Build output
```

## 🔧 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Run production server
- `npm run check` - Type check TypeScript
- `npm run db:push` - Push database schema changes
- `npm run test` - Run tests
- `npm run test:run` - Run tests once

## 🧪 Testing

```bash
# Run all tests
npm run test

# Run tests once
npm run test:run

# Run tests with coverage
npm run test:coverage

# Type checking
npm run check
```

## 🔐 Security

- ✅ CORS configured
- ✅ Session cookies with httpOnly
- ✅ Firebase token verification
- ✅ SQL injection protection (Drizzle ORM)
- ✅ Environment variables for secrets
- ✅ PostgreSQL session store for production

## ⚖️ Legal Compliance

This platform is designed for educational purposes only:

- ✅ No real money transactions
- ✅ No monetary prizes or rewards
- ✅ No entry fees or payments
- ✅ Free participation in all learning contests
- ✅ Clear educational disclaimers on all pages
- ✅ Virtual currency for simulation only

**Important**: This platform should NOT be used for:
- Real money trading
- Gambling or betting
- Financial advice or investment decisions
- Any activity involving real currency

## 📚 Documentation

- [AWS Deployment Guide](./AWS_DEPLOYMENT.md) - Deploy to AWS (ECS, EB, EC2)
- [Database Migration Guide](./HOW_TO_RUN_MIGRATION.md) - Run database migrations
- [Mobile App Guide](./MOBILE_APP.md) - Build Android app
- [Deployment Checklist](./DEPLOYMENT_CHECKLIST.md) - Production deployment checklist

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Ensure build passes: `npm run build`
4. Ensure tests pass: `npm run test:run`
5. Submit a pull request

## 📝 License

MIT

## 🆘 Support

For issues or questions:
1. Check deployment guides for troubleshooting
2. Review server logs
3. Check environment variables
4. Verify database connectivity

## 🔄 CI/CD

GitHub Actions workflows are configured:
- `.github/workflows/ci.yml` - Continuous Integration
- `.github/workflows/deploy.yml` - Deployment

## 📌 Important Notes

- **Database Migration Required**: Run the migration to remove `entry_fee` column (see [HOW_TO_RUN_MIGRATION.md](./HOW_TO_RUN_MIGRATION.md))
- **Legal Compliance**: Ensure all legal disclaimers are visible to users
- **Educational Purpose Only**: This platform is for learning, not real trading
- **No Real Money**: All currency is virtual and for simulation only
