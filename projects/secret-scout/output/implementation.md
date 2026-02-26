Below is a **complete, production‑ready implementation** of **Secret Scout**.  
All files are shown with full content, each file starts with a top‑level comment describing its purpose, every public function/class has a detailed docstring, constants are defined in a dedicated `settings.py` module (no magic numbers), and every async‑like operation (file I/O, DB access) is wrapped in proper error handling.  

---

## 1️⃣ File: `secret_scout/src/utils/logging.py`
```python
"""
utils.logging
==============

Centralised helper for obtaining a configured ``logging.Logger`` instance.
All modules import ``get_logger`` to ensure a single logging configuration
across the project.
"""

import logging
import logging.config
from pathlib import Path
from typing import Final

# --------------------------------------------------------------------------- #
# Constants (no magic numbers)
# --------------------------------------------------------------------------- #
DEFAULT_LOGGING_CONFIG_PATH: Final[Path] = Path(__file__).resolve().parents[2] / "config" / "logging_config.py"

def _load_logging_config() -> None:
    """
    Load the logging configuration defined in ``config/logging_config.py``.
    If the file cannot be imported, fall back to a very simple configuration.
    """
    try:
        import importlib.util

        spec = importlib.util.spec_from_file_location("logging_config", str(DEFAULT_LOGGING_CONFIG_PATH))
        if spec and spec.loader:
            config_module = importlib.util.module_from_spec(spec)
            spec.loader.exec_module(config_module)  # type: ignore
            logging.config.dictConfig(config_module.LOGGING_CONFIG)  # type: ignore
        else:
            raise ImportError("Unable to load logging config module.")
    except Exception as exc:  # pragma: no cover – defensive fallback
        logging.basicConfig(level=logging.INFO)
        logging.getLogger(__name__).warning("Failed to load custom logging config: %s", exc)

# Load the configuration once at import time
_load_logging_config()


def get_logger(name: str = __name__) -> logging.Logger:
    """
    Return a ``logging.Logger`` instance with the project‑wide configuration.

    Parameters
    ----------
    name:
        The name of the logger – typically ``__name__`` of the caller.

    Returns
    -------
    logging.Logger
        Configured logger.
    """
    return logging.getLogger(name)
```

---

## 2️⃣ File: `secret_scout/config/settings.py`
```python
"""
config.settings
================

Global constants used throughout the project.  Keeping them in a single
module makes it easy to adjust detection behaviour without touching the
core logic.
"""

from pathlib import Path
from typing import Final, Dict, Pattern
import re

# --------------------------------------------------------------------------- #
# Directory constants
# --------------------------------------------------------------------------- #
PROJECT_ROOT: Final[Path] = Path(__file__).resolve().parents[1]

# --------------------------------------------------------------------------- #
# Secret detection patterns
# --------------------------------------------------------------------------- #
# Each entry maps a human‑readable name to a compiled regular expression.
# The patterns aim for a good balance between detection rate and false‑positives.
SECRET_PATTERNS: Final[Dict[str, Pattern]] = {
    # AWS Access Key ID – 20 characters, starts with AKIA, ASIA, etc.
    "AWS_ACCESS_KEY": re.compile(r"AKIA[0-9A-Z]{16}"),
    # AWS Secret Access Key – 40 base64‑like characters
    "AWS_SECRET_KEY": re.compile(r"(?i)aws_secret_access_key[^\\w]*([0-9a-zA-Z/+]{40})"),
    # Generic API key – 32+ alphanumeric characters, often with hyphens/underscores
    "GENERIC_API_KEY": re.compile(r"[A-Za-z0-9]{32,}"),
    # Slack token – starts with xoxb‑ or xoxp‑
    "SLACK_TOKEN": re.compile(r"xox[bp]-(?:[0-9a-zA-Z]{10,48})"),
    # Private RSA key header (simple heuristic)
    "RSA_PRIVATE_KEY": re.compile(r"-----BEGIN RSA PRIVATE KEY-----"),
    # Password assignment in code (e.g., password = "secret")
    "PASSWORD_ASSIGN": re.compile(r"""(?i)(?:password|pwd|secret)\s*=\s*["']([^"']{4,})["']"""),
}

# --------------------------------------------------------------------------- #
# Severity mapping – higher number = more severe
# --------------------------------------------------------------------------- #
SEVERITY_LEVELS: Final[Dict[str, int]] = {
    "RSA_PRIVATE_KEY": 5,      # Critical – private key exposed
    "AWS_SECRET_KEY": 4,       # High – full secret key
    "AWS_ACCESS_KEY": 3,       # Medium – can be combined with secret key
    "SLACK_TOKEN": 4,
    "GENERIC_API_KEY": 2,
    "PASSWORD_ASSIGN": 2,
}
```

---

## 3️⃣ File: `secret_scout/config/logging_config.py`
```python
"""
config.logging_config
=====================

Dictionary passed to ``logging.config.dictConfig`` to configure the
project‑wide logger.  The format is deliberately simple to keep the
dependency footprint low.
"""

LOGGING_CONFIG = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "standard": {
            "format": "%(asctime)s [%(levelname)s] %(name)s: %(message)s"
        }
    },
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
            "formatter": "standard",
            "level": "INFO"
        },
        "file": {
            "class": "logging.FileHandler",
            "formatter": "standard",
            "filename": "secret_scout.log",
            "level": "DEBUG",
        },
    },
    "loggers": {
        "": {  # root logger
            "handlers": ["console", "file"],
            "level": "DEBUG",
            "propagate": False,
        }
    },
}
```

---

## 4️⃣ File: `secret_scout/src/database/database.py`
```python
"""
database.database
=================

Thin wrapper around SQLite providing a context‑manager for safe
connections and a simple schema initialisation routine.
"""

import sqlite3
from pathlib import Path
from typing import ContextManager, Generator, Final
import datetime
import logging

from ..utils.logging import get_logger
from .scan_results import ScanResult

# --------------------------------------------------------------------------- #
# Constants
# --------------------------------------------------------------------------- #
DB_FILE: Final[