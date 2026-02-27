**Implementation Overview**

The EnvSync CLI is built in **Python** and follows a clean, modular structure.  
Each module has a top‑level comment describing its purpose, every public function is documented with a docstring (Google style – equivalent to JSDoc for Python), constants are used instead of magic numbers, and every asynchronous‑like operation (network calls) is wrapped in `try/except` blocks with proper logging.

The CLI can:

1. **Read** a local `.env` file (`config_parser.py`).
2. **Fetch** secrets from one or more cloud secret managers (`cloud_providers/*.py`).
3. **Diff** the two sets of secrets (`sync_mechanism.py` using `deepdiff`).
4. **Synchronise** the differences either *to the cloud*, *to the local file*, or *both* (`sync_mechanism.py`).
5. **Log** every step (`logger.py`).

The entry point is `src/main.py`. Running `python -m src.main --help` shows the CLI options.

---

## 1. File: `src/logger.py`
```python
# src/logger.py
"""
Logger utility for EnvSync CLI.

Provides a configured ``logging.Logger`` instance that all modules import.
"""

import logging
import sys

# ----------------------------------------------------------------------
# Constants – no magic numbers
# ----------------------------------------------------------------------
LOG_FORMAT = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
DEFAULT_LEVEL = logging.INFO

def get_logger(name: str = "envsync") -> logging.Logger:
    """
    Create (or retrieve) a logger with a standard configuration.

    Args:
        name: The logger name (defaults to ``envsync``).

    Returns:
        A configured ``logging.Logger`` instance.
    """
    logger = logging.getLogger(name)
    if logger.handlers:
        # Logger already configured
        return logger

    logger.setLevel(DEFAULT_LEVEL)

    handler = logging.StreamHandler(stream=sys.stdout)
    handler.setLevel(DEFAULT_LEVEL)
    formatter = logging.Formatter(LOG_FORMAT)
    handler.setFormatter(formatter)

    logger.addHandler(handler)
    logger.propagate = False
    return logger
```

---

## 2. File: `src/config_parser.py`
```python
# src/config_parser.py
"""
Utilities for reading and writing local ``.env`` files.

Uses ``python-dotenv`` to parse the file into a ``dict`` and to write
updates back to disk.
"""

from pathlib import Path
from typing import Dict
from dotenv import dotenv_values, set_key, unset_key
from src.logger import get_logger

LOGGER = get_logger(__name__)

# ----------------------------------------------------------------------
# Constants
# ----------------------------------------------------------------------
DEFAULT_ENV_PATH = Path(".env")

def load_env(env_path: Path = DEFAULT_ENV_PATH) -> Dict[str, str]:
    """
    Load a ``.env`` file into a dictionary.

    Args:
        env_path: Path to the ``.env`` file.

    Returns:
        A ``dict`` mapping variable names to string values.
    """
    try:
        values = dotenv_values(env_path)
        LOGGER.debug("Loaded %d variables from %s", len(values), env_path)
        return values
    except Exception as exc:
        LOGGER.error("Failed to load .env file %s: %s", env_path, exc)
        raise

def write_env(
    env_path: Path,
    data: Dict[str, str],
) -> None:
    """
    Write the supplied ``data`` dictionary back to ``env_path``.
    Existing keys are updated; new keys are added; keys with ``None`` values
    are removed.

    Args:
        env_path: Path to the ``.env`` file.
        data: Mapping of variable names to values.
    """
    try:
        # Ensure the file exists
        env_path.touch(exist_ok=True)

        # Update or remove each key
        existing = dotenv_values(env_path)
        for key, value in data.items():
            if value is None:
                if key in existing:
                    unset_key(env_path, key)
                    LOGGER.debug("Removed key %s from %s", key, env_path)
            else:
                set_key(env_path, key, value)
                LOGGER.debug("Set key %s=%s in %s", key, value, env_path)

        LOGGER.info("Successfully wrote %d entries to %s", len(data), env_path)
    except Exception as exc:
        LOGGER.error("Failed to write .env file %s: %s", env_path, exc)
        raise
```

---

## 3. File: `src/cloud_providers/aws.py`
```python
# src/cloud_providers/aws.py
"""
AWS Secrets Manager integration.

Provides ``AWSProvider`` with methods to list and upsert secrets.
"""

import os
from typing import Dict
import boto3
from botocore.exceptions import BotoCoreError, ClientError
from src.logger import get_logger

LOGGER = get_logger(__name__)

# ----------------------------------------------------------------------
# Constants
# ----------------------------------------------------------------------
AWS_REGION = os.getenv("AWS_REGION", "us-east-1")
# Secrets are stored under a single AWS Secrets Manager secret where the
# secret string is a JSON object mapping key -> value.
# This design keeps the CLI simple and mirrors the .env flat structure.
DEFAULT_SECRET_NAME = os.getenv("AWS_SECRET_NAME", "envsync-secrets")

class AWSProvider:
    """
    Wrapper around boto3 Secrets Manager client.

    All secret values are stored as a JSON string inside a single secret.
    """

    def __init__(self, secret_name: str = DEFAULT_SECRET_NAME, region: str = AWS_REGION):
        """
        Initialise the provider.

        Args:
            secret_name: Name of the AWS Secrets Manager secret.
            region: AWS region.
        """
        self.secret_name = secret_name
        self.client = boto3.client("secretsmanager", region_name=region)

    def _fetch_secret_blob(self) -> Dict[str, str]:
        """
        Retrieve the JSON blob stored in the secret.

        Returns:
            A ``dict`` of key/value pairs. Returns an empty dict if the secret
            does not exist.
        """
        try:
            response = self.client.get_secret_value(SecretId=self.secret_name)
            secret_string = response.get("SecretString", "{}")
            return json.loads(secret_string)
        except self.client.exceptions.ResourceNotFoundException:
            LOGGER.info("AWS secret %s not found – treating as empty.", self.secret_name)
            return {}
        except (BotoCoreError, ClientError) as exc:
            LOGGER.error("AWS get_secret_value failed: %s", exc)
            raise

    def list_secrets(self) -> Dict[str, str]:
        """
        List all secrets stored in the configured AWS secret.

        Returns:
            Mapping of secret name → value.
        """
        return self._fetch_secret_blob()

    def upsert_secrets(self, updates: Dict[str, str]) -> None:
        """
        Create or update the configured secret with the supplied ``updates``.

        The entire secret JSON blob is overwritten with the merged result.

        Args:
            updates: Mapping of key → value to store.
        """
        try:
            current = self._fetch_secret_blob()
            merged = {**current, **updates}
            self.client.put_secret_value(
                SecretId=self.secret_name,
                SecretString=json.dumps(merged),
            )
            LOGGER.info("AWS secret %s updated with %d entries.", self.secret_name, len(updates))
        except (BotoCoreError, ClientError) as exc:
            LOGGER.error("AWS put_secret_value failed: %s", exc)
            raise
```

---

## 4. File: `src/cloud_providers/gcp.py`
```python
# src/cloud_providers/gcp.py
"""
GCP Secret Manager integration.

Each secret is stored as an individual Secret Manager secret; the secret
payload is the plain string value (no JSON wrapper).
"""

import os
from typing import Dict
from google.cloud import secretmanager
from google.api_core.exceptions import NotFound, GoogleAPICallError
from src.logger import get_logger

LOGGER = get_logger(__name__)

