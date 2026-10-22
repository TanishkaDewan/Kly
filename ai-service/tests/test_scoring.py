import math
import pytest
from evaluator import DIMENSIONS, CodeEvaluator, calculate_scores


def test_dimension_weights_sum_to_one():
    total_weight = sum(d["weight"] for d in DIMENSIONS)
    assert round(total_weight, 4) == 1.0
    assert len(DIMENSIONS) == 6

    weights_by_name = {d["name"]: d["weight"] for d in DIMENSIONS}
    assert weights_by_name["Technical Quality"] == 0.20
    assert weights_by_name["Architecture & Engineering"] == 0.15
    assert weights_by_name["Functionality & Completeness"] == 0.20
    assert weights_by_name["Innovation & Problem Solving"] == 0.15
    assert weights_by_name["Feasibility & Scalability"] == 0.15
    assert weights_by_name["Documentation & Engineering Process"] == 0.15


def test_calculate_scores_all_perfect():
    """Six perfect ratings of 5 produce 100.0."""
    raw_scores = {d["key"]: 5.0 for d in DIMENSIONS}
    total_score, dimension_results = calculate_scores(raw_scores)

    assert total_score == 100.0
    assert len(dimension_results) == 6
    for dim in dimension_results:
        assert dim["raw_score"] == 5.0
        assert dim["dimension_score"] == 100.0
        assert dim["weighted_score"] == round(100.0 * dim["weight"], 2)


def test_calculate_scores_all_zero():
    """Six zero ratings produce 0.0."""
    raw_scores = {d["key"]: 0.0 for d in DIMENSIONS}
    total_score, dimension_results = calculate_scores(raw_scores)

    assert total_score == 0.0
    assert len(dimension_results) == 6
    for dim in dimension_results:
        assert dim["raw_score"] == 0.0
        assert dim["dimension_score"] == 0.0
        assert dim["weighted_score"] == 0.0


def test_calculate_scores_three_fifths_weighting():
    """
    A rating of 3/5 contributes 60% of that dimension's weight.
    For weight 0.20: scaled = 60.0, weighted = 12.0.
    For weight 0.15: scaled = 60.0, weighted = 9.0.
    All six ratings at 3/5 sum to exactly 60.0.
    """
    raw_scores = {d["key"]: 3.0 for d in DIMENSIONS}
    total_score, dimension_results = calculate_scores(raw_scores)

    assert total_score == 60.0
    dim_map = {d["dimension"]: d for d in dimension_results}

    # Technical Quality (weight 0.20)
    assert dim_map["Technical Quality"]["dimension_score"] == 60.0
    assert dim_map["Technical Quality"]["weighted_score"] == 12.0

    # Architecture & Engineering (weight 0.15)
    assert dim_map["Architecture & Engineering"]["dimension_score"] == 60.0
    assert dim_map["Architecture & Engineering"]["weighted_score"] == 9.0

    # Functionality & Completeness (weight 0.20)
    assert dim_map["Functionality & Completeness"]["dimension_score"] == 60.0
    assert dim_map["Functionality & Completeness"]["weighted_score"] == 12.0

    # Innovation & Problem Solving (weight 0.15)
    assert dim_map["Innovation & Problem Solving"]["dimension_score"] == 60.0
    assert dim_map["Innovation & Problem Solving"]["weighted_score"] == 9.0

    # Feasibility & Scalability (weight 0.15)
    assert dim_map["Feasibility & Scalability"]["dimension_score"] == 60.0
    assert dim_map["Feasibility & Scalability"]["weighted_score"] == 9.0

    # Documentation & Engineering Process (weight 0.15)
    assert dim_map["Documentation & Engineering Process"]["dimension_score"] == 60.0
    assert dim_map["Documentation & Engineering Process"]["weighted_score"] == 9.0


def test_calculate_scores_missing_dimensions():
    """Missing any required dimension must raise ValueError and not default to zero."""
    full_scores = {d["key"]: 4.0 for d in DIMENSIONS}

    # Missing single dimension
    for key in [d["key"] for d in DIMENSIONS]:
        incomplete = {k: v for k, v in full_scores.items() if k != key}
        with pytest.raises(ValueError, match=f"Missing required dimension: '{key}'"):
            calculate_scores(incomplete)

    # Empty dictionary
    with pytest.raises(ValueError, match="Missing required dimension"):
        calculate_scores({})

    # Non-dictionary input
    with pytest.raises(ValueError, match="raw_dimension_scores must be a dict"):
        calculate_scores(["not", "a", "dict"])


def test_calculate_scores_nan_and_infinities():
    """NaN, +Inf, -Inf must be rejected with ValueError."""
    for invalid_val in [float("nan"), float("inf"), float("-inf")]:
        scores = {d["key"]: 3.0 for d in DIMENSIONS}
        scores["technical_quality"] = invalid_val
        with pytest.raises(ValueError, match="must be a finite number"):
            calculate_scores(scores)


def test_calculate_scores_strings_and_booleans():
    """Strings, booleans, and None must be rejected with ValueError."""
    # Boolean True/False must not be coerced to 1.0/0.0
    for bool_val in [True, False]:
        scores = {d["key"]: 3.0 for d in DIMENSIONS}
        scores["technical_quality"] = bool_val
        with pytest.raises(ValueError, match="cannot be a boolean"):
            calculate_scores(scores)

    # Strings must not be silently parsed or converted
    for str_val in ["3.0", "5", "invalid", ""]:
        scores = {d["key"]: 3.0 for d in DIMENSIONS}
        scores["technical_quality"] = str_val
        with pytest.raises(ValueError, match="must be a numeric float or int"):
            calculate_scores(scores)

    # None
    scores = {d["key"]: 3.0 for d in DIMENSIONS}
    scores["technical_quality"] = None
    with pytest.raises(ValueError, match="must be a numeric float or int"):
        calculate_scores(scores)


def test_calculate_scores_out_of_range():
    """Values outside the 0.0 - 5.0 range must be rejected with ValueError."""
    for negative_val in [-0.1, -1.0, -5.0]:
        scores = {d["key"]: 3.0 for d in DIMENSIONS}
        scores["architecture_engineering"] = negative_val
        with pytest.raises(ValueError, match="must be between 0.0 and 5.0"):
            calculate_scores(scores)

    for excessive_val in [5.1, 6.0, 10.0, 100.0]:
        scores = {d["key"]: 3.0 for d in DIMENSIONS}
        scores["functionality_completeness"] = excessive_val
        with pytest.raises(ValueError, match="must be between 0.0 and 5.0"):
            calculate_scores(scores)


def test_valid_evaluation_behavior_preserved():
    """Standard realistic ratings produce the correct deterministic composite score."""
    realistic_scores = {
        "technical_quality": 4.5,            # 90.0 * 0.20 = 18.00
        "architecture_engineering": 4.0,     # 80.0 * 0.15 = 12.00
        "functionality_completeness": 4.0,   # 80.0 * 0.20 = 16.00
        "innovation_problem_solving": 3.5,   # 70.0 * 0.15 = 10.50
        "feasibility_scalability": 4.0,      # 80.0 * 0.15 = 12.00
        "documentation_engineering_process": 4.5  # 90.0 * 0.15 = 13.50
    }
    total_score, dimension_results = calculate_scores(realistic_scores)

    # Total = 18.0 + 12.0 + 16.0 + 10.5 + 12.0 + 13.5 = 82.0
    assert total_score == 82.0
    assert len(dimension_results) == 6
    assert all(math.isfinite(d["weighted_score"]) for d in dimension_results)
    assert all(0.0 <= d["dimension_score"] <= 100.0 for d in dimension_results)


def test_evaluate_repository_malformed_model_output_triggers_degraded():
    """
    When Gemini/model output fails scoring validation, CodeEvaluator.evaluate_repository()
    safely returns degraded mode with null total_score without crashing or inventing numbers.
    """
    evaluator = CodeEvaluator()
    # When unconfigured, it returns degraded mode
    evaluator.client = None
    evaluator.api_key = None

    analysis = {
        "repository": {"name": "test-repo"},
        "contributors": {"evidence": []},
        "commits": {"evidence": []},
        "pull_requests": {"evidence": []},
        "evidence_manifest": {}
    }

    result = evaluator.evaluate_repository(analysis)
    assert result["status"] == "EVALUATION_DEGRADED"
    assert result["total_score"] is None
    assert result["dimension_scores"] is None
