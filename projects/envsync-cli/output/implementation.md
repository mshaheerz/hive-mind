**File: `src/__init__.py`**
```python
"""
EnvSync CLI package initializer.
"""
# No runtime initialisation required.
```

---

**File: `src/logger.py`**
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
from typing import Dict

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
        if not logger.handlers:
            logger.addHandler(file_handler)
            logger.addHandler(console_handler)

        _LOGGERS[name] = logger
        return logger
```

---

**File: `src/config_parser.py`**
```python
"""
Utilities for parsing and writing .env configuration files.
"""

import os
import re
from pathlib import Path
from typing import Dict

# Regular expression for parsing a single .env line
_ENV_LINE_RE = re.compile(r"""
    ^\s*
    (?P<key>[A-Za-z_][A-Za-z0-9_]*)          # key
    \s*=\s*
    (?P<value>                               # value
        (?:'[^']*') |                         # single quoted
        (?:"[^"]*") |                         # double quoted
        [^\s#]+                               # unquoted
    )
    \s*(?:#.*)?$                              # optional comment
""", re.VERBOSE)


def parse_env_file(file_path: Path) -> Dict[str, str]:
    """
    Parse a .env file into a dictionary.

    Parameters
    ----------
    file_path : Path
        Path to the .env file.

    Returns
    -------
    Dict[str, str]
        Mapping of key to value.
    """
    env: Dict[str, str] = {}
    if not file_path.exists():
        return env

    with file_path.open("r", encoding="utf-8") as fh:
        for line in fh:
            match = _ENV_LINE_RE.match(line)
            if match:
                key = match.group("key")
