# LEOxSOLAR Monitoring Dashboard (Phase 2)

React + Node.js dashboard that mirrors the original Python/Flask monitoring app and reads live data from Google Sheets.

## Project structure

- `package.json` (root): workspaces for `server` and `client`.
- `server/`: Node.js API (Express) used by the frontend and Render.
  - `src/index.js` – API entrypoint (`/api/dashboard`, `/api/report`).
  - `src/tableData.js` – data loading, filters, stats, Lot mapping, etc.
  - `src/googleSheets.js` – Google Sheets service client.
- `client/`: React + Vite + Tailwind dashboard UI.

## Local development

From `Monitoring (Phase-2)`:

```bash
npm install
npm install --workspace server
npm install --workspace client

# in one terminal (or use npm run dev if you have concurrently installed)
cd server && npm run dev
cd client && npm run dev
```

Frontend: `http://localhost:5173` (proxies `/api` to the server).  
Backend: `http://localhost:5001`.

## Google Sheets credentials

The backend looks for Google service account credentials in this order:

1. `GOOGLE_SERVICE_ACCOUNT_JSON` env var (recommended for Render).
2. Local file `monitoring-dashboard-485505-73f943f6722d.json` (ignored by git).

For Render, set a **Secret File** or **Environment Variable**:

- `GOOGLE_SERVICE_ACCOUNT_JSON` – the full JSON content of the service account.

## Dev-only switches

Some features are meant only for developers and are gated by URL query params:

- `?full=1` – include unscheduled rows (equivalent to the old “Include unscheduled”).
- `?report=1` – show the “Download report (XLSX)” button.

Example:

- `/` – normal view.
- `/?full=1` – includes unscheduled rows.
- `/?report=1` – enables XLSX download.
- `/?full=1&report=1` – both behaviors.

## Deployment on Render (suggested)

You can deploy as **two services**:

1. **Backend (Web Service)**
   - Root: `Monitoring (Phase-2)/server`
   - Build command: `npm install`
   - Start command: `npm start`
   - Environment:
     - `GOOGLE_SERVICE_ACCOUNT_JSON` – service account JSON

2. **Frontend (Static Site)**
   - Root: `Monitoring (Phase-2)/client`
   - Build command: `npm install && npm run build`
   - Publish directory: `dist`
   - Set `VITE_API_BASE_URL` (if you later refactor client to use a configurable API URL).

Right now the client assumes the API is available at `/api` (proxied in dev). On Render, you can either:

- Configure the static site to call the backend URL directly, or
- Serve the built client from the backend service (requires a small Express static-file tweak).

