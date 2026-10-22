# KLYRO — AI Evaluation Service (`ai-service`)

> **Primary Service Owner**: Member 3 (AI Service)  
> **Engine**: Python 3.11+, FastAPI, `google-genai` SDK (`gemini-3.8-flash`)

The **KLYRO AI Evaluation Service** is an autonomous microservice responsible for ingesting GitHub repository evidence, evaluating code against challenge requirements, and producing multi-dimensional craftsmanship scores and heuristic contribution estimations.

---

## 1. Core Capabilities

- **GitHub Repository Analysis**: Ingests file tree topology, README content, commit logs, pull requests, and contributor activity.
- **Challenge-Aware Source Evidence Ingestion**: Dynamically prioritizes files matching challenge keywords, core entry points, and domain models, adhering to strict size (20 KB/file) and aggregate budget (80 KB) limits.
- **Six-Dimension Deterministic Scoring**: Uses Gemini to evaluate observable static evidence against 0–5 anchors, while calculating scaled (0–100) and weighted totals deterministically in Python.
- **AI-Assisted Contribution Estimation**: Synthesizes commit volume, sampled commit file attributions, and PRs into an estimated contribution breakdown with explicit confidence levels and limitations.
- **Degraded Mode Resilience**: If the LLM is unreachable or returns malformed output, the service gracefully returns `EVALUATION_DEGRADED` with raw GitHub evidence preserved and null dimension scores—never fabricating scores.

---

## 2. Environment Configuration

Create a `.env` file inside `ai-service/` containing:

```env
GITHUB_TOKEN=your_github_personal_access_token_here
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-3.8-flash
AI_SERVICE_KEY=your_internal_service_key_here
```

| Variable | Required | Default | Description |
| :--- | :---: | :--- | :--- |
| `GITHUB_TOKEN` | Recommended | None | GitHub token for higher API rate limits (5,000 req/hr). |
| `GEMINI_API_KEY` | Required for AI | None | Google GenAI API key for LLM judging. |
| `GEMINI_MODEL` | Optional | `gemini-3.8-flash` | Gemini model alias to invoke for code evaluation. |
| `AI_SERVICE_KEY` | Optional (Enforced if set) | None | Pre-shared key for internal backend service authentication (`Authorization: Bearer <token>`). |

---

## 3. API Endpoints

### Internal Service Authentication
When `AI_SERVICE_KEY` is configured in the environment, protected endpoints (`POST /evaluate` and `GET /evaluate`) enforce service-to-service authentication:
```http
Authorization: Bearer <AI_SERVICE_KEY>
```
Missing or invalid credentials return `401 Unauthorized`. If `AI_SERVICE_KEY` is not set, authentication is bypassed to simplify local development.

### `GET /health` & `GET /`
Basic service liveness checks (always public). Returns `{"status": "healthy"}`.

### `GET /evaluate?owner={owner}&repo={repo}` (Legacy Analysis)
Preserved backward-compatible endpoint returning raw GitHub metrics and repository topology:
```json
{
  "project_name": "demo-repository",
  "repository": "shravani-student/demo-repository",
  "default_branch": "main",
  "commit_count": 4,
  "pull_request_count": 0,
  "contributor_count": 1,
  "contributors": ["shravani-student"],
  "analysis": { ... }
}
```

### `POST /evaluate` (Challenge-Aware AI Evaluation)
Evaluates a repository against challenge requirements:
**Request Body**:
```json
{
  "owner": "shravani-student",
  "repo": "demo-repository",
  "challenge_id": "c11a8123-e29b-41d4-a716-446655440001",
  "challenge_title": "Real-time Leaderboard",
  "requirements": [
    "JWT Authentication with role-based access",
    "Redis caching for leaderboard query",
    "Automated unit test coverage"
  ]
}
```

**Response Format**:
```json
{
  "status": "SUCCESS",
  "evaluated_at": "2026-09-30T16:15:00.000Z",
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
    ...
  ],
  "requirements_evaluation": [
    {
      "requirement": "JWT Authentication with role-based access",
      "status": "MET",
      "evidence": "src/auth/jwt.py",
      "justification": "JWT encoding/decoding and token verification implemented."
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

---

## 4. Evaluation Dimensions & Weights

The total score (0–100) is calculated deterministically in Python using the exact weights:

1. **Technical Quality (20%)**
2. **Functionality & Completeness (20%)**
3. **Architecture & Engineering (15%)**
4. **Innovation & Problem Solving (15%)**
5. **Feasibility & Scalability (15%)**
6. **Documentation & Engineering Process (15%)**

---

## 5. Running Tests

Run the test suite using `pytest`:

```bash
python -m pytest tests/
```
