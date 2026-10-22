# KLYRO — Developer Setup & Local Workflow (`/docs/DEVELOPMENT.md`)

> **Local Development Quickstart & Engineering Workflow Guide**  
> **Target Audience**: All project developers & team members  
> **Primary Owners**: Shared (Member 1, Member 2, Member 3)

---

## 1. Prerequisites & Tooling Requirements

Before setting up KLYRO locally, ensure you have the following installed on your machine:

- **Node.js**: `v18.x` or `v20.x` (LTS)
- **npm**: `v9.x` or higher
- **Python**: `v3.11.x`
- **Git**: `v2.40.x` or higher
- **VS Code** (Recommended IDE) with ESLint & Python extensions

---

## 2. Environment Variables Configuration

Copy `.env.example` to `.env` in each service subdirectory before starting:

### A. AI Service Environment (`ai-service/.env`)
```env
GITHUB_TOKEN=your_github_personal_access_token
GEMINI_API_KEY=your_google_gemini_api_key
```

### B. Backend Environment (`backend/.env`)
```env
PORT=5000
NODE_ENV=development
SUPABASE_URL=https://your-supabase-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
AI_SERVICE_URL=http://localhost:8000
FRONTEND_URL=http://localhost:5173
```

### C. Frontend Environment (`frontend/.env`)
```env
VITE_API_BASE_URL=http://localhost:5000
VITE_SUPABASE_URL=https://your-supabase-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

---

## 3. Local Development Quickstart

To run the entire KLYRO platform locally, start the three microservices in separate terminal windows:

### Terminal 1: Frontend (React + Vite)
```bash
cd frontend
npm install
npm run dev
```
- Local URL: **[http://localhost:5173](http://localhost:5173)**

---

### Terminal 2: Main Backend (Node.js + Express)
```bash
cd Backend/Klyro-feature-backend-foundation/Klyro-feature-backend-foundation/backend
npm install
npm run dev # or node src/server.js
```
- Local URL: **[http://localhost:5000](http://localhost:5000)**
- Health Endpoint: `http://localhost:5000/health`

---

### Terminal 3: AI Service (Python + FastAPI)
```bash
cd ai-service
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```
- Local URL: **[http://localhost:8000](http://localhost:8000)**
- Interactive API Docs: `http://localhost:8000/docs`

---

## 4. Git Branching & Team Workflow

To maintain repository stability across team members:

| Service Area | Branch Name Strategy | Responsible Member |
| :--- | :--- | :--- |
| **Frontend** | `feature/frontend` | Member 1 |
| **Backend & DB** | `feature/backend` | Member 2 |
| **AI Evaluation Engine** | `feature/ai-service` | Member 3 |

### Workflow Rules
1. Never commit `.env` or sensitive API keys to source control.
2. Always test local endpoint health before pushing to origin branches.
3. Open Pull Requests against `main` for cross-team integration testing.
