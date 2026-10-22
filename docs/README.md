# KLYRO — Project Documentation Index

> Welcome to the official engineering documentation for **KLYRO** — the Online Competitive Software Engineering Arena.  
> This directory serves as the centralized knowledge hub for developers, system architects, and contributors working across the Klyro platform.

---

## 📚 Documentation Directory

| Document | Primary Owner | Description |
| :--- | :--- | :--- |
| 🏛️ **[ARCHITECTURE.md](file:///c:/Users/Sayali%20Mohite/OneDrive/Desktop/Klyro/Klyro/docs/ARCHITECTURE.md)** | **Shared** | System topology, monorepo breakdown, microservices interaction flow, security model & team ownership. |
| 🔌 **[API_CONTRACT.md](file:///c:/Users/Sayali%20Mohite/OneDrive/Desktop/Klyro/Klyro/docs/API_CONTRACT.md)** | **Member 2** | Comprehensive REST API specification for Main Backend (`/api/...`) and AI Service (`/evaluate`). |
| 🗄️ **[DATABASE_SCHEMA.md](file:///c:/Users/Sayali%20Mohite/OneDrive/Desktop/Klyro/Klyro/docs/DATABASE_SCHEMA.md)** | **Member 2** | Supabase / PostgreSQL schema details, relational models, enums, indices, and RLS policies. |
| 🤖 **[AI_EVALUATION.md](file:///c:/Users/Sayali%20Mohite/OneDrive/Desktop/Klyro/Klyro/docs/AI_EVALUATION.md)** | **Member 3** | The 6 scoring dimensions, weighting formulas, LLM judging prompts, AST analysis & feedback generation. |
| 🔍 **[GITHUB_ANALYSIS.md](file:///c:/Users/Sayali%20Mohite/OneDrive/Desktop/Klyro/Klyro/docs/GITHUB_ANALYSIS.md)** | **Member 3** | GitHub REST API ingestion, diff parsing, repository tree traversal, and contribution percentage algorithms. |
| 🎨 **[FRONTEND_GUIDE.md](file:///c:/Users/Sayali%20Mohite/OneDrive/Desktop/Klyro/Klyro/docs/FRONTEND_GUIDE.md)** | **Member 1** | React + Vite UI architecture, component taxonomy, route maps, HUD cockpit design, and Tailwind tokens. |
| 🚀 **[DEPLOYMENT.md](file:///c:/Users/Sayali%20Mohite/OneDrive/Desktop/Klyro/Klyro/docs/DEPLOYMENT.md)** | **Shared** | Production infrastructure deployment guides for Vercel, Render Web Services, and Supabase. |
| 💻 **[DEVELOPMENT.md](file:///c:/Users/Sayali%20Mohite/OneDrive/Desktop/Klyro/Klyro/docs/DEVELOPMENT.md)** | **Shared** | Developer onboarding, local environment installation, database seeding, environment keys, and Git workflow. |

---

## 🏗️ Monorepo Quick Structure

```
Klyro/
├── frontend/             # Member 1: React, Vite, Tailwind CSS, Lucide icons
├── backend/              # Member 2: Express.js, Supabase JS Client, Auth middleware
├── database/             # Member 2: PostgreSQL schema.sql & seed definitions
├── ai-service/           # Member 3: Python, FastAPI, GitHub API Client, Gemini LLM Judging
└── docs/                 # Shared Engineering Documentation Hub
```

---

## 👥 Team Responsibilities & Stack

| Service | Primary Tech | Hosted On | Primary Owner |
| :--- | :--- | :--- | :--- |
| **Frontend** | React 18, Vite, Tailwind CSS, React Router | Vercel | **Member 1** |
| **Main Backend** | Node.js, Express.js | Render | **Member 2** |
| **Database & Auth** | Supabase (PostgreSQL 15), Supabase Auth | Supabase Cloud | **Member 2** |
| **AI Evaluation Engine**| Python 3.11, FastAPI, `google-genai` | Render | **Member 3** |

---

## 📌 Core Architecture Principles

1. **Strict Service Boundaries**: The Frontend *only* communicates with the Main Express Backend. The AI Evaluation Engine *only* accepts internal requests from the Express Backend.
2. **Single Source of Truth**: Database reads and writes are strictly governed by the Main Backend or Supabase Auth policies.
3. **Empirical AI Judging**: AI scoring is grounded in verifiable commit logs, AST analysis, PR history, and GitHub code artifacts — never arbitrary heuristics.
