from datetime import datetime, timezone
import hmac
import os
from typing import Any

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Request, Query, Header, Depends, status
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
import requests

from evaluator import CodeEvaluator
from github.analyzer import GitHubAnalyzer

load_dotenv()

app = FastAPI(title="KLYRO AI Evaluation Service", version="1.0.0")

analyzer = GitHubAnalyzer()
evaluator = CodeEvaluator()


# ---------------------------------------------------------------------------
# Internal Service Authentication
# ---------------------------------------------------------------------------
def verify_service_key(authorization: str | None = Header(None)) -> None:
    """
    Validates internal service-to-service authentication via Bearer token.
    If AI_SERVICE_KEY is not set in the environment, requests are allowed (local development/testing).
    If AI_SERVICE_KEY is set, requests must include 'Authorization: Bearer <AI_SERVICE_KEY>'.
    Uses constant-time comparison (hmac.compare_digest) to prevent timing attacks.
    """
    expected_key = os.getenv("AI_SERVICE_KEY")
    if not expected_key:
        return

    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or missing service key."
        )

    token = authorization.split(" ", 1)[1].strip()
    if not hmac.compare_digest(token, expected_key):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or missing service key."
        )



# ---------------------------------------------------------------------------
# Standard Error Formatting (Adheres to /docs/API_CONTRACT.md)
# ---------------------------------------------------------------------------
def standard_error_response(status_code: int, error_category: str, message: str) -> JSONResponse:
    return JSONResponse(
        status_code=status_code,
        content={
            "error": error_category,
            "message": message,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
    )


@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    category_map = {
        400: "BadRequest",
        401: "Unauthorized",
        403: "Forbidden",
        404: "NotFound",
        500: "InternalServerError",
        502: "BadGateway",
        503: "ServiceUnavailable"
    }
    cat = category_map.get(exc.status_code, "Error")
    return standard_error_response(exc.status_code, cat, str(exc.detail))


@app.exception_handler(requests.exceptions.HTTPError)
async def requests_http_error_handler(request: Request, exc: requests.exceptions.HTTPError):
    resp = exc.response
    status_code = resp.status_code if resp is not None else 502
    if status_code == 404:
        return standard_error_response(404, "NotFound", "Repository not found or is private on GitHub.")
    elif status_code == 403:
        return standard_error_response(403, "Forbidden", "GitHub API rate limit exceeded or access forbidden.")
    return standard_error_response(502, "BadGateway", f"Upstream GitHub API error: {str(exc)}")


@app.exception_handler(requests.exceptions.RequestException)
async def requests_exception_handler(request: Request, exc: requests.exceptions.RequestException):
    return standard_error_response(502, "BadGateway", f"Upstream network failure connecting to GitHub: {str(exc)}")


# ---------------------------------------------------------------------------
# Health Endpoints
# ---------------------------------------------------------------------------
@app.get("/")
def root():
    return {"status": "healthy"}


@app.get("/health")
def health():
    return {"status": "healthy"}


# ---------------------------------------------------------------------------
# GET /evaluate — Legacy Repository Analysis (Contract Preserved Exactly)
# ---------------------------------------------------------------------------
@app.get("/evaluate", dependencies=[Depends(verify_service_key)])
def evaluate_get(
    owner: str = Query(..., description="GitHub repository owner"),
    repo: str = Query(..., description="GitHub repository name")
):
    if not owner.strip() or not repo.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Parameters 'owner' and 'repo' cannot be empty."
        )

    try:
        analysis = analyzer.analyze_repository(owner, repo)
    except requests.exceptions.HTTPError as e:
        status_code = e.response.status_code if e.response is not None else 502
        if status_code == 404:
            raise HTTPException(status_code=404, detail=f"Repository '{owner}/{repo}' not found on GitHub.")
        elif status_code == 403:
            raise HTTPException(status_code=403, detail="GitHub API rate limit exceeded or access forbidden.")
        raise HTTPException(status_code=502, detail=f"Upstream GitHub error: {str(e)}")

    # Exact legacy response contract preserved
    return {
        "project_name": analysis["repository"]["name"],
        "repository": analysis["repository"]["full_name"],
        "default_branch": analysis["repository"]["default_branch"],

        "commit_count": analysis["commits"]["count"],
        "pull_request_count": analysis["pull_requests"]["count"],
        "contributor_count": analysis["contributors"]["count"],

        "contributors": [
            contributor["login"]
            for contributor in analysis["contributors"]["evidence"]
        ],

        "analysis": analysis
    }


# ---------------------------------------------------------------------------
# POST /evaluate — Challenge-Aware AI Evaluation Engine
# ---------------------------------------------------------------------------
class ChallengeEvaluationRequest(BaseModel):
    owner: str = Field(..., description="GitHub repository owner or organization")
    repo: str = Field(..., description="GitHub repository name")
    challenge_id: str | None = Field(None, description="Optional challenge UUID")
    challenge_title: str | None = Field(None, description="Title of the battle challenge")
    requirements: list[str] = Field(default_factory=list, description="List of challenge criteria to verify")


@app.post("/evaluate", dependencies=[Depends(verify_service_key)])
def evaluate_post(payload: ChallengeEvaluationRequest):
    owner = payload.owner.strip()
    repo = payload.repo.strip()

    if not owner or not repo:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Fields 'owner' and 'repo' cannot be empty."
        )

    try:
        # Ingest full repository analysis including source code evidence and commit attributions
        analysis = analyzer.analyze_repository(
            owner=owner,
            repo=repo,
            challenge_requirements=payload.requirements,
            include_code_evidence=True
        )
    except requests.exceptions.HTTPError as e:
        status_code = e.response.status_code if e.response is not None else 502
        if status_code == 404:
            raise HTTPException(status_code=404, detail=f"Repository '{owner}/{repo}' not found on GitHub.")
        elif status_code == 403:
            raise HTTPException(status_code=403, detail="GitHub API rate limit exceeded or access forbidden.")
        raise HTTPException(status_code=502, detail=f"Upstream GitHub error: {str(e)}")

    # Run AI evaluation (or fallback gracefully to degraded mode if AI service unavailable)
    result = evaluator.evaluate_repository(
        analysis=analysis,
        challenge=payload.model_dump()
    )

    return result