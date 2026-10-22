import base64
from unittest.mock import MagicMock

from github.analyzer import (
    GitHubAnalyzer,
    extract_challenge_keywords,
    MAX_FILE_SIZE_BYTES,
    MAX_TOTAL_CODE_BYTES
)


def test_extract_challenge_keywords():
    reqs = [
        "JWT-based user authentication and login",
        "Redis caching for high-speed leaderboard query",
        "Automated unit testing with Jest"
    ]
    keywords = extract_challenge_keywords(reqs)
    assert "jwt" in keywords
    assert "authentication" in keywords
    assert "login" in keywords
    assert "redis" in keywords
    assert "caching" in keywords
    assert "leaderboard" in keywords
    assert "jest" in keywords
    # Stop words should not be included
    assert "and" not in keywords
    assert "for" not in keywords
    assert "with" not in keywords


def test_select_priority_files_challenge_aware():
    analyzer = GitHubAnalyzer()
    tree = [
        {"type": "blob", "path": "node_modules/package/index.js"},
        {"type": "blob", "path": ".venv/lib/python.py"},
        {"type": "blob", "path": "package-lock.json"},
        {"type": "blob", "path": "bundle.min.js"},
        {"type": "blob", "path": "image.png"},
        {"type": "blob", "path": "src/utils.py"},
        {"type": "blob", "path": "src/auth/jwt_handler.py"},
        {"type": "blob", "path": "src/controllers/leaderboard.py"},
        {"type": "blob", "path": "main.py"},
        {"type": "blob", "path": "tests/test_auth.py"},
        {"type": "tree", "path": "src"}
    ]
    reqs = ["JWT authentication service", "Redis leaderboard"]
    selected = analyzer.select_priority_files(tree, challenge_requirements=reqs)

    # Exclusions
    assert "node_modules/package/index.js" not in selected
    assert ".venv/lib/python.py" not in selected
    assert "package-lock.json" not in selected
    assert "bundle.min.js" not in selected
    assert "image.png" not in selected

    # Top selections should include keyword matching files
    assert "src/auth/jwt_handler.py" in selected
    assert "src/controllers/leaderboard.py" in selected
    assert "main.py" in selected
    assert "tests/test_auth.py" in selected

    # Keywords should rank higher than generic utility
    jwt_idx = selected.index("src/auth/jwt_handler.py")
    assert jwt_idx < selected.index("src/utils.py")


def test_fetch_source_evidence_truncation_and_budget():
    analyzer = GitHubAnalyzer()
    analyzer.client = MagicMock()

    # Create a 25 KB string to test per-file 6 KB truncation
    large_text = "a" * (25 * 1024)
    encoded_large = base64.b64encode(large_text.encode("utf-8")).decode("utf-8")

    analyzer.client.fetch_file_content.side_effect = [
        {"content": encoded_large, "size": 25 * 1024},
        {"content": base64.b64encode(b"console.log('hello');").decode("utf-8"), "size": 21}
    ]

    inspected, manifest = analyzer.fetch_source_evidence(
        owner="test-owner",
        repo="test-repo",
        default_branch="main",
        selected_file_paths=["large_file.py", "small_file.js"],
        total_tree_files=10,
        tree_truncated=False
    )

    assert len(inspected) == 2
    assert inspected[0]["truncated"] is True
    assert "[... file content truncated at 6 KB ...]" in inspected[0]["content"]
    assert inspected[1]["truncated"] is False

    assert manifest["total_files_discovered"] == 10
    assert manifest["files_inspected"] == ["large_file.py", "small_file.js"]
    assert manifest["files_omitted_count"] == 8
    assert manifest["tree_truncated"] is False


def test_fetch_source_evidence_total_budget_exhaustion():
    analyzer = GitHubAnalyzer()
    analyzer.client = MagicMock()

    # Two 5 KB files fill the 10 KB budget; a third file exceeds it
    file1 = base64.b64encode(("x" * (5 * 1024)).encode("utf-8")).decode("utf-8")
    file2 = base64.b64encode(("y" * (5 * 1024)).encode("utf-8")).decode("utf-8")
    file3 = base64.b64encode(b"z" * 500).decode("utf-8")

    analyzer.client.fetch_file_content.side_effect = [
        {"content": file1, "size": 5 * 1024},
        {"content": file2, "size": 5 * 1024},
        {"content": file3, "size": 500}
    ]

    inspected, manifest = analyzer.fetch_source_evidence(
        owner="test-owner",
        repo="test-repo",
        default_branch="main",
        selected_file_paths=["f1.py", "f2.py", "f3.py"],
        total_tree_files=15,
        tree_truncated=False
    )

    assert len(inspected) == 2
    assert manifest["budget_exhausted"] is True
    assert manifest["total_files_discovered"] == 15
    assert manifest["files_omitted_count"] == 13


def test_sample_commit_attributions():
    analyzer = GitHubAnalyzer()
    analyzer.client = MagicMock()

    commits = [
        {
            "sha": "sha1",
            "commit": {"author": {"name": "Alice"}},
            "author": {"login": "alice_gh"}
        },
        {
            "sha": "sha2",
            "commit": {"author": {"name": "Bob"}},
            "author": {"login": "bob_gh"}
        }
    ]

    analyzer.client.fetch_commit_detail.side_effect = [
        {
            "stats": {"additions": 100, "deletions": 10},
            "files": [{"filename": "src/auth.py"}, {"filename": "main.py"}]
        },
        {
            "stats": {"additions": 50, "deletions": 5},
            "files": [{"filename": "README.md"}]
        }
    ]

    attributions = analyzer.sample_commit_attributions("owner", "repo", commits)

    assert "alice_gh" in attributions
    assert attributions["alice_gh"]["commits_sampled"] == 1
    assert attributions["alice_gh"]["additions"] == 100
    assert "src/auth.py" in attributions["alice_gh"]["files_touched"]

    assert "bob_gh" in attributions
    assert attributions["bob_gh"]["commits_sampled"] == 1
    assert attributions["bob_gh"]["additions"] == 50
