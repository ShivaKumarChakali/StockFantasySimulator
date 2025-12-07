# Stock Fantasy Simulator

A gamified stock trading learning platform where users create virtual portfolios, compete in daily contests, and master stock trading in a risk-free environment.

## 🚀 Features

- **Virtual Trading**: Create portfolios with ₹10,00,000 starting capital
- **Daily Contests**: Compete in live trading contests during market hours (9:15 AM - 3:30 PM IST)
- **Virtual Coins**: Earn and spend coins for contest entry and prizes
- **Real-time Updates**: Live stock prices and portfolio ROI via WebSocket
- **Leaderboards**: Track rankings and compete with other traders
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

See `env.example` for all available options.

### 4. Database Setup
```bash
npm run db:push
```

This creates all necessary tables and initializes default data.

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

## 🧪 Testing

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm test

# Run tests once
npm run test:run

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage

# Type checking
npm run check

# Build test
npm run build
```

### Test Coverage
- ✅ Market hours utility (14 tests)
- ✅ Prize distributor (4 tests)
- ✅ Portfolio calculator (5 tests)
- Total: 23 tests passing

## 🚢 Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions.

### Quick Deploy Options

1. **Railway**: Connect GitHub repo, add env vars, deploy
2. **Render**: Create web service, connect repo, configure
3. **Docker**: Build image and deploy to any container platform

## 🔐 Security

- ✅ CORS configured
- ✅ Session cookies with httpOnly
- ✅ Firebase token verification
- ✅ SQL injection protection (Drizzle ORM)
- ✅ Environment variables for secrets

## 📚 Documentation

- [Requirements Review](./REQUIREMENTS_REVIEW.md) - Feature checklist and status
- [Deployment Guide](./DEPLOYMENT.md) - Deployment instructions
- [Database Setup](./DATABASE_SETUP.md) - Database configuration
- [Firebase Status](./FIREBASE_STATUS.md) - Firebase setup guide

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Ensure build passes: `npm run build`
4. Submit a pull request

## 📝 License

MIT

## 🆘 Support

For issues or questions:
1. Check [DEPLOYMENT.md](./DEPLOYMENT.md) for troubleshooting
2. Review server logs
3. Check environment variables

## 🔄 CI/CD

GitHub Actions workflows are configured:
- `.github/workflows/ci.yml` - Continuous Integration
- `.github/workflows/deploy.yml` - Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for setup instructions.

