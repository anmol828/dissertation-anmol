## Futsal Booking Platform

Web-based futsal court booking and player/team management system built with:

- **Frontend**: React + Vite + Tailwind CSS
- **Backend**: Node.js + Express
- **Database**: MySQL with Prisma ORM

### Features

- User registration and login (email + password, JWT-based)
- Multiple roles: admin, venue admin, player, normal user
- Venue and court management
- Court booking in 1-hour multiples
- Booking cancellation allowed up to 2 hours before start time
- Player profiles with age, position, and skill level
- Team creation and player recruitment (no chat or payments yet)

### Getting Started

1. Create a MySQL database and update `DATABASE_URL` in `.env` (see `.env.example`).
2. Install dependencies:
   - Backend: `cd backend && npm install`
   - Frontend: `cd frontend && npm install`
3. Run Prisma migrations:
   - `cd backend`
   - `npx prisma migrate dev --name init`
4. Optional: load demo data
   - `npm run prisma:seed`
5. Start development servers:
   - Backend: `npm run dev`
   - Frontend: `cd ../frontend && npm run dev`

### Notes

- eSewa payment and AI-based recommendations are not implemented yet, but the data model is designed so they can be added later.
- This project is structured for local/university demo use but can be deployed with environment configuration.
- Demo accounts after seeding:
  - Admin: `admin@futsalhub.demo` / `demo123`
  - Venue owner: `owner1@futsalhub.demo` / `demo123`
  - Player: `player1@futsalhub.demo` / `demo123`
  - User: `user@futsalhub.demo` / `demo123`

