import json
import math
import os
import re
import time
from datetime import datetime, timezone
from typing import Any

from dotenv import load_dotenv
from pydantic import BaseModel, Field, ValidationError

try:
    from google import genai
    from google.genai import types, errors
except ImportError:
    genai = None
    types = None
    errors = None

load_dotenv()


def is_transient_error(exc: Exception) -> bool:
    """
    Checks if an exception represents a transient 503/5xx or server-unavailable error.
    Explicitly does NOT treat validation or parsing errors as transient.
    """
    if errors and isinstance(exc, errors.ServerError):
        return True

    code = getattr(exc, "code", None) or getattr(exc, "status_code", None)
    if code in {500, 502, 503, 504}:
        return True

    status_str = str(getattr(exc, "status", "")).upper()
    if status_str in {"UNAVAILABLE", "DEADLINE_EXCEEDED"}:
        return True

    msg = str(exc).lower()
    transient_indicators = [
        "503",
        "unavailable",
        "high demand",
        "overloaded",
        "service unavailable",
        "resource exhausted",
        "deadline exceeded",
        "temporary failure",
        "timed out",
        "timeout",
        "read operation"
    ]
    return any(indicator in msg for indicator in transient_indicators)

DEFAULT_GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-3.8-flash")
FALLBACK_GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-3.8-flash")

CONTRIBUTION_DISCLAIMER = (
    "AI-assisted estimated contribution is an algorithmic heuristic based on repository commit, "
    "PR, and file metadata. Git history cannot objectively prove exact intellectual contribution "
    "or off-git collaborative teamwork."
)

DIMENSIONS = [
    {
        "key": "technical_quality",
        "name": "Technical Quality",
        "weight": 0.20,
        "criteria": (
            "Score 0: Empty repository, fatal syntax/runtime errors preventing basic execution, or no meaningful code.\n"
            "Score 1: Fragmented code, unhandled fatal exceptions, no typing discipline, pervasive antipatterns (e.g. hardcoded credentials, duplicate copy-paste blocks).\n"
            "Score 2: Basic code with rudimentary error boundaries; inconsistent typing/validation; unhandled edge cases in core functions.\n"
            "Score 3: Consistent error handling across primary routes; standard language typing/validation; clear variable naming; no obvious resource leaks.\n"
            "Score 4: Strong typing/interfaces; structured error handling and logging; modular single-responsibility functions; clean algorithmic logic.\n"
            "Score 5: Exemplary code craftsmanship; comprehensive defensive programming; appropriate algorithmic choices; strong observable automated test coverage."
        )
    },
    {
        "key": "architecture_engineering",
        "name": "Architecture & Engineering",
        "weight": 0.15,
        "criteria": (
            "Score 0: Completely unstructured; all code dumped into a single root file with no recognizable architecture.\n"
            "Score 1: Chaotic directory layout; circular dependencies; mixed presentation, business, and database logic.\n"
            "Score 2: Basic folder separation attempted, but abstractions leak heavily with tight coupling between components.\n"
            "Score 3: Standard idiomatic project layout (e.g., clear separation of routes, controllers, services); standard dependency management (package.json, requirements.txt).\n"
            "Score 4: Strong separation of concerns; clean service layer; centralized configuration/environment variable management; clear module boundaries.\n"
            "Score 5: Highly decoupled architecture; reusable utilities; clear module boundaries; well-structured configuration and persistence design where applicable."
        )
    },
    {
        "key": "functionality_completeness",
        "name": "Functionality & Completeness",
        "weight": 0.20,
        "criteria": (
            "Score 0: None of the challenge requirements or declared features are implemented.\n"
            "Score 1: Skeleton only; functions are empty stubs, placeholder UI elements, or mock hardcoded data without real logic.\n"
            "Score 2: Less than half of the challenge requirements met; core execution flows broken or incomplete.\n"
            "Score 3: Majority of core requirements MET with working code paths; minor secondary requirements PARTIAL or MISSING.\n"
            "Score 4: All primary challenge requirements MET and verifiable in code; input validation and error paths implemented.\n"
            "Score 5: All challenge requirements fully MET with observable edge-case handling, comprehensive validation, and verified end-to-end integration across components."
        )
    },
    {
        "key": "innovation_problem_solving",
        "name": "Innovation & Problem Solving",
        "weight": 0.15,
        "criteria": (
            "Score 0: No discernible problem-solving logic; boilerplate template copy-paste only.\n"
            "Score 1: Trivial implementation relying entirely on default framework starter code without custom problem-solving logic.\n"
            "Score 2: Basic brute-force approach to the problem; minimal attention to efficiency or user experience.\n"
            "Score 3: Competent custom logic solving the core problem effectively; thoughtful data structures chosen.\n"
            "Score 4: Clever architectural optimization (e.g., efficient caching, state management, asynchronous handling, or novel UX interaction flow).\n"
            "Score 5: Distinctive, highly creative technical execution; exceptional domain modeling, micro-optimizations, or unique features that elevate the solution beyond baseline requirements."
        )
    },
    {
        "key": "feasibility_scalability",
        "name": "Feasibility & Scalability",
        "weight": 0.15,
        "criteria": (
            "Score 0: Completely unfeasible; hardcoded single-user credentials, blocking synchronous calls on high-load paths, or non-portable environments.\n"
            "Score 1: Major scalability bottlenecks (e.g., in-memory state preventing multi-instance execution, unindexed N+1 query patterns).\n"
            "Score 2: Basic database or file persistence, but lacks connection management, pagination, or payload size limits.\n"
            "Score 3: Stateless API design; standard ORM/database queries with parameterized inputs; environment-driven configuration.\n"
            "Score 4: Scalability patterns present: structured caching considerations, database indexing/pagination, connection pooling, cloud-ready configurations.\n"
            "Score 5: Strong scalability and deployment readiness appropriate to the project's requirements; efficient data access; appropriate resource management; clear path to horizontal scaling where relevant."
        )
    },
    {
        "key": "documentation_engineering_process",
        "name": "Documentation & Engineering Process",
        "weight": 0.15,
        "criteria": (
            "Score 0: No README, empty repository commit history (single giant commit with generic message like 'init'), no PRs.\n"
            "Score 1: Minimal default README (e.g., default framework starter text), few cryptic commits ('update', 'fix').\n"
            "Score 2: Basic README with project title and partial setup commands; irregular commit progression.\n"
            "Score 3: Clear README with installation, environment variable requirements, and run instructions; informative commit messages showing iterative development.\n"
            "Score 4: Thorough README with architecture diagrams or API endpoint descriptions; clean Git commit discipline with conventional commit prefixes.\n"
            "Score 5: Exemplary documentation: complete setup guide, API contract documentation, clear inline docstrings/type annotations, well-documented PR descriptions or changelogs."
        )
    }
]


# ---------------------------------------------------------------------------
# Pydantic Output Schemas
# ---------------------------------------------------------------------------
class RawDimensionScore(BaseModel):
    raw_score: float = Field(ge=0.0, le=5.0)
    rationale: str


class RequirementVerdict(BaseModel):
    requirement: str
    status: str  # MET, PARTIAL, MISSING, NOT_VERIFIABLE
    evidence: str
    justification: str


class GeminiEvaluationPayload(BaseModel):
    technical_quality: RawDimensionScore
    architecture_engineering: RawDimensionScore
    functionality_completeness: RawDimensionScore
    innovation_problem_solving: RawDimensionScore
    feasibility_scalability: RawDimensionScore
    documentation_engineering_process: RawDimensionScore
    feedback_summary: str
    strengths: list[str] = Field(default_factory=list)
    weaknesses: list[str] = Field(default_factory=list)
    recommendations: list[str] = Field(default_factory=list)
    suspicious_flags: list[str] = Field(default_factory=list)
    requirements_evaluation: list[RequirementVerdict] = Field(default_factory=list)


# ---------------------------------------------------------------------------
# Scoring Engine
# ---------------------------------------------------------------------------
def calculate_scores(raw_dimension_scores: dict[str, Any]) -> tuple[float, list[dict]]:
    """
    Deterministically computes normalized (0-100) scores and weighted total score in Python.
    Strictly validates every rating before arithmetic. Rejects booleans, non-numeric values,
    NaN, infinities, out-of-range values, and missing dimensions.
    """
    if not isinstance(raw_dimension_scores, dict):
        raise ValueError(f"raw_dimension_scores must be a dict, got {type(raw_dimension_scores).__name__}")

    # Validate all 6 required dimensions before computing scores
    validated_ratings: dict[str, float] = {}
    for dim in DIMENSIONS:
        key = dim["key"]
        if key not in raw_dimension_scores:
            raise ValueError(f"Missing required dimension: '{key}'")

        val = raw_dimension_scores[key]

        # Explicitly reject booleans (bool is a subclass of int in Python)
        if isinstance(val, bool):
            raise ValueError(f"Dimension '{key}' rating cannot be a boolean (received {val!r}).")

        # Reject non-numeric types (e.g. str, list, dict, None)
        if not isinstance(val, (int, float)):
            raise ValueError(f"Dimension '{key}' rating must be a numeric float or int (received {type(val).__name__}: {val!r}).")

        float_val = float(val)

        # Reject NaN, +Inf, -Inf
        if math.isnan(float_val) or math.isinf(float_val):
            raise ValueError(f"Dimension '{key}' rating must be a finite number (received {val!r}).")

        # Reject out-of-range ratings (must be between 0.0 and 5.0)
        if float_val < 0.0 or float_val > 5.0:
            raise ValueError(f"Dimension '{key}' rating must be between 0.0 and 5.0 (received {float_val}).")

        validated_ratings[key] = float_val

    total_score = 0.0
    dimension_results = []

    for dim in DIMENSIONS:
        key = dim["key"]
        name = dim["name"]
        weight = dim["weight"]
        raw = validated_ratings[key]

        # Scale rating (0-5) to dimension score (0-100)
        scaled_score = round((raw / 5.0) * 100.0, 1)
        weighted_score = round(scaled_score * weight, 2)
        total_score += weighted_score

        dimension_results.append({
            "dimension": name,
            "raw_score": raw,
            "weight": weight,
            "dimension_score": scaled_score,
            "weighted_score": weighted_score
        })

    final_total = round(total_score, 1)

    if not math.isfinite(final_total) or final_total < 0.0 or final_total > 100.0:
        raise ValueError(f"Calculated final score is out of range or non-finite: {final_total}")

    return final_total, dimension_results


# ---------------------------------------------------------------------------
# Contribution Estimation Heuristic
# ---------------------------------------------------------------------------
def estimate_contributions(
    contributors: list[dict],
    commits: list[dict],
    commit_attributions: dict[str, dict] | None,
    pull_requests: list[dict]
) -> list[dict]:
    """
    Calculates an AI-assisted heuristic contribution breakdown normalized across contributors.
    Explicitly includes confidence, limitations, and mandatory disclaimer.
    """
    if not contributors:
        return []

    # Map logins
    contributor_map: dict[str, dict] = {}
    for c in contributors:
        login = c.get("login") or "unknown"
        contributor_map[login] = {
            "login": login,
            "total_commits": c.get("contributions", 0),
            "sampled_additions": 0,
            "sampled_deletions": 0,
            "files_touched": [],
            "prs_authored": 0
        }

    # Add commit attribution data if available
    if commit_attributions:
        for login, data in commit_attributions.items():
            if login in contributor_map:
                contributor_map[login]["sampled_additions"] = data.get("additions", 0)
                contributor_map[login]["sampled_deletions"] = data.get("deletions", 0)
                contributor_map[login]["files_touched"] = data.get("files_touched", [])
            else:
                contributor_map[login] = {
                    "login": login,
                    "total_commits": data.get("commits_sampled", 1),
                    "sampled_additions": data.get("additions", 0),
                    "sampled_deletions": data.get("deletions", 0),
                    "files_touched": data.get("files_touched", []),
                    "prs_authored": 0
                }

    # Add PR counts
    for pr in pull_requests:
        author = pr.get("author")
        if author and author in contributor_map:
            contributor_map[author]["prs_authored"] += 1

    total_contributors = len(contributor_map)
    weights: dict[str, float] = {}

    for login, stats in contributor_map.items():
        c_commits = stats["total_commits"]
        c_lines = stats["sampled_additions"] + stats["sampled_deletions"]
        c_prs = stats["prs_authored"]
        # Multi-signal heuristic formula
        w = (c_commits * 2.0) + (c_prs * 4.0) + (c_lines ** 0.5 * 0.5)
        weights[login] = max(0.1, w)

    sum_weights = sum(weights.values())
    results = []

    # Confidence evaluation
    total_commits = len(commits)
    if total_commits <= 1:
        confidence = "LOW"
    elif commit_attributions and len(commit_attributions) > 0 and total_commits >= 5:
        confidence = "HIGH"
    else:
        confidence = "MEDIUM"

    running_percent = 0.0
    items = list(weights.items())

    for idx, (login, w) in enumerate(items):
        if idx == len(items) - 1:
            # Ensure exact 100.0% sum
            percent = round(100.0 - running_percent, 1)
        else:
            percent = round((w / sum_weights) * 100.0, 1)
            running_percent += percent

        stats = contributor_map[login]
        evidence_points = [
            f"{stats['total_commits']} commits recorded in contributor log",
        ]
        if stats["prs_authored"] > 0:
            evidence_points.append(f"{stats['prs_authored']} pull requests authored")
        if stats["files_touched"]:
            top_files = stats["files_touched"][:3]
            evidence_points.append(f"Touched files including: {', '.join(top_files)}")

        limitations = [
            "Git commits cannot detect offline collaboration or verbal pair programming.",
            "Squashed merges or inconsistent git author emails may obscure contribution granularity."
        ]

        results.append({
            "github_username": login,
            "estimated_percentage": percent,
            "evidence": evidence_points,
            "confidence": confidence,
            "limitations": limitations,
            "disclaimer": CONTRIBUTION_DISCLAIMER
        })

    return results


# ---------------------------------------------------------------------------
# CodeEvaluator
# ---------------------------------------------------------------------------
class CodeEvaluator:
    def __init__(self, model_name: str | None = None, fallback_model_name: str | None = None):
        self.api_key = os.getenv("GEMINI_API_KEY")
        self.model_name = model_name or os.getenv("GEMINI_MODEL") or DEFAULT_GEMINI_MODEL
        self.fallback_model_name = fallback_model_name or os.getenv("GEMINI_MODEL") or FALLBACK_GEMINI_MODEL

        self.client = None
        if genai and self.api_key:
            try:
                self.client = genai.Client(api_key=self.api_key)
            except Exception:
                self.client = None

    def build_prompt(
        self,
        analysis: dict[str, Any],
        challenge: dict[str, Any] | None
    ) -> str:
        repo_meta = analysis.get("repository", {})
        structure = analysis.get("structure", {})
        readme = analysis.get("readme", {})
        commits = analysis.get("commits", {})
        prs = analysis.get("pull_requests", {})
        contributors = analysis.get("contributors", {})
        source_files = analysis.get("source_files", [])
        manifest = analysis.get("evidence_manifest", {})

        requirements = (challenge or {}).get("requirements") or []
        challenge_title = (challenge or {}).get("challenge_title") or "General Software Engineering Project"

        prompt = f"""
You are the KLYRO AI Code Judging Engine.
You must evaluate the submitted GitHub repository based strictly on observable engineering evidence.

### SUBMISSION CONTEXT
- Repository: {repo_meta.get("full_name")}
- Default Branch: {repo_meta.get("default_branch")}
- Challenge Title: {challenge_title}
- Total Discovered Files: {structure.get("total_files")}
- Inspected Source Files Count: {len(source_files)}
- Tree Truncated: {structure.get("tree_truncated")}
- Budget Exhausted: {manifest.get("budget_exhausted")}

### CHALLENGE REQUIREMENTS TO VERIFY:
{json.dumps(requirements, indent=2)}

### OBSERVABLE EVIDENCE
1. README (Exists: {readme.get("exists")}, Size: {readme.get("size")}):
```markdown
{(readme.get("content") or "NO README AVAILABLE")[:4000]}
```

2. Commits ({commits.get("count")} total, {commits.get("verified_count")} verified):
{json.dumps(commits.get("evidence", [])[:10], indent=2)}

3. Pull Requests ({prs.get("count")} total, {prs.get("merged_count")} merged):
{json.dumps(prs.get("evidence", [])[:10], indent=2)}

4. Contributors:
{json.dumps(contributors.get("evidence", []), indent=2)}

5. Inspected Source Code Files ({len(source_files)} files):
"""
        for sf in source_files:
            trunc = " [TRUNCATED]" if sf.get("truncated") else ""
            prompt += f"\n--- FILE: {sf.get('path')}{trunc} ---\n{sf.get('content')}\n"

        prompt += """
### EVALUATION RULES:
1. Ground every score in observable code evidence.
2. For each challenge requirement, determine status as one of:
   - "MET": Observable code/structure confirms implementation.
   - "PARTIAL": Incomplete logic, stubs, or missing error boundaries.
   - "MISSING": Inspected relevant files and structure confirm requirement is absent.
   - "NOT_VERIFIABLE": Available evidence is insufficient (e.g. file omitted by budget or requires external deployment).
   NOTE: Do NOT treat NOT_VERIFIABLE as a failure.
3. For each of the 6 dimensions, provide a raw score between 0.0 and 5.0 and rationale matching these observable anchors:
   - Technical Quality (0-5): 0=empty/fatal errors, 3=consistent error handling/standard types, 5=exemplary craftsmanship, defensive programming, appropriate algorithmic choices, strong observable automated test coverage.
   - Architecture & Engineering (0-5): 0=unstructured single file, 3=idiomatic separation of concerns, 5=highly decoupled architecture, reusable utilities, clear module boundaries, well-structured configuration and persistence design where applicable.
   - Functionality & Completeness (0-5): 0=nothing implemented, 3=majority of core requirements met, 5=all requirements fully met with edge cases and integration.
   - Innovation & Problem Solving (0-5): 0=no problem solving, 3=competent custom logic, 5=distinctive creative execution, exceptional domain modeling.
   - Feasibility & Scalability (0-5): 0=unfeasible/hardcoded, 3=stateless API, standard queries, 5=strong scalability and deployment readiness appropriate to requirements, efficient data access, appropriate resource management, clear path to horizontal scaling.
   - Documentation & Engineering Process (0-5): 0=no README/single commit, 3=clear install instructions and iterative commits, 5=exemplary documentation, complete setup guide, API contract documentation, well-documented PRs.

Respond with strict JSON adhering to this exact schema structure:
```json
{
  "technical_quality": {"raw_score": 0.0, "rationale": "..."},
  "architecture_engineering": {"raw_score": 0.0, "rationale": "..."},
  "functionality_completeness": {"raw_score": 0.0, "rationale": "..."},
  "innovation_problem_solving": {"raw_score": 0.0, "rationale": "..."},
  "feasibility_scalability": {"raw_score": 0.0, "rationale": "..."},
  "documentation_engineering_process": {"raw_score": 0.0, "rationale": "..."},
  "feedback_summary": "...",
  "strengths": ["..."],
  "weaknesses": ["..."],
  "recommendations": ["..."],
  "suspicious_flags": [],
  "requirements_evaluation": [
    {
      "requirement": "...",
      "status": "MET",
      "evidence": "...",
      "justification": "..."
    }
  ]
}
```
"""
        return prompt

    def _generate_with_retry(
        self,
        prompt: str,
        temperature: float = 0.2,
        max_retries: int = 1,
        base_delay: float = 1.0,
        model: str | None = None,
        timeout: int = 60000
    ) -> str:
        """
        Executes generate_content with exponential backoff on transient 503/5xx errors.
        Note: types.HttpOptions expects timeout in milliseconds.
        """
        target_model = model or self.model_name
        last_exception = None
        # Defensively normalize to milliseconds if passed in seconds (< 1000)
        timeout_ms = timeout * 1000 if timeout < 1000 else timeout
        for attempt in range(max_retries + 1):
            try:
                config = types.GenerateContentConfig(
                    response_mime_type="application/json",
                    response_schema=GeminiEvaluationPayload,
                    temperature=temperature,
                    http_options=types.HttpOptions(timeout=timeout_ms)
                )
                response = self.client.models.generate_content(
                    model=target_model,
                    contents=prompt,
                    config=config
                )
                return response.text or ""
            except Exception as e:
                last_exception = e
                if is_transient_error(e) and attempt < max_retries:
                    delay = base_delay * (2 ** attempt)
                    time.sleep(delay)
                    continue
                raise e

        if last_exception:
            raise last_exception
        return ""

    def evaluate_repository(
        self,
        analysis: dict[str, Any],
        challenge: dict[str, Any] | None = None
    ) -> dict[str, Any]:
        """
        Executes Gemini evaluation. If Gemini is unavailable or fails, returns degraded mode.
        """
        manifest = analysis.get("evidence_manifest") or {}
        contributors = analysis.get("contributors", {}).get("evidence", [])
        commits = analysis.get("commits", {}).get("evidence", [])
        commit_attributions = analysis.get("commit_attributions")
        prs = analysis.get("pull_requests", {}).get("evidence", [])

        # Calculate heuristic contributions regardless of AI status
        contributions = estimate_contributions(
            contributors=contributors,
            commits=commits,
            commit_attributions=commit_attributions,
            pull_requests=prs
        )

        # -------------------------------------------------------------
        # Degraded Mode Check (No API Key or GenAI library)
        # -------------------------------------------------------------
        if not self.client or not self.api_key:
            return self._build_degraded_response(
                analysis=analysis,
                contributions=contributions,
                manifest=manifest,
                reason="Gemini API key or client is not configured on the AI service."
            )

        prompt = self.build_prompt(analysis, challenge)

        # -------------------------------------------------------------
        # Call Gemini with Fallback on 503/Transient Failures
        # Primary: gemini-3-flash-preview -> Fallback: gemini-3.8-flash
        # -------------------------------------------------------------
        parsed_payload = None
        used_model = self.model_name
        try:
            text = self._generate_with_retry(prompt, temperature=0.2, model=self.model_name, max_retries=1, timeout=70000)
            parsed_payload = self._parse_and_validate(text)
        except Exception as e:
            if is_transient_error(e) and self.fallback_model_name:
                try:
                    text = self._generate_with_retry(prompt, temperature=0.2, model=self.fallback_model_name, max_retries=1, timeout=70000)
                    parsed_payload = self._parse_and_validate(text)
                    used_model = self.fallback_model_name
                except Exception as fb_e:
                    return self._build_degraded_response(
                        analysis=analysis,
                        contributions=contributions,
                        manifest=manifest,
                        reason=f"Gemini API primary failure ({str(e)}) and fallback failure ({str(fb_e)})"
                    )
            else:
                return self._build_degraded_response(
                    analysis=analysis,
                    contributions=contributions,
                    manifest=manifest,
                    reason=f"Gemini API execution failure: {str(e)}"
                )

        # If text was received but failed JSON/schema validation, attempt one-turn repair
        if not parsed_payload:
            try:
                repair_prompt = f"The previous response was invalid. Extract and output valid JSON for the schema:\n{prompt}"
                repair_text = self._generate_with_retry(repair_prompt, temperature=0.0, model=used_model, max_retries=1)
                parsed_payload = self._parse_and_validate(repair_text)
            except Exception as repair_e:
                return self._build_degraded_response(
                    analysis=analysis,
                    contributions=contributions,
                    manifest=manifest,
                    reason=f"Gemini API repair execution failure: {str(repair_e)}"
                )

        if not parsed_payload:
            return self._build_degraded_response(
                analysis=analysis,
                contributions=contributions,
                manifest=manifest,
                reason="Unrepairable invalid JSON structure received from AI model."
            )

        # -------------------------------------------------------------
        # Deterministic Python Scoring
        # -------------------------------------------------------------
        raw_scores = {
            "technical_quality": parsed_payload.technical_quality.raw_score,
            "architecture_engineering": parsed_payload.architecture_engineering.raw_score,
            "functionality_completeness": parsed_payload.functionality_completeness.raw_score,
            "innovation_problem_solving": parsed_payload.innovation_problem_solving.raw_score,
            "feasibility_scalability": parsed_payload.feasibility_scalability.raw_score,
            "documentation_engineering_process": parsed_payload.documentation_engineering_process.raw_score,
        }

        try:
            total_score, dimension_results = calculate_scores(raw_scores)
        except (ValueError, TypeError) as ve:
            return self._build_degraded_response(
                analysis=analysis,
                contributions=contributions,
                manifest=manifest,
                reason=f"Scoring validation failed on AI ratings: {str(ve)}"
            )

        # Attach rationales to dimension results
        for dim_res in dimension_results:
            name = dim_res["dimension"]
            if name == "Technical Quality":
                dim_res["rationale"] = parsed_payload.technical_quality.rationale
            elif name == "Architecture & Engineering":
                dim_res["rationale"] = parsed_payload.architecture_engineering.rationale
            elif name == "Functionality & Completeness":
                dim_res["rationale"] = parsed_payload.functionality_completeness.rationale
            elif name == "Innovation & Problem Solving":
                dim_res["rationale"] = parsed_payload.innovation_problem_solving.rationale
            elif name == "Feasibility & Scalability":
                dim_res["rationale"] = parsed_payload.feasibility_scalability.rationale
            elif name == "Documentation & Engineering Process":
                dim_res["rationale"] = parsed_payload.documentation_engineering_process.rationale

        return {
            "status": "SUCCESS",
            "evaluated_at": datetime.now(timezone.utc).isoformat(),
            "model": used_model,
            "total_score": total_score,
            "dimension_scores": dimension_results,
            "feedback_summary": parsed_payload.feedback_summary,
            "strengths": parsed_payload.strengths,
            "weaknesses": parsed_payload.weaknesses,
            "recommendations": parsed_payload.recommendations,
            "suspicious_flags": parsed_payload.suspicious_flags,
            "requirements_evaluation": [r.model_dump() for r in parsed_payload.requirements_evaluation],
            "contributions": contributions,
            "evidence_manifest": manifest,
            "repository": analysis.get("repository", {})
        }

    def _parse_and_validate(self, text: str) -> GeminiEvaluationPayload | None:
        if not text:
            return None

        # Clean markdown codeblocks if present
        clean = text.strip()
        if clean.startswith("```json"):
            clean = clean[7:]
        elif clean.startswith("```"):
            clean = clean[3:]
        if clean.endswith("```"):
            clean = clean[:-3]
        clean = clean.strip()

        try:
            data = json.loads(clean)
            return GeminiEvaluationPayload.model_validate(data)
        except (json.JSONDecodeError, ValidationError):
            return None

    def _build_degraded_response(
        self,
        analysis: dict[str, Any],
        contributions: list[dict],
        manifest: dict[str, Any],
        reason: str
    ) -> dict[str, Any]:
        """
        Builds a degraded response.
        Explicitly does NOT fabricate scores.
        total_score and dimension_scores are None.
        """
        return {
            "status": "EVALUATION_DEGRADED",
            "degraded_reason": reason,
            "evaluated_at": datetime.now(timezone.utc).isoformat(),
            "model": self.model_name,
            "total_score": None,
            "dimension_scores": None,
            "requirements_evaluation": None,
            "feedback_summary": None,
            "strengths": [],
            "weaknesses": [],
            "recommendations": [],
            "suspicious_flags": [],
            "contributions": contributions,
            "evidence_manifest": manifest,
            "repository": analysis.get("repository", {})
        }
