# Render Single-Service Deploy

This project can run as one Render web service.

## How It Works

- The frontend builds into `frontend/dist`
- The backend serves that build from `backend/app.js`
- The frontend calls the API with same-origin `/api`

## Render Setup

Use [render.yaml](/c:/Users/harsh/Downloads/Assignment/Assignment/render.yaml:1) from the repo root, or configure the service manually with:

- Root directory: repo root
- Build command: `cd frontend && npm ci && npm run build && cd ../backend && npm ci`
- Start command: `cd backend && npm start`

## Environment Variables

Set these on Render:

- `MONGO_URI`
- `JWT_SECRET`
- `INVITE_JWT_SECRET`
- `JWT_EXPIRES_IN=7d`
- `INVITE_EXPIRES_IN=7d`
- `CLIENT_URL=https://<your-render-app>.onrender.com`
- `CORS_ORIGIN=https://<your-render-app>.onrender.com`

## Result

After deploy, the same Render URL serves:

- the React app, for example `/login` and `/signup`
- the API, for example `/api/auth/login` and `/api/auth/signup`
