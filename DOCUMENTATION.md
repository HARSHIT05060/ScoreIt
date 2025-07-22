# ScoreIt Documentation

## Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [Backend](#backend)
   - [Tech Stack](#backend-tech-stack)
   - [Folder Structure](#backend-folder-structure)
   - [Data Models](#data-models)
   - [API Endpoints](#api-endpoints)
   - [Authentication & Roles](#authentication--roles)
   - [Environment Variables](#backend-environment-variables)
3. [Frontend](#frontend)
   - [Tech Stack](#frontend-tech-stack)
   - [Folder Structure](#frontend-folder-structure)
   - [Main Components & Pages](#main-components--pages)
   - [User Flows](#user-flows)
   - [Environment Variables](#frontend-environment-variables)
4. [Deployment](#deployment)
5. [FAQ](#faq)

---

## Architecture Overview
- **Monorepo** with `backend` (Node.js/Express/MongoDB) and `frontend` (React/Vite/Tailwind)
- RESTful API for all data operations
- JWT-based authentication and role-based access control
- Real-time updates via polling (future: websockets)

---

## Backend
### Backend Tech Stack
- Node.js, Express, MongoDB, Mongoose
- JWT for authentication, bcryptjs for password hashing

### Backend Folder Structure
- `controllers/` - Auth, match, team, player logic
- `models/` - Mongoose schemas: User, Team, Player, Match, Innings, PlayerPerformance
- `routes/` - API endpoints for auth, matches, teams, players
- `middleware/` - Auth and role middleware
- `utils/` - Utility functions (e.g., JWT token generation)

### Data Models
- **User**: { name, email, password, role (Admin/Scorer/Viewer) }
- **Team**: { name, players[] }
- **Player**: { name, age, role, stats }
- **Match**: { matchName, matchType, teams, date, status, innings[] }
- **Innings**: { matchId, battingTeam, bowlingTeam, totalRuns, ... }
- **PlayerPerformance**: { matchId, playerName, teamId, role, batting, bowling, fielding, ... }

### API Endpoints (Sample)
- `POST /api/auth/register` - Register user
- `POST /api/auth/login` - Login user
- `GET /api/teams` - List teams
- `POST /api/teams` - Create team
- `GET /api/matches` - List matches
- `POST /api/matches` - Create match
- `POST /api/match/:id/start` - Start match
- `POST /api/match/:id/score` - Update score
- `GET /api/match/:id/summary` - Match summary

### Authentication & Roles
- JWT tokens required for protected routes
- Roles:
  - **Admin**: Full access (manage users, teams, matches)
  - **Scorer**: Manage matches, enter scores
  - **Viewer**: View matches and stats only

### Backend Environment Variables
- `MONGO_URI` - MongoDB connection string
- `JWT_SECRET` - Secret for JWT
- `PORT` - Server port (default: 5000)

---

## Frontend
### Frontend Tech Stack
- React, Vite, Tailwind CSS, Axios

### Frontend Folder Structure
- `src/components/` - UI components (dashboards, forms, scoring, etc.)
- `src/pages/` - Main pages (dashboard, match creation, etc.)
- `src/context/` - Auth context/provider
- `src/services/` - API calls

### Main Components & Pages
- **HomePage**: Landing page
- **LoginForm/RegisterForm**: Auth forms
- **AdminScorerDashboard**: Dashboard for Admin/Scorer
- **ViewerDashboard**: Dashboard for Viewers
- **CreateMatch/StartMatch**: Match setup and start
- **ScoringComponent**: Ball-by-ball scoring UI
- **MatchSummary**: View match results and stats

### User Flows
- **Registration/Login**: Users register (default: Viewer). Admin upgrades roles.
- **Team/Player Management**: Admin/Scorer creates teams and players.
- **Match Creation**: Admin/Scorer schedules matches, selects teams.
- **Live Scoring**: Scorer enters ball-by-ball data during match.
- **Viewing**: Viewers see live scores and summaries.

### Frontend Environment Variables
- `VITE_API_BASE_URL` - Backend API base URL

---

## Deployment
- Deploy backend (Node.js) to services like Heroku, Render, or Vercel (serverless)
- Deploy frontend (Vite/React) to Vercel, Netlify, or similar
- Set environment variables in deployment dashboard

---

## FAQ
**Q: How do I become a Scorer or Admin?**
A: Register as a Viewer, then request an Admin to upgrade your role.

**Q: Can I use this for tournaments?**
A: The app is designed for single matches, but can be extended for tournaments.

**Q: How do I contribute?**
A: Fork the repo, create a feature branch, and open a pull request! 