# Reverse ETL to Webhook

A simplified Reverse ETL setup flow that allows users to configure a data pipeline from PostgreSQL to a webhook destination. Built with React, TypeScript, and Node.js.

## Features

- 🔌 **Connect to PostgreSQL** - Test and verify database connections
- 📊 **Table Selection** - Browse available tables with schema preview
- 🗺️ **Column Mapping** - Map database columns to nested JSON paths with validation
- 👁️ **Preview Output** - See the transformed JSON payload before sending
- 📱 **Mobile Responsive** - Works on screens as small as 320px
- 🎨 **Modern UI** - Glassmorphism design with smooth animations

## Prerequisites

- **Docker** and **Docker Compose** (for PostgreSQL database) - Docker daemon should be running
- **Node.js** v20.19.0 (specified in `.nvmrc`)

## Quick Start

### 1. Clone the repository

```bash
git clone git@github.com:Dmytro9/reverse-etl.git
cd reverse-etl
```

### 2. Install dependencies

```bash
# Install root dependencies
npm install

# Install backend dependencies
cd backend && npm install && cd ..

# Install frontend dependencies
cd frontend && npm install && cd ..
```

### 3. Start the PostgreSQL database

```bash
npm run start-customer-db
```

This will:
- Start a PostgreSQL container with Docker Compose
- Seed it with 20 sample users
- Display the connection string (e.g., `postgresql://postgres:postgres@localhost:<PORT>/mydb`)

### 4. Configure environment variables

**Backend** (optional - defaults are fine):
```bash
cp backend/.env.example backend/.env
# Edit if needed - default PORT is 3001
```

**Frontend** (already configured):
```bash
# frontend/.env already exists with:
VITE_API_BASE=http://localhost:3001/api
```

### 5. Start the development servers

```bash
npm run dev
```

This runs both backend and frontend concurrently:
- Backend: `http://localhost:3001`
- Frontend: `http://localhost:5173`

### 6. Use the application

1. Open `http://localhost:5173` in your browser
2. Paste the PostgreSQL connection string from step 3
3. Click "Test Connection"
4. Select a table (try `users`)
5. Map columns to JSON paths (or use "Auto-map all columns")
6. Generate preview and send to webhook (simulated)

## Architecture

```
┌─────────────┐      REST API      ┌─────────────┐      ┌─────────────┐
│             │ ◄─────────────────► │             │ ◄───► │             │
│  Frontend   │                     │   Backend   │       │  PostgreSQL │
│             │   JSON over HTTP    │             │       │             │
└─────────────┘                     └─────────────┘      └─────────────┘
  React + TS                          Node.js + TS         Docker
```

### Frontend Structure

```
frontend/src/
├── components/          # React components
│   ├── ConnectSource/   # Database connection step
│   ├── SelectTable/     # Table selection step
│   ├── MappingEditor/   # Column mapping step
│   ├── Preview/         # Preview and send step
│   └── Stepper.tsx      # Progress indicator
├── hooks/               # Custom React hooks
│   └── useWizard.ts     # Wizard state management
├── config/              # Configuration
│   ├── steps.tsx        # Step definitions
│   └── constants.ts     # App constants
├── api/                 # API client
│   └── client.ts        # Backend API calls
├── types/               # TypeScript types
└── utils/               # Helper functions
```

### Backend Structure

```
backend/src/
├── controllers/                # Route handlers
│   └── connectionController.ts
├── services/                   # Business logic
│   ├── connectionService.ts    # Connection pool management
│   ├── tableService.ts         # Table/column operations
│   └── mappingService.ts       # Data transformation
├── middleware/                 # Express middleware
│   └── errorHandler.ts         # Error handling
├── validation/                 # Request validation
│   └── schemas.ts              # Zod schemas
├── routes/                     # API routes
│   └── connections.ts
└── types/                      # TypeScript types
```

## API Endpoints

### POST `/api/connections/test`
Test database connection and create connection pool.

**Request:**
```json
{
  "connectionString": "postgresql://user:pass@host:port/db"
}
```

**Response:**
```json
{
  "ok": true,
  "connectionId": "uuid-v4"
}
```

### GET `/api/connections/:connectionId/tables`
List all tables in the database.

**Response:**
```json
{
  "tables": ["users", "orders", "products"]
}
```

### GET `/api/connections/:connectionId/tables/:table/columns`
Get columns for a specific table.

**Response:**
```json
{
  "columns": [
    { "name": "id", "type": "integer" },
    { "name": "email", "type": "character varying" }
  ]
}
```

### POST `/api/connections/:connectionId/preview`
Generate preview of transformed data.

**Request:**
```json
{
  "table": "users",
  "limit": 5,
  "mapping": [
    { "sourceColumn": "first_name", "targetPath": "user.name.first" },
    { "sourceColumn": "email", "targetPath": "contact.email" }
  ]
}
```

**Response:**
```json
{
  "rows": [
    {
      "user": { "name": { "first": "John" } },
      "contact": { "email": "john@example.com" }
    }
  ]
}
```

## Key Technical Decisions

### Backend

- **Connection Pooling**: Connections are stored in-memory with UUID keys and 30-minute TTL
- **SQL Injection Prevention**: Uses parameterized queries and identifier validation
- **Validation**: Zod schemas for type-safe request validation
- **Error Handling**: Custom error classes with centralized middleware
- **CORS**: Environment-aware (permissive in dev, whitelist in production)

### Frontend

- **State Management**: Custom `useWizard` hook for wizard flow
- **Validation**: Client-side validation for mapping entries (duplicates, conflicts, invalid paths)
- **Nested JSON Paths**: Supports dot notation (e.g., `user.profile.name`)
- **API Communication**: Centralized client with error handling
- **Component Architecture**: Separated presentational and container logic with custom hooks

## Assumptions Made

1. **Single User**: No authentication or multi-tenancy required
2. **Short Sessions**: Connection pools expire after 30 minutes of inactivity
3. **Preview Only**: No actual webhook execution - sends are simulated
4. **PostgreSQL Only**: Only PostgreSQL databases are supported
5. **No Persistence**: Configuration doesn't survive page refresh
6. **Limited Preview**: Maximum 100 rows can be previewed (enforced by backend)
7. **Simple Nested Paths**: JSON paths use dot notation without array indexing
8. **Trust Input**: Webhook URL is not validated or called (simulation only)
9. **Modern Browsers**: Targets ES2020+ (no IE support)
10. **Column Types**: All database types are transformed to JSON strings/numbers/nulls

## Environment Variables

### Backend (`backend/.env`)
```env
PORT=3001
NODE_ENV=development

# Production only: Comma-separated list of allowed origins for CORS
# ALLOWED_ORIGINS=https://yourdomain.com,https://app.yourdomain.com
```

### Frontend (`frontend/.env`)
```env
VITE_API_BASE=http://localhost:3001/api
```

## Scripts

```bash
# Root
npm run start-customer-db    # Start PostgreSQL database
npm run stop-customer-db     # Stop PostgreSQL database
npm run dev                  # Run backend + frontend concurrently

# Backend
cd backend
npm run dev                  # Start dev server with ts-node
npm run build                # Compile TypeScript
npm run start                # Run compiled JavaScript

# Frontend
cd frontend
npm run dev                  # Start Vite dev server
npm run build                # Build for production
npm run preview              # Preview production build
```

## Future Improvements

Given more time, here are potential enhancements:

### Testing
- Unit tests for services and utilities (Jest)
- Integration tests for API endpoints (Supertest)
- Component tests for React components (React Testing Library)
- E2E tests for critical user flows (Playwright)

### Features
- **Actual Webhook Execution**: Send real HTTP requests to webhook URLs
- **Authentication**: Add user authentication and authorization
- **Persistence**: Save configurations to database
- **Schedule Syncs**: Set up recurring sync schedules
- **Data Filtering**: Add WHERE clause support for preview queries
- **Column Type Detection**: Smart default mapping based on column types
- **Error Recovery**: Retry mechanisms for failed webhooks
- **Audit Logs**: Track all sync operations
- **Multiple Destinations**: Support multiple destination types (not just webhooks)
- **Batch Processing**: Handle large datasets efficiently
- **Data Transformations**: Add custom transformation functions

### Technical
- **Connection Reuse**: Persistent connection pool across server restarts
- **Rate Limiting**: Prevent abuse of API endpoints
- **Caching**: Cache table schemas to reduce database queries
- **WebSocket**: Real-time validation feedback
- **Docker Compose**: Single command to run entire stack
- **Monitoring**: Application metrics and logging (Prometheus, Grafana)
- **Performance**: Query optimization for large tables
- **Security**: API key authentication, input sanitization improvements

### UX
- **Mapping Templates**: Save and reuse common mapping patterns
- **Column Search**: Search/filter columns in large tables
- **Bulk Operations**: Edit multiple mappings at once
- **Undo/Redo**: Mapping history
- **Dark Mode**: Support for dark theme
- **Keyboard Shortcuts**: Power user features
- **Progress Indicators**: Show progress for long operations

## Technology Stack

- **Frontend**: React 19.2, TypeScript, Vite, CSS3
- **Backend**: Node.js, Express 5, TypeScript
- **Database**: PostgreSQL 17
- **Validation**: Zod
- **Development**: ts-node, concurrently, nodemon

---

