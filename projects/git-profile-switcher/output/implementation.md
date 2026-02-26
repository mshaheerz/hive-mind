**File: `config/profiles.json`**
```json
{
  "repositories": [
    {
      "remote_url": "https://github.com/example/personal-project.git",
      "profile": {
        "name": "John Personal",
        "email": "john.personal@example.com",
        "signing_key": ""
      }
    },
    {
      "remote_url": "git@github.com:example/work-project.git",
      "profile": {
        "name": "John Work",
        "email": "john.work@company.com",
        "signing_key": "ABCDEF1234567890"
      }
    }
  ]
}
```

---

**File: `src/profile.py`**
```python
#!/usr/bin/env python3
"""
profile.py
~~~~~~~~~~

Utility classes for loading the user‑defined profile configuration
(`profiles.json`) and for representing a single Git identity profile.

The module purposefully contains no I/O side‑effects other than reading
the JSON file – this makes it easy to unit‑test.
"""

import json
import os
from dataclasses import dataclass
from typing import List, Optional

# --------------------------------------------------------------------------- #
# Constants
# --------------------------------------------------------------------------- #

DEFAULT_CONFIG_PATH = os.path.join(
    os.path.dirname(os.path.abspath(__file__)), "..", "config", "profiles.json"
)


# --------------------------------------------------------------------------- #
# Data classes
# --------------------------------------------------------------------------- #

@dataclass(frozen=True)
class GitProfile:
    """
    Immutable representation of a Git identity.

    Attributes
    ----------
    name: str
        The value for ``user.name``.
    email: str
        The value for ``user.email``.
    signing_key: str
        The value for ``user.signingkey``. Empty string means "do not set".
    """
    name: str
    email: str
    signing_key: str = ""


@dataclass(frozen=True)
class RepositoryRule:
    """
    Mapping between a repository remote URL (or a pattern) and a
    :class:`GitProfile`.

    Attributes
    ----------
    remote_url: str
        Exact remote URL to match. Matching is performed using ``in`` so a
        partial URL (e.g. just the host) works as well.
    profile: GitProfile
        The profile that should be applied when the rule matches.
    """
    remote_url: str
    profile: GitProfile


# --------------------------------------------------------------------------- #
# Loader
# --------------------------------------------------------------------------- #

class ConfigLoader:
    """
    Loads and validates the JSON configuration file.

    Parameters
    ----------
    config_path: str, optional
        Path to ``profiles.json``. If omitted, the default location relative
        to the project root is used.
    """

    def __init__(self, config_path: Optional[str] = None) -> None:
        self._config_path = config_path or DEFAULT_CONFIG_PATH

    def load(self) -> List[RepositoryRule]:
        """
        Parse the JSON file and return a list of :class:`RepositoryRule`.

        Returns
        -------
        List[RepositoryRule]
            All repository‑to‑profile mappings defined in the file.

        Raises
        ------
        FileNotFoundError
            If the configuration file does not exist.
        json.JSONDecodeError
            If the file contains invalid JSON.
        ValueError
            If required fields are missing.
        """
        if not os.path.isfile(self._config_path):
            raise FileNotFoundError(f"Configuration file not found: {self._config_path}")

        with open(self._config_path, "r", encoding="utf-8") as f:
            raw = json.load(f)

        if "repositories" not in raw or not isinstance(raw["repositories"], list):
            raise ValueError("Invalid configuration format – missing 'repositories' list")

        rules: List[RepositoryRule] = []
        for entry in raw["repositories"]:
            if "remote_url" not in entry or "profile" not in entry:
                raise ValueError("Each repository entry must contain 'remote_url' and 'profile'")
            profile_data = entry["profile"]
            if "name" not in profile_data or "email" not in profile_data:
                raise ValueError("Profile must contain at least 'name' and 'email'")

            profile = GitProfile(
                name=profile_data["name"],
                email=profile_data["email"],
                signing_key=profile_data.get("signing_key", "")
            )
            rule = RepositoryRule(remote_url=entry["remote_url"], profile=profile)
            rules.append(rule)

        return rules
```

---

**File: `src/git_helper.py`**
```python
#!/usr/bin/env python3
"""
git_helper.py
~~~~~~~~~~~~~

Thin wrapper around *gitpython* that provides the small set of operations
required by the CLI:

* discover the current repository,
* obtain the remote URLs,
* apply a :class:`GitProfile` to the repository's **local** configuration.

All functions raise explicit exceptions on failure so the CLI can present
helpful error messages.
"""

import os
from typing import List

from git import Repo, InvalidGitRepositoryError, NoSuchPathError, GitCommandError

from .profile import GitProfile

# --------------------------------------------------------------------------- #
# Constants
# --------------------------------------------------------------------------- #

DEFAULT_REMOTE_NAME = "origin"


# --------------------------------------------------------------------------- #
# Helper functions
# --------------------------------------------------------------------------- #

def find_repository(start_path: str = ".") -> Repo:
    """
    Locate the nearest Git repository starting from ``start_path`` and walking
    upwards.

    Parameters
    ----------
    start_path: str, optional
        Directory from which the search begins. Defaults to the current
        working directory.

    Returns
    -------
    Repo
        An instantiated :class:`git.Repo` object.

    Raises
    ------
    FileNotFoundError
        If no repository can be found.
    """
    try:
        repo = Repo(start_path, search_parent_directories=True)
        # ``gitpython`` returns a Repo even if the directory is not a repository
        # but ``repo.git_dir`` will be ``None`` in that case.
        if repo.git_dir is None:
            raise InvalidGitRepositoryError
        return repo
    except (InvalidGitRepositoryError, NoSuchPathError):
        raise FileNotFoundError("No Git repository found in the current directory or its parents.")


def get_remote_urls(repo: Repo, remote_name: str = DEFAULT_REMOTE_NAME) -> List[str]:
    """
    Return all fetch URLs for the given remote (defaults to ``origin``).

    Parameters
    ----------
    repo: Repo
        Repository instance.
    remote_name: str, optional
        Name of the remote to inspect.

    Returns
    -------
    List[str]
        All URLs associated with the remote.

    Raises
    ------
    ValueError
        If the remote does not exist.
    """
    if remote_name not in repo.remotes:
        raise ValueError(f"Remote '{remote_name}' not found in repository.")
    remote = repo.remotes[remote_name]
    return [url for url in remote.urls]


def apply_profile(repo: Repo, profile: GitProfile) -> None:
    """
    Write the profile values to the **local** git configuration of ``repo``.

    Parameters
    ----------
    repo: Repo
        Repository to configure.
    profile: GitProfile
        Identity information to write.

    Raises
    ------
    GitCommandError
        If any ``git config`` command fails.
    """
    try:
        with repo.config_writer(config_level="repository") as cfg:
            cfg.set_value("user", "name", profile.name)
            cfg.set_value("user", "email", profile.email)
            if profile.sign