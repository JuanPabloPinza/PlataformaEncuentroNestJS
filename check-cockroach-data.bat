@echo off
REM CockroachDB Data Inspection Scripts for Windows

echo 🔍 CockroachDB Data Inspection Tools
echo ======================================

if "%1"=="" goto usage

if "%1"=="check_databases" goto check_databases
if "%1"=="check_tables" goto check_tables
if "%1"=="check_orders" goto check_orders
if "%1"=="check_replication" goto check_replication
if "%1"=="connect_node1" goto connect_node1
if "%1"=="connect_node2" goto connect_node2
if "%1"=="cluster_status" goto cluster_status
goto usage

:check_databases
echo 🗄️ Listing all databases...
docker exec cockroach-node1 cockroach sql --insecure --execute="SHOW DATABASES;"
goto end

:check_tables
echo 📋 Listing tables in orders_db...
docker exec cockroach-node1 cockroach sql --insecure --execute="USE orders_db; SHOW TABLES;"
goto end

:check_orders
echo 📊 Showing orders data...
docker exec cockroach-node1 cockroach sql --insecure --execute="USE orders_db; SELECT * FROM \"order\" LIMIT 10;"
goto end

:check_replication
echo 🔄 Showing replication status...
docker exec cockroach-node1 cockroach sql --insecure --execute="SHOW RANGES FROM DATABASE orders_db;"
goto end

:connect_node1
echo 🔌 Connecting to Node 1 SQL shell...
echo Type 'exit' or press Ctrl+C to quit
docker exec -it cockroach-node1 cockroach sql --insecure
goto end

:connect_node2
echo 🔌 Connecting to Node 2 SQL shell...
echo Type 'exit' or press Ctrl+C to quit
docker exec -it cockroach-node2 cockroach sql --insecure
goto end

:cluster_status
echo 🔍 Cluster Node Status:
docker exec cockroach-node1 cockroach node status --insecure
goto end

:usage
echo Available commands:
echo   check_databases    - List all databases
echo   check_tables       - List tables in orders_db
echo   check_orders       - Show all orders
echo   check_replication  - Show replication status
echo   connect_node1      - Connect to Node 1 SQL shell
echo   connect_node2      - Connect to Node 2 SQL shell
echo   cluster_status     - Show cluster node status
echo.
echo Usage: check-cockroach-data.bat [command]
echo Example: check-cockroach-data.bat check_orders

:end
pause
