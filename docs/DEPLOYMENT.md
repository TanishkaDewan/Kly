# KLYRO — Production Deployment Guide (`/docs/DEPLOYMENT.md`)

> **Master Production Deployment Manual**  
> **Target Cloud Platforms**: Vercel (Frontend), Render (Backend & AI Service via Blueprint or Manual), Supabase Cloud (Database & Auth)  
> **Architecture**: Distributed Cloud Microservices

---

## 1. Cloud Architecture Overview

| Service | Platform | Root Directory | Build Command | Start Command | Health Check |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Frontend** | [Vercel](https://vercel.com) | `frontend` | `npm run build` | *Static SPA* (`dist`) | `/` |
| **Backend API** | [Render](https://render.com) | `Backend` | `npm install` | `node src/server.js` | `GET /health` |
| **AI Service** | [Render](https://render.com) | `ai-service` | `pip install -r requirements.txt` | `uvicorn main:app --host 0.0.0.0 --port $PORT` | `GET /health` |
| **Database & Auth**| [Supabase](https://supabase.com) | `database` | *PostgreSQL DDL* | Managed PostgreSQL 15 | Direct SQL / API |

---

## 2. Step-by-Step Deployment Instructions

### Phase 1: Database Setup (Supabase Cloud)

1. Log into [supabase.com](https://supabase.com) and create a new project (e.g. `klyro-prod`).
2. Navigate to **SQL Editor** in the left sidebar.
3. Open and run [`database/schema.sql`](../database/schema.sql) to create baseline tables, indexes, and triggers.
4. Next, open and run [`database/migration_phase4.sql`](../database/migration_phase4.sql) to add the `battles` schema, challenge relations, and degraded status constraints.
5. In **Project Settings > API**, record:
   - **Project URL** (`SUPABASE_URL` / `VITE_SUPABASE_URL`)
   - **Project API Anon Key** (`SUPABASE_ANON_KEY` / `VITE_SUPABASE_ANON_KEY`)
   - **Project API Service Role Key** (`SUPABASE_SERVICE_ROLE_KEY` — *Keep secret!*)

---

### Phase 2: Deploy Backend & AI Service (Render)

You can deploy both services using either the **Automated Blueprint** (recommended) or **Manual Web Services**.

#### Option A: 1-Click Render Blueprint (Recommended)
1. Push your repository to GitHub (`TanishkaDewan/Klyro`).
2. Log into [render.com](https://render.com) and click **New + > Blueprint**.
3. Select your repository. Render automatically reads [`render.yaml`](../render.yaml) and provisions:
   - `klyro-ai-service`
   - `klyro-backend`
   - Automatic cross-service secret synchronization (`AI_SERVICE_KEY`)
4. Fill in the requested secret environment variables:
   - For `klyro-ai-service`: `GITHUB_TOKEN`, `GEMINI_API_KEY`.
   - For `klyro-backend`: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `FRONTEND_URL` (e.g. `https://klyro.vercel.app`), and `AI_SERVICE_URL` (set to the URL of `klyro-ai-service.onrender.com`).
5. Click **Apply**.

#### Option B: Manual Web Service Setup
If you prefer creating them individually:
1. **AI Service**:
   - New **Web Service** on Render connected to `TanishkaDewan/Klyro`
   - **Name**: `klyro-ai-service`
   - **Root Directory**: `ai-service`
   - **Environment**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
   - **Environment Variables**:
     - `GITHUB_TOKEN` = `<your-github-pat>`
     - `GEMINI_API_KEY` = `<your-gemini-key>`
     - `GEMINI_MODEL` = `gemini-2.5-flash`
     - `AI_SERVICE_KEY` = `<shared-random-secret>`
   - Note down the public URL: `https://klyro-ai-service.onrender.com`

2. **Backend Service**:
   - New **Web Service** on Render connected to `TanishkaDewan/Klyro`
   - **Name**: `klyro-backend`
   - **Root Directory**: `Backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node src/server.js`
   - **Environment Variables**:
     - `NODE_ENV` = `production`
     - `PORT` = `5000` (or leave default assigned by Render)
     - `FRONTEND_URL` = `https://your-frontend.vercel.app`
     - `SUPABASE_URL` = `https://<your-id>.supabase.co`
     - `SUPABASE_ANON_KEY` = `<your-anon-key>`
     - `SUPABASE_SERVICE_ROLE_KEY` = `<your-service-role-key>`
     - `AI_SERVICE_URL` = `https://klyro-ai-service.onrender.com`
     - `AI_SERVICE_KEY` = `<must match AI_SERVICE_KEY above>`
   - Note down the public URL: `https://klyro-backend.onrender.com`

---

### Phase 3: Deploy Frontend (Vercel)

1. Log into [vercel.com](https://vercel.com) and click **Add New > Project**.
2. Import the `TanishkaDewan/Klyro` repository.
3. Configure the Project:
   - **Framework Preset**: `Vite`
   - **Root Directory**: Click *Edit* and select `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Expand **Environment Variables** and add:
   - `VITE_API_BASE_URL` = `https://klyro-backend.onrender.com`
   - `VITE_SUPABASE_URL` = `https://<your-id>.supabase.co`
   - `VITE_SUPABASE_ANON_KEY` = `<your-anon-key>`
5. Click **Deploy**. Vercel will build the frontend and provide your production domain (e.g. `https://klyro.vercel.app`).
6. *Important*: If your backend `FRONTEND_URL` was a placeholder, update `FRONTEND_URL` in the Render Backend settings to your actual Vercel URL!

---

## 3. Post-Deployment Verification & Health Checks

Verify your deployment with these checks:

```bash
# 1. AI Service Health Check
curl -X GET https://klyro-ai-service.onrender.com/health
# Expected Response: {"status":"healthy","service":"klyro-ai-service"}

# 2. Backend Health Check
curl -X GET https://klyro-backend.onrender.com/health
# Expected Response: {"status":"ok","service":"klyro-backend","timestamp":"..."}

# 3. Frontend App
# Open https://your-app.vercel.app in your browser and check:
# - Landing page renders
# - Login modal interacts with Supabase Auth
# - Challenge browser and leaderboard load data
```
