# Estocks - Stock Market Fantasy Game (Fest Edition)

## Project Overview
Estocks is India's first college-based stock market fantasy trading game. It combines gamification with financial education through a Dream11-style contest model applied to stock trading.

**Status**: MVP with Fest Edition Features

---

## Enhanced Features (Fest Edition)

### 1. College-Based System
- **Signup Integration**: Users select their college during registration
- **College-wise Leaderboards**: Compete within your college community
- **Top College Ranking**: "Top College of the Fest" tracking
- **Location-based Competition**: Foster intra-college competitiveness

**Pages**: 
- `/college` - College selection during onboarding
- `/leaderboard` - College tab with college filter

### 2. QR Quick Join
- **QR Code Integration**: Generate QR codes linking directly to contest pages
- **One-Click Signup**: Fastest conversion flow for on-ground fest events
- **Guest Demo First**: Try before signup

### 3. Guest Demo Mode
- **Zero Friction Entry**: Try a demo contest without account creation
- **Full Experience**: Real portfolio management with mock data
- **Conversion Flow**: Demo → Sign up → Real contests

**Route**: `/demo`

### 4. Referral Ranking System
- **Referral Leaderboard**: Rank by number of successful referrals
- **Ambassador Recognition**: Top referrers get exclusive certificates
- **Non-monetary Rewards**: Focus on recognition and campus status
- **Gamified Participation**: Encourage word-of-mouth growth

**Routes**:
- `/referrals` - Referral leaderboard
- `GET /api/referrals/top` - Top referrers endpoint
- `POST /api/referrals` - Add referral endpoint

### 5. Fest Mode
- **Special Flag**: `festMode` in contests and users table
- **Auto-UI Activation**: Special UI when fest mode is active
- **Contest Timings**: Fest-specific contest windows
- **Enhanced Analytics**: Fest-specific leaderboards

### 6. Onboarding Flow (90-second)
**Route**: `/onboarding`

Steps:
1. Welcome Screen - "Welcome to Estocks – India's First College Stock Simulation Game"
2. College Selection - Dropdown with all colleges
3. Quick Tutorial - 3 slides (What/How/Rewards)
4. Portfolio Creation - Select 5-10 stocks with budget
5. Contest Confirmation - Portfolio locked, ready to compete

---

## Core MVP Features

### Authentication & User Management
- Email/password signup and login
- User profiles with college affiliation
- Virtual wallet (₹10,00,000 starting capital)
- Referral code generation

**Routes**:
- `POST /api/auth/signup`
- `POST /api/auth/login`
- `GET /api/users/:id`
- `GET /api/users/college/:collegeId`

### Portfolio Management
- Create virtual portfolios with 5-10 stocks
- Real-time portfolio value tracking
- ROI calculation
- Portfolio locking during contests

### Market Sessions (Contests)
- Daily/weekly contest creation
- Entry fee system
- Virtual capital: ₹10,00,000
- Contest status tracking (upcoming, live, ended)

**Routes**:
- `GET /api/contests` - List contests
- `POST /api/contests` - Create contest
- `GET /api/contests/:id` - Contest details
- `POST /api/contests/:contestId/join` - Join contest

### Leaderboards
- **Global Rankings**: All users ranked by ROI
- **College Rankings**: Users ranked within their college
- **Friends Rankings**: Compare with friends
- **Referral Rankings**: Top ambassadors

**Routes**:
- `GET /api/leaderboard/contest/:contestId`
- `GET /api/leaderboard/college/:collegeId`

---

## Tech Stack

### Frontend
- React 18 with TypeScript
- Wouter (client-side routing)
- TanStack React Query v5 (data fetching)
- shadcn/ui + Tailwind CSS
- Recharts (data visualization)

### Backend
- Express.js (Node.js)
- In-memory storage (MemStorage)
- Zod validation
- Drizzle ORM (prepared for PostgreSQL)

### Database
- PostgreSQL (Neon) - configured but using MemStorage for MVP
- Tables: users, colleges, contests, portfolios, holdings, userContests, referrals

---

## File Structure

```
client/src/
  ├── pages/
  │   ├── Onboarding.tsx       (Welcome flow - NEW)
  │   ├── CollegeSelection.tsx  (College picker - NEW)
  │   ├── DemoMode.tsx          (Demo contest - NEW)
  │   ├── Signup.tsx            (Registration - NEW)
  │   ├── ReferralRanking.tsx   (Referral leaderboard - NEW)
  │   ├── Market.tsx            (Browse stocks)
  │   ├── Portfolio.tsx         (User portfolio)
  │   ├── Contests.tsx          (Join contests)
  │   ├── Leaderboard.tsx       (Rankings - UPDATED)
  │   └── Profile.tsx           (User profile)
  ├── components/
  │   ├── ThemeProvider.tsx
  │   ├── ThemeToggle.tsx
  │   ├── BottomNav.tsx
  │   ├── SearchBar.tsx
  │   ├── StockCard.tsx
  │   └── ui/                   (shadcn components)
  └── App.tsx                   (Routes - UPDATED)

server/
  ├── index.ts
  ├── routes.ts                 (API endpoints - UPDATED)
  ├── storage.ts                (Data layer - UPDATED)
  └── vite.ts

shared/
  └── schema.ts                 (Zod schemas - UPDATED)
```

---

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - Login user

### Users
- `GET /api/users/:id` - Get user details
- `GET /api/users/college/:collegeId` - List users by college
- `PATCH /api/users/:id/balance` - Update virtual balance

### Colleges
- `GET /api/colleges` - List all colleges

### Contests
- `GET /api/contests` - List contests (supports `?fest=true` filter)
- `POST /api/contests` - Create contest
- `GET /api/contests/:id` - Get contest details
- `PATCH /api/contests/:id/status` - Update contest status
- `POST /api/contests/:contestId/join` - Join contest
- `GET /api/users/:userId/contests` - Get user's contests

### Leaderboards
- `GET /api/leaderboard/contest/:contestId` - Contest leaderboard
- `GET /api/leaderboard/college/:collegeId` - College leaderboard (supports `?contestId=`)

### Referrals
- `POST /api/referrals` - Add referral
- `GET /api/referrals/top` - Get top referrers (supports `?limit=`)
- `GET /api/referrals/count/:userId` - Get referral count

---

## Routes (Frontend)

- `/` - Market (home)
- `/onboarding` - Welcome & tutorial flow (NEW)
- `/college` - College selection (NEW)
- `/demo` - Demo contest mode (NEW)
- `/signup` - Registration (NEW)
- `/portfolio` - User portfolio
- `/contests` - Browse/join contests
- `/leaderboard` - Rankings with college filter (UPDATED)
- `/referrals` - Referral leaderboard (NEW)
- `/profile` - User profile

---

## Fest Event Strategy

### On-Ground Setup
- Laptop + mobile demo station
- QR code posters (linking to `/demo` or signup)
- 2 volunteers for guidance
- TV/display for live leaderboard

### Conversion Funnel
1. **Awareness**: QR poster → `/demo` (Guest Demo Mode)
2. **Interest**: Demo experience → Natural conversion prompt
3. **Action**: User clicks "Create Account & Join"
4. **Engagement**: College-based competition drives participation

### Key Messaging
> "Just like Dream11, but for stock market. No money risk. Just brain. Top students get certified."

---

## User Preferences & Development Notes
- In-memory storage for MVP (easy testing, no setup)
- Dark mode support via ThemeProvider
- test-id attributes on all interactive elements
- Responsive design for mobile-first approach
- All data is virtual (no real money involved)

---

## Future Enhancements (Phase 2+)
- Real-time price updates via paid APIs
- Private leagues with friends
- Badges/XP gamification
- In-app stock trading tutorials
- Integration with EdTech platforms
- Social sharing features
- Sponsored contests

---

## Running the Project

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm build

# Start production server
npm start
```

The app runs on `http://localhost:5000` with both backend and frontend served together.

---

## Competition Rules (Fest Edition)

**Duration**: 3/5/7 days (configurable)
**Starting Capital**: ₹10,00,000 (virtual)
**Entry Fee**: ₹50-₹100 (configurable, virtual)
**ROI Calculation**: `(Final Value - Initial Capital) / Initial Capital × 100`
**Rankings**: Based on highest ROI %
**Rewards**: Certificates + Sponsored goodies (no real money)

---

## Success Metrics
- Daily active users (DAU)
- College participation rate
- Referral conversion rate
- Average session ROI accuracy
- User retention (Day 7, Day 30)
- Campus ambassador engagement
