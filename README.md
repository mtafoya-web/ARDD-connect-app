# ARDD Connect

ARDD Connect is a web and mobile conference platform for the Aging Research and Drug Discovery community. It helps attendees discover sessions, find relevant researchers, compare match explanations, message contacts, follow announcements, and use the ARDD Claw Bot as a conference assistant.

The repository contains three apps:

- `backend/`: FastAPI API, authentication, database models, matching, sessions, posts, messages, media uploads, and bot endpoints.
- `frontend/`: React 18 + Vite + TypeScript web app.
- `mobile/`: Expo Router + React Native mobile app for iOS, Android, and Expo Go.

## Core Features

- Personalized attendee matching based on research interests, role alignment, and profile metadata.
- Session discovery, recommended agenda views, and saved sessions.
- Social feed with posts, replies, likes, bookmarks, reposts, and media upload support.
- Direct messaging and notification flows.
- Expert profile claiming from `agingpharma_profiles.csv`.
- Admin screens for managing users, posts, and events.
- ARDD Claw Bot for deterministic conference Q&A, session pulse, recommendations, and attendee lookup.

## Prerequisites

- Python 3.11+
- Node.js 20+
- npm
- Expo tooling through `npx expo`
- Expo Go or an iOS/Android simulator for mobile testing

## Environment Setup

Create local env files from the examples:

```powershell
Copy-Item backend\.env.example backend\.env
Copy-Item frontend\.env.example frontend\.env
```

Create `mobile\.env`:

```powershell
Set-Content mobile\.env "EXPO_PUBLIC_API_BASE=http://localhost:8000"
```

For a physical phone on the same Wi-Fi network, replace `localhost` with your computer's LAN IP address:

```text
EXPO_PUBLIC_API_BASE=http://YOUR_LAN_IP:8000
```

Important backend settings:

- `DATABASE_URL`: defaults to local SQLite with `sqlite:///./ardd.db`.
- `SECRET_KEY`: JWT signing key. Use a long random value outside demos.
- `BACKEND_CORS_ORIGINS`: comma-separated frontend origins allowed to call the API.
- `PUBLIC_BASE_URL`: public backend origin used for uploaded file URLs.
- `CLOUDINARY_URL`: optional Cloudinary config. Local upload storage is used when omitted or left as a placeholder.

## Run the Backend

From the repository root:

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Backend URLs:

- API: `http://localhost:8000`
- Swagger docs: `http://localhost:8000/docs`

Optional demo data:

```powershell
cd backend
.\.venv\Scripts\python.exe seed_ardd.py
.\.venv\Scripts\python.exe seed_experts.py
.\.venv\Scripts\python.exe seed_admin.py
```

## Run the Frontend

In a second terminal:

```powershell
cd frontend
npm install
npm run dev
```

Frontend URL:

- Web app: `http://localhost:5173`

Build and typecheck:

```powershell
cd frontend
npm run typecheck
npm run build
```

## Run the Mobile App

Start the backend first, then start Expo:

```powershell
cd mobile
npm install
npx expo start
```

Use one of the Expo options:

- Scan the QR code with Expo Go on a physical device.
- Press `i` for the iOS simulator.
- Press `a` for the Android emulator.
- Press `w` for the web preview.

If API calls fail on a physical phone, update `mobile\.env` so `EXPO_PUBLIC_API_BASE` points to your computer's LAN IP instead of `localhost`, then restart Expo.

Mobile quality check:

```powershell
cd mobile
npx expo lint
```

## Common Local Workflow

Run these in separate terminals:

```powershell
cd backend
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

```powershell
cd frontend
npm run dev
```

```powershell
cd mobile
npx expo start
```

## Production Notes

- Set `ENVIRONMENT=production`.
- Use a production-grade `SECRET_KEY`.
- Use Postgres for real users instead of local SQLite.
- Restrict `BACKEND_CORS_ORIGINS` to deployed frontend origins.
- Set `PUBLIC_BASE_URL` to the deployed backend URL.
- Configure Cloudinary or durable object storage for uploads.
- Serve the backend behind HTTPS.
- Run frontend build/typecheck and backend import checks before release.

## Project Team

- Mario Tafoya - Software Engineer
- Alan Lopex - Electrical Engineer / Presenter
