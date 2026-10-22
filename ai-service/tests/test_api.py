from unittest.mock import MagicMock, patch
from fastapi.testclient import TestClient
import pytest
import requests

from main import app

client = TestClient(app)

TEST_SERVICE_KEY = "test_internal_key_abc"
AUTH_HEADERS = {"Authorization": f"Bearer {TEST_SERVICE_KEY}"}


@pytest.fixture(autouse=True)
def setup_test_service_key(monkeypatch):
    """
    Ensures all tests run in an explicitly controlled authentication environment,
    insulating them from developer local .env configuration.
    """
    monkeypatch.setenv("AI_SERVICE_KEY", TEST_SERVICE_KEY)


def test_health_endpoints():
    r1 = client.get("/")
    assert r1.status_code == 200
    assert r1.json() == {"status": "healthy"}

    r2 = client.get("/health")
    assert r2.status_code == 200
    assert r2.json() == {"status": "healthy"}


def test_get_evaluate_legacy_contract_preserved():
    mock_analysis = {
        "repository": {
            "name": "demo-repository",
            "full_name": "owner/demo-repository",
            "default_branch": "main"
        },
        "commits": {"count": 4, "evidence": []},
        "pull_requests": {"count": 1, "evidence": []},
        "contributors": {
            "count": 1,
            "evidence": [{"login": "alice", "contributions": 4}]
        },
        "structure": {"total_files": 2},
        "readme": {"exists": True}
    }

    with patch("main.analyzer.analyze_repository", return_value=mock_analysis):
        response = client.get("/evaluate?owner=owner&repo=demo-repository", headers=AUTH_HEADERS)

        assert response.status_code == 200
        data = response.json()

        # Exact legacy fields required
        assert data["project_name"] == "demo-repository"
        assert data["repository"] == "owner/demo-repository"
        assert data["default_branch"] == "main"
        assert data["commit_count"] == 4
        assert data["pull_request_count"] == 1
        assert data["contributor_count"] == 1
        assert data["contributors"] == ["alice"]
        assert "analysis" in data
        assert data["analysis"]["commits"]["count"] == 4


def test_get_evaluate_missing_params_and_validation():
    r1 = client.get("/evaluate?owner=&repo=", headers=AUTH_HEADERS)
    assert r1.status_code == 400
    err = r1.json()
    assert err["error"] == "BadRequest"
    assert "timestamp" in err


def test_get_evaluate_github_404():
    mock_resp = MagicMock()
    mock_resp.status_code = 404
    exc = requests.exceptions.HTTPError(response=mock_resp)

    with patch("main.analyzer.analyze_repository", side_effect=exc):
        response = client.get("/evaluate?owner=nonexistent&repo=repo", headers=AUTH_HEADERS)
        assert response.status_code == 404
        err = response.json()
        assert err["error"] == "NotFound"
        assert "not found" in err["message"].lower()


def test_post_evaluate_validation():
    # Empty payload fields
    resp = client.post("/evaluate", json={"owner": "", "repo": ""}, headers=AUTH_HEADERS)
    assert resp.status_code == 400
    assert resp.json()["error"] == "BadRequest"


def test_post_evaluate_success_flow():
    mock_analysis = {
        "repository": {"name": "demo", "full_name": "owner/demo"},
        "commits": {"count": 3, "evidence": []},
        "pull_requests": {"count": 0, "evidence": []},
        "contributors": {"evidence": [{"login": "alice", "contributions": 3}]},
        "evidence_manifest": {"total_files_discovered": 5, "files_inspected": ["main.py"]}
    }

    mock_eval_result = {
        "status": "SUCCESS",
        "evaluated_at": "2026-09-30T12:00:00Z",
        "model": "gemini-3.8-flash",
        "total_score": 85.0,
        "dimension_scores": [
            {
                "dimension": "Technical Quality",
                "raw_score": 4.5,
                "weight": 0.20,
                "dimension_score": 90.0,
                "weighted_score": 18.0,
                "rationale": "Strong typing"
            }
        ],
        "feedback_summary": "High quality submission",
        "strengths": ["Clean structure"],
        "weaknesses": [],
        "recommendations": [],
        "suspicious_flags": [],
        "requirements_evaluation": [
            {
                "requirement": "Auth",
                "status": "MET",
                "evidence": "main.py",
                "justification": "JWT found"
            }
        ],
        "contributions": [
            {
                "github_username": "alice",
                "estimated_percentage": 100.0,
                "evidence": ["3 commits"],
                "confidence": "HIGH",
                "limitations": [],
                "disclaimer": "AI-assisted estimated contribution is an algorithmic heuristic..."
            }
        ],
        "evidence_manifest": {"files_inspected": ["main.py"]},
        "repository": {"name": "demo"}
    }

    with patch("main.analyzer.analyze_repository", return_value=mock_analysis), \
         patch("main.evaluator.evaluate_repository", return_value=mock_eval_result):
        payload = {
            "owner": "owner",
            "repo": "demo",
            "challenge_title": "Leaderboard API",
            "requirements": ["Auth"]
        }
        response = client.post("/evaluate", json=payload, headers=AUTH_HEADERS)
        assert response.status_code == 200
        data = response.json()

        assert data["status"] == "SUCCESS"
        assert data["total_score"] == 85.0
        assert data["model"] == "gemini-3.8-flash"
        assert data["requirements_evaluation"][0]["status"] == "MET"
        assert data["contributions"][0]["estimated_percentage"] == 100.0


def test_post_evaluate_missing_service_key_when_configured(monkeypatch):
    monkeypatch.setenv("AI_SERVICE_KEY", "test_internal_key_abc")
    response = client.post("/evaluate", json={"owner": "owner", "repo": "demo"})
    assert response.status_code == 401
    err = response.json()
    assert err["error"] == "Unauthorized"
    assert err["message"] == "Invalid or missing service key."
    assert "timestamp" in err


def test_post_evaluate_wrong_service_key(monkeypatch):
    monkeypatch.setenv("AI_SERVICE_KEY", "test_internal_key_abc")
    headers = {"Authorization": "Bearer wrong_invalid_key"}
    response = client.post("/evaluate", json={"owner": "owner", "repo": "demo"}, headers=headers)
    assert response.status_code == 401
    err = response.json()
    assert err["error"] == "Unauthorized"
    assert err["message"] == "Invalid or missing service key."


def test_post_evaluate_correct_service_key(monkeypatch):
    monkeypatch.setenv("AI_SERVICE_KEY", "test_internal_key_abc")
    mock_analysis = {
        "repository": {"name": "demo", "full_name": "owner/demo"},
        "commits": {"count": 1, "evidence": []},
        "pull_requests": {"count": 0, "evidence": []},
        "contributors": {"evidence": []},
        "evidence_manifest": {"files_inspected": []}
    }
    mock_eval = {
        "status": "SUCCESS",
        "total_score": 90.0,
        "model": "gemini-3.8-flash"
    }
    headers = {"Authorization": "Bearer test_internal_key_abc"}
    with patch("main.analyzer.analyze_repository", return_value=mock_analysis), \
         patch("main.evaluator.evaluate_repository", return_value=mock_eval):
        response = client.post(
            "/evaluate",
            json={"owner": "owner", "repo": "demo"},
            headers=headers
        )
        assert response.status_code == 200
        assert response.json()["status"] == "SUCCESS"


def test_health_endpoint_without_key_when_configured(monkeypatch):
    monkeypatch.setenv("AI_SERVICE_KEY", "test_internal_key_abc")
    r1 = client.get("/")
    assert r1.status_code == 200
    assert r1.json() == {"status": "healthy"}

    r2 = client.get("/health")
    assert r2.status_code == 200
    assert r2.json() == {"status": "healthy"}


def test_get_evaluate_protected_when_key_configured(monkeypatch):
    monkeypatch.setenv("AI_SERVICE_KEY", "test_internal_key_abc")

    # 1. Missing header -> 401
    r_missing = client.get("/evaluate?owner=owner&repo=demo")
    assert r_missing.status_code == 401
    assert r_missing.json()["error"] == "Unauthorized"
    assert r_missing.json()["message"] == "Invalid or missing service key."

    # 2. Wrong header -> 401
    r_wrong = client.get("/evaluate?owner=owner&repo=demo", headers={"Authorization": "Bearer wrong"})
    assert r_wrong.status_code == 401
    assert r_wrong.json()["error"] == "Unauthorized"

    # 3. Correct header -> 200
    mock_analysis = {
        "repository": {
            "name": "demo",
            "full_name": "owner/demo",
            "default_branch": "main"
        },
        "commits": {"count": 2, "evidence": []},
        "pull_requests": {"count": 0, "evidence": []},
        "contributors": {"count": 1, "evidence": [{"login": "alice"}]},
        "structure": {"total_files": 1},
        "readme": {"exists": True}
    }
    with patch("main.analyzer.analyze_repository", return_value=mock_analysis):
        r_ok = client.get(
            "/evaluate?owner=owner&repo=demo",
            headers={"Authorization": "Bearer test_internal_key_abc"}
        )
        assert r_ok.status_code == 200
        assert r_ok.json()["project_name"] == "demo"

