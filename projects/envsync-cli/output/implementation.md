**File: `src/logger.py`**
```python
#!/usr/bin/env python3
"""
logger.py
---------

Centralised logger configuration for the EnvSync CLI.  All modules import
`get_logger()` to obtain a pre‑configured ``logging.Logger`` instance that
writes to stdout with a consistent format.
"""

import logging
import sys
from typing import Final

# --------------------------------------------------------------------------- #
# Named constants – avoid magic numbers / strings throughout the code base
# --------------------------------------------------------------------------- #
_LOG_FORMAT: Final = "%(asctime)s | %(levelname)-8s | %(name)s | %(message)s"
_LOG_LEVEL: Final = logging.INFO


def get_logger(name: str = "envsync") -> logging.Logger:
    """
    Create (or retrieve) a logger with a standard configuration.

    Parameters
    ----------
    name: str
        Name of the logger.  Child modules typically pass ``__name__``.

    Returns
    -------
    logging.Logger
        Configured logger instance.
    """
    logger = logging.getLogger(name)

    # Prevent adding multiple handlers if `get_logger` is called repeatedly
    if logger.handlers:
        return logger

    logger.setLevel(_LOG_LEVEL)

    handler = logging.StreamHandler(stream=sys.stdout)
    handler.setLevel(_LOG_LEVEL)
    formatter = logging.Formatter(_LOG_FORMAT)
    handler.setFormatter(formatter)

    logger.addHandler(handler)
    logger.propagate = False
    return logger
```

---

**File: `src/config_parser.py`**
```python
#!/usr/bin/env python3
"""
config_parser.py
----------------

Utilities for reading and writing ``.env`` files using ``python-dotenv``.
All values are returned as strings because environment variables are
string‑based.
"""

import os
from pathlib import Path
from typing import Dict, Final

from dotenv import dotenv_values, set_key
from .logger import get_logger

LOGGER = get_logger(__name__)

# --------------------------------------------------------------------------- #
# Named constants
# --------------------------------------------------------------------------- #
DEFAULT_ENV_PATH: Final[Path] = Path.cwd() / ".env"


def load_env(env_path: Path = DEFAULT_ENV_PATH) -> Dict[str, str]:
    """
    Load a ``.env`` file into a plain dictionary.

    Parameters
    ----------
    env_path: Path
        Path to the ``.env`` file.  Defaults to ``./.env`` in the current
        working directory.

    Returns
    -------
    dict[str, str]
        Mapping of variable names to their values.  Missing file returns an
        empty dict.
    """
    if not env_path.is_file():
        LOGGER.warning("Env file %s not found – returning empty dict", env_path)
        return {}

    try:
        data = dotenv_values(dotenv_path=env_path)
        LOGGER.info("Loaded %d variables from %s", len(data), env_path)
        return data
    except Exception as exc:  # pragma: no cover – defensive
        LOGGER.error("Failed to read .env file %s: %s", env_path, exc)
        raise


def write_env(
    data: Dict[str, str],
    env_path: Path = DEFAULT_ENV_PATH,
) -> None:
    """
    Write a dictionary of environment variables back to a ``.env`` file.
    Existing keys are overwritten; new keys are appended.

    Parameters
    ----------
    data: dict[str, str]
        Variables to write.
    env_path: Path
        Destination file.  Parent directories are created if missing.
    """
    try:
        env_path.parent.mkdir(parents=True, exist_ok=True)

        # ``set_key`` writes a single key; we use it in a loop to preserve
        # ordering and comments (if any) as much as possible.
        for key, value in data.items():
            set_key(env_path, key, value, quote_mode="auto")
        LOGGER.info("Wrote %d variables to %s", len(data), env_path)
    except Exception as exc:  # pragma: no cover – defensive
        LOGGER.error("Failed to write .env file %s: %s", env_path, exc)
        raise
```

---

**File: `src/cloud_providers/aws.py`**
```python
#!/usr/bin/env python3
"""
aws.py
-------

Minimal wrapper around ``boto3`` for AWS Secrets Manager.  The wrapper
exposes only the operations required by the CLI: fetching all secrets
under a given *path* (prefix) and upserting a secret value.
"""

import os
from typing import Dict, Final

import boto3
from botocore.exceptions import BotoCoreError, ClientError

from ..logger import get_logger

LOGGER = get_logger(__name__)

# --------------------------------------------------------------------------- #
# Named constants
# --------------------------------------------------------------------------- #
AWS_REGION_ENV: Final = "AWS_REGION"
DEFAULT_AWS_REGION: Final = "us-east-1"
SECRETS_PREFIX_ENV: Final = "ENV_SYNC_AWS_PREFIX"
DEFAULT_PREFIX: Final = ""  # empty string means fetch all secrets


class AwsSecretsManager:
    """
    Helper class to interact with AWS Secrets Manager.
    """

    def __init__(self, region_name: str = None, prefix: str = None):
        """
        Initialise the client.

        Parameters
        ----------
        region_name: str | None
            AWS region.  If ``None`` the value is read from the environment
            variable ``AWS_REGION`` or defaults to ``us-east-1``.
        prefix: str | None
            Optional secret name prefix used to filter secrets.
        """
        self.region = region_name or os.getenv(AWS_REGION_ENV, DEFAULT_AWS_REGION)
        self.prefix = prefix or os.getenv(SECRETS_PREFIX_ENV, DEFAULT_PREFIX)

        try:
            self.client = boto3.client("secretsmanager", region_name=self.region)
            LOGGER.info("Initialized AWS Secrets Manager client (region=%s)", self.region)
        except (BotoCoreError, ClientError) as exc:
            LOGGER.error("Failed to create AWS client: %s", exc)
            raise

    def _list_secret_arns(self) -> Dict[str, str]:
        """
        Retrieve a mapping of secret name → ARN for all secrets that match
        the configured prefix.

        Returns
        -------
        dict[str, str]
            Secret name to ARN.
        """
        paginator = self.client.get_paginator("list_secrets")
        secret_map: Dict[str, str] = {}

        try:
            for page in paginator.paginate():
                for secret in page.get("SecretList", []):
                    name = secret["Name"]
                    if name.startswith(self.prefix):
                        secret_map[name] = secret["ARN"]
        except (BotoCoreError, ClientError) as exc:
            LOGGER.error("Error listing AWS secrets: %s", exc)
            raise

        LOGGER.debug("Discovered %d AWS secrets with prefix '%s'", len(secret_map), self.prefix)
        return secret_map

    def get_secrets(self) -> Dict[str, str]:
        """
        Fetch all secrets (as plain text key/value pairs) that match the
        configured prefix.

        Returns
        -------
        dict[str, str]
            Mapping of secret name (without prefix) → secret string.
        """
        secrets: Dict[str, str] = {}
        secret_map = self._list_secret_arns()

        for full_name, arn in secret_map.items():
            try:
                response = self.client.get_secret_value(SecretId=arn)
                secret_string = response.get("SecretString", "")
                # Strip the prefix for a clean key name
                key = full_name[len(self.prefix) :] if self.prefix else full_name
                secrets[key] = secret_string
            except (BotoCoreError, ClientError) as exc:
                LOGGER.error("Failed to retrieve secret %s: %s", full_name, exc)
                continue

        LOGGER.info("Fetched %d secrets from AWS", len(secrets))
        return secrets

    def put_secret(self, key: str, value: str) -> None:
        """
        Create or update a secret in AWS Secrets Manager.

        Parameters
        ----------
        key: str
           