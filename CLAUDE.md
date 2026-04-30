# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Bids Tracker is a dockerized construction bid tracking application built with React (TypeScript) frontend and Node.js/Express backend, using PostgreSQL with Prisma ORM. The application allows users to track construction bids, manage agencies, handle addenda with file attachments, and receive automated email reminders for bid deadlines.

## Development Commands

### Docker-based development (recommended)
```bash
# Start all services (builds and starts postgres, backend, frontend, nginx)
./start.sh

# Stop all services
./stop.sh

# View logs (all services or specific service)
./logs.sh              # All services
./logs.sh backend      # Specific service
./logs.sh postgres
./logs.sh frontend

# Rebuild after code changes
docker compose up --build

# Reset everything (deletes all data)
docker compose down -v
```

### Local development with hot reload
```bash
# Terminal 1: Start database only
docker compose up postgres

# Terminal 2: Start backend
cd backend
npm install
npm run dev              # Runs on port 6902

# Terminal 3: Start frontend
cd frontend
npm install
npm run dev              # Runs on port 5173
```

### Backend-specific commands
```bash
cd backend
npm run build            # Compile TypeScript
npm run start            # Run compiled server
npm run prisma:generate  # Generate Prisma client
npm run prisma:migrate   # Run migrations
npm run prisma:studio    # Open Prisma Studio (database GUI)
npm run seed             # Seed database with dummy data
```

### Frontend-specific commands
```bash
cd frontend
npm run dev              # Start dev server (port 5173)
npm run build            # Production build
npm run lint             # Run ESLint
```

## Architecture

### Application Flow
1. **User Registration/Login** → JWT tokens issued and stored in localStorage
2. **First-time User Flow** → `requireAgency` middleware checks if user has an agency; if not, redirects to `/create-agency`
3. **Agency Creation** → Required before creating projects; enforced server-side via middleware
4. **Project Creation** → Selects from user's agencies; can add addenda with conditional file attachments
5. **Calendar Dashboard** → Color-coded events (red: bid due dates, blue: walkthroughs, yellow: addenda)

### Port Configuration
| Port | Service | Access |
|------|---------|--------|
| 6900 | PostgreSQL | Direct DB access |
| 6901 | Nginx (main app) | http://localhost:6901 |
| 6902 | Backend API | Internal/Frontend access |
| 5173 | Vite dev server | Local development only |

### Key Directories
```
backend/src/
├── index.ts              # Server entry point, middleware setup
├── middleware/
│   └── auth.ts          # JWT authentication + requireAgency check
├── routes/              # API route handlers (auth, agencies, projects, calendar, notifications, teamMembers)
├── prisma/              # Not here - schema is at backend/prisma/schema.prisma
└── utils/               # emailScheduler.ts, fileUpload.ts

frontend/src/
├── App.tsx              # Route definitions with ProtectedRoute wrapper
├── lib/
│   └── api.ts           # Axios instance with interceptors, API functions
├── components/
│   ├── ProtectedRoute.tsx  # Auth wrapper component
│   └── ui/              # shadcn/ui components
└── pages/               # Page components (Login, Dashboard, Projects, etc.)
```

### Database Schema (Prisma)
Located at `backend/prisma/schema.prisma`

**Models:**
- **User**: Authentication, role (ADMIN/MEMBER), relation to agencies and projects
- **Agency**: Belongs to user, has many ContactPersons and Projects
- **ContactPerson**: Optional contacts for agencies
- **Project**: Construction bids with dates, belongs to User and Agency
- **Addendum**: Project addenda with conditional file attachments (hasAttachment XOR noAttachment)
- **ProjectFile**: Uploaded files (drawings/specs) for projects

**Key relationships:**
- User → Agencies (1:N, cascade delete)
- User → Projects (1:N, cascade delete)
- Agency → Projects (1:N, restrict delete - can't delete agency with projects)
- Project → Addenda (1:N, cascade delete)
- Project → ProjectFiles (1:N, cascade delete)

### Authentication Pattern
- JWT stored in localStorage, attached via `Authorization: Bearer <token>` header
- Axios interceptor in `frontend/src/lib/api.ts` automatically adds token to requests
- Server middleware: `authenticate` verifies JWT, `requireAgency` checks agency ownership
- 401 responses trigger automatic redirect to login and clear localStorage

### File Upload System
- Multer handles `multipart/form-data` uploads to `/uploads` directory
- Files persisted in Docker volume: `uploads:/uploads`
- File types: drawings, specifications
- API routes: `POST /api/projects/:id/files` (upload), `GET /api/projects/:id/files` (list), `DELETE /api/projects/:id/files/:fileId` (delete)
- Static file serving: backend serves `/uploads` route at `app.use('/uploads', express.static(UPLOAD_DIR))`

### Email Notifications
- node-cron job runs daily at 8 AM America/New_York
- Checks projects with bid due dates at T-3 days, T-1 day, and T-0 days
- Sends reminders via Nodemailer using SMTP credentials from `.env`
- Configuration: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `EMAIL_FROM`

## Environment Variables

Copy from `.env.example`:
- `JWT_SECRET`: Required, strong secret for JWT signing
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `EMAIL_FROM`: Optional, for email notifications

## Common Patterns

### Adding a new API endpoint
1. Create route handler in `backend/src/routes/`
2. Register in `backend/src/index.ts`: `app.use('/api/feature', featureRoutes)`
3. Add API functions to `frontend/src/lib/api.ts`
4. Use in frontend component with TanStack Query or direct API call

### Database schema changes
1. Modify `backend/prisma/schema.prisma`
2. Run: `cd backend && npx prisma migrate dev --name description`
3. Regenerate client: `npm run prisma:generate`
4. Rebuild Docker containers: `docker compose up --build`

### Adding a new page
1. Create component in `frontend/src/pages/`
2. Add route in `frontend/src/App.tsx` wrapped in `ProtectedRoute` if auth needed
3. Add navigation link in appropriate existing page

### Team member management
- Feature exists: TeamMembers page, teamMemberAPI, and `/api/team-members` routes
- Allows CRUD operations on users with ADMIN/MEMBER roles
- Password updates via `PATCH /api/team-members/:id/password`

## Testing

No automated test suite is currently configured. Manual testing workflow:
1. Seed database: `cd backend && npm run seed`
2. Login with: admin@ambcontractors.com / admin123
3. Test user flows: agency creation, project creation, file uploads, calendar view
4. Check email functionality via API: `GET /api/notifications/status`
5. View logs for errors: `./logs.sh backend`

## Important Constraints

- **Agency requirement**: Users must create an agency before creating projects (enforced server-side)
- **Addendum validation**: `hasAttachment` and `noAttachment` are mutually exclusive (XOR validation in route)
- **Cascade deletes**: Deleting a user deletes their agencies and projects; deleting a project deletes its addenda and files
- **Restrict delete**: Cannot delete an agency that has projects (prevents orphaned projects)
- **File storage**: Files stored in Docker volume, persist across container restarts
- **Email timezone**: Cron job uses America/New_York timezone regardless of server timezone
