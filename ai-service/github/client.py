import os

import requests
from dotenv import load_dotenv


MAX_COMMITS = 30
MAX_PULL_REQUESTS = 100

load_dotenv()


class GitHubClient:
    def __init__(self):
        self.token = os.getenv("GITHUB_TOKEN")

        self.base_url = "https://api.github.com"

        self.headers = {
            "Accept": "application/vnd.github+json"
        }

        if self.token:
            self.headers["Authorization"] = f"Bearer {self.token}"

    def fetch_repository(self, owner: str, repo: str):
        url = f"{self.base_url}/repos/{owner}/{repo}"

        response = requests.get(
            url,
            headers=self.headers,
            timeout=10
        )

        response.raise_for_status()

        return response.json()

    def fetch_readme(self, owner: str, repo: str):
        url = f"{self.base_url}/repos/{owner}/{repo}/readme"

        response = requests.get(
            url,
            headers=self.headers,
            timeout=10
        )

        response.raise_for_status()

        return response.json()

    def fetch_commits(self, owner: str, repo: str):
        url = f"{self.base_url}/repos/{owner}/{repo}/commits"

        params = {
            "per_page": MAX_COMMITS
        }

        response = requests.get(
            url,
            headers=self.headers,
            params=params,
            timeout=10
        )

        response.raise_for_status()

        return response.json()

    def fetch_contributors(self, owner: str, repo: str):
        url = f"{self.base_url}/repos/{owner}/{repo}/contributors"

        response = requests.get(
            url,
            headers=self.headers,
            timeout=10
        )

        response.raise_for_status()

        return response.json()

    def fetch_pull_requests(self, owner: str, repo: str):
        url = f"{self.base_url}/repos/{owner}/{repo}/pulls"

        params = {
            "state": "all",
            "per_page": MAX_PULL_REQUESTS
        }

        response = requests.get(
            url,
            headers=self.headers,
            params=params,
            timeout=10
        )

        response.raise_for_status()

        return response.json()

    def fetch_repository_structure(
        self,
        owner: str,
        repo: str,
        default_branch: str | None = None
    ):
        if default_branch is None:
            repository = self.fetch_repository(owner, repo)
            default_branch = repository["default_branch"]

        url = f"{self.base_url}/repos/{owner}/{repo}/git/trees/{default_branch}"

        params = {
            "recursive": "1"
        }

        response = requests.get(
            url,
            headers=self.headers,
            params=params,
            timeout=10
        )

        response.raise_for_status()

        return response.json()

    def fetch_file_content(
        self,
        owner: str,
        repo: str,
        path: str,
        ref: str | None = None
    ):
        url = f"{self.base_url}/repos/{owner}/{repo}/contents/{path}"

        params = {}
        if ref:
            params["ref"] = ref

        response = requests.get(
            url,
            headers=self.headers,
            params=params,
            timeout=10
        )

        response.raise_for_status()

        return response.json()

    def fetch_commit_detail(self, owner: str, repo: str, sha: str):
        url = f"{self.base_url}/repos/{owner}/{repo}/commits/{sha}"

        response = requests.get(
            url,
            headers=self.headers,
            timeout=10
        )

        response.raise_for_status()

        return response.json()


if __name__ == "__main__":
    client = GitHubClient()

    repository = client.fetch_repository(
        "octocat",
        "Hello-World"
    )

    structure = client.fetch_repository_structure(
        "octocat",
        "Hello-World"
    )

    readme = client.fetch_readme(
        "octocat",
        "Hello-World"
    )

    commits = client.fetch_commits(
        "octocat",
        "Hello-World"
    )

    pull_requests = client.fetch_pull_requests(
        "octocat",
        "Hello-World"
    )

    contributors = client.fetch_contributors(
        "octocat",
        "Hello-World"
    )

    print("Default branch:", repository["default_branch"])
    print("Number of items:", len(structure["tree"]))
    print("README name:", readme["name"])
    print("Number of commits:", len(commits))
    print("Number of pull requests:", len(pull_requests))
    print("Number of contributors:", len(contributors))