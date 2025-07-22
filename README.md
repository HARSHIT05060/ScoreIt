# ScoreIt: Gully Cricket Scoring App

## Overview
ScoreIt is a full-stack web application for managing and scoring gully cricket matches. It allows users to create teams, schedule matches, record live scores ball-by-ball, and view match/player statistics. The app supports multiple user roles: Admin, Scorer, and Viewer, each with tailored dashboards and permissions.

## Features
- User authentication and role-based access (Admin, Scorer, Viewer)
- Team and player management
- Match scheduling and live scoring (T10, T20, ODI formats)
- Ball-by-ball score entry and real-time updates
- Match summaries and player statistics
- Responsive, modern UI with dashboards for each role

## Tech Stack
- **Frontend:** React, Vite, Tailwind CSS, Axios
- **Backend:** Node.js, Express, MongoDB, Mongoose, JWT, bcryptjs

## Project Structure
```
scoring app/
  backend/    # Express API, models, controllers, routes
  frontend/   # React app (Vite), components, pages, assets
  README.md   # Project overview (this file)
  DOCUMENTATION.md # Detailed technical documentation
```

## Getting Started
### Prerequisites
- Node.js (v18+ recommended)
- npm or yarn
- MongoDB instance (local or cloud)

### Backend Setup
1. `cd backend`
2. `npm install`
3. Create a `.env` file with:
   ```
   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   PORT=5000
   ```
4. `npm start` (or `node server.js`)

### Frontend Setup
1. `cd frontend`
2. `npm install`
3. `npm run dev` (starts on http://localhost:5173)

## Usage
- Register as a user (default role: Viewer). Admins can upgrade roles.
- Admin/Scorer: Create teams, schedule matches, enter live scores.
- Viewer: View live matches, scores, and summaries.

## API & Folder Structure
- **Backend:**
  - `controllers/` - Business logic for auth, matches, teams, players
  - `models/` - Mongoose schemas (User, Team, Player, Match, etc.)
  - `routes/` - Express routes for API endpoints
  - `middleware/` - Auth and role checks
- **Frontend:**
  - `src/components/` - UI components (dashboards, forms, scoring)
  - `src/pages/` - Main pages (dashboard, match creation, etc.)
  - `src/context/` - Auth context
  - `src/services/` - API calls

## Contributing
Pull requests are welcome! Please open an issue first to discuss changes.

## License
MIT

## Contact
For questions or support, contact the maintainer.
