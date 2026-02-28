**File: `src/wizard.py`**
```python
"""
wizard.py
---------

Core automation utilities for the DevEnv Setup Wizard.

Provides functions to:
- Load environment variables from a .env file.
- Log setup actions while redacting secrets.
- Install Python packages.
- Set up Python and Node.js environments.
- Integrate with Docker and Git.

All functions include comprehensive error handling and are fully typed.
"""

from __future__ import annotations

import os
import re
import subprocess
from pathlib import Path
from typing import Dict, List, Mapping, Optional

# --------------------------------------------------------------------------- #
# Constants
# --------------------------------------------------------------------------- #

# Commands used throughout the wizard
PYTHON_VENV_CMD: List[str] = ["python", "-m", "venv", "env"]
PIP_INSTALL_CMD: List[str] = ["pip", "install"]
NPM_INSTALL_CMD: List[str] = ["npm", "install"]
DOCKER_COMPOSE_UP_CMD: List[str] = ["docker", "compose", "up", "-d"]
GIT_INIT_CMD: List[str] = ["git", "init"]

# Keys that are considered secrets and should be redacted from logs
SECRET_KEYS = {"API_KEY", "SECRET", "TOKEN", "PASSWORD", "ACCESS_KEY", "PRIVATE_KEY"}

# Regex pattern to locate key=value pairs for redaction
SECRET_PATTERN = re.compile(
    r"(?P<key>" + "|".join(SECRET_KEYS) + r")\s*=\s*(?P<value>[^ \n\r\t]+)", re.IGNORECASE
)


# --------------------------------------------------------------------------- #
# Helper Functions
# --------------------------------------------------------------------------- #

def _redact_secrets(message: str) -> str:
    """
    Redact any secret values found in ``message``.

    Parameters
    ----------
    message: str
        The original log message.

    Returns
    -------
    str
        The message with secret values replaced by ``[REDACTED]``.
    """
    def _replace(match: re.Match) -> str:
        return f"{match.group('key')}=[REDACTED]"

    return SECRET_PATTERN.sub(_replace, message)


# --------------------------------------------------------------------------- #
# Public API
# --------------------------------------------------------------------------- #

def load_env(file_path: str) -> Dict[str, str]:
    """
    Parse a ``.env`` file and return a dictionary of key/value pairs.

    The function respects existing environment variables – if a variable is
    already defined in ``os.environ`` it will overwrite the value read from the
    file.

    Parameters
    ----------
    file_path: str
        Path to the ``.env`` file.

    Returns
    -------
    Dict[str, str]
        Mapping of environment variable names to their values.

    Raises
    ------
    FileNotFoundError
        If ``file_path`` does not exist.
    """
    env_path = Path(file_path)
    if not env_path.is_file():
        raise FileNotFoundError(f".env file not found: {file_path}")

    result: Dict[str, str] = {}
    with env_path.open("r", encoding="utf-8") as f:
        for raw_line in f:
            line = raw_line.strip()
            # Skip empty lines and comments
            if not line or line.startswith("#"):
                continue
            if "=" not in line:
                # Invalid line – ignore per test expectations
                continue
            key, value = line.split("=", 1)
            key, value = key.strip(), value.strip()
            result[key] = value

    # Override with OS environment variables if they exist
    for key in list(result.keys()):
        if os.getenv(key) is not None:
            result[key] = os.getenv(key)

    return result


def log_setup(message: str, logfile: Optional[str] = None) -> None:
    """
    Write a log entry to ``logfile`` (or ``setup.log`` in the current directory).

    The function appends to the file, creates it if necessary, and redacts any
    secret values before writing.

    Parameters
    ----------
    message: str
        Log message to write.
    logfile: Optional[str]
        Destination file path. Defaults to ``setup.log`` in the cwd.

    Raises
    ------
    PermissionError
        Propagated if the file cannot be opened for writing.
    """
    target_path = Path(logfile) if logfile else Path("setup.log")
    redacted_message = _redact_secrets(message)

    # Ensure the parent directory exists
    target_path.parent.mkdir(parents=True, exist_ok=True)

    try:
        with target_path.open("a", encoding="utf-8") as f:
            f.write(redacted_message + "\n")
    except PermissionError as exc:
        # Re‑raise to satisfy test expectations
        raise PermissionError(f"Unable to write to log file {target_path}") from exc


def install_packages(packages: List[str]) -> None:
    """
    Install a list of Python packages using ``pip``.

    Parameters
    ----------
    packages: List[str]
        List of package specifications (e.g., ``["requests", "flask==2.2.0"]``).

    Raises
    ------
    RuntimeError
        If the subprocess call fails.
    """
    if not packages:
        # Nothing to install – early exit
        return

    cmd = PIP_INSTALL_CMD + packages
    try:
        subprocess.run(cmd, check=True)
    except Exception as exc:
        raise RuntimeError(f"Failed to install packages: {packages}") from exc


def setup_python_env(env: Mapping[str, str]) -> bool:
    """
    Automate Python environment setup.

    The function creates a virtual environment in the ``env`` directory and
    installs packages from ``requirements.txt``.

    Parameters
    ----------
    env: Mapping[str, str]
        Environment configuration. Must not be ``None``.

    Returns
    -------
    bool
        ``True`` on success.

    Raises
    ------
    ValueError
        If ``env`` is ``None``.
    RuntimeError
        If any subprocess command fails.
    """
    if env is None:
        raise ValueError("env argument must not be None")

    try:
        # Create virtual environment
        subprocess.run(PYTHON_VENV_CMD, check=True)

        # Install requirements
