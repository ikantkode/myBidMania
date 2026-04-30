# Bids Tracker - Construction Bid Tracking Application

A complete dockerized React application for tracking construction bids with PostgreSQL database.

## Features

- **User Authentication**: Secure JWT-based authentication with self-registration
- **Agency Management**: Create and manage agencies with contact persons
- **Project Tracking**: Create construction bid projects with all relevant details
- **Addenda Handling**: Add addenda with conditional attachment requirements
- **File Uploads**: Upload drawings and specifications for each project
- **Calendar Dashboard**: Monthly calendar view showing all bid dates, walkthroughs, and addenda
- **Email Notifications**: Automated reminders for upcoming bid deadlines
- **Modern UI**: Clean, minimalistic interface built with shadcn/ui and Tailwind CSS

## Tech Stack

### Frontend
- React 18 with Vite
- TypeScript
- shadcn/ui components
- Tailwind CSS
- FullCalendar
- React Router
- TanStack Query
- Axios

### Backend
- Node.js with Express
- TypeScript
- Prisma ORM
- PostgreSQL
- JWT authentication
- Multer for file uploads
- Nodemailer for email notifications
- node-cron for scheduled tasks

### Infrastructure
- Docker Compose
- Nginx reverse proxy
- PostgreSQL (port 6900)
- Backend API (port 6902)
- Main application (port 6901)

## Quick Start

### Prerequisites

- Docker and Docker Compose installed

### 1. Clone and Navigate

```bash
cd bids
```

### 2. Start the Application

```bash
docker compose up --build
```

That's it! The application will:
- Generate a secure JWT secret automatically
- Set up the PostgreSQL database
- Run all necessary migrations
- Start all services

First start will take a few minutes to build images.

### 3. Access the Application

Open your browser and navigate to:

```
http://localhost:6901
```

### Optional: Configure Email Notifications

If you want email notifications for bid deadlines, create a `.env` file:

```bash
cp .env.example .env
```

Then edit `.env` with your SMTP configuration:

```env
# Email Configuration (for bid deadline reminders)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
EMAIL_FROM=noreply@bidstracker.com
```

Restart the containers after adding `.env`:

```bash
docker compose down
docker compose up --build
```

## Application Flow

### First-Time Setup

1. **Register**: Create a new account
2. **Create Agency**: You'll be prompted to create your first agency
   - Agency name and address (required)
   - Contact persons (optional)
3. **Start Creating Projects**: Once agency is created, you can start tracking bids

### Creating a Project

1. Click "New Project" button
2. Fill in project details:
   - School name/code (required)
   - Description (required)
   - Bid due date (required)
   - Pre-bid walkthrough date (required)
   - Address (required)
   - Agency selection (required)
   - Contact person (optional, if agency has contacts)
3. Add addenda (optional):
   - Add addendum dates
   - Attach files OR check "No attachment"
4. Create project
5. Upload drawings and specifications

### Calendar Dashboard

- **Red events**: Bid due dates
- **Blue events**: Pre-bid walkthroughs
- **Yellow events**: Addenda dates
- Click any event to see quick details
- Navigate to full project details

## Email Notifications

The system sends automatic email reminders for bid deadlines:

- **3 days before**: Advance notice
- **1 day before**: Final reminder
- **Same day**: Urgent reminder

Emails are sent daily at 8:00 AM (America/New_York timezone).

## Development

### Local Development with Hot Reload

For frontend development with hot reload, run services individually:

```bash
# Start database
docker compose up postgres

# Start backend (from backend directory)
cd backend
npm install
npm run dev

# Start frontend (from frontend directory)
cd frontend
npm install
npm run dev
```

Frontend will be available at http://localhost:5173
Backend API will be available at http://localhost:6902

### Database Management

```bash
# Generate Prisma client
cd backend
npx prisma generate

# Run migrations
npx prisma migrate dev

# Open Prisma Studio (database GUI)
npx prisma studio
```

### Adding New Dependencies

Backend:
```bash
cd backend
npm install package-name
```

Frontend:
```bash
cd frontend
npm install package-name
```

Then rebuild Docker containers:
```bash
docker compose up --build
```

## File Structure

```
bids/
├── docker compose.yml          # Docker orchestration
├── .env                        # Environment variables (create from .env.example)
├── frontend/                   # React application
│   ├── src/
│   │   ├── components/        # React components
│   │   ├── pages/            # Page components
│   │   ├── lib/              # Utilities and API client
│   │   └── main.tsx          # Entry point
│   ├── Dockerfile
│   └── package.json
├── backend/                   # Node.js API
│   ├── src/
│   │   ├── routes/           # API routes
│   │   ├── middleware/       # Auth middleware
│   │   ├── utils/           # File upload, email scheduler
│   │   ├── prisma/          # Database schema
│   │   └── index.ts         # Server entry point
│   ├── Dockerfile
│   └── package.json
└── nginx/                    # Reverse proxy
    ├── nginx.conf
    └── Dockerfile
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

### Agencies
- `GET /api/agencies` - List all agencies
- `POST /api/agencies` - Create agency
- `GET /api/agencies/:id` - Get agency details
- `PUT /api/agencies/:id` - Update agency
- `DELETE /api/agencies/:id` - Delete agency
- `POST /api/agencies/:id/contacts` - Add contact person
- `GET /api/agencies/:id/contacts` - List contact persons

### Projects
- `GET /api/projects` - List all projects
- `POST /api/projects` - Create project
- `GET /api/projects/:id` - Get project details
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project
- `POST /api/projects/:id/addenda` - Add addendum
- `POST /api/projects/:id/files` - Upload file
- `GET /api/projects/:id/files` - List files
- `DELETE /api/projects/:id/files/:fileId` - Delete file

### Calendar
- `GET /api/calendar/events` - Get calendar events

### Notifications
- `POST /api/notifications/send-reminders` - Trigger reminder emails
- `GET /api/notifications/status` - Check email configuration

## Troubleshooting

### Database Connection Issues

```bash
# Check if PostgreSQL is running
docker compose ps

# View database logs
docker compose logs postgres

# Restart database
docker compose restart postgres
```

### Email Not Working

1. Verify SMTP credentials in `.env`
2. Check email service logs:
   ```bash
   docker compose logs backend | grep email
   ```
3. Test email configuration:
   ```bash
   curl http://localhost:6901/api/notifications/status
   ```

### File Upload Issues

- Maximum file size: 50MB
- Supported formats: PDF, DOC, DOCX, XLS, XLSX, Images, DWG, DXF, ZIP
- Files are stored in Docker volume and persist across restarts

### Reset Everything

```bash
# Stop all containers
docker compose down

# Remove volumes (deletes all data!)
docker compose down -v

# Rebuild and start
docker compose up --build
```

## Security Notes

- JWT_SECRET is auto-generated on first start (check backend logs for the value)
- For production, set your own JWT_SECRET in `.env` for better security
- Use strong passwords for database
- Configure HTTPS for production
- Regular security updates for dependencies
- Review file upload permissions

## License

MIT

## Support

For issues or questions, please contact the development team.
