import json
from unittest.mock import MagicMock, patch

from evaluator import (
    CodeEvaluator,
    estimate_contributions,
    CONTRIBUTION_DISCLAIMER
)


def test_estimate_contributions_multi_author():
    contributors = [
        {"login": "alice", "contributions": 15},
        {"login": "bob", "contributions": 5}
    ]
    commits = [
        {"sha": "c1", "author": {"name": "Alice"}},
        {"sha": "c2", "author": {"name": "Alice"}},
        {"sha": "c3", "author": {"name": "Bob"}},
        {"sha": "c4", "author": {"name": "Alice"}},
        {"sha": "c5", "author": {"name": "Alice"}}
    ]
    attributions = {
        "alice": {"additions": 400, "deletions": 50, "files_touched": ["src/app.py", "src/auth.py"]},
        "bob": {"additions": 100, "deletions": 10, "files_touched": ["README.md"]}
    }
    prs = [
        {"author": "alice"},
        {"author": "alice"}
    ]

    results = estimate_contributions(contributors, commits, attributions, prs)

    assert len(results) == 2
    total_pct = sum(r["estimated_percentage"] for r in results)
    assert round(total_pct, 1) == 100.0

    alice_res = next(r for r in results if r["github_username"] == "alice")
    bob_res = next(r for r in results if r["github_username"] == "bob")

    # Alice has more commits, PRs, and lines, so her estimated percentage must be higher
    assert alice_res["estimated_percentage"] > bob_res["estimated_percentage"]
    assert alice_res["confidence"] == "HIGH"
    assert alice_res["disclaimer"] == CONTRIBUTION_DISCLAIMER
    assert len(alice_res["limitations"]) > 0


def test_evaluator_degraded_mode_when_unconfigured():
    evaluator = CodeEvaluator()
    evaluator.client = None
    evaluator.api_key = None

    analysis = {
        "repository": {"name": "demo", "full_name": "owner/demo"},
        "contributors": {"evidence": [{"login": "alice", "contributions": 10}]},
        "commits": {"evidence": []},
        "pull_requests": {"evidence": []},
        "evidence_manifest": {"total_files_discovered": 5}
    }

    result = evaluator.evaluate_repository(analysis)

    assert result["status"] == "EVALUATION_DEGRADED"
    # Dimension scores and total score MUST be None/null
    assert result["total_score"] is None
    assert result["dimension_scores"] is None
    assert result["requirements_evaluation"] is None
    assert result["feedback_summary"] is None
    assert "not configured" in result["degraded_reason"]
    # Preserves contributions and manifest
    assert len(result["contributions"]) == 1
    assert result["contributions"][0]["github_username"] == "alice"


def test_parse_and_validate_markdown_stripping():
    evaluator = CodeEvaluator()
    valid_obj = {
        "technical_quality": {"raw_score": 4.5, "rationale": "Clean code"},
        "architecture_engineering": {"raw_score": 4.0, "rationale": "Modular"},
        "functionality_completeness": {"raw_score": 3.5, "rationale": "Most features done"},
        "innovation_problem_solving": {"raw_score": 3.0, "rationale": "Standard approach"},
        "feasibility_scalability": {"raw_score": 4.0, "rationale": "Stateless"},
        "documentation_engineering_process": {"raw_score": 5.0, "rationale": "Great README"},
        "feedback_summary": "Solid repository with clean architecture.",
        "strengths": ["Good tests"],
        "weaknesses": ["Needs caching"],
        "recommendations": ["Add Redis"],
        "suspicious_flags": [],
        "requirements_evaluation": [
            {
                "requirement": "Auth",
                "status": "MET",
                "evidence": "src/auth.py",
                "justification": "JWT implemented"
            }
        ]
    }
    wrapped_json = f"```json\n{json.dumps(valid_obj)}\n```"

    parsed = evaluator._parse_and_validate(wrapped_json)
    assert parsed is not None
    assert parsed.technical_quality.raw_score == 4.5
    assert parsed.requirements_evaluation[0].status == "MET"


def test_parse_and_validate_handles_invalid_json_and_validation_error():
    evaluator = CodeEvaluator()

    # 1. Malformed JSON should return None instead of raising JSONDecodeError
    malformed_json = '{"technical_quality": {"raw_score": 4.5, "rationale": "incomplete json'
    assert evaluator._parse_and_validate(malformed_json) is None

    # 2. Schema validation error (e.g. missing required fields) should return None instead of raising ValidationError
    schema_invalid_json = '{"technical_quality": {"raw_score": 4.5}}'
    assert evaluator._parse_and_validate(schema_invalid_json) is None

    # 3. Empty string should return None
    assert evaluator._parse_and_validate("") is None


def test_evaluate_repository_repair_loop_recovery():
    """
    Verifies that when initial output is malformed JSON, the one-turn repair loop
    is triggered and successfully produces a valid evaluation result.
    """
    evaluator = CodeEvaluator()
    evaluator.api_key = "test_fake_api_key"
    mock_client = MagicMock()
    evaluator.client = mock_client

    valid_payload = {
        "technical_quality": {"raw_score": 4.0, "rationale": "Clean code"},
        "architecture_engineering": {"raw_score": 4.0, "rationale": "Modular"},
        "functionality_completeness": {"raw_score": 4.0, "rationale": "Complete"},
        "innovation_problem_solving": {"raw_score": 3.0, "rationale": "Good"},
        "feasibility_scalability": {"raw_score": 4.0, "rationale": "Scalable"},
        "documentation_engineering_process": {"raw_score": 4.0, "rationale": "Documented"},
        "feedback_summary": "Solid build.",
        "strengths": ["Clean"],
        "weaknesses": [],
        "recommendations": [],
        "suspicious_flags": [],
        "requirements_evaluation": []
    }

    # First attempt: malformed JSON; Second attempt (repair): valid JSON
    resp_malformed = MagicMock(text="```json\n{malformed json}\n```")
    resp_repaired = MagicMock(text=json.dumps(valid_payload))
    mock_client.models.generate_content.side_effect = [resp_malformed, resp_repaired]

    analysis = {
        "repository": {"name": "test-repo"},
        "contributors": {"evidence": []},
        "commits": {"evidence": []},
        "pull_requests": {"evidence": []},
        "evidence_manifest": {}
    }

    result = evaluator.evaluate_repository(analysis)
    assert result["status"] == "SUCCESS"
    assert result["total_score"] is not None
    assert mock_client.models.generate_content.call_count == 2


def test_evaluate_repository_repair_loop_unrepairable():
    """
    Verifies that when both initial and repair attempts are malformed,
    the service gracefully degrades with the unrepairable reason.
    """
    evaluator = CodeEvaluator()
    evaluator.api_key = "test_fake_api_key"
    mock_client = MagicMock()
    evaluator.client = mock_client

    resp_malformed = MagicMock(text="{bad json")
    mock_client.models.generate_content.return_value = resp_malformed

    analysis = {
        "repository": {"name": "test-repo"},
        "contributors": {"evidence": []},
        "commits": {"evidence": []},
        "pull_requests": {"evidence": []},
        "evidence_manifest": {}
    }

    result = evaluator.evaluate_repository(analysis)
    assert result["status"] == "EVALUATION_DEGRADED"
    assert "Unrepairable invalid JSON structure" in result["degraded_reason"]
    assert mock_client.models.generate_content.call_count == 2


def test_evaluate_repository_success_with_mocked_gemini():
    """
    Verifies the end-to-end SUCCESS path of CodeEvaluator.evaluate_repository().
    Ensures that Python deterministically computes weighted scores from AI raw scores,
    and preserves evidence manifest, contributions, and requirement verdicts.
    """
    evaluator = CodeEvaluator()
    evaluator.api_key = "test_fake_api_key"
    mock_client = MagicMock()
    evaluator.client = mock_client

    ai_response_payload = {
        "technical_quality": {"raw_score": 4.5, "rationale": "Strong typing and defensive error handling."},
        "architecture_engineering": {"raw_score": 4.0, "rationale": "Clear separation of routes and business logic."},
        "functionality_completeness": {"raw_score": 4.0, "rationale": "All core challenge requirements MET."},
        "innovation_problem_solving": {"raw_score": 3.5, "rationale": "Competent custom caching and indexing."},
        "feasibility_scalability": {"raw_score": 4.0, "rationale": "Stateless design with connection pooling."},
        "documentation_engineering_process": {"raw_score": 4.5, "rationale": "Thorough README and conventional commit history."},
        "feedback_summary": "High quality implementation meeting core challenge criteria.",
        "strengths": ["Clean modular code", "Comprehensive unit tests"],
        "weaknesses": ["Could add more edge-case tests"],
        "recommendations": ["Implement automated CI linting"],
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
                "status": "MET",
                "evidence": "src/cache/redis.py",
                "justification": "Redis client initialized and used in leaderboard route."
            }
        ]
    }

    mock_response = MagicMock()
    mock_response.text = json.dumps(ai_response_payload)
    mock_client.models.generate_content.return_value = mock_response

    analysis = {
        "repository": {
            "name": "leaderboard-api",
            "full_name": "klyro-team/leaderboard-api",
            "default_branch": "main",
            "language": "Python"
        },
        "structure": {
            "total_files": 12,
            "tree_truncated": False
        },
        "readme": {
            "exists": True,
            "size": 1500,
            "content": "# Leaderboard API\nSetup instructions and API details."
        },
        "commits": {
            "count": 6,
            "verified_count": 5,
            "evidence": [
                {"sha": "c1", "message": "feat: add JWT auth", "author": "Alice", "date": "2026-09-30T10:00:00Z", "verified": True},
                {"sha": "c2", "message": "feat: add redis cache", "author": "Alice", "date": "2026-09-30T11:00:00Z", "verified": True}
            ]
        },
        "pull_requests": {
            "count": 1,
            "open_count": 0,
            "closed_count": 1,
            "merged_count": 1,
            "evidence": [
                {"number": 1, "title": "Implement caching", "state": "closed", "merged": True, "author": "alice"}
            ]
        },
        "contributors": {
            "count": 1,
            "evidence": [{"login": "alice", "contributions": 6}]
        },
        "source_files": [
            {"path": "src/auth/jwt.py", "content": "import jwt\n# token logic", "size": 120, "truncated": False},
            {"path": "src/cache/redis.py", "content": "import redis\n# cache logic", "size": 95, "truncated": False}
        ],
        "evidence_manifest": {
            "total_files_discovered": 12,
            "files_inspected": ["src/auth/jwt.py", "src/cache/redis.py"],
            "files_omitted_count": 10,
            "tree_truncated": False,
            "budget_exhausted": False,
            "omission_notes": "Inspected 2 prioritized files."
        },
        "commit_attributions": {
            "alice": {"commits_sampled": 2, "additions": 215, "deletions": 10, "files_touched": ["src/auth/jwt.py", "src/cache/redis.py"]}
        }
    }

    challenge = {
        "challenge_id": "c11a8123-e29b-41d4-a716-446655440001",
        "challenge_title": "Real-time Leaderboard API",
        "requirements": [
            "JWT Authentication with role-based access",
            "Redis caching for leaderboard query"
        ]
    }

    # Execute the real evaluate_repository method with stubbed Gemini
    result = evaluator.evaluate_repository(analysis, challenge)

    # 1. Verify top-level status and model
    assert result["status"] == "SUCCESS"
    assert result["model"] == evaluator.model_name
    assert "evaluated_at" in result

    # 2. Verify deterministic Python calculation of total_score
    # Expected: (4.5/5*100)*0.20 + (4.0/5*100)*0.15 + (4.0/5*100)*0.20 + (3.5/5*100)*0.15 + (4.0/5*100)*0.15 + (4.5/5*100)*0.15
    # = 18.0 + 12.0 + 16.0 + 10.5 + 12.0 + 13.5 = 82.0
    expected_total = 82.0
    assert result["total_score"] == expected_total

    # 3. Verify exactly 6 dimension scores
    assert len(result["dimension_scores"]) == 6
    dim_map = {d["dimension"]: d for d in result["dimension_scores"]}

    assert dim_map["Technical Quality"]["raw_score"] == 4.5
    assert dim_map["Technical Quality"]["weight"] == 0.20
    assert dim_map["Technical Quality"]["dimension_score"] == 90.0
    assert dim_map["Technical Quality"]["weighted_score"] == 18.0
    assert dim_map["Technical Quality"]["rationale"] == "Strong typing and defensive error handling."

    assert dim_map["Architecture & Engineering"]["raw_score"] == 4.0
    assert dim_map["Architecture & Engineering"]["weight"] == 0.15
    assert dim_map["Architecture & Engineering"]["dimension_score"] == 80.0
    assert dim_map["Architecture & Engineering"]["weighted_score"] == 12.0

    assert dim_map["Functionality & Completeness"]["raw_score"] == 4.0
    assert dim_map["Functionality & Completeness"]["weight"] == 0.20
    assert dim_map["Functionality & Completeness"]["dimension_score"] == 80.0
    assert dim_map["Functionality & Completeness"]["weighted_score"] == 16.0

    assert dim_map["Innovation & Problem Solving"]["raw_score"] == 3.5
    assert dim_map["Innovation & Problem Solving"]["weight"] == 0.15
    assert dim_map["Innovation & Problem Solving"]["dimension_score"] == 70.0
    assert dim_map["Innovation & Problem Solving"]["weighted_score"] == 10.5

    assert dim_map["Feasibility & Scalability"]["raw_score"] == 4.0
    assert dim_map["Feasibility & Scalability"]["weight"] == 0.15
    assert dim_map["Feasibility & Scalability"]["dimension_score"] == 80.0
    assert dim_map["Feasibility & Scalability"]["weighted_score"] == 12.0

    assert dim_map["Documentation & Engineering Process"]["raw_score"] == 4.5
    assert dim_map["Documentation & Engineering Process"]["weight"] == 0.15
    assert dim_map["Documentation & Engineering Process"]["dimension_score"] == 90.0
    assert dim_map["Documentation & Engineering Process"]["weighted_score"] == 13.5

    # 4. Verify feedback and requirements evaluation
    assert result["feedback_summary"] == "High quality implementation meeting core challenge criteria."
    assert len(result["strengths"]) == 2
    assert len(result["requirements_evaluation"]) == 2
    assert result["requirements_evaluation"][0]["requirement"] == "JWT Authentication with role-based access"
    assert result["requirements_evaluation"][0]["status"] == "MET"
    assert result["requirements_evaluation"][0]["evidence"] == "src/auth/jwt.py"
    assert result["requirements_evaluation"][1]["requirement"] == "Redis caching for leaderboard query"
    assert result["requirements_evaluation"][1]["status"] == "MET"

    # 5. Verify preserved repository and evidence manifest
    assert result["repository"]["full_name"] == "klyro-team/leaderboard-api"
    assert result["evidence_manifest"]["total_files_discovered"] == 12
    assert len(result["evidence_manifest"]["files_inspected"]) == 2

    # 6. Verify heuristic contribution was computed
    assert len(result["contributions"]) == 1
    assert result["contributions"][0]["github_username"] == "alice"
    assert result["contributions"][0]["estimated_percentage"] == 100.0


def test_generate_with_retry_recovers_from_transient_503():
    """
    Verifies that _generate_with_retry recognizes transient 503/server errors,
    applies exponential backoff sleep, and succeeds on the second attempt.
    """
    evaluator = CodeEvaluator()
    evaluator.api_key = "test_fake_api_key"
    mock_client = MagicMock()
    evaluator.client = mock_client

    transient_exc = Exception("503 Service Unavailable: The model is overloaded.")
    transient_exc.status_code = 503

    success_response = MagicMock()
    success_response.text = '{"status": "ok", "message": "recovered"}'

    # First call fails with 503, second call succeeds
    mock_client.models.generate_content.side_effect = [
        transient_exc,
        success_response
    ]

    with patch("evaluator.time.sleep") as mock_sleep:
        result_text = evaluator._generate_with_retry(
            prompt="Analyze this code",
            temperature=0.2,
            max_retries=3,
            base_delay=1.0
        )

        # 1. Verify Gemini was called exactly twice (1 failure + 1 retry)
        assert mock_client.models.generate_content.call_count == 2

        # 2. Verify sleep was invoked once with base_delay (1.0 * 2^0 = 1.0)
        assert mock_sleep.call_count == 1
        mock_sleep.assert_called_once_with(1.0)

        # 3. Verify the successful response text is returned
        assert result_text == '{"status": "ok", "message": "recovered"}'


def test_build_prompt_contains_all_evidence_and_rules():
    """
    Verifies that CodeEvaluator.build_prompt() faithfully formats and includes:
    1. Repository name/full_name
    2. Challenge title
    3. Each challenge requirement
    4. README content
    5. Commit information
    6. Pull-request information
    7. Contributor information
    8. Selected source-code evidence
    9. Evidence manifest / submission context
    10. Evaluation rules (MET, PARTIAL, MISSING, NOT_VERIFIABLE)
    11. The six evaluation dimensions with scoring anchors
    """
    evaluator = CodeEvaluator()

    analysis = {
        "repository": {
            "name": "distinctive-repo-slug",
            "full_name": "unique-org/distinctive-repo-slug",
            "default_branch": "main-distinct",
            "language": "Python"
        },
        "structure": {
            "total_files": 99,
            "tree_truncated": False
        },
        "readme": {
            "exists": True,
            "size": 2400,
            "content": "# Special Project AlphaBeta\nDistinctive installation instruction with custom flag --enable-telemetry."
        },
        "commits": {
            "count": 14,
            "verified_count": 12,
            "evidence": [
                {
                    "sha": "distinctive_commit_sha_12345",
                    "message": "feat: add custom signature verification engine",
                    "author": "DistinctiveDev",
                    "date": "2026-09-30T10:00:00Z",
                    "verified": True
                }
            ]
        },
        "pull_requests": {
            "count": 3,
            "open_count": 0,
            "closed_count": 3,
            "merged_count": 2,
            "evidence": [
                {
                    "number": 42,
                    "title": "Implement distributed lock PR",
                    "state": "closed",
                    "merged": True,
                    "author": "DistinctiveContributor"
                }
            ]
        },
        "contributors": {
            "count": 2,
            "evidence": [
                {"login": "distinctive_lead_developer", "contributions": 14}
            ]
        },
        "source_files": [
            {
                "path": "src/core/distinctive_crypto.py",
                "content": "def verify_hmac_custom_signature():\n    return 'distinctive_signature_valid'",
                "size": 75,
                "truncated": False
            }
        ],
        "evidence_manifest": {
            "total_files_discovered": 99,
            "files_inspected": ["src/core/distinctive_crypto.py"],
            "files_omitted_count": 98,
            "tree_truncated": False,
            "budget_exhausted": False,
            "omission_notes": "Inspected 1 prioritized file."
        }
    }

    challenge = {
        "challenge_id": "c99a8123-e29b-41d4-a716-446655440099",
        "challenge_title": "Realtime Distributed Leaderboard Battle",
        "requirements": [
            "Requirement Alpha: Implement HMAC-SHA256 signature verification",
            "Requirement Beta: Integrate Redis zset leaderboard sorting"
        ]
    }

    prompt = evaluator.build_prompt(analysis, challenge)

    # 1. Repository name/full_name
    assert "unique-org/distinctive-repo-slug" in prompt
    assert "main-distinct" in prompt

    # 2. Challenge title
    assert "Realtime Distributed Leaderboard Battle" in prompt

    # 3. Each challenge requirement
    assert "Requirement Alpha: Implement HMAC-SHA256 signature verification" in prompt
    assert "Requirement Beta: Integrate Redis zset leaderboard sorting" in prompt

    # 4. README content
    assert "Special Project AlphaBeta" in prompt
    assert "--enable-telemetry" in prompt

    # 5. Commit information
    assert "distinctive_commit_sha_12345" in prompt
    assert "feat: add custom signature verification engine" in prompt
    assert "DistinctiveDev" in prompt

    # 6. Pull-request information
    assert "Implement distributed lock PR" in prompt
    assert "DistinctiveContributor" in prompt

    # 7. Contributor information
    assert "distinctive_lead_developer" in prompt

    # 8. Selected source-code evidence
    assert "src/core/distinctive_crypto.py" in prompt
    assert "def verify_hmac_custom_signature():" in prompt
    assert "'distinctive_signature_valid'" in prompt

    # 9. Evidence manifest / submission context information
    assert "Total Discovered Files: 99" in prompt
    assert "Budget Exhausted: False" in prompt

    # 10. Evaluation rules/status meanings, including NOT_VERIFIABLE
    assert '"MET"' in prompt
    assert '"PARTIAL"' in prompt
    assert '"MISSING"' in prompt
    assert '"NOT_VERIFIABLE"' in prompt
    assert "Do NOT treat NOT_VERIFIABLE as a failure" in prompt

    # 11. The six evaluation dimensions
    assert "Technical Quality (0-5)" in prompt
    assert "Architecture & Engineering (0-5)" in prompt
    assert "Functionality & Completeness (0-5)" in prompt
    assert "Innovation & Problem Solving (0-5)" in prompt
    assert "Feasibility & Scalability (0-5)" in prompt
    assert "Documentation & Engineering Process (0-5)" in prompt


SAMPLE_VALID_PAYLOAD = json.dumps({
    "technical_quality": {"raw_score": 4.0, "rationale": "Solid code"},
    "architecture_engineering": {"raw_score": 4.0, "rationale": "Clean modularity"},
    "functionality_completeness": {"raw_score": 4.0, "rationale": "All features met"},
    "innovation_problem_solving": {"raw_score": 3.0, "rationale": "Good logic"},
    "feasibility_scalability": {"raw_score": 3.0, "rationale": "Scalable"},
    "documentation_engineering_process": {"raw_score": 4.0, "rationale": "Clear docs"},
    "requirements_evaluation": [
        {"requirement": "POST /cart", "status": "MET", "evidence": "route in app", "justification": "implemented"}
    ],
    "feedback_summary": "Great submission",
    "strengths": ["Clean structure"],
    "weaknesses": ["Minor edge cases"],
    "recommendations": ["Add more tests"],
    "suspicious_flags": []
})

SAMPLE_ANALYSIS = {
    "repository": {"name": "test-repo", "full_name": "owner/test-repo"},
    "contributors": {"evidence": []},
    "commits": {"evidence": []},
    "pull_requests": {"evidence": []},
    "evidence_manifest": {"total_files_discovered": 1}
}


def test_evaluator_primary_model_success():
    evaluator = CodeEvaluator(model_name="gemini-3.1-flash-lite", fallback_model_name="gemini-3-flash-preview")
    evaluator.client = MagicMock()
    evaluator.api_key = "dummy-key"

    mock_resp = MagicMock()
    mock_resp.text = SAMPLE_VALID_PAYLOAD
    evaluator.client.models.generate_content.return_value = mock_resp

    res = evaluator.evaluate_repository(SAMPLE_ANALYSIS, {"requirements": ["POST /cart"]})

    assert res["status"] == "SUCCESS"
    assert res["model"] == "gemini-3.1-flash-lite"
    assert res["total_score"] is not None
    assert len(res["dimension_scores"]) == 6
    evaluator.client.models.generate_content.assert_called_once()


def test_evaluator_fallback_model_success_on_primary_503():
    evaluator = CodeEvaluator(model_name="gemini-3.1-flash-lite", fallback_model_name="gemini-3-flash-preview")
    evaluator.client = MagicMock()
    evaluator.api_key = "dummy-key"

    err_503 = Exception("503 ServerError UNAVAILABLE: High demand spike")
    mock_resp_fallback = MagicMock()
    mock_resp_fallback.text = SAMPLE_VALID_PAYLOAD

    evaluator.client.models.generate_content.side_effect = [err_503, err_503, mock_resp_fallback]

    res = evaluator.evaluate_repository(SAMPLE_ANALYSIS, {"requirements": ["POST /cart"]})

    assert res["status"] == "SUCCESS"
    assert res["model"] == "gemini-3-flash-preview"
    assert res["total_score"] is not None
    assert len(res["dimension_scores"]) == 6


def test_evaluator_both_models_fail_returns_degraded():
    evaluator = CodeEvaluator(model_name="gemini-3.1-flash-lite", fallback_model_name="gemini-3-flash-preview")
    evaluator.client = MagicMock()
    evaluator.api_key = "dummy-key"

    err_503 = Exception("503 ServerError UNAVAILABLE: Persistent outage")
    evaluator.client.models.generate_content.side_effect = err_503

    res = evaluator.evaluate_repository(SAMPLE_ANALYSIS, {"requirements": ["POST /cart"]})

    assert res["status"] == "EVALUATION_DEGRADED"
    assert res["total_score"] is None
    assert res["dimension_scores"] is None
    assert "primary failure" in res["degraded_reason"]
    assert "fallback failure" in res["degraded_reason"]


def test_evaluator_malformed_output_returns_degraded():
    evaluator = CodeEvaluator(model_name="gemini-3.1-flash-lite", fallback_model_name="gemini-3-flash-preview")
    evaluator.client = MagicMock()
    evaluator.api_key = "dummy-key"

    mock_resp_bad = MagicMock()
    mock_resp_bad.text = "This is not valid JSON at all."
    evaluator.client.models.generate_content.return_value = mock_resp_bad

    res = evaluator.evaluate_repository(SAMPLE_ANALYSIS, {"requirements": ["POST /cart"]})

    assert res["status"] == "EVALUATION_DEGRADED"
    assert res["total_score"] is None
    assert res["dimension_scores"] is None
    assert "invalid JSON" in res["degraded_reason"].lower() or "repair" in res["degraded_reason"].lower()


def test_evaluator_timeout_in_milliseconds():
    evaluator = CodeEvaluator()
    evaluator.client = MagicMock()
    evaluator.api_key = "dummy-key"

    mock_resp = MagicMock()
    mock_resp.text = SAMPLE_VALID_PAYLOAD
    evaluator.client.models.generate_content.return_value = mock_resp

    # If timeout passed as 60 (seconds), it should be normalized to 60000 ms in HttpOptions
    evaluator._generate_with_retry("test prompt", timeout=60)
    call_args = evaluator.client.models.generate_content.call_args
    assert call_args is not None
    config_used = call_args.kwargs.get("config")
    assert config_used is not None
    assert config_used.http_options.timeout == 60000

    # If timeout passed as 60000 (ms), it should remain 60000 ms
    evaluator._generate_with_retry("test prompt", timeout=60000)
    call_args2 = evaluator.client.models.generate_content.call_args
    assert call_args2.kwargs["config"].http_options.timeout == 60000




