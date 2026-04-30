#!/bin/bash

echo "🛑 Stopping Bids Tracker..."

# Determine which docker compose command to use
if command -v docker-compose &> /dev/null; then
    DOCKER_COMPOSE="docker-compose"
elif docker compose version &> /dev/null; then
    DOCKER_COMPOSE="docker compose"
else
    echo "❌ Docker Compose not found. Please install Docker Compose."
    exit 1
fi

$DOCKER_COMPOSE down

echo "✅ Application stopped!"
echo ""
echo "💾 To remove all data (including database): $DOCKER_COMPOSE down -v"
