# Survey App

**Land Survey Management System** — full-stack web app for clients, sites, field visits, instruments, account-manager ledgers, invoices, reports, and company settings.

React (Vite) frontend and Node.js (Express) API with MongoDB, Cloudinary uploads, and Brevo SMTP for password-reset email.

---

## Repository layout

```
survey-app/
├── frontend/                 # React + Vite SPA
│   ├── public/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   ├── context/
│   │   ├── hooks/
│   │   ├── pages/            # Route-level screens
│   │   ├── services/         # API client (axios) + query helpers
│   │   └── utils/
│   ├── index.html
│   ├── package.json
│   ├── vite.config.ts
│   └── .env.example
├── backend/                  # Express API
│   ├── config/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── services/
│   ├── uploads/
│   ├── package.json
│   ├── server.js
│   └── .env.example
├── package.json              # Optional: npm workspaces + `npm run dev` from root
├── render.yaml
├── README.md
└── .gitignore
```

---

## Prerequisites

- **Node.js** 20+ (see `.nvmrc`)
- **MongoDB** (Atlas URI for production)
- **Cloudinary** (uploads)
- **Brevo** SMTP (password-reset OTP)

---

## Environment setup

```bash
cp frontend/.env.example frontend/.env
cp backend/.env.example backend/.env
```

### Frontend (`frontend/.env`)

| Variable | Description |
|----------|-------------|
| `VITE_API_URL` or `VITE_API_BASE_URL` | Production API origin (no trailing slash), e.g. `https://your-api.onrender.com`. Leave empty for local dev — Vite proxies `/api` to the backend. |
| `VITE_API_PROXY_TARGET` | Dev proxy target (default `http://localhost:4000`). |

### Backend (`backend/.env`)

| Variable | Description |
|----------|-------------|
| `PORT` | API port (default `4000`). |
| `MONGO_URI` | MongoDB connection string. |
| `JWT_SECRET` | Required in production. |
| `FRONTEND_ORIGIN` | Comma-separated CORS origins, e.g. `http://localhost:5173`. |
| `CLOUDINARY_*` | Cloudinary credentials. |
| `BREVO_*` | Brevo SMTP / API for email. |

---

## Run locally

### Frontend

```bash
cd frontend
npm install
npm run dev
```

App: [http://localhost:5173](http://localhost:5173)

### Backend

```bash
cd backend
npm install
npm start
```

API: [http://localhost:4000](http://localhost:4000) · Health: `GET /api/health`

For development with auto-reload:

```bash
cd backend
npm run dev
```

### Both (from repo root, optional)

```bash
npm install
npm run dev
```

---

## Production build

```bash
cd frontend
npm install
npm run build
```

Output: `frontend/dist/`

---

## Features

- JWT auth (admin / super_admin)
- Password reset with email OTP
- Dashboard, clients & sites, site visits with photo uploads
- Account manager ledgers, reports, invoices (PDF)
- Instrument scoping and PWA support

---

## Deployment

- **Frontend (Vercel):** Root directory `frontend`, build `npm run build`, output `dist`, env `VITE_API_URL` = your API URL.
- **Backend (Render):** Root directory `backend`, start `npm start`, set env from `backend/.env.example`. See `render.yaml`.

---

## License

Proprietary — all rights reserved unless otherwise agreed in writing.
