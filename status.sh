#!/bin/bash

echo "🔍 Bids Tracker Status Check"
echo ""

# Determine which docker compose command to use
if command -v docker-compose &> /dev/null; then
    DOCKER_COMPOSE="docker-compose"
elif docker compose version &> /dev/null; then
    DOCKER_COMPOSE="docker compose"
else
    echo "❌ Docker Compose not found"
    exit 1
fi

echo "📊 Container Status:"
$DOCKER_COMPOSE ps

echo ""
echo "🌐 Access URLs:"
echo "   Main App: http://localhost:6901"
echo "   API: http://localhost:6901/api"
echo "   Database: localhost:6900"

echo ""
echo "📝 Recent Logs (last 20 lines):"
$DOCKER_COMPOSE logs --tail=20
