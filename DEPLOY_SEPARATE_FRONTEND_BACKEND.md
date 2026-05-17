# Separate Frontend + Backend Deployment (How to wire API URL)

This project deploys **frontend** and **backend** separately:
- Frontend: `frontend/` (React / CRA)
- Backend: `okoa-gas-backend/` (Express)

## 1) Backend
Backend runs on `PORT` (default **5000**) and exposes:
- `GET  /api/health`
- `POST /api/mpesa/pay`
- `POST /api/mpesa/status`
- `POST /api/mpesa/callback`

Set backend environment (recommended):
- `PORT`
- `CONSUMER_KEY`
- `CONSUMER_SECRET`
- `SHORTCODE`
- `PASSKEY`
- `CALLBACK_URL`

## 2) Frontend -> Backend wiring
The React app calls the backend using:
- `process.env.REACT_APP_API_URL`

### Recommended (production build)
Set this in `frontend/.env.production`:
- `REACT_APP_API_URL=https://YOUR_BACKEND_DOMAIN:5000`

### Local dev
You can run locally with:
- `REACT_APP_API_URL=http://localhost:5000`

## 3) Build
From `frontend/`:
- `npm ci` (or `npm install`)
- `npm run build`

From `okoa-gas-backend/`:
- `npm ci`
- `npm run start`

## 4) Verify
1. Open backend health endpoint:
   - `GET {API_URL}/api/health`
2. Load the frontend and trigger the payment flow.
   - The app should POST to `{API_URL}/api/mpesa/pay`

## Notes
- CRA only exposes env vars prefixed with `REACT_APP_`.
- `REACT_APP_API_URL` must not end with a trailing `/`.

