# Quick Start Guide - Bids Tracker

## 🚀 Fast Start (2 Steps)

### 1. Navigate to Project
```bash
cd /home/shakespear/bids
```

### 2. Start Application
```bash
./start.sh
```

This will:
- Auto-generate a secure JWT secret
- Build Docker images
- Start all services
- Run database migrations
- Display service status

### 3. Access Application
```
http://localhost:6901
```

**Note:** JWT_SECRET is auto-generated. For email notifications, optionally configure SMTP settings in `.env`.

## 📁 Project Structure

```
bids/
├── docker compose.yml     # Docker orchestration
├── start.sh              # Start script
├── stop.sh               # Stop script
├── logs.sh               # View logs
├── README.md             # Full documentation
├── frontend/             # React app
│   ├── src/pages/       # Login, Dashboard, Projects, etc.
│   ├── src/components/  # UI components
│   └── src/lib/         # API client, utilities
├── backend/             # Node.js API
│   ├── src/routes/      # API endpoints
│   ├── src/middleware/  # Authentication
│   └── src/prisma/      # Database schema
└── nginx/               # Reverse proxy
```

## 🎯 First Time Use

1. **Register**: Create account at /register
2. **Create Agency**: You'll be prompted automatically
3. **Create Project**: Click "New Project" button
4. **Track Bids**: View calendar and project list

## 🔧 Common Commands

```bash
# Start application
./start.sh

# Stop application
./stop.sh

# View logs
./logs.sh              # All services
./logs.sh backend      # Specific service

# Rebuild after changes
docker compose up --build

# Remove all data (reset)
docker compose down -v
```

## 🌐 Access Points

| Service | URL | Port |
|---------|-----|------|
| Main App | http://localhost:6901 | 6901 |
| API | http://localhost:6901/api | 6901 |
| Database | localhost:6900 | 6900 |
| Backend Direct | http://localhost:6902 | 6902 |

## 🎨 Features

- ✅ User authentication
- ✅ Agency management
- ✅ Project tracking
- ✅ Addenda with attachments
- ✅ File uploads (drawings, specs)
- ✅ Calendar dashboard
- ✅ Email reminders
- ✅ Modern UI

## 📧 Email Setup (Optional)

For email notifications, configure in `.env`:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
EMAIL_FROM=noreply@bidstracker.com
```

**Gmail users:** Use an App Password, not your regular password.

## 🐛 Troubleshooting

**Port already in use?**
```bash
# Check what's using port 6900-6902
lsof -i :6900
lsof -i :6901
lsof -i :6902
```

**Database not starting?**
```bash
docker compose logs postgres
docker compose restart postgres
```

**Need to reset everything?**
```bash
docker compose down -v
./start.sh
```

## 📚 Full Documentation

See [README.md](README.md) for complete documentation.

---

**Need help?** Check the logs: `./logs.sh backend`
