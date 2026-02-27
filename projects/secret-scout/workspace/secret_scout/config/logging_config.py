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
