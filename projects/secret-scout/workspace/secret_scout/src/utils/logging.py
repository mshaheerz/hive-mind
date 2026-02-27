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
