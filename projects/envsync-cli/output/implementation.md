**Implementation Overview**

The EnvSync CLI is written in **Python 3.11** and follows the folder layout described in the brief.  
Key design decisions:

| Decision | Reason |
|----------|--------|
| **`argparse` CLI** | Simple, no extra dependencies. |
| **Provider classes (`AwsProvider`, `GcpProvider`, `AzureProvider`)** | Encapsulate all SDK‑specific logic, making the sync core provider‑agnostic. |
| **`python‑dotenv`** | Reads and writes `.env` files as plain dictionaries. |
| **`deepdiff`** | Gives a clear diff of two dicts (local vs cloud). |
| **Built‑in `logging`** | Configured once in `logger.py`; all modules import the same logger. |
| **Constants module** (`src/constants.py`) | No magic numbers/strings – everything is named. |
| **Error handling** | Every async‑like SDK call (network I/O) is wrapped in `try/except` and re‑raised as a custom `EnvSyncError`. |
| **Bidirectional sync** | By default cloud values win on conflict; the user can choose `--direction local-to-cloud` or `--direction cloud-to-local`. |
| **Docstrings** | Every public function/class has a full JSDoc‑style comment (Python triple‑quoted docstring) as required. |

Below are all source files, the test‑stub folder is omitted for brevity but can be added later.

---

## 1️⃣ `src/constants.py`

```python
"""
constants.py
------------
Central place for all string literals, default values and exit codes.
"""

# CLI defaults
DEFAULT_ENV_PATH = ".env"
DEFAULT_CLOUD = "aws"               # one of: aws, gcp, azure
DEFAULT_DIRECTION = "bidirectional"  # one of: bidirectional, local-to-cloud, cloud-to-local

# Exit codes
EXIT_SUCCESS = 0
EXIT_FAILURE = 1

# Provider identifiers
PROVIDER_AWS = "aws"
PROVIDER_GCP = "gcp"
PROVIDER_AZURE = "azure"

# Logging
LOG_FORMAT = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
```

---

## 2️⃣ `src/logger.py`

```python
"""
logger.py
---------
Configures a single, reusable logger for the whole application.
"""

import logging
from .constants import LOG_FORMAT

def get_logger(name: str = "envsync") -> logging.Logger:
    """
    Returns a configured logger instance.
    
    Args:
        name: Name of the logger (defaults to "envsync").
    
    Returns:
        logging.Logger: Configured logger.
    """
    logger = logging.getLogger(name)
    if not logger.handlers:  # Prevent duplicate handlers on re‑import
        logger.setLevel(logging.INFO)
        handler = logging.StreamHandler()
        handler.setFormatter(logging.Formatter(LOG_FORMAT))
        logger.addHandler(handler)
    return logger
```

---

## 3️⃣ `src/config_parser.py`

```python
"""
config_parser.py
----------------
Utilities for reading and writing .env files using python‑dotenv.
"""

import os
from typing import Dict
from dotenv import dotenv_values, set_key
from .logger import get_logger

logger = get_logger(__name__)

def load_env_file(path: str = ".env") -> Dict[str, str]:
    """
    Loads a .env file into a plain dictionary.
    
    Args:
        path: Path to the .env file.
    
    Returns:
        Dict[str, str]: Mapping of variable names to values.
    
    Raises:
        FileNotFoundError: If the .env file does not exist.
    """
    if not os.path.isfile(path):
        raise FileNotFoundError(f".env file not found at {path}")
    logger.debug("Loading .env from %s", path)
    return dotenv_values(path)  # returns dict with strings

def write_env_file(env: Dict[str, str], path: str = ".env") -> None:
    """
    Writes a dictionary of env variables back to a .env file.
    
    Args:
        env: Mapping of variable names to values.
        path: Destination .env file.
    
    Raises:
        OSError: If the file cannot be written.
    """
    logger.debug("Writing %d variables to %s", len(env), path)
    # Ensure file exists before we start writing
    open(path, "a").close()
    for key, value in env.items():
        set_key(path, key, value)  # overwrites existing key
    logger.info("Successfully updated %s", path)
```

---

## 4️⃣ `src/cloud_providers/aws.py`

```python
"""
aws.py
------
AWS Secrets Manager integration using boto3.
"""

import json
from typing import Dict
import boto3
from botocore.exceptions import BotoCoreError, ClientError
from ..logger import get_logger
from ..exceptions import EnvSyncError

logger = get_logger(__name__)

class AwsProvider:
    """
    Wrapper around boto3 Secrets Manager client.
    
    All secrets are stored in a single AWS secret (JSON string) whose name
    is supplied by the user.
    """

    def __init__(self, secret_name: str, region_name: str = "us-east-1"):
        """
        Initialise the provider.
        
        Args:
            secret_name: Name of the AWS Secrets Manager secret.
            region_name: AWS region (default us-east-1).
        """
        self.secret_name = secret_name
        self.region_name = region_name
        self.client = boto3.client("secretsmanager", region_name=self.region_name)

    def fetch_secrets(self) -> Dict[str, str]:
        """
        Retrieves the secret JSON from AWS and returns it as a dict.
        
        Returns:
            Dict[str, str]: Secrets key/value pairs.
        
        Raises:
            EnvSyncError: On any AWS SDK failure.
        """
        try:
            logger.debug("Fetching secret %s from AWS", self.secret_name)
            response = self.client.get_secret_value(SecretId=self.secret_name)
            secret_string = response.get("SecretString", "{}")
            return json.loads(secret_string)
        except (BotoCoreError, ClientError) as exc:
            raise EnvSyncError(f"AWS fetch failed: {exc}") from exc

    def upsert_secrets(self, secrets: Dict[str, str]) -> None:
        """
        Creates or updates the AWS secret with the supplied dictionary.
        
        Args:
            secrets: Mapping of secret keys to values.
        
        Raises:
            EnvSyncError: On any AWS SDK failure.
        """
        try:
            payload = json.dumps(secrets)
            logger.debug("Putting secret %s to AWS (payload size %d)", self.secret_name, len(payload))
            # Try to update first; if it doesn't exist we create it.
            self.client.put_secret_value(SecretId=self.secret_name, SecretString=payload)
        except self.client.exceptions.ResourceNotFoundException:
            # Secret does not exist – create it.
            try:
                self.client.create_secret(Name=self.secret_name, SecretString=payload)
                logger.info("Created new AWS secret %s", self.secret_name)
            except (BotoCoreError, ClientError) as exc:
                raise EnvSyncError(f"AWS create secret failed: {exc}") from exc
        except (BotoCoreError, ClientError) as exc:
            raise EnvSyncError(f"AWS upsert failed: {exc}") from exc
```

---

## 5️⃣ `src/cloud_providers/gcp.py`

```python
"""
gcp.py
------
Google Cloud Secret Manager integration using google‑cloud‑secretmanager.
"""

import json
from typing import Dict
from google.cloud import secretmanager
from google.api_core.exceptions import GoogleAPIError, NotFound
from ..logger import