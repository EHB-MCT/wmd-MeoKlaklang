#!/bin/bash

echo "🐳 Building and starting Docker containers..."

# Stop any running containers
docker-compose down -v

# Build and start production containers
docker-compose up --build -d

echo "⏳ Waiting for services to start..."
sleep 15

# Check if services are healthy
echo "🔍 Checking service health..."
if curl -s http://localhost:5003/health > /dev/null; then
    echo "✅ Backend is healthy!"
else
    echo "❌ Backend is not responding"
fi

if curl -s http://localhost > /dev/null; then
    echo "✅ Frontend is healthy!"
else
    echo "❌ Frontend is not responding"
fi

echo ""
echo "🎉 Services are running!"
echo "🌐 Frontend: http://localhost"
echo "🔧 Backend API: http://localhost:5003"
echo "🗄️  MongoDB: mongodb://localhost:27017"

# Show running containers
docker-compose ps