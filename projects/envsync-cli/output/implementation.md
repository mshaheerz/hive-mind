## 📁 Project Files

Below are **all** source files required for the **EnvSync CLI**.  
Each file starts with a short header comment, every public function has a full docstring (Python‑style JSDoc‑like), constants are named, and every async‑like operation (network calls) is wrapped in `try/except` with proper logging.

---

### `src/__init__.py`
```python
# src/__init__.py
"""
EnvSync package initializer.
Exports the public API for the CLI tool.
"""
```

---

### `src/logger.py`
```python
# src/logger.py
"""
Provides a configured, module‑level logger for the EnvSync CLI.
All other modules import `get_logger()` to obtain the same logger instance.
"""

import logging
import sys

_LOGGER_NAME = "envsync"
_LOG_LEVEL = logging.INFO
_LOG_FORMAT = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"


def get_logger() -> logging.Logger:
    """
    Returns a singleton logger configured with a stream handler.

    Returns:
        logging.Logger: Configured logger instance.
    """
    logger = logging.getLogger(_LOGGER_NAME)
    if not logger.handlers:  # Prevent duplicate handlers on repeated imports
        logger.setLevel(_LOG_LEVEL)
        handler = logging.StreamHandler(sys.stdout)
        formatter = logging.Formatter(_LOG_FORMAT)
        handler.setFormatter(formatter)
        logger.addHandler(handler)
    return logger
```

---

### `src/config_parser.py`
```python
# src/config_parser.py
"""
Utility functions for reading and writing `.env` files using python‑dotenv.
All secrets are kept in memory as a plain `dict[str, str]`.
"""

from pathlib import Path
from typing import Dict

from dotenv import dotenv_values, set_key
from src.logger import get_logger

LOGGER = get_logger()


def load_env_file(env_path: Path) -> Dict[str, str]:
    """
    Load a .env file into a dictionary.

    Args:
        env_path (Path): Path to the .env file.

    Returns:
        Dict[str, str]: Mapping of key → value from the file.

    Raises:
        FileNotFoundError: If the file does not exist.
        OSError: If the file cannot be read.
    """
    if not env_path.is_file():
        raise FileNotFoundError(f".env file not found at {env_path}")

    try:
        env_dict = dotenv_values(dotenv_path=env_path)
        LOGGER.debug("Loaded %d entries from %s", len(env_dict), env_path)
        return env_dict
    except Exception as exc:
        LOGGER.error("Failed to load .env file: %s", exc)
        raise


def write_env_file(env_path: Path, data: Dict[str, str]) -> None:
    """
    Write a dictionary of secrets back to a .env file.
    Existing keys are overwritten; new keys are appended.

    Args:
        env_path (Path): Path to the .env file.
        data (Dict[str, str]): Mapping of key → value to write.

    Raises:
        OSError: If the file cannot be written.
    """
    try:
        # Ensure file exists so set_key works
        env_path.touch(exist_ok=True)
        for key, value in data.items():
            set_key(env_path, key, value)
        LOGGER.info("Successfully wrote %d entries to %s", len(data), env_path)
    except Exception as exc:
        LOGGER.error("Failed to write .env file: %s", exc)
        raise
```

---

### `src/cloud_providers/__init__.py`
```python
# src/cloud_providers/__init__.py
"""
Exports the concrete provider classes for dynamic import.
"""

from .aws import AwsSecretsManager
from .gcp import GcpSecretManager
from .azure import AzureKeyVault
```

---

### `src/cloud_providers/aws.py`
```python
# src/cloud_providers/aws.py
"""
AWS Secrets Manager integration.
Wraps boto3 client calls with error handling and a simple dict interface.
"""

import os
from typing import Dict

import boto3
from botocore.exceptions import BotoCoreError, ClientError

from src.logger import get_logger

LOGGER = get_logger()


class AwsSecretsManager:
    """
    Minimal wrapper around AWS Secrets Manager.
    Secrets are stored as a single JSON string in a secret named `ENV_SYNC_SECRET`.
    """

    _DEFAULT_SECRET_NAME = "envsync-secrets"

    def __init__(self, secret_name: str = _DEFAULT_SECRET_NAME, region: str = None):
        """
        Initialise the AWS client.

        Args:
            secret_name (str): Name of the secret that holds the env dict.
            region (str, optional): AWS region. If omitted, boto3 uses its default chain.
        """
        self.secret_name = secret_name
        self.client = boto3.client("secretsmanager", region_name=region)

    def _get_secret_string(self) -> str:
        """
        Retrieve the raw secret string from AWS.

        Returns:
            str: JSON string representing the secret dictionary.

        Raises:
            RuntimeError: If the secret cannot be fetched.
        """
        try:
            response = self.client.get_secret_value(SecretId=self.secret_name)
            secret = response.get("SecretString", "")
            LOGGER.debug("Fetched secret %s from AWS", self.secret_name)
            return secret
        except (BotoCoreError, ClientError) as exc:
            LOGGER.error("AWS get_secret_value failed: %s", exc)
            raise RuntimeError(f"Unable to retrieve secret {self.secret_name}") from exc

    def get_secrets(self) -> Dict[str, str]:
        """
        Return the secret payload as a dictionary.

        Returns:
            Dict[str, str]: Mapping of key → value.

        Raises:
            RuntimeError: If the secret payload cannot be parsed.
        """
        import json

        secret_str = self._get_secret_string()
        if not secret_str:
            return {}
        try:
            data = json.loads(secret_str)
            if not isinstance(data, dict):
                raise ValueError("Secret payload is not a JSON object")
            return {str(k): str(v) for k, v in data.items()}
        except json.JSONDecodeError as exc:
            LOGGER.error("Failed to decode AWS secret JSON: %s", exc)
            raise RuntimeError("Invalid JSON in AWS secret") from exc

    def put_secrets(self, secrets: Dict[str, str]) -> None:
        """
        Store the provided dictionary as the secret's JSON payload.

        Args:
            secrets (Dict[str, str]): Mapping to store.

        Raises:
            RuntimeError: If the put operation fails.
        """
        import json

        payload = json.dumps(secrets)
        try:
            self.client.put_secret_value(SecretId=self.secret_name, SecretString=payload)
            LOGGER.info("Updated AWS secret %s with %d entries", self.secret_name, len(secrets))
        except (BotoCoreError, ClientError) as exc:
            LOGGER.error("AWS put_secret_value failed: %s", exc)
            raise RuntimeError(f"Unable to update secret {self.secret_name}") from exc
```

---

### `src/cloud_providers/gcp.py`
```python
# src/cloud_providers/gcp.py
"""
GCP Secret Manager integration.
Stores the whole .env as a single secret version with JSON payload.
"""

import json
from typing import Dict

from google.api_core.exceptions import GoogleAPIError
from google.cloud import secretmanager

from src