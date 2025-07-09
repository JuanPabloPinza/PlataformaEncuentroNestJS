#!/bin/bash
# CockroachDB Data Inspection Scripts

echo "🔍 CockroachDB Data Inspection Tools"
echo "======================================"

# Function to run SQL commands on CockroachDB
run_sql() {
    local node=$1
    local sql_command=$2
    echo "🗄️ Running on $node: $sql_command"
    docker exec $node cockroach sql --insecure --execute="$sql_command"
    echo ""
}

# Function to connect to interactive SQL shell
connect_sql() {
    local node=$1
    echo "🔌 Connecting to interactive SQL shell on $node"
    echo "Type 'exit' or press Ctrl+C to quit"
    docker exec -it $node cockroach sql --insecure
}

echo "Available commands:"
echo "1. check_databases    - List all databases"
echo "2. check_tables       - List tables in orders_db"
echo "3. check_orders       - Show all orders"
echo "4. check_replication  - Show replication status"
echo "5. connect_node1      - Connect to Node 1 SQL shell"
echo "6. connect_node2      - Connect to Node 2 SQL shell"
echo "7. cluster_status     - Show cluster node status"
echo ""

case "$1" in
    "check_databases")
        run_sql "cockroach-node1" "SHOW DATABASES;"
        ;;
    "check_tables")
        run_sql "cockroach-node1" "USE orders_db; SHOW TABLES;"
        ;;
    "check_orders")
        run_sql "cockroach-node1" "USE orders_db; SELECT * FROM \"order\" LIMIT 10;"
        ;;
    "check_replication")
        run_sql "cockroach-node1" "SHOW RANGES FROM DATABASE orders_db;"
        ;;
    "connect_node1")
        connect_sql "cockroach-node1"
        ;;
    "connect_node2")
        connect_sql "cockroach-node2"
        ;;
    "cluster_status")
        echo "🔍 Cluster Node Status:"
        docker exec cockroach-node1 cockroach node status --insecure
        ;;
    *)
        echo "Usage: ./check-cockroach-data.sh [command]"
        echo "Example: ./check-cockroach-data.sh check_orders"
        ;;
esac
