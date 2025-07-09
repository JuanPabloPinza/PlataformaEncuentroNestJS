#!/bin/bash

# CockroachDB Startup Script for NestJS Microservices Platform

echo "🚀 Starting CockroachDB cluster and microservices..."

# Function to check if a service is running
check_service() {
    local service_name=$1
    local port=$2
    local max_attempts=30
    local attempt=1

    echo "Checking $service_name on port $port..."
    while [ $attempt -le $max_attempts ]; do
        if nc -z localhost $port; then
            echo "✅ $service_name is ready on port $port"
            return 0
        fi
        echo "⏳ Waiting for $service_name... (attempt $attempt/$max_attempts)"
        sleep 2
        ((attempt++))
    done
    
    echo "❌ $service_name failed to start on port $port"
    return 1
}

# Step 1: Start CockroachDB cluster
echo "📦 Starting CockroachDB cluster with Docker Compose..."
docker-compose up -d cockroach-node1 cockroach-node2 cockroach-init cockroach-setup rabbitmq haproxy

# Step 2: Wait for CockroachDB to be ready
echo "⏳ Waiting for CockroachDB cluster to initialize..."
sleep 15

# Check if CockroachDB nodes are running
check_service "CockroachDB Node 1" 26257
check_service "CockroachDB Node 2" 26258
check_service "CockroachDB Load Balancer" 26260
check_service "RabbitMQ" 5672

# Step 3: Set environment variables for CockroachDB
echo "🔧 Setting up environment variables..."
export DB_TYPE=cockroachdb
export DB_HOST=localhost
export DB_PORT=26260  # Load balanced port
export DB_USERNAME=orders_user
export DB_PASSWORD=
export DB_NAME=orders_db
export DB_SSL=false

# Step 4: Display connection information
echo ""
echo "🗄️ Database Connection Information:"
echo "   Type: CockroachDB"
echo "   Load Balanced Endpoint: localhost:26260"
echo "   Direct Node 1: localhost:26257"
echo "   Direct Node 2: localhost:26258"
echo "   Web UI Node 1: http://localhost:8080"
echo "   Web UI Node 2: http://localhost:8081"
echo "   HAProxy Stats: http://localhost:8404/stats"
echo ""
echo "🐰 RabbitMQ Information:"
echo "   AMQP: localhost:5672"
echo "   Management UI: http://localhost:15672 (admin/admin)"
echo ""

# Step 5: Start the microservices
echo "🚀 Starting NestJS microservices..."
echo "You can now run:"
echo "   npm run serve:orders-service    # Orders service with CockroachDB"
echo "   npm run serve:events-service    # Events service"
echo "   npm run serve:realtime-service  # Realtime service"
echo "   npm run serve:api-gateway       # API Gateway"
echo ""
echo "Or start all services at once:"
echo "   npm run start:all"
echo ""

# Optional: Start services automatically
read -p "Do you want to start all microservices now? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🚀 Starting all microservices..."
    npm run start:all
fi

echo "✅ CockroachDB cluster setup completed!"
