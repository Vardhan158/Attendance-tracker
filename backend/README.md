# SkillBridge Backend

Production-ready REST API for the SkillBridge Attendance Management System.

## Tech Stack

- Node.js and Express.js
- MongoDB with Mongoose
- JWT authentication
- bcrypt password hashing
- dotenv environment variables
- CORS, Helmet, Morgan
- express-validator request validation

## Setup

```bash
cd backend
npm install
copy .env.example .env
npm run dev
```

On macOS/Linux, use:

```bash
cp .env.example .env
```

Update `.env` with your MongoDB connection string and strong JWT secrets.

## Scripts

```bash
npm run dev
npm start
```

## Health Check

```http
GET /health
```

## API Routes

### Auth

```http
POST /api/auth/signup
POST /api/auth/login
```

### Batch

```http
POST /api/batches
POST /api/batches/:batchId/invite
POST /api/batches/:batchId/join
```

### Session

```http
POST /api/sessions
```

### Attendance

```http
POST /api/attendance/mark
```

### Reports

```http
GET /api/sessions/:sessionId/attendance
GET /api/batches/:batchId/summary
GET /api/institutions/:institutionId/summary
GET /api/programme/summary
```

## Roles

- `student`
- `trainer`
- `institution`
- `programme_manager`
- `monitoring_officer`

All protected routes require:

```http
Authorization: Bearer <jwt-token>
```

## Deployment

Render or Railway can run the API with:

```bash
npm install
npm start
```

Required environment variables:

- `MONGO_URI`
- `JWT_SECRET`
- `INVITE_JWT_SECRET`
- `JWT_EXPIRES_IN`
- `INVITE_EXPIRES_IN`
- `CLIENT_URL`
- `CORS_ORIGIN`
- `PORT`
