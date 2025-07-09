# CockroachDB Migration Guide

This guide explains how to migrate from PostgreSQL to CockroachDB for database replication in the orders-service microservice.

## Overview

CockroachDB provides:
- **Distributed SQL database** with PostgreSQL compatibility
- **Automatic replication** across multiple nodes
- **High availability** with automatic failover
- **Horizontal scaling** capabilities
- **ACID transactions** with strong consistency

## Architecture

```
┌─────────────────┐    Load Balancer    ┌─────────────────┐
│ Orders Service  │◄─────────────────────│    HAProxy      │
│   (Port 8878)   │                      │   (Port 26260)  │
└─────────────────┘                      └─────────────────┘
                                                   │
                                   ┌───────────────┼───────────────┐
                                   │               │               │
                            ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
                            │ CockroachDB │ │ CockroachDB │ │   Future    │
                            │   Node 1    │ │   Node 2    │ │   Node 3    │
                            │ (Port 26257)│ │ (Port 26258)│ │ (Port 26259)│
                            └─────────────┘ └─────────────┘ └─────────────┘
```

## Quick Start

### 1. Start CockroachDB Cluster

**Windows:**
```cmd
start-cockroach.bat
```

**Linux/Mac:**
```bash
chmod +x start-cockroach.sh
./start-cockroach.sh
```

**Manual Docker Compose:**
```bash
docker-compose up -d
```

### 2. Set Environment Variables

Create a `.env` file or set environment variables:

```bash
# For CockroachDB
DB_TYPE=cockroachdb
DB_HOST=localhost
DB_PORT=26260          # Load balanced port
DB_USERNAME=orders_user
DB_PASSWORD=
DB_NAME=orders_db
DB_SSL=false

# For production, use SSL:
# DB_SSL=true
```

### 3. Start Services

```bash
# Start orders service with CockroachDB
npm run serve:orders-service

# Or start all services
npm run start:all
```

## Service Ports

| Service | Port | Description |
|---------|------|-------------|
| CockroachDB Node 1 | 26257 | Direct connection to node 1 |
| CockroachDB Node 2 | 26258 | Direct connection to node 2 |
| HAProxy Load Balancer | 26260 | **Recommended for apps** |
| CockroachDB Web UI 1 | 8080 | Node 1 admin interface |
| CockroachDB Web UI 2 | 8081 | Node 2 admin interface |
| HAProxy Stats | 8404 | Load balancer statistics |
| RabbitMQ AMQP | 5672 | Message broker |
| RabbitMQ Management | 15672 | RabbitMQ web interface |

## Configuration Details

### Database Configuration

The orders-service now uses a dynamic configuration that supports both PostgreSQL and CockroachDB:

```typescript
// Automatic configuration based on DB_TYPE environment variable
const config = createDatabaseConfig();
```

### Connection Features

- **Load Balancing**: HAProxy distributes connections across nodes
- **Automatic Failover**: If one node fails, traffic routes to healthy nodes
- **Connection Pooling**: Optimized pool settings for CockroachDB
- **Retry Logic**: Built-in retry for CockroachDB transactions

### CockroachDB Optimizations

- **Application Name**: Set to 'orders-service' for monitoring
- **Statement Timeout**: Configurable query timeouts
- **Connection Limits**: Optimized pool sizing
- **Retry Writes**: Automatic retry for transient failures

## Migration Steps

### 1. Zero-Downtime Migration

```bash
# 1. Start CockroachDB cluster alongside PostgreSQL
docker-compose up -d

# 2. Export data from PostgreSQL
pg_dump -h localhost -U postgres orders_db > orders_backup.sql

# 3. Import to CockroachDB
cockroach sql --insecure --host=localhost:26257 --database=orders_db < orders_backup.sql

# 4. Update environment variables
export DB_TYPE=cockroachdb
export DB_HOST=localhost
export DB_PORT=26260

# 5. Restart orders-service
npm run serve:orders-service
```

### 2. Rollback Plan

To rollback to PostgreSQL:

```bash
# 1. Stop CockroachDB services
docker-compose down

# 2. Update environment variables
export DB_TYPE=postgres
export DB_HOST=127.0.0.1
export DB_PORT=5432
export DB_USERNAME=postgres
export DB_PASSWORD=password

# 3. Restart services
npm run serve:orders-service
```

## Monitoring and Management

### CockroachDB Web Interface

- **Node 1**: http://localhost:8080
- **Node 2**: http://localhost:8081

Features:
- Cluster overview and health
- Query performance metrics
- Database and table management
- Node-specific statistics

### HAProxy Statistics

- **URL**: http://localhost:8404/stats
- **Features**: 
  - Connection distribution
  - Node health status
  - Load balancing metrics
  - Real-time traffic monitoring

### Health Checks

```bash
# Check cluster status
docker exec cockroach-node1 cockroach node status --insecure

# Check database connectivity
docker exec cockroach-node1 cockroach sql --insecure --execute="SELECT now();"

# Test load balancer
curl http://localhost:26260
```

## Production Considerations

### Security

1. **Enable SSL/TLS**:
   ```bash
   DB_SSL=true
   ```

2. **Use Certificates**:
   ```bash
   # Generate certificates for secure cluster
   cockroach cert create-ca
   cockroach cert create-node
   cockroach cert create-client
   ```

3. **Network Security**:
   - Use private networks
   - Configure firewalls
   - Limit port access

### Scaling

1. **Add More Nodes**:
   ```yaml
   # Add to docker-compose.yml
   cockroach-node3:
     image: cockroachdb/cockroach:v23.1.0
     command: start --insecure --join=cockroach-node1,cockroach-node2,cockroach-node3
     ports:
       - "26259:26257"
   ```

2. **Geographic Distribution**:
   - Deploy nodes across regions
   - Configure locality settings
   - Optimize replication zones

### Backup and Recovery

```bash
# Create backup
cockroach sql --insecure --host=localhost:26257 --execute="BACKUP DATABASE orders_db TO 'nodelocal://1/backup';"

# Restore backup
cockroach sql --insecure --host=localhost:26257 --execute="RESTORE DATABASE orders_db FROM 'nodelocal://1/backup';"
```

## Troubleshooting

### Common Issues

1. **Connection Refused**:
   ```bash
   # Check if containers are running
   docker-compose ps
   
   # Check logs
   docker-compose logs cockroach-node1
   ```

2. **Cluster Not Initializing**:
   ```bash
   # Reinitialize cluster
   docker-compose down
   docker volume prune
   docker-compose up -d
   ```

3. **Load Balancer Issues**:
   ```bash
   # Check HAProxy status
   curl http://localhost:8404/stats
   
   # Check HAProxy logs
   docker-compose logs haproxy
   ```

### Debug Commands

```bash
# View cluster nodes
docker exec cockroach-node1 cockroach node ls --insecure

# Check replication status
docker exec cockroach-node1 cockroach sql --insecure --execute="SHOW RANGES FROM DATABASE orders_db;"

# Monitor query performance
docker exec cockroach-node1 cockroach sql --insecure --execute="SHOW QUERIES;"
```

## Performance Tuning

### Database Settings

```sql
-- Optimize for your workload
SET CLUSTER SETTING kv.range_split.by_load_enabled = true;
SET CLUSTER SETTING kv.range_merge.queue_enabled = true;
SET CLUSTER SETTING sql.stats.automatic_collection.enabled = true;
```

### Connection Pool

```typescript
// Adjust in database.config.ts
extra: {
  max: 20,           // Maximum connections
  min: 2,            // Minimum connections
  acquire: 30000,    // Connection acquisition timeout
  idle: 10000,       // Idle timeout
  evict: 60000,      // Connection eviction timeout
}
```

## Benefits Over PostgreSQL

1. **Automatic Replication**: No manual setup required
2. **High Availability**: Automatic failover without data loss
3. **Horizontal Scaling**: Add nodes without downtime
4. **Global Distribution**: Deploy across multiple regions
5. **Strong Consistency**: ACID transactions across all nodes
6. **PostgreSQL Compatibility**: Minimal code changes required

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review CockroachDB logs: `docker-compose logs`
3. Consult [CockroachDB Documentation](https://www.cockroachlabs.com/docs/)
4. Open an issue in the project repository
