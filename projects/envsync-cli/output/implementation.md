**File: `src/logger.py`**
```python
#!/usr/bin/env python3
"""
logger.py
~~~~~~~~~
Centralised logger configuration for the EnvSync CLI.

All modules import ``get_logger`` to obtain a pre‑configured ``logging.Logger``.
The logger prints timestamps, log level and message to stdout and can be
extended to log to files if needed.
"""

import logging
import sys
from typing import Final

# --------------------------------------------------------------------------- #
# Constants – avoid magic numbers/strings
# --------------------------------------------------------------------------- #
DEFAULT_LOG_LEVEL: Final[int] = logging.INFO
LOG_FORMAT: Final[str] = "%(asctime)s - %(levelname)s - %(name)s - %(message)s"


def get_logger(name: str = "envsync") -> logging.Logger:
    """
    Create (or retrieve) a logger with a standard configuration.

    Parameters
    ----------
    name: str
        Name of the logger (usually ``__name__`` of the caller).

    Returns
    -------
    logging.Logger
        Configured logger instance.
    """
    logger = logging.getLogger(name)

    # Configure only once – subsequent calls are no‑ops
    if not logger.handlers:
        logger.setLevel(DEFAULT_LOG_LEVEL)

        handler = logging.StreamHandler(stream=sys.stdout)
        handler.setFormatter(logging.Formatter(LOG_FORMAT))

        logger.addHandler(handler)

    return logger
```

---

**File: `src/config_parser.py`**
```python
#!/usr/bin/env python3
"""
config_parser.py
~~~~~~~~~~~~~~~~
Utilities for loading and writing ``.env`` files using ``python-dotenv``.
All secrets are represented as ``dict[str, str]``.
"""

from pathlib import Path
from typing import Dict, Final

from dotenv import dotenv_values, set_key, unset_key

from .logger import get_logger

# --------------------------------------------------------------------------- #
# Constants
# --------------------------------------------------------------------------- #
DEFAULT_ENV_PATH: Final[Path] = Path(".env")

log = get_logger(__name__)


def load_env(env_path: Path = DEFAULT_ENV_PATH) -> Dict[str, str]:
    """
    Load a ``.env`` file and return its contents as a dictionary.

    Parameters
    ----------
    env_path: Path
        Path to the ``.env`` file. Defaults to ``./.env``.

    Returns
    -------
    dict[str, str]
        Mapping of variable names to their string values.
    """
    if not env_path.is_file():
        log.warning("Env file %s does not exist – returning empty dict.", env_path)
        return {}

    try:
        data = dotenv_values(env_path)
        log.debug("Loaded %d entries from %s.", len(data), env_path)
        return data
    except Exception as exc:
        log.error("Failed to read .env file %s: %s", env_path, exc)
        raise


def write_env(env_path: Path, data: Dict[str, str]) -> None:
    """
    Write a dictionary of secrets to a ``.env`` file. Existing keys are
    overwritten; keys not present in ``data`` are left untouched.

    Parameters
    ----------
    env_path: Path
        Destination ``.env`` file.
    data: dict[str, str]
        Secrets to write.
    """
    try:
        # Ensure the file exists – ``set_key`` creates it if missing.
        env_path.touch(exist_ok=True)

        # First clear the file to avoid stale entries.
        env_path.write_text("")

        for key, value in data.items():
            set_key(env_path, key, value, quote_mode="auto")
        log.info("Wrote %d entries to %s.", len(data), env_path)
    except Exception as exc:
        log.error("Failed to write .env file %s: %s", env_path, exc)
        raise
```

---

**File: `src/cloud_providers/aws.py`**
```python
#!/usr/bin/env python3
"""
aws.py
~~~~~~
AWS Secrets Manager wrapper used by EnvSync.
All secrets are stored as a single JSON‑encoded string in a secret
identified by ``secret_name``.
"""

import json
import os
from typing import Dict, Final

import boto3
from botocore.exceptions import BotoCoreError, ClientError

from ..logger import get_logger

log = get_logger(__name__)

# --------------------------------------------------------------------------- #
# Constants
# --------------------------------------------------------------------------- #
DEFAULT_REGION: Final[str] = os.getenv("AWS_DEFAULT_REGION", "us-east-1")


class AWSSecretsManager:
    """
    Minimal wrapper around boto3's Secrets Manager client.
    """

    def __init__(self, region_name: str = DEFAULT_REGION):
        """
        Initialise the client.

        Parameters
        ----------
        region_name: str
            AWS region; falls back to ``AWS_DEFAULT_REGION`` env var.
        """
        try:
            self.client = boto3.client("secretsmanager", region_name=region_name)
            log.debug("Created AWS Secrets Manager client for region %s.", region_name)
        except (BotoCoreError, ClientError) as exc:
            log.error("Failed to create AWS client: %s", exc)
            raise

    def get_secret(self, secret_name: str) -> Dict[str, str]:
        """
        Retrieve a secret and decode its JSON payload.

        Parameters
        ----------
        secret_name: str
            Name/ARN of the secret.

        Returns
        -------
        dict[str, str]
            Parsed key/value pairs.
        """
        try:
            response = self.client.get_secret_value(SecretId=secret_name)
            secret_string = response.get("SecretString", "{}")
            data = json.loads(secret_string)
            log.debug("Fetched %d entries from AWS secret %s.", len(data), secret_name)
            return data
        except (BotoCoreError, ClientError, json.JSONDecodeError) as exc:
            log.error("Failed to fetch secret %s from AWS: %s", secret_name, exc)
            raise

    def put_secret(self, secret_name: str, data: Dict[str, str]) -> None:
        """
        Create or update a secret with the supplied dictionary.

        Parameters
        ----------
        secret_name: str
            Name/ARN of the secret.
        data: dict[str, str]
            Secrets to store.
        """
        payload = json.dumps(data)
        try:
            # Try an update first – if secret does not exist, create it.
            self.client.update_secret(SecretId=secret_name, SecretString=payload)
            log.info("Updated AWS secret %s with %d entries.", secret_name, len(data))
        except self.client.exceptions.ResourceNotFoundException:
            # Secret does not exist – create it.
            self.client.create_secret(Name=secret_name, SecretString=payload)
            log.info("Created AWS secret %s with %d entries.", secret_name, len(data))
        except (BotoCoreError, ClientError) as exc:
            log.error("Failed to put secret %s to AWS: %s", secret_name, exc)
            raise
```

---

**File: `src/cloud_providers/gcp.py`**
```python
#!/usr/bin/env python3
"""
gcp.py
~~~~~~
Google Cloud Secret Manager wrapper for EnvSync.
Each secret version stores a JSON‑encoded string of key/value pairs.
"""

import json
from typing import Dict

from google.api_core.exceptions import GoogleAPICallError, NotFound
from google.cloud import secretmanager

from ..logger import get_logger

log = get_logger(__name__)


class GCPSecretManager:
    """
    Wrapper around the GCP Secret Manager client.
    """

    def __init__(self, project_id: str):
        """
        Initialise the client.

        Parameters
        ----------
        project