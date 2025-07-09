# Plataforma Encuentro - Backend

**Sistema de reservas de eventos con arquitectura de microservicios**

**Integrantes:** Juan Pablo Pinza, Alex Trejo, Karla Ansatuña

### Microservicios

| Servicio | Puerto | Descripción |
|----------|--------|-------------|
| **API Gateway** | 3000 | Punto de entrada principal, enrutamiento |
| **Auth Service** | 3001 | Autenticación y autorización |
| **User Service** | 3002 | Gestión de perfiles de usuario |
| **Events Service** | 3003 | Gestión de eventos y categorías |
| **Orders Service** | 3004 | Procesamiento de órdenes |
| **Realtime Service** | 3005 | WebSockets y actualizaciones en tiempo real |

## 💻 Requisitos Previos

Antes de instalar el proyecto, asegúrate de tener instalado:

### Software Requerido

- **Node.js** (versión 18 o superior)
  ```bash
  node --version
  ```
- **npm** (incluido con Node.js)
  ```bash
  npm --version
  ```
- **Docker** y **Docker Compose**
  ```bash
  docker --version
  docker-compose --version
  ```
- **Git**
  ```bash
  git --version
  ```

### Para poder gestionar el monorepo con NX

- **Nx CLI**
  ```bash
  npm install -g nx
  ```

## 📦 Instalación

### 1. Clonar el Repositorio

```bash
git clone https://github.com/tu-usuario/PlataformaEncuentroNestJS.git
cd PlataformaEncuentroNestJS
```

### 2. Instalar Dependencias

```bash
npm install
```

## ⚙️ Configuración

### Base de Datos CockroachDB

El proyecto utiliza CockroachDB para alta disponibilidad y replicación automática.

#### Configuración Automática (Recomendado)

**En Windows:**
```cmd
start-cockroach.bat
```

**En Linux/macOS:**
```bash
chmod +x start-cockroach.sh
./start-cockroach.sh
```

#### Configuración Manual

```bash
docker-compose up -d

npm run cockroach:status

npm run cockroach:logs
```

### RabbitMQ

RabbitMQ se inicia automáticamente con Docker Compose y está configurado para comunicación entre microservicios.

## 🏃‍♂️ Ejecución del Proyecto

### Opción 1: Ejecutar Todos los Servicios (Recomendado)

```bash
# Reiniciar base de datos
npm run cockroach:reset-schema

# Iniciar todos los servicios
npm run start:all-cockroach
```

### Opción 2: Ejecutar Servicios Individualmente

```bash
# Reiniciar base de datos
npm run cockroach:reset-schema

# 2. Iniciar servicios uno por uno
npm run serve:api-gateway     
npm run serve:auth-service    
npm run serve:user-service   
npm run serve:events-service  
npm run cockroach:check-orders 
npm run serve:realtime-service 
```

### Verificar que Todo Funcione

```bash
# Verificar API Gateway
curl http://localhost:3000

# Verificar salud de servicios
curl http://localhost:3000/orders/health

# Verificar estadísticas en tiempo real
curl http://localhost:3005/stats
```

## 🔧 Servicios Disponibles

### API Gateway (Puerto 3000)

Punto de entrada principal para todas las peticiones:

```bash
# Salud del sistema
GET http://localhost:3000/

# Autenticación
POST http://localhost:3000/auth/register
POST http://localhost:3000/auth/login

# Gestión de usuarios
GET http://localhost:3000/user/profile/:id
GET http://localhost:3000/user/all

# Gestión de eventos
GET http://localhost:3000/events
POST http://localhost:3000/events
GET http://localhost:3000/events/:id/categories

# Gestión de órdenes
GET http://localhost:3000/orders
POST http://localhost:3000/orders
PUT http://localhost:3000/orders/:id/confirm
```

### Realtime Service (Puerto 3005)

WebSocket para actualizaciones en tiempo real:

```javascript
// Conectar a WebSocket
const socket = io('http://localhost:3005/realtime', {
  query: { userId: '123' }
});

// Unirse a sala de evento
socket.emit('join-event-room', { userId: 123, eventId: 456 });

// Bloquear tickets temporalmente
socket.emit('lock-tickets', {
  userId: 123,
  eventId: 456,
  categoryId: 789,
  quantity: 2
});
```

## 🗄️ Base de Datos

### CockroachDB Cluster

El proyecto utiliza un cluster de CockroachDB con las siguientes características:

- **2 nodos** para replicación
- **HAProxy** como balanceador de carga
- **Puerto 26260** para conexiones de aplicaciones
- **Interfaz web** en puertos 8080 y 8081

#### Comandos Útiles

```bash
# Ver estado del cluster
npm run cockroach:status

# Conectar a la consola SQL
npm run cockroach:sql

# Ver tablas
npm run cockroach:check-tables

# Ver órdenes
npm run cockroach:check-orders

# Reiniciar cluster (CUIDADO: borra datos)
npm run cockroach:reset

# Ver datos específicos
npm run cockroach:view-data
```

#### Interfaz Web

- **Node 1**: http://localhost:8080
- **Node 2**: http://localhost:8081
- **HAProxy Stats**: http://localhost:8404

### Ejemplos Rápidos

#### Registro de Usuario
```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "juan_perez",
    "email": "juan@example.com",
    "password": "password123",
    "firstName": "Juan",
    "lastName": "Pérez"
  }'
```

#### Login
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "juan_perez",
    "password": "password123"
  }'
```

#### Crear Orden
```bash
curl -X POST http://localhost:3000/orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TU_JWT_TOKEN" \
  -d '{
    "eventId": "123",
    "categoryId": "456",
    "quantity": 2,
    "lockId": "lock_abc123"
  }'
```

### Estructura del Proyecto

```
PlataformaEncuentroNestJS/
├── apps/                          # Microservicios
│   ├── api-gateway/              # Gateway principal
│   ├── auth-service/             # Autenticación
│   ├── user-service/             # Gestión usuarios
│   ├── events-service/           # Gestión eventos
│   ├── orders-service/           # Gestión órdenes
│   └── realtime-service/         # WebSockets
├── docker-compose.yml            # Configuración Docker
├── haproxy.cfg                   # Configuración load balancer
├── package.json                  # Dependencias y scripts
├── API_DOCUMENTATION.md          # Documentación completa APIs
├── COCKROACH_MIGRATION.md        # Guía migración DB
└── README.md                     # Este archivo
```

## 🚀 Tecnologías Utilizadas

### Backend
- **NestJS** - Framework de Node.js
- **TypeScript** - Lenguaje de programación
- **TypeORM** - ORM para base de datos
- **RabbitMQ** - Message broker
- **Socket.io** - WebSockets en tiempo real

### Base de Datos
- **CockroachDB** - Base de datos distribuida
- **HAProxy** - Load balancer

### DevOps
- **Docker** - Containerización
- **Docker Compose** - Orquestación
- **Nx** - Herramientas de desarrollo monorepo

### Autenticación
- **JWT** - JSON Web Tokens
- **bcrypt** - Hash de contraseñas
