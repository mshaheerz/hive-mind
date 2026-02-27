**Key Decisions**

| Decision | Reason |
|----------|--------|
| **Per‑name logger cache** | Avoids the global singleton bug and allows callers to obtain independent loggers. |
| **Thread‑safe creation** | Uses a `threading.Lock` to guarantee only one instance per name is created even in multi‑threaded scenarios. |
| **TimedRotatingFileHandler** | Prevents unbounded log growth by rotating logs daily and keeping a limited number of backups. |
| **Proper escaping of `.env` values** | Wraps values containing spaces, newlines, `#`, or quotes in double quotes and escapes internal quotes, ensuring a syntactically valid file. |
| **Atomic write with `os.replace`** | Guarantees that the file is either fully written or not at all, even on Windows. |
| **Tests for logger, parser, and provider** | Covers singleton behaviour, handler duplication, log level override, atomic writes, special‑character handling, and abstract‑class enforcement. |
| **Minimal CLI (`src/main.py`)** | Provides a usable entry point for future expansion without adding unnecessary complexity. |

---

## File list

```
src/
├── __init__.py
├── logger.py
├── config_parser.py
├── cloud_providers/
│   ├── __init__.py
│   ├── base.py
│   ├── aws.py
│   ├── gcp.py
│   └── azure.py
├── sync_mechanism.py
├── main.py
tests/
├── conftest.py
├── test_logger.py
├── test_config_parser.py
└── test_base_provider.py
requirements.txt
```

---

### `src/__init__.py`

```python
"""
EnvSync CLI package initializer.
"""
# No runtime initialisation required.
```

---

### `src/logger.py`

```python
"""
Centralised logger creation for EnvSync CLI.

Provides a thread‑safe per‑name logger factory that writes to a
daily‑rotating file and the console. Log level can be overridden
with the ``ENV_SYNC_LOG_LEVEL`` environment variable.
"""

import logging
import logging.handlers
import os
import threading
from pathlib import Path
from typing import Dict, Optional

# --------------------------------------------------------------------------- #
# Constants – no magic numbers
# --------------------------------------------------------------------------- #
DEFAULT_LOG_LEVEL = "INFO"
LOG_DIR_NAME = "logs"
LOG_FILE_NAME = "envsync.log"
ENV_LOG_LEVEL = "ENV_SYNC_LOG_LEVEL"

# Rotation settings
LOG_ROTATION_INTERVAL = "midnight"  # rotate at midnight
LOG_BACKUP_COUNT = 7               # keep 7 rotated log files

# --------------------------------------------------------------------------- #
# Internal state
# --------------------------------------------------------------------------- #
# Cache of loggers keyed by name
_LOGGERS: Dict[str, logging.Logger] = {}
# Lock to guard creation of new loggers
_LOCK = threading.Lock()


def _ensure_log_dir() -> Path:
    """
    Ensure that the log directory exists and return its Path.
    """
    log_dir = Path(__file__).resolve().parent.parent / LOG_DIR_NAME
    try:
        log_dir.mkdir(parents=True, exist_ok=True)
    except OSError as exc:
        raise RuntimeError(f"Failed to create log directory {log_dir}") from exc
    return log_dir


def get_logger(name: str = "envsync") -> logging.Logger:
    """
    Return a configured logger instance.

    Parameters
    ----------
    name : str
        Name of the logger (defaults to ``envsync``).

    Returns
    -------
    logging.Logger
        Configured logger instance. Subsequent calls with the same
        ``name`` return the same object. Different names produce
        independent loggers.
    """
    with _LOCK:
        if name in _LOGGERS:
            return _LOGGERS[name]

        # Create new logger
        logger = logging.getLogger(name)
        logger.setLevel(os.getenv(ENV_LOG_LEVEL, DEFAULT_LOG_LEVEL).upper())
        logger.propagate = False

        # File handler – rotate daily
        log_dir = _ensure_log_dir()
        log_file = log_dir / LOG_FILE_NAME
        file_handler = logging.handlers.TimedRotatingFileHandler(
            filename=str(log_file),
            when=LOG_ROTATION_INTERVAL,
            backupCount=LOG_BACKUP_COUNT,
            encoding="utf-8",
        )
        file_handler.setFormatter(
            logging.Formatter(
                "%(asctime)s %(levelname)s %(name)s %(message)s"
            )
        )

        # Console handler
        console_handler = logging.StreamHandler()
        console_handler.setFormatter(
            logging.Formatter("%(levelname)s %(message)s")
        )

        # Guard against duplicate handlers
        if not