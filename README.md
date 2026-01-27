# Attendance System
# Church Attendance — Vite (JSX) + Express + Apps Script webhook

Simple attendance app scaffold (frontend + backend) where the backend forwards writes/reads to a Google Apps Script Web App that appends/reads rows in a Google Sheet.

Quick start (local)
1. Configure Apps Script and get APPS_SCRIPT_WEBHOOK and optional APPS_SCRIPT_KEY (see apps-script/Code.gs).
2. Copy .env.example to backend/.env and set APPS_SCRIPT_WEBHOOK and APPS_SCRIPT_KEY.
3. From `frontend/` run: `npm install && npm run dev`
4. From `backend/` run: `npm install && npm run dev`
5. Open frontend at http://localhost:3000 (Vite default). The frontend proxies `/api` requests to the backend.

Notes
- Admin live updates are pushed via Server-Sent Events (SSE) at `/api/admin/stream`.
- This scaffold is optimized for a fast MVP using Apps Script. For production, consider using Google Sheets API (service account) and add authentication to admin routes.