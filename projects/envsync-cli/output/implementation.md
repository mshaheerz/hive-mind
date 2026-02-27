**File: `src/logger.py`**
```python
"""
logger.py
~~~~~~~~~
Provides a configured, module‑level logger for the EnvSync CLI.
All modules import ``get_logger`` and use the same logger instance.
"""

import logging
import sys
from typing import Final

# ----------------------------------------------------------------------
# Named constants – no magic numbers/strings
# ----------------------------------------------------------------------
LOG_FORMAT: Final = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
DEFAULT_LEVEL: Final = logging.INFO


def _configure_root_logger() -> logging.Logger:
    """
    Configures the root logger with a stream handler.
    This function is called once on import.
    """
    logger = logging.getLogger("envsync")
    logger.setLevel(DEFAULT_LEVEL)

    # Avoid adding multiple handlers if this module is reloaded
    if not logger.handlers:
        handler = logging.StreamHandler(sys.stdout)
        handler.setFormatter(logging.Formatter(LOG_FORMAT))
        logger.addHandler(handler)

    return logger


# Expose a single logger instance
_logger: logging.Logger = _configure_root_logger()


def get_logger(name: str | None = None) -> logging.Logger:
    """
    Returns a child logger of the EnvSync root logger.

    Args:
        name: Optional name for the child logger. If omitted, the root logger is returned.

    Returns:
        Configured ``logging.Logger`` instance.
    """
    return _logger.getChild(name) if name else _logger
```

---

**File: `src/config_parser.py`**
```python
"""
config_parser.py
~~~~~~~~~~~~~~~~
Utilities for reading and writing ``.env`` files using ``python-dotenv``.
All operations return plain ``dict`` objects for easy diffing.
"""

from pathlib import Path
from typing import Dict, Final

from dotenv import dotenv_values, set_key, unset_key
from logger import get_logger

# ----------------------------------------------------------------------
# Named constants
# ----------------------------------------------------------------------
DEFAULT_ENV_PATH: Final = Path(".env")
ENCODING: Final = "utf-8"

_logger = get_logger(__name__)


def load_env(env_path: Path = DEFAULT_ENV_PATH) -> Dict[str, str]:
    """
    Loads an ``.env`` file into a dictionary.

    Args:
        env_path: Path to the ``.env`` file. Defaults to ``./.env``.

    Returns:
        Mapping of environment variable names to values.

    Raises:
        FileNotFoundError: If the file does not exist.
        OSError: For any I/O error while reading the file.
    """
    try:
        if not env_path.is_file():
            raise FileNotFoundError(f".env file not found at {env_path}")

        env_dict = dotenv_values(dotenv_path=env_path, encoding=ENCODING)
        _logger.debug("Loaded %d entries from %s", len(env_dict), env_path)
        return env_dict
    except Exception as exc:
        _logger.error("Failed to load .env: %s", exc)
        raise


def write_env(env: Dict[str, str], env_path: Path = DEFAULT_ENV_PATH) -> None:
    """
    Writes a dictionary of environment variables back to an ``.env`` file.
    Existing keys are updated; new keys are appended; removed keys are deleted.

    Args:
        env: Mapping of variable names to values to be persisted.
        env_path: Destination file path. Defaults to ``./.env``.

    Raises:
        OSError: If the file cannot be written.
    """
    try:
        # Ensure the file exists – create empty if necessary
        env_path.touch(exist_ok=True)

        # Load current content to detect removals
        current = dotenv_values(dotenv_path=env_path, encoding=ENCODING)

        # Update / add keys
        for key, value in env.items():
            if current.get(key) != value:
                set_key(str(env_path), key, value, quote_mode="auto")
                _logger.debug("Set %s=%s", key, value)

        # Remove keys that are no longer present
        for key in set(current) - set(env):
            unset_key(str(env_path), key)
            _logger.debug("Unset %s", key)

        _logger.info("Successfully wrote %d entries to %s", len(env), env_path)
    except Exception as exc:
        _logger.error("Failed to write .env: %s", exc)
        raise
```

---

**File: `src/cloud_providers/aws.py`**
```python
"""
aws.py
~~~~~~
AWS Secrets Manager implementation for EnvSync.
Encapsulates all AWS‑specific operations behind a simple class interface.
"""

import json
from typing import Dict, Final

import boto3
from botocore.exceptions import BotoCoreError, ClientError

from logger import get_logger

# ----------------------------------------------------------------------
# Named constants
# ----------------------------------------------------------------------
DEFAULT_REGION: Final = "us-east-1"

_logger = get_logger(__name__)


class AwsSecretsManager:
    """
    Wrapper around boto3 client for AWS Secrets Manager.
    """

    def __init__(self, region_name: str = DEFAULT_REGION) -> None:
        """
        Initialise the boto3 client.

        Args:
            region_name: AWS region. Defaults to ``us-east-1``.
        """
        try:
            self.client = boto3.client("secretsmanager", region_name=region_name)
            _logger.debug("AWS Secrets Manager client created for region %s", region_name)
        except (BotoCoreError, ClientError) as exc:
            _logger.error("Failed to create AWS client: %s", exc)
            raise

    def get_secret(self, secret_name: str) -> Dict[str, str]:
        """
        Retrieve a secret from AWS Secrets Manager and decode it as JSON.

        Args:
            secret_name: Name or ARN of the secret.

        Returns:
            Dictionary of key/value pairs stored in the secret.

        Raises:
            RuntimeError: If the secret cannot be retrieved or is not JSON.
        """
        try:
            response = self.client.get_secret_value(SecretId=secret_name)
            secret_string = response.get("SecretString")
            if not secret_string:
                raise RuntimeError("SecretString is empty")
            secret_dict = json.loads(secret_string)
            _logger.debug("Fetched %d keys from AWS secret %s", len(secret_dict), secret_name)
            return secret_dict
        except (BotoCoreError, ClientError, json.JSONDecodeError) as exc:
            _logger.error("Error fetching AWS secret %s: %s", secret_name, exc)
            raise RuntimeError(f"Failed to retrieve secret {secret_name}") from exc

    def put_secret(self, secret_name: str, secret_dict: Dict[str, str]) -> None:
        """
        Create or update a secret in AWS Secrets Manager.

        Args:
            secret_name: Name or ARN of the secret.
            secret_dict: Mapping of key/value pairs to store.

        Raises:
            RuntimeError: If the put operation fails.
        """
        try:
            payload = json.dumps(secret_dict)
            # Try to update first; if it doesn't exist, create it.
            try:
                self.client.update_secret(SecretId=secret_name, SecretString=payload)
                _logger.info("Updated AWS secret %s", secret_name)
            except self.client.exceptions.ResourceNotFoundException:
                self.client.create_secret(Name=secret_name, SecretString=payload)
                _logger.info("Created AWS secret %s", secret_name)
       