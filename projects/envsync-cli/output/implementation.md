**Implementation Overview**

The **EnvSync CLI** is a Python‑based command‑line tool that can **push**, **pull**, or **bidirectionally sync** a local `.env` file with a secret stored in one of the three major cloud secret managers (AWS Secrets Manager, GCP Secret Manager, Azure Key Vault).  

Key design choices:

| Decision | Reason |
|----------|--------|
| **Python** + official SDKs (`boto3`, `google-cloud-secretmanager`, `azure-identity`, `azure-keyvault-secrets`) | Mature, well‑documented libraries and easy to ship as a single CLI. |
| **python‑dotenv** | Simple parsing/writing of `.env` files. |
| **`deepdiff`** | Provides a clear, readable diff between two dictionaries for the sync algorithm. |
| **`argparse`** + **`logging`** | Standard library, no extra runtime dependencies for CLI handling and structured logs. |
| **All constants in `constants.py`** | Avoids magic numbers/strings and makes the code configurable. |
| **Full error handling** on every external call (cloud SDK, file I/O) | Guarantees the CLI never crashes silently. |
| **Docstrings** (Python‑style) and top‑file comments | Satisfy the “JSDoc‑style” documentation rule in a Python‑friendly way. |

Below are **all source files**, a minimal **test suite**, and a **requirements.txt** ready for `pip install -r requirements.txt`.

---

## 1. `src/constants.py`

```python
# src/constants.py
"""
Constants used across the EnvSync CLI project.
"""

# Default location of the local .env file
DEFAULT_ENV_PATH = ".env"

# Name of the secret that stores the JSON representation of the .env key‑value pairs
DEFAULT_SECRET_NAME = "envsync-secrets"

# Logging format
LOG_FORMAT = "%(asctime)s - %(levelname)s - %(name)s - %(message)s"

# DeepDiff configuration
DEEPCMP_IGNORE_ORDER = True
```

---

## 2. `src/logger.py`

```python
# src/logger.py
"""
Provides a configured logger for the EnvSync CLI.
"""

import logging
from .constants import LOG_FORMAT

def get_logger(name: str = "envsync") -> logging.Logger:
    """
    Returns a module‑level logger with a consistent format and INFO level.

    Args:
        name: Logger name (defaults to "envsync").

    Returns:
        Configured ``logging.Logger`` instance.
    """
    logger = logging.getLogger(name)
    if not logger.handlers:
        logger.setLevel(logging.INFO)
        handler = logging.StreamHandler()
        handler.setFormatter(logging.Formatter(LOG_FORMAT))
        logger.addHandler(handler)
    return logger
```

---

## 3. `src/config_parser.py`

```python
# src/config_parser.py
"""
Utilities for reading and writing .env files using python‑dotenv.
"""

from pathlib import Path
from typing import Dict
from dotenv import dotenv_values, set_key, unset_key
from .logger import get_logger

LOGGER = get_logger(__name__)

def load_env_file(env_path: str) -> Dict[str, str]:
    """
    Loads a .env file and returns its contents as a dictionary.

    Args:
        env_path: Path to the .env file.

    Returns:
        Dictionary of key/value pairs.

    Raises:
        FileNotFoundError: If the file does not exist.
    """
    path = Path(env_path)
    if not path.is_file():
        LOGGER.error("Env file not found: %s", env_path)
        raise FileNotFoundError(f".env file not found at {env_path}")

    LOGGER.debug("Loading .env from %s", env_path)
    return dotenv_values(env_path)  # returns dict[str, str]

def write_env_file(env_path: str, data: Dict[str, str]) -> None:
    """
    Writes a dictionary of secrets to a .env file, overwriting existing keys
    and preserving comments/ordering where possible.

    Args:
        env_path: Destination .env file path.
        data: Mapping of key/value pairs to write.

    Raises:
        OSError: If the file cannot be written.
    """
    path = Path(env_path)
    try:
        # Ensure the file exists (creates empty file if missing)
        path.touch(exist_ok=True)
    except OSError as exc:
        LOGGER.error("Unable to touch .env file %s: %s", env_path, exc)
        raise

    # Update each key individually – this preserves any existing comments
    for key, value in data.items():
        set_key(env_path, key, value)

    # Remove any keys that are in the file but not in `data`
    existing = dotenv_values(env_path)
    for key in set(existing) - set(data):
        unset_key(env_path, key)

    LOGGER.info("Successfully wrote %d entries to %s", len(data), env_path)
```

---

## 4. `src/cloud_providers/aws.py`

```python
# src/cloud_providers/aws.py
"""
AWS Secrets Manager integration.
"""

import json
from typing import Dict
import boto3
from botocore.exceptions import BotoCoreError, ClientError
from ..logger import get_logger

LOGGER = get_logger(__name__)

class AwsProvider:
    """
    Wrapper around AWS Secrets Manager for a single JSON‑encoded secret.
    """

    def __init__(self, secret_name: str):
        """
        Initialise the provider.

        Args:
            secret_name: Name (or ARN) of the secret that holds the JSON payload.
        """
        self.secret_name = secret_name
        self.client = boto3.client("secretsmanager")
        LOGGER.debug("AWS provider initialised for secret %s", secret_name)

    def get_secrets(self) -> Dict[str, str]:
        """
        Retrieve the secret payload and decode it into a dict.

        Returns:
            Mapping of secret keys to values.

        Raises:
            RuntimeError: If the secret cannot be fetched or decoded.
        """
        try:
            response = self.client.get_secret_value(SecretId=self.secret_name)
            secret_string = response.get("SecretString", "{}")
            LOGGER.debug("Fetched secret from AWS: %s", self.secret_name)
            return json.loads(secret_string)
        except (BotoCoreError, ClientError) as exc:
            LOGGER.error("AWS get_secret_value failed: %s", exc)
            raise RuntimeError(f"Failed to retrieve secret {self.secret_name}") from exc
        except json.JSONDecodeError as exc:
            LOGGER.error("Invalid JSON in AWS secret %s: %s", self.secret_name, exc)
            raise RuntimeError("Secret payload is not valid JSON") from exc

    def put_secrets(self, secrets: Dict[str, str]) -> None:
        """
        Store the provided dict as a JSON string in the secret.

        Args:
            secrets: Mapping of key/value pairs to store.

        Raises:
            RuntimeError: If the secret cannot be created or updated.
        """
        payload = json.dumps(secrets)
        try