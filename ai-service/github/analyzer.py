import re
import base64
from collections import Counter
from pathlib import PurePosixPath

from github.client import GitHubClient


MAX_SELECTED_FILES = 5
MAX_FILE_SIZE_BYTES = 6 * 1024  # 6 KB per file
MAX_TOTAL_CODE_BYTES = 10 * 1024  # 10 KB total code budget (8-12 KB target)
MAX_SAMPLED_COMMITS = 15

EXCLUDED_DIRS = {
    "node_modules", "venv", ".venv", "env", "dist", "build",
    ".next", "coverage", "__pycache__", ".git", "target", ".vscode", ".idea"
}

EXCLUDED_EXTS = {
    ".png", ".jpg", ".jpeg", ".gif", ".svg", ".ico", ".wasm",
    ".exe", ".pdf", ".zip", ".tar", ".gz", ".lock", ".pyc",
    ".html", ".css", ".scss", ".less", ".map"
}

EXCLUDED_FILENAMES = {
    "package-lock.json", "pnpm-lock.yaml", "yarn.lock", "poetry.lock", "cargo.lock",
    "postcss.config.js", "tailwind.config.js", "vite.config.js", "webpack.config.js",
    "babel.config.js", "tsconfig.json", "jsconfig.json"
}


def extract_challenge_keywords(requirements: list[str] | None) -> list[str]:
    if not requirements:
        return []
    keywords = set()
    stop_words = {
        "the", "and", "with", "for", "a", "an", "in", "on", "of", "to", "or",
        "is", "by", "as", "at", "from", "each", "all", "must", "should", "using",
        "post", "get", "delete", "put", "patch", "options", "head", "api"
    }
    for req in requirements:
        for word in req.lower().replace("-", " ").replace("_", " ").replace("/", " ").split():
            clean = "".join(c for c in word if c.isalnum())
            if len(clean) >= 3 and clean not in stop_words:
                keywords.add(clean)
    return list(keywords)


class GitHubAnalyzer:
    def __init__(self):
        self.client = GitHubClient()

    def select_priority_files(
        self,
        tree: list[dict],
        challenge_requirements: list[str] | None = None
    ) -> list[str]:
        keywords = extract_challenge_keywords(challenge_requirements)
        candidates = []

        for item in tree:
            if item.get("type") != "blob":
                continue

            path = item.get("path", "")
            posix_path = PurePosixPath(path)
            parts = [p.lower() for p in posix_path.parts]

            # Exclude vendor and build directories
            if any(excluded in parts for excluded in EXCLUDED_DIRS):
                continue

            suffix = posix_path.suffix.lower()
            name = posix_path.name.lower()

            if suffix in EXCLUDED_EXTS or name in EXCLUDED_FILENAMES:
                continue

            if ".min." in name or name.endswith(".config.js") or name.endswith(".config.ts"):
                continue

            # Prioritization scoring
            score = 0
            path_lower = path.lower()
            path_tokens = set(re.findall(r"[a-zA-Z0-9]+", path_lower))

            # Dynamic Tier 0: Challenge keyword matching on word tokens
            for kw in keywords:
                if kw in path_tokens:
                    score += 100

            # Tier 1: Core entry points, backend routes, controllers, and APIs
            if name in {"main.py", "app.py", "server.js", "index.ts", "index.js", "app.tsx", "app.jsx", "server.py", "app.js"}:
                score += 50
            elif any(r in path_lower for r in ["/routes/", "/controllers/", "/api/", "router", "route.", "controller."]):
                score += 45

            # Tier 2: Domain logic, services, repositories, and database schemas
            if any(d in path_lower for d in ["/services/", "/models/", "/db/", "/repositories/", "schema.sql", "prisma", "model.", "service."]):
                score += 35

            # Tier 3: Test verification
            if any(t in path_lower for t in ["test", "tests/", ".test.", "_test.", ".spec.", "_spec."]):
                score += 25

            # Source code extensions baseline
            if suffix in {".py", ".ts", ".tsx", ".js", ".jsx", ".go", ".rs", ".java", ".sql"}:
                score += 5

            if score > 0:
                candidates.append((score, len(path), path))

        # Sort highest score first, then shortest path length
        candidates.sort(key=lambda x: (-x[0], x[1]))
        return [c[2] for c in candidates[:MAX_SELECTED_FILES]]

    def fetch_source_evidence(
        self,
        owner: str,
        repo: str,
        default_branch: str,
        selected_file_paths: list[str],
        total_tree_files: int,
        tree_truncated: bool
    ) -> tuple[list[dict], dict]:
        inspected_files = []
        total_bytes = 0
        budget_exhausted = False

        for file_path in selected_file_paths:
            if budget_exhausted:
                break

            try:
                data = self.client.fetch_file_content(
                    owner, repo, file_path, default_branch
                )
                encoded = data.get("content", "")
                if not encoded:
                    continue

                encoded_clean = encoded.replace("\n", "")
                decoded = base64.b64decode(encoded_clean).decode("utf-8", errors="replace")
                raw_bytes = len(decoded.encode("utf-8"))

                is_truncated = False
                if raw_bytes > MAX_FILE_SIZE_BYTES:
                    # Head-truncate at 6 KB
                    decoded = decoded[:MAX_FILE_SIZE_BYTES] + "\n[... file content truncated at 6 KB ...]"
                    is_truncated = True

                file_byte_size = len(decoded.encode("utf-8"))
                if total_bytes + file_byte_size > MAX_TOTAL_CODE_BYTES:
                    remaining_budget = MAX_TOTAL_CODE_BYTES - total_bytes
                    if remaining_budget > 500:
                        decoded = decoded[:remaining_budget] + "\n[... file content truncated at 10 KB total evidence budget ...]"
                        is_truncated = True
                        inspected_files.append({
                            "path": file_path,
                            "size": data.get("size", raw_bytes),
                            "content": decoded,
                            "truncated": is_truncated
                        })
                    budget_exhausted = True
                    break

                total_bytes += file_byte_size
                inspected_files.append({
                    "path": file_path,
                    "size": data.get("size", raw_bytes),
                    "content": decoded,
                    "truncated": is_truncated
                })
            except Exception:
                # Omit file gracefully if unreadable or permission issue
                continue

            if total_bytes >= MAX_TOTAL_CODE_BYTES:
                budget_exhausted = True

        omitted_count = max(0, total_tree_files - len(inspected_files))
        omission_notes = (
            f"Inspected {len(inspected_files)} prioritized files ({total_bytes} bytes). "
            f"{omitted_count} files omitted due to scope boundaries or evidence budgets."
        )
        if budget_exhausted:
            omission_notes += " Aggregate 10 KB source evidence budget reached."
        if tree_truncated:
            omission_notes += " Upstream GitHub git tree was truncated."

        manifest = {
            "total_files_discovered": total_tree_files,
            "files_inspected": [f["path"] for f in inspected_files],
            "files_omitted_count": omitted_count,
            "tree_truncated": tree_truncated,
            "budget_exhausted": budget_exhausted,
            "omission_notes": omission_notes
        }

        return inspected_files, manifest

    def sample_commit_attributions(
        self,
        owner: str,
        repo: str,
        commits: list[dict]
    ) -> dict:
        sampled = commits[:MAX_SAMPLED_COMMITS]
        author_data: dict[str, dict] = {}

        for commit in sampled:
            sha = commit.get("sha")
            if not sha:
                continue

            author_info = commit.get("commit", {}).get("author") or {}
            author_name = author_info.get("name") or "unknown"
            committer_user = commit.get("author") or {}
            author_login = committer_user.get("login") or author_name

            if author_login not in author_data:
                author_data[author_login] = {
                    "login": author_login,
                    "commits_sampled": 0,
                    "additions": 0,
                    "deletions": 0,
                    "files_touched": []
                }

            author_data[author_login]["commits_sampled"] += 1

            try:
                detail = self.client.fetch_commit_detail(owner, repo, sha)
                stats = detail.get("stats") or {}
                author_data[author_login]["additions"] += stats.get("additions", 0)
                author_data[author_login]["deletions"] += stats.get("deletions", 0)

                for f in detail.get("files", []):
                    fname = f.get("filename")
                    if fname and fname not in author_data[author_login]["files_touched"]:
                        author_data[author_login]["files_touched"].append(fname)
            except Exception:
                # If detail call fails (e.g. rate limit), continue with available stats
                continue

        return author_data

    def analyze_repository(
        self,
        owner: str,
        repo: str,
        challenge_requirements: list[str] | None = None,
        include_code_evidence: bool = False
    ):
        # ---------------------------------------------------------
        # 1. Repository information
        # ---------------------------------------------------------
        repository = self.client.fetch_repository(owner, repo)

        default_branch = repository["default_branch"]

        # ---------------------------------------------------------
        # 2. Repository structure
        # ---------------------------------------------------------
        structure = self.client.fetch_repository_structure(
            owner,
            repo,
            default_branch
        )

        tree = structure.get("tree", [])

        files = [
            item for item in tree
            if item.get("type") == "blob"
        ]

        directories = [
            item for item in tree
            if item.get("type") == "tree"
        ]

        file_extensions = Counter()

        for file in files:
            path = file.get("path", "")
            suffix = PurePosixPath(path).suffix.lower()

            if suffix:
                file_extensions[suffix] += 1

        file_paths = {
            item.get("path", "").lower()
            for item in files
        }

        # Common project indicators.
        has_readme = any(
            path == "readme.md" or path == "readme"
            for path in file_paths
        )

        has_gitignore = ".gitignore" in file_paths
        has_requirements = "requirements.txt" in file_paths
        has_package_json = "package.json" in file_paths
        has_package_lock = "package-lock.json" in file_paths

        # ---------------------------------------------------------
        # 3. README
        # ---------------------------------------------------------
        readme_data = None
        readme_content = None

        try:
            readme_data = self.client.fetch_readme(owner, repo)

            encoded_content = readme_data.get("content", "")

            if encoded_content:
                encoded_content = encoded_content.replace("\n", "")

                try:
                    readme_content = base64.b64decode(
                        encoded_content
                    ).decode("utf-8", errors="replace")
                except (ValueError, UnicodeDecodeError):
                    readme_content = None

        except Exception:
            readme_data = None
            readme_content = None

        # ---------------------------------------------------------
        # 4. Commits
        # ---------------------------------------------------------
        commits = self.client.fetch_commits(owner, repo)

        commit_evidence = []

        for commit in commits:
            commit_info = commit.get("commit", {})
            author_info = commit_info.get("author") or {}
            verification_info = commit_info.get("verification") or {}

            commit_evidence.append(
                {
                    "sha": commit.get("sha"),
                    "message": commit_info.get("message"),
                    "author": author_info.get("name"),
                    "date": author_info.get("date"),
                    "verified": verification_info.get("verified", False)
                }
            )

        verified_commit_count = sum(
            1
            for commit in commit_evidence
            if commit["verified"]
        )

        # ---------------------------------------------------------
        # 5. Pull requests
        # ---------------------------------------------------------
        pull_requests = self.client.fetch_pull_requests(owner, repo)

        open_pull_requests = 0
        closed_pull_requests = 0
        merged_pull_requests = 0

        pull_request_evidence = []

        for pull_request in pull_requests:
            state = pull_request.get("state")
            merged_at = pull_request.get("merged_at")

            if state == "open":
                open_pull_requests += 1
            elif state == "closed":
                closed_pull_requests += 1

            if merged_at is not None:
                merged_pull_requests += 1

            user = pull_request.get("user") or {}

            pull_request_evidence.append(
                {
                    "number": pull_request.get("number"),
                    "title": pull_request.get("title"),
                    "state": state,
                    "merged": merged_at is not None,
                    "created_at": pull_request.get("created_at"),
                    "closed_at": pull_request.get("closed_at"),
                    "author": user.get("login")
                }
            )

        # ---------------------------------------------------------
        # 6. Contributors
        # ---------------------------------------------------------
        contributors = self.client.fetch_contributors(owner, repo)

        contributor_evidence = []

        for contributor in contributors:
            contributor_evidence.append(
                {
                    "login": contributor.get("login"),
                    "contributions": contributor.get("contributions", 0)
                }
            )

        # ---------------------------------------------------------
        # 7. Assemble Base Evidence
        # ---------------------------------------------------------
        result = {
            "repository": {
                "name": repository.get("name"),
                "full_name": repository.get("full_name"),
                "description": repository.get("description"),
                "default_branch": default_branch,
                "language": repository.get("language"),
                "visibility": repository.get("visibility"),
                "fork": repository.get("fork")
            },

            "structure": {
                "total_items": len(tree),
                "total_files": len(files),
                "total_directories": len(directories),
                "file_extensions": dict(file_extensions),
                "has_readme": has_readme,
                "has_gitignore": has_gitignore,
                "has_requirements": has_requirements,
                "has_package_json": has_package_json,
                "has_package_lock": has_package_lock,
                "tree_truncated": structure.get("truncated", False)
            },

            "readme": {
                "exists": readme_data is not None,
                "name": (
                    readme_data.get("name")
                    if readme_data
                    else None
                ),
                "size": (
                    readme_data.get("size")
                    if readme_data
                    else None
                ),
                "content": readme_content
            },

            "commits": {
                "count": len(commits),
                "verified_count": verified_commit_count,
                "evidence": commit_evidence
            },

            "pull_requests": {
                "count": len(pull_requests),
                "open_count": open_pull_requests,
                "closed_count": closed_pull_requests,
                "merged_count": merged_pull_requests,
                "evidence": pull_request_evidence
            },

            "contributors": {
                "count": len(contributors),
                "evidence": contributor_evidence
            }
        }

        # ---------------------------------------------------------
        # 8. Optional Extended Source Evidence & Commit Attribution
        # ---------------------------------------------------------
        if include_code_evidence:
            selected_files = self.select_priority_files(tree, challenge_requirements)
            source_files, manifest = self.fetch_source_evidence(
                owner=owner,
                repo=repo,
                default_branch=default_branch,
                selected_file_paths=selected_files,
                total_tree_files=len(files),
                tree_truncated=structure.get("truncated", False)
            )
            commit_attributions = self.sample_commit_attributions(
                owner=owner,
                repo=repo,
                commits=commits
            )

            result["source_files"] = source_files
            result["evidence_manifest"] = manifest
            result["commit_attributions"] = commit_attributions

        return result


if __name__ == "__main__":
    analyzer = GitHubAnalyzer()

    result = analyzer.analyze_repository(
        "shravani-student",
        "demo-repository"
    )

    print(result)