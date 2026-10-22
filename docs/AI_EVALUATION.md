# KLYRO — AI Judging & Evaluation Engine (`/docs/AI_EVALUATION.md`)

> **Master AI Judging & Automated Code Evaluation Documentation**  
> **Primary Owner**: Member 3 (AI Service)  
> **Engine**: Python 3.11+, FastAPI, `google-genai` SDK (`gemini-3.8-flash` via `GEMINI_MODEL`)

---

## 1. Overview & Evaluation Philosophy

In traditional competitive coding platforms, evaluation is limited to unit test assertions. KLYRO evaluates total software engineering craftsmanship, repository structure, contribution authenticity, code elegance, maintainability, and documentation.

> *"Don't just show us what you built. Show us how you built it."*

---

## 2. The 6 Scoring Dimensions & Exact Weights

The total score (0 - 100) is calculated deterministically in Python from the 6 core engineering dimensions:

| Dimension | Weight | Target Criteria & What It Measures |
| :--- | :---: | :--- |
| **Technical Quality** | **20%** | Code structure, error handling, typing hygiene, algorithmic clarity, avoidance of anti-patterns. |
| **Functionality & Completeness** | **20%** | Observable feature completion against challenge requirements, working endpoints/components. |
| **Architecture & Engineering** | **15%** | Project structure, clean separation of concerns, modularity, framework utilization, design patterns. |
| **Innovation & Problem Solving** | **15%** | Originality of solution, clever optimization, UX micro-interactions, creative problem solving. |
| **Feasibility & Scalability** | **15%** | Practicality, cloud deployment readiness, database efficiency, horizontal scaling considerations. |
| **Documentation & Engineering Process** | **15%** | Comprehensive README setup guide, clear inline docstrings, git commit hygiene, meaningful PR discussions. |

---

## 3. Observable 0–5 Scoring Anchors

To prevent speculative grading, each dimension is evaluated against observable static repository evidence:

### 1. Technical Quality (20%)
- **0**: Empty repository, fatal syntax/runtime errors preventing basic execution, or no meaningful code present.
- **1**: Fragmented code, unhandled fatal exceptions, no typing discipline, pervasive antipatterns (e.g., hardcoded credentials, duplicate copy-paste blocks).
- **2**: Basic code with rudimentary error boundaries; inconsistent typing/validation; unhandled edge cases in core functions.
- **3**: Consistent error handling across primary routes; standard language typing/validation; clear variable naming; no obvious resource leaks.
- **4**: Strong typing/interfaces; structured error handling and logging; modular single-responsibility functions; clean algorithmic logic.
- **5**: Exemplary code craftsmanship; comprehensive defensive programming; appropriate algorithmic choices; strong observable automated test coverage. *(Zero lint/type errors are not claimed unless verified by a tool).*

### 2. Architecture & Engineering (15%)
- **0**: Completely unstructured; all code dumped into a single root file with no recognizable architecture.
- **1**: Chaotic directory layout; circular dependencies; mixed presentation, business, and database logic.
- **2**: Basic folder separation attempted, but abstractions leak heavily with tight coupling between components.
- **3**: Standard idiomatic project layout (e.g., clear separation of routes, controllers, services); standard dependency management (`package.json`, `requirements.txt`).
- **4**: Strong separation of concerns; clean service layer; centralized configuration/environment variable management; clear module boundaries.
- **5**: Highly decoupled architecture; reusable utilities; clear module boundaries; well-structured configuration and persistence design where applicable. *(Docker / Docker Compose is not required for a score of 5).*

### 3. Functionality & Completeness (20%)
- **0**: None of the challenge requirements or declared features are implemented.
- **1**: Skeleton only; functions are empty stubs, placeholder UI elements, or mock hardcoded data without real logic.
- **2**: Less than half of the challenge requirements met; core execution flows broken or incomplete.
- **3**: Majority of core requirements MET with working code paths; minor secondary requirements PARTIAL or MISSING.
- **4**: All primary challenge requirements MET and verifiable in code; input validation and error paths implemented.
- **5**: All challenge requirements fully MET with observable edge-case handling, comprehensive validation, and verified end-to-end integration across components.

### 4. Innovation & Problem Solving (15%)
- **0**: No discernible problem-solving logic; boilerplate template copy-paste only.
- **1**: Trivial implementation relying entirely on default framework starter code without custom problem-solving logic.
- **2**: Basic brute-force approach to the problem; minimal attention to efficiency or user experience.
- **3**: Competent custom logic solving the core problem effectively; thoughtful data structures chosen.
- **4**: Clever architectural optimization (e.g., efficient caching, state management, asynchronous handling, or novel UX interaction flow).
- **5**: Distinctive, highly creative technical execution; exceptional domain modeling, micro-optimizations, or unique features that elevate the solution beyond baseline requirements.

### 5. Feasibility & Scalability (15%)
- **0**: Completely unfeasible; hardcoded single-user credentials, blocking synchronous calls on high-load paths, or non-portable environments.
- **1**: Major scalability bottlenecks (e.g., in-memory state preventing multi-instance execution, unindexed N+1 query patterns).
- **2**: Basic database or file persistence, but lacks connection management, pagination, or payload size limits.
- **3**: Stateless API design; standard ORM/database queries with parameterized inputs; environment-driven configuration.
- **4**: Scalability patterns present: structured caching considerations, database indexing/pagination, connection pooling, cloud-ready configurations.
- **5**: Strong scalability and deployment readiness appropriate to the project's requirements; efficient data access; appropriate resource management; clear path to horizontal scaling where relevant. *(Containerization is not required for a score of 5).*

### 6. Documentation & Engineering Process (15%)
- **0**: No README, empty repository commit history (single giant commit with generic message like "init"), no PRs.
- **1**: Minimal default README (e.g., default framework starter text), few cryptic commits ("update", "fix").
- **2**: Basic README with project title and partial setup commands; irregular commit progression.
- **3**: Clear README with installation, environment variable requirements, and run instructions; informative commit messages showing iterative development.
- **4**: Thorough README with architecture diagrams or API endpoint descriptions; clean Git commit discipline with conventional commit prefixes.
- **5**: Exemplary documentation: complete setup guide, API contract documentation, clear inline docstrings/type annotations, well-documented PR descriptions or changelogs.

---

## 4. Deterministic Python Scoring Formula

The LLM is strictly prohibited from computing the final total score. Python computes it deterministically:

1. **Raw Scores**: Gemini supplies $s_i \in [0.0, 5.0]$ for each dimension.
2. **Normalized Dimension Score**:
   $$\text{Dimension Score}_i = \left(\frac{s_i}{5.0}\right) \times 100$$
3. **Weighted Score**:
   $$\text{Weighted Score}_i = \text{Dimension Score}_i \times \text{Weight}_i$$
4. **Final Total Score**:
   $$\text{Total Score} = \sum_{i=1}^{6} \text{Weighted Score}_i \quad (0.0 \text{ to } 100.0, \text{ rounded to 1 decimal place})$$

---

## 5. Challenge-Aware Requirement Verdicts

Requirements submitted in `POST /evaluate` are evaluated to one of four strict verdicts:
- **`MET`**: Concrete observable evidence confirms implementation.
- **`PARTIAL`**: Concrete evidence demonstrates partial or incomplete implementation.
- **`MISSING`**: Relevant code areas were inspected and the requirement is absent.
- **`NOT_VERIFIABLE`**: Available evidence is insufficient (e.g., target file exceeded budget, tree was truncated, or requires external runtime services). **Missing evidence is NEVER automatically graded as a failure.**

---

## 6. Degraded Mode (`EVALUATION_DEGRADED`)

If the Gemini API key is missing, network calls fail, or the LLM returns unrepairable invalid JSON:
- **No scores are fabricated.**
- `status = "EVALUATION_DEGRADED"`
- `total_score = null`
- `dimension_scores = null`
- `requirements_evaluation = null`
- `feedback_summary = null`
- Preserves all gathered GitHub metrics, manifest, and contribution heuristics with `degraded_reason` explaining the issue.

---

## 7. Heuristic Contribution Estimation

Contribution percentage is an AI-assisted heuristic normalized across contributors based on commit volume, lines changed, and pull requests.
It includes:
- `github_username`: login
- `estimated_percentage`: normalized heuristic %
- `evidence`: commit, line, and PR counts
- `confidence`: `HIGH`, `MEDIUM`, or `LOW`
- `limitations`: explicit blind spots
- **Mandatory Disclaimer**:
  > *"AI-assisted estimated contribution is an algorithmic heuristic based on repository commit, PR, and file metadata. Git history cannot objectively prove exact intellectual contribution or off-git collaborative teamwork."*
