@echo off
echo 🚀 Starting CockroachDB cluster and microservices...

REM Step 1: Start CockroachDB cluster
echo 📦 Starting CockroachDB cluster with Docker Compose...
docker-compose up -d cockroach-node1 cockroach-node2 cockroach-init cockroach-setup rabbitmq haproxy

REM Step 2: Wait for CockroachDB to be ready
echo ⏳ Waiting for CockroachDB cluster to initialize...
timeout /t 15 /nobreak > nul

REM Step 3: Set environment variables for CockroachDB
echo 🔧 Setting up environment variables...
set DB_TYPE=cockroachdb
set DB_HOST=localhost
set DB_PORT=26260
set DB_USERNAME=orders_user
set DB_PASSWORD=
set DB_NAME=orders_db
set DB_SSL=false

REM Step 4: Display connection information
echo.
echo 🗄️ Database Connection Information:
echo    Type: CockroachDB
echo    Load Balanced Endpoint: localhost:26260
echo    Direct Node 1: localhost:26257
echo    Direct Node 2: localhost:26258
echo    Web UI Node 1: http://localhost:8080
echo    Web UI Node 2: http://localhost:8081
echo    HAProxy Stats: http://localhost:8404/stats
echo.
echo 🐰 RabbitMQ Information:
echo    AMQP: localhost:5672
echo    Management UI: http://localhost:15672 (admin/admin)
echo.

REM Step 5: Service startup instructions
echo 🚀 Starting NestJS microservices...
echo You can now run:
echo    npm run serve:orders-service    # Orders service with CockroachDB
echo    npm run serve:events-service    # Events service
echo    npm run serve:realtime-service  # Realtime service
echo    npm run serve:api-gateway       # API Gateway
echo.
echo Or start all services at once:
echo    npm run start:all
echo.

REM Optional: Start services automatically
set /p choice="Do you want to start all microservices now? (y/n): "
if /i "%choice%"=="y" (
    echo 🚀 Starting all microservices...
    npm run start:all
)

echo ✅ CockroachDB cluster setup completed!
pause
