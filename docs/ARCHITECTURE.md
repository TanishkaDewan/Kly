# KLYRO — System Architecture (`/docs/ARCHITECTURE.md`)

> **Master Architecture & Engineering Specification**  
> **Owners**: Shared (Member 1, Member 2, Member 3)

---

## 1. High-Level Architecture Overview

KLYRO is engineered as a decoupled, multi-tier microservice architecture designed to handle real-time competitive software battles, automated code analysis, multi-dimensional AI judging, and player gamification.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    FRONTEND (React + Vite + Tailwind)                   │
│               Owner: Member 1 · Deployed on Vercel                      │
│      [Landing | Lobby | Battle Cockpit | Results | Leaderboard]         │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │ HTTPS (JSON API / Bearer Auth)
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                   MAIN BACKEND (Node.js + Express)                      │
│               Owner: Member 2 · Deployed on Render                      │
│      [Auth Middleware | Matchmaking | Battle Engine | Scoring API]      │
└──────────────┬───────────────────────────────────────────┬──────────────┘
               │ PostgreSQL Connection / Service Key       │ HTTP POST /evaluate
               ▼                                           ▼
┌──────────────────────────────┐         ┌────────────────────────────────┐
│      SUPABASE DATABASE       │         │      AI EVALUATION ENGINE      │
│  PostgreSQL 15 + Auth Engine │         │     (Python 3.11 + FastAPI)     │
│       Owner: Member 2        │         │       Owner: Member 3          │
│   (Single Source of Truth)   │         │    [GitHub Client + Gemini]    │
└──────────────────────────────┘         └───────────────┬────────────────┘
                                                         │
                                   ┌─────────────────────┴─────────────────────┐
                                   ▼                                           ▼
                        ┌──────────────────────┐                   ┌───────────────────────┐
                        │   GitHub REST API    │                   │   Gemini 3.6 Flash    │
                        │ (Repository Evidence)│                   │   (LLM Evaluation)    │
                        └──────────────────────┘                   └───────────────────────┘
```

---

## 2. Team Ownership & Responsibilities

| Subsystem / Directory | Primary Owner | Tech Stack | Responsibilities |
| :--- | :--- | :--- | :--- |
| **`/frontend`** | **Member 1** | React 18, Vite, Tailwind CSS, Lucide | UI/UX visual design, battle cockpit HUD, interactive matchmaking lobby, showcase gallery, leaderboard. |
| **`/backend`** | **Member 2** | Node.js, Express.js | Core API gateway, Supabase authentication guard, team matchmaking algorithm, scoring calculations, XP engine. |
| **`/database`** | **Member 2** | PostgreSQL 15, Supabase Auth | Relational schema design, seed data generation, foreign key integrity, index optimizations, RLS security. |
| **`/ai-service`** | **Member 3** | Python 3.11, FastAPI, `google-genai` | GitHub REST client ingestion, AST structure parsing, prompt engineering, Gemini LLM evaluation execution. |
| **`/docs`** | **Shared** | Markdown | Technical documentation, API schemas, deployment manuals, setup guides. |

---

## 3. Component Interaction & Data Flow

### A. Matchmaking & Team Formation Flow
1. User logs in on the Frontend via Supabase Authentication (GitHub OAuth / Email).
2. Player joins the Matchmaking Queue with selected skill tags (`FRONTEND`, `BACKEND`, `AI_ML`).
3. Express Backend pairs players based on skill category and experience rating, generating a `teams` record.
4. Consent checks ensure both matched players accept the pairing before transitioning the team status to `CONFIRMED`.

### B. Challenge Execution & Submission Flow
1. Active teams receive a `challenge` payload (title, specification, test criteria, duration).
2. Team collaborates on a shared private/public GitHub repository.
3. Upon battle timer expiration or explicit manual submit, player inputs the repository URL (`https://github.com/owner/repo`).
4. Express Backend stores submission details in `submissions` table and sets status to `EVALUATING`.

### C. AI Automated Evaluation Flow
1. Main Backend issues an internal async HTTP request to `/evaluate?owner={owner}&repo={repo}` on the AI Service.
2. AI Service invokes `GitHubAnalyzer`:
   - Fetches repository tree, README, file stats.
   - Fetches commit logs, changed files, and pull request history.
   - Computes individual contributor commit ratios and code distribution.
3. AI Service builds structured prompt containing evidence and queries Gemini (`gemini-3.6-flash`).
4. Gemini returns structured evaluation output across 6 dimensions.
5. AI Service sends standardized score breakdown back to Main Backend.
6. Main Backend persists results in `evaluations`, `evaluation_scores`, `contribution_analysis`, and updates `user_stats` (XP, Rating, Streaks).

---

## 4. Security & Communication Protocols

1. **Frontend Isolation**: Frontend is strictly restricted from querying Supabase directly with service role credentials or invoking the AI service. All interactions route through `/api/*`.
2. **Backend Gatekeeper**: Express backend validates JWT bearer tokens using `requireAuth` middleware before exposing protected endpoints.
3. **Internal AI Endpoint**: The Python FastAPI service runs as an isolated microservice on Render and is accessible only via backend orchestration.
4. **Environment Security**: Sensitive keys (`GEMINI_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `GITHUB_TOKEN`) are strictly injected through environment variables and never checked into source control.
