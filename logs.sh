#!/bin/bash

# Determine which docker compose command to use
if command -v docker-compose &> /dev/null; then
    DOCKER_COMPOSE="docker-compose"
elif docker compose version &> /dev/null; then
    DOCKER_COMPOSE="docker compose"
else
    echo "❌ Docker Compose not found. Please install Docker Compose."
    exit 1
fi

if [ -z "$1" ]; then
    echo "📊 Showing logs for all services (Ctrl+C to exit)..."
    $DOCKER_COMPOSE logs -f
else
    echo "📊 Showing logs for $1 (Ctrl+C to exit)..."
    $DOCKER_COMPOSE logs -f "$1"
fi
