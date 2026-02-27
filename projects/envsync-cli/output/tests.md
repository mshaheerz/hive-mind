**File: `tests/test_logger.py`**
```python
"""
Unit tests for src/logger.py
"""

import os
import logging
import threading
import tempfile
import shutil
from pathlib import Path
from importlib import import_module

import pytest

# Import the module under test
logger_module = import_module("src.logger")
get_logger = logger_module.get_logger
_LOGGERS = logger_module._LOGGERS
_LOCK = logger_module._LOCK
ENV_LOG_LEVEL = logger_module.ENV_LOG_LEVEL
DEFAULT_LOG_LEVEL = logger_module.DEFAULT_LOG_LEVEL


@pytest.fixture(autouse=True)
def clear_loggers(monkeypatch):
    """Ensure a clean state for each test."""
    monkeypatch.setitem(_LOGGERS, {}, None)
    monkeypatch.setattr(_LOCK, "acquire", _LOCK.acquire, raising=False)
    monkeypatch.setattr(_LOCK, "release", _LOCK.release, raising=False)


def test_get_logger_basic(monkeypatch):
    """A single call returns a Logger instance."""
    log = get_logger()
    assert isinstance(log, logging.Logger)
    assert log.name == "envsync"
    # Default level should be INFO unless overridden
    assert log.level == logging.getLevelName(DEFAULT_LOG_LEVEL.upper())


def test_get_logger_caching(monkeypatch):
    """Same name returns the same instance."""
    log1 = get_logger("mylogger")
    log2 = get_logger("mylogger")
    assert log1 is log2
    # Different names produce different loggers
    log3 = get_logger("otherlogger")
    assert log1 is not log3


def test_env_log_level_override(monkeypatch):
    """Setting ENV_SYNC_LOG_LEVEL overrides the default level."""
    monkeypatch.setenv(ENV_LOG_LEVEL, "debug")
    log = get_logger("level_test")
    assert log.level == logging.DEBUG


def test_propagate_false(monkeypatch):
    """Loggers should not propagate to root."""
    log = get_logger("no_propagate")
    assert log.propagate is False


def test_handlers_added_once(monkeypatch):
    """Handlers are added only once per logger."""
    log = get_logger("handler_test")
    # Initially two handlers: file + console
    assert len(log.handlers) == 2
    # Subsequent call should not add duplicates
    log2 = get_logger("handler_test")
    assert len(log2.handlers) == 2


def test_thread_safety(monkeypatch):
    """Concurrent calls to get_logger should return the same instance."""
    results = []

    def worker(name):
        results.append(get_logger(name))

    threads = [threading.Thread(target=worker, args=("concurrent",)) for _ in range(10)]
    for t in threads:
        t.start()
    for t in threads:
        t.join()

    assert all(r is results[0] for r in results)


def test_log_dir_creation(monkeypatch, tmp_path):
    """
    _ensure_log_dir should create the log directory relative to the
    package root. We monkeypatch the function to use a temporary directory.
    """
    original_path = Path(logger_module.__file__).resolve().parent.parent

    # Create a temporary directory to act as the package root
    temp_root = tmp_path / "package_root"
    temp_root.mkdir()
    # Monkeypatch the __file__ attribute so that _ensure_log_dir uses temp_root
    monkeypatch.setattr(logger_module, "__file__", str(temp_root / "logger.py"))

    # Call get_logger which internally calls _ensure_log_dir
    log = get_logger("temp_dir_test")
    # The log directory should be temp_root/logs
    expected_dir = temp_root / logger_module.LOG_DIR_NAME
    assert expected_dir.exists() and expected_dir.is_dir()


def test_get_logger_file_handler_properties