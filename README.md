# ARDD Connect

ARDD Connect is a FastAPI + React/Vite app for conference networking, session discovery, messaging, posts, matching, and the ARDD Claw Bot.

## Local Development

Backend:

```powershell
cd backend
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload
```

Frontend:

```powershell
cd frontend
npm.cmd install
npm.cmd run dev
```

Default URLs:

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:8000`
- API docs: `http://localhost:8000/docs`

## Environment

Copy the example files and fill in production values:

```powershell
Copy-Item backend\.env.example backend\.env
Copy-Item frontend\.env.example frontend\.env
```

Important backend variables:

- `DATABASE_URL`: database connection string.
- `SECRET_KEY`: long random JWT secret.
- `ENVIRONMENT`: `development` or `production`.
- `BACKEND_CORS_ORIGINS`: comma-separated frontend origins allowed to call the API.
- `PUBLIC_BASE_URL`: public API origin used for uploaded file URLs.
- `CLOUDINARY_URL`: optional Cloudinary URL. Local storage is used when omitted or placeholder.

Important frontend variable:

- `VITE_API_BASE_URL`: public backend API origin.

## Production Checklist

Before launch:

- Set `ENVIRONMENT=production`.
- Set `BACKEND_CORS_ORIGINS` to the deployed frontend origin only.
- Set `PUBLIC_BASE_URL` to the deployed backend origin.
- Use a real `SECRET_KEY`.
- Use Postgres for production data if the app will have real users.
- Configure Cloudinary or durable object storage for uploads.
- Run the backend behind HTTPS.
- Run `npm.cmd run build` and `npx.cmd tsc --noEmit`.
- Run `.\.venv\Scripts\python.exe -m compileall app`.

## Build

Frontend production build:

```powershell
cd frontend
npm.cmd run typecheck
npm.cmd run build
```

Backend import check:

```powershell
cd backend
.\.venv\Scripts\python.exe -c "from app.main import app; print(len(app.routes))"
```
