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
