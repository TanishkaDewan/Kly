# KLYRO — GitHub Analysis Pipeline (`/docs/GITHUB_ANALYSIS.md`)

> **Repository Analysis & Evidence Ingestion Engine Documentation**  
> **Primary Owner**: Member 3 (AI Service)  
> **Module**: `ai-service/github/` (`client.py`, `analyzer.py`)

---

## 1. Overview

The GitHub Analysis Pipeline is responsible for connecting to public and private GitHub repositories submitted by arena battle teams. It extracts verifiable evidence (tree topology, prioritized source files, commits, PRs, author activity) to pass to the AI Judging Engine.

---

## 2. Ingestion Pipeline Workflow

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Triggers:                                                │
│    - GET  /evaluate?owner=X&repo=Y (Legacy Analysis)        │
│    - POST /evaluate (Challenge-Aware AI Evaluation)         │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. GitHubClient Authentication                              │
│    Loads GITHUB_TOKEN from env, initializes REST headers    │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. API Fetches                                              │
│    ├── fetch_repository()       ──> Repo metadata           │
│    ├── fetch_tree()             ──> File structure tree     │
│    ├── fetch_readme()           ──> README content & size   │
│    ├── fetch_commits()          ──> Recent commit log       │
│    ├── fetch_pull_requests()    ──> PR history & reviews    │
│    ├── fetch_contributors()     ──> Contributor list        │
│    ├── fetch_file_content()     ──> Prioritized source files│
│    └── fetch_commit_detail()    ──> Sampled commit diffs    │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. Evidence Processing & Budgets                            │
│    ├── Filter vendor/build dirs (node_modules, venv, dist)  │
│    ├── Tiered & challenge keyword file prioritization      │
│    ├── Enforce 20 KB/file & 80 KB total evidence caps       │
│    └── Sample commit attributions (max 15 commits)          │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. Returns Evidence Object & Evidence Manifest to Evaluator │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. GitHub API Client Module (`github/client.py`)

The `GitHubClient` encapsulates GitHub REST API interactions using Python's `requests`.

### Environment Configuration
- `GITHUB_TOKEN`: Personal Access Token / Fine-grained token configured via `.env` (5,000 req/hour).

### Core Methods

| Method | Endpoint Called | Description |
| :--- | :--- | :--- |
| `fetch_repository(owner, repo)` | `GET /repos/{owner}/{repo}` | Fetches primary metadata (stars, forks, default branch, language). |
| `fetch_repository_structure(owner, repo, branch)` | `GET /repos/{owner}/{repo}/git/trees/{branch}?recursive=1` | Fetches complete recursive file tree of the repository. |
| `fetch_readme(owner, repo)` | `GET /repos/{owner}/{repo}/readme` | Retrieves base64 encoded README and raw byte count. |
| `fetch_commits(owner, repo)` | `GET /repos/{owner}/{repo}/commits` | Retrieves commit logs, authors, timestamps, and commit messages. |
| `fetch_pull_requests(owner, repo)` | `GET /repos/{owner}/{repo}/pulls?state=all` | Retrieves closed and open PR details. |
| `fetch_contributors(owner, repo)` | `GET /repos/{owner}/{repo}/contributors` | Retrieves list of GitHub logins and commit contribution counts. |
| `fetch_file_content(owner, repo, path, ref)` | `GET /repos/{owner}/{repo}/contents/{path}` | Retrieves base64 encoded contents of specific source files. |
| `fetch_commit_detail(owner, repo, sha)` | `GET /repos/{owner}/{repo}/commits/{sha}` | Retrieves commit additions/deletions stats and touched files list. |

---

## 4. GitHub Analyzer Module (`github/analyzer.py`)

The `GitHubAnalyzer` processes raw API responses into clean, challenge-aware evidence artifacts.

### Source File Selection & Budget Enforcement
1. **Dynamic Keyword Tiering**:
   - Matches keywords from challenge requirements against file paths (e.g., `auth`, `redis`, `api`).
   - Prioritizes entry points (`main.py`, `server.js`, `index.ts`), domain models, and test files.
2. **Exclusion Filters**:
   - Excludes vendor, build, and virtualenv paths (`node_modules/`, `venv/`, `dist/`, `build/`).
   - Excludes binary extensions (`.png`, `.wasm`, `.exe`) and lock files (`*-lock.json`, `pnpm-lock.yaml`).
3. **Hard Budgets**:
   - Up to **10 files** selected.
   - Max **20 KB** per file (head-truncated with notice).
   - Max **80 KB** total evidence budget across all files.
4. **Evidence Manifest**:
   - Emits `evidence_manifest` tracking total discovered files, inspected files, omissions, tree truncation, and budget exhaustion.

### Sampled Commit Attribution
- Samples up to **15 recent commits** to extract author additions/deletions and touched file components.
- Gracefully degrades to volume-only attribution if commit details hit rate limits.

---

## 5. Verification & Testing Command

To verify the test suite:

```bash
python -m pytest tests/
```
