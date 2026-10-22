import pytest
from evaluator import RequirementVerdict, GeminiEvaluationPayload, RawDimensionScore


def test_requirement_verdict_valid_statuses():
    for status in ["MET", "PARTIAL", "MISSING", "NOT_VERIFIABLE"]:
        v = RequirementVerdict(
            requirement="Test Requirement",
            status=status,
            evidence="Observed evidence string",
            justification="Detailed justification text"
        )
        assert v.status == status


def test_not_verifiable_requirement_preserves_evidence_notes():
    v = RequirementVerdict(
        requirement="Redis Caching",
        status="NOT_VERIFIABLE",
        evidence="Redis omitted due to 80 KB budget cap",
        justification="File services/cache.py was not selected in inspected tier."
    )
    assert v.status == "NOT_VERIFIABLE"
    assert "budget cap" in v.evidence
