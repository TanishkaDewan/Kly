# KLYRO — REST API Specification (`/docs/API_CONTRACT.md`)

> **Master API Specification Document**  
> **Primary Owner**: Member 2 (Backend) & Member 3 (AI Service)

---

## 1. Overview & General Standards

- **Base Backend URL**: `http://localhost:5000/api` (Dev) / `https://klyro-backend.onrender.com/api` (Prod)
- **Base AI Service URL**: `http://localhost:8000` (Dev) / `https://klyro-ai-service.onrender.com` (Prod)
- **Data Format**: All request and response bodies use `application/json`.
- **Authentication**: Protected endpoints require standard HTTP Bearer token authorization header:
  ```http
  Authorization: Bearer <SUPABASE_JWT_TOKEN>
  ```

---

## 2. Standard Response & Error Format

### Success Response Format
```json
{
  "status": "success",
  "data": { ... },
  "timestamp": "2026-09-10T12:00:00.000Z"
}
```

### Error Response Format
```json
{
  "error": "ErrorCategory",
  "message": "Human-readable error explanation",
  "timestamp": "2026-09-10T12:00:00.000Z"
}
```

| HTTP Code | Error | Description |
| :--- | :--- | :--- |
| `400` | `BadRequest` | Missing required parameters or malformed payload. |
| `401` | `Unauthorized` | Missing or invalid Supabase JWT authentication token. |
| `403` | `Forbidden` | Insufficient user privileges (e.g. non-admin accessing admin route). |
| `404` | `NotFound` | Requested resource or route does not exist. |
| `500` | `InternalServerError` | Server-side unexpected exception or AI provider failure. |

---

## 3. Main Backend Endpoints (`/api`)

### Health Check
- **`GET /health`**
- **Auth**: None
- **Response `200 OK`**:
  ```json
  {
    "status": "ok",
    "service": "klyro-backend",
    "timestamp": "2026-09-10T12:00:00.000Z"
  }
  ```

### Authentication & Profile
- **`GET /api/auth/me`**
- **Auth**: Required (`Bearer`)
- **Response `200 OK`**:
  ```json
  {
    "message": "Authenticated successfully",
    "user": {
      "id": "u49a8123-e29b-41d4-a716-446655440000",
      "email": "developer@klyro.dev",
      "role": "PLAYER",
      "user_metadata": {
        "full_name": "Tanishka Dewan",
        "username": "tanishkadewan",
        "github_username": "TanishkaDewan"
      }
    }
  }
  ```

### Matchmaking Queue *(Planned)*
- **`POST /api/matchmaking/join`**
- **Auth**: Required (`Bearer`)
- **Request Body**:
  ```json
  {
    "skill_category": "FRONTEND",
    "experience_level": "INTERMEDIATE"
  }
  ```
- **Response `200 OK`**:
  ```json
  {
    "status": "queued",
    "entered_at": "2026-09-10T12:05:00.000Z",
    "estimated_wait_seconds": 15
  }
  ```

### Submissions & Battles *(Planned)*
- **`POST /api/submissions`**
- **Auth**: Required (`Bearer`)
- **Request Body**:
  ```json
  {
    "challenge_id": "c11a8123-e29b-41d4-a716-446655440001",
    "team_id": "t22a8123-e29b-41d4-a716-446655440002",
    "repo_url": "https://github.com/TanishkaDewan/Klyro"
  }
  ```
- **Response `201 Created`**:
  ```json
  {
    "submission_id": "s33a8123-e29b-41d4-a716-446655440003",
    "status": "EVALUATING",
    "submitted_at": "2026-09-10T12:10:00.000Z"
  }
  ```

---

## 4. AI Evaluation Service Endpoints

### Internal Service Authentication
Protected AI service endpoints (`POST /evaluate` and `GET /evaluate`) enforce service-to-service authentication when `AI_SERVICE_KEY` is configured in the environment:
- **Header**:
  ```http
  Authorization: Bearer <AI_SERVICE_KEY>
  ```
- **Verification**: Evaluated using constant-time token comparison (`hmac.compare_digest`).
- **Rejection (`401 Unauthorized`)**:
  If the header is missing or the key does not match:
  ```json
  {
    "error": "Unauthorized",
    "message": "Invalid or missing service key.",
    "timestamp": "2026-10-01T04:30:00.000Z"
  }
  ```
- **Backend Responsibility**: When the backend calls `POST /evaluate`, it must include the `Authorization: Bearer <AI_SERVICE_KEY>` header using its configured secret.
- **Local Development / Testing**: If `AI_SERVICE_KEY` is omitted or unconfigured, the AI service allows unauthenticated calls to facilitate local test workflows.

### Health Check
- **`GET /health`**
- **Auth**: None
- **Response `200 OK`**:
  ```json
  {
    "status": "healthy"
  }
  ```

### Repository Analysis (Legacy Ingestion)
- **`GET /evaluate?owner={owner}&repo={repo}`**
- **Auth**: Service Key (`Authorization: Bearer <AI_SERVICE_KEY>`)
- **Query Parameters**:
  - `owner` (string, required): GitHub repository owner or organization (e.g. `shravani-student`).
  - `repo` (string, required): GitHub repository name (e.g. `demo-repository`).

- **Response `200 OK`**:
  ```json
  {
    "project_name": "demo-repository",
    "repository": "shravani-student/demo-repository",
    "default_branch": "main",
    "commit_count": 4,
    "pull_request_count": 0,
    "contributor_count": 1,
    "contributors": [
      "shravani-student"
    ],
    "analysis": {
      "repository": {
        "name": "demo-repository",
        "full_name": "shravani-student/demo-repository",
        "private": false,
        "default_branch": "main"
      },
      "structure": {
        "total_files": 2,
        "file_extensions": {".py": 1, ".md": 1}
      },
      "readme": {
        "exists": true,
        "size": 120
      },
      "commits": {
        "count": 4,
        "evidence": [...]
      },
      "pull_requests": {
        "count": 0,
        "evidence": []
      },
      "contributors": {
        "count": 1,
        "evidence": [...]
      }
    }
  }
  ```

### AI Repository Evaluation (Challenge-Aware Judging)
- **`POST /evaluate`**
- **Auth**: Service Key (`Authorization: Bearer <AI_SERVICE_KEY>`)
- **Request Body**:
  ```json
  {
    "owner": "shravani-student",
    "repo": "demo-repository",
    "challenge_id": "c11a8123-e29b-41d4-a716-446655440001",
    "challenge_title": "Real-time Leaderboard API",
    "requirements": [
      "JWT Authentication with role-based access",
      "Redis caching for leaderboard query",
      "Automated unit test coverage"
    ]
  }
  ```

- **Response `200 OK` (Evaluated)**:
  ```json
  {
    "status": "SUCCESS",
    "evaluated_at": "2026-09-30T16:20:00.000Z",
    "model": "gemini-3.8-flash",
    "total_score": 86.5,
    "dimension_scores": [
      {
        "dimension": "Technical Quality",
        "raw_score": 4.5,
        "weight": 0.20,
        "dimension_score": 90.0,
        "weighted_score": 18.0,
        "rationale": "Strong typing and defensive error handling."
      },
      {
        "dimension": "Functionality & Completeness",
        "raw_score": 4.0,
        "weight": 0.20,
        "dimension_score": 80.0,
        "weighted_score": 16.0,
        "rationale": "Core requirements implemented with minor edge case omissions."
      },
      {
        "dimension": "Architecture & Engineering",
        "raw_score": 4.5,
        "weight": 0.15,
        "dimension_score": 90.0,
        "weighted_score": 13.5,
        "rationale": "Clean modular routes and services separation."
      },
      {
        "dimension": "Innovation & Problem Solving",
        "raw_score": 4.0,
        "weight": 0.15,
        "dimension_score": 80.0,
        "weighted_score": 12.0,
        "rationale": "Thoughtful caching layer design."
      },
      {
        "dimension": "Feasibility & Scalability",
        "raw_score": 4.5,
        "weight": 0.15,
        "dimension_score": 90.0,
        "weighted_score": 13.5,
        "rationale": "Stateless API ready for horizontal scaling."
      },
      {
        "dimension": "Documentation & Engineering Process",
        "raw_score": 4.5,
        "weight": 0.15,
        "dimension_score": 90.0,
        "weighted_score": 13.5,
        "rationale": "Comprehensive README and iterative commit history."
      }
    ],
    "feedback_summary": "High craftsmanship implementation with clean modular design.",
    "strengths": ["Clean separation between routes and business logic."],
    "weaknesses": ["Omitted automated integration tests for error paths."],
    "recommendations": ["Add pytest suites covering edge cases."],
    "suspicious_flags": [],
    "requirements_evaluation": [
      {
        "requirement": "JWT Authentication with role-based access",
        "status": "MET",
        "evidence": "src/auth/jwt.py",
        "justification": "JWT verification and token decoding implemented."
      },
      {
        "requirement": "Redis caching for leaderboard query",
        "status": "NOT_VERIFIABLE",
        "evidence": "File omitted by 80 KB budget cap",
        "justification": "Could not inspect secondary cache service within evidence budget."
      }
    ],
    "contributions": [
      {
        "github_username": "shravani-student",
        "estimated_percentage": 100.0,
        "evidence": ["4 commits recorded", "Touched files: main.py, src/auth/jwt.py"],
        "confidence": "HIGH",
        "limitations": [
          "Git commits cannot detect offline collaboration or verbal pair programming.",
          "Squashed merges or inconsistent git author emails may obscure contribution granularity."
        ],
        "disclaimer": "AI-assisted estimated contribution is an algorithmic heuristic based on repository commit, PR, and file metadata. Git history cannot objectively prove exact intellectual contribution or off-git collaborative teamwork."
      }
    ],
    "evidence_manifest": {
      "total_files_discovered": 12,
      "files_inspected": ["main.py", "src/auth/jwt.py"],
      "files_omitted_count": 10,
      "tree_truncated": false,
      "budget_exhausted": false,
      "omission_notes": "Inspected 2 prioritized files..."
    }
  }
  ```

- **Response `200 OK` (Degraded Mode — AI Unreachable / Malformed)**:
  ```json
  {
    "status": "EVALUATION_DEGRADED",
    "degraded_reason": "Gemini API key is not configured or upstream timeout.",
    "evaluated_at": "2026-09-30T16:20:00.000Z",
    "model": "gemini-3.8-flash",
    "total_score": null,
    "dimension_scores": null,
    "requirements_evaluation": null,
    "feedback_summary": null,
    "strengths": [],
    "weaknesses": [],
    "recommendations": [],
    "suspicious_flags": [],
    "contributions": [...],
    "evidence_manifest": {...}
  }
  ```
