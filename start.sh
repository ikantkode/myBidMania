#!/bin/bash

echo "🚀 Starting Bids Tracker..."

# Check if .env exists
if [ ! -f .env ]; then
    echo "⚠️  .env file not found. Creating from .env.example..."
    cp .env.example .env
    echo "✅ Created .env file. Please edit it with your configuration before starting."
    echo ""
    echo "📝 Edit .env and configure:"
    echo "   - JWT_SECRET (use a strong random string)"
    echo "   - SMTP settings for email notifications (optional)"
    echo ""
    exit 1
fi

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

# Determine which docker compose command to use
if command -v docker-compose &> /dev/null; then
    DOCKER_COMPOSE="docker-compose"
elif docker compose version &> /dev/null; then
    DOCKER_COMPOSE="docker compose"
else
    echo "❌ Docker Compose not found. Please install Docker Compose."
    exit 1
fi

echo "🔧 Using: $DOCKER_COMPOSE"

# Build and start
echo "🐳 Building Docker images..."
$DOCKER_COMPOSE build

echo "⏳ Starting services..."
$DOCKER_COMPOSE up -d

echo ""
echo "✅ Application started!"
echo ""
echo "📱 Access the application at: http://localhost:6901"
echo ""
echo "🔍 View logs: ./logs.sh"
echo "🛑 Stop application: ./stop.sh"
echo ""
echo "⏳ Waiting for services to be ready..."
sleep 10

# Check if services are running
if $DOCKER_COMPOSE ps | grep -q "Up"; then
    echo "✅ All services are running!"
    echo ""
    echo "📊 Service status:"
    $DOCKER_COMPOSE ps
else
    echo "❌ Some services failed to start. Check logs with: ./logs.sh"
fi
