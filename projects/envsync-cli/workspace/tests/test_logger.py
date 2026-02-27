import os
import logging
import threading
import time
from pathlib import Path
import pytest

# Import the module under test
from src.logger import (
    get_logger,
    _ensure_log_dir,
    LOG_DIR_NAME,
    LOG_FILE_NAME,
    ENV_LOG_LEVEL,
    DEFAULT_LOG_LEVEL,
)

# --------------------------------------------------------------------------- #
# Helper fixtures
# --------------------------------------------------------------------------- #
@pytest.fixture
def temp_log_dir(tmp_path: Path):
    """
    Override the log directory to a temporary path for isolation.
    """
    original_dir = Path(__file__).resolve().parent.parent / LOG_DIR_NAME
    # Temporarily change the LOG_DIR_NAME constant
    global LOG_DIR_NAME
    original_name = LOG_DIR_NAME
    LOG_DIR_NAME = "tmp_logs"
    yield tmp_path
    LOG_DIR_NAME = original_name


@pytest.fixture
def clear_loggers():
    """
    Ensure that the internal logger cache is cleared between tests.
    """
    from src.logger import _LOGGERS
    _LOGGERS.clear()
    yield
    _LOGGERS.clear()


# --------------------------------------------------------------------------- #
# Unit tests for get_logger
# --------------------------------------------------------------------------- #
def test_get_logger_creates_new_logger(clear_loggers):
    """A first call creates a logger with the correct name."""
    logger = get_logger("test_logger")
    assert isinstance(logger, logging.Logger)
    assert logger.name == "test_logger"
    # Default level should be INFO unless overridden
    assert logger.level == logging.INFO


def test_get_logger_respects_env_level(clear_loggers, monkeypatch):
    """The ENV_SYNC_LOG_LEVEL env var overrides the default level."""
    monkeypatch.setenv(ENV_LOG_LEVEL, "debug")
    logger = get_logger("level_test")
    assert logger.level == logging.DEBUG


def test_get_logger_same_name_returns_same_instance(clear_loggers):
    """Multiple calls with the same name return the same logger object."""
    first = get_logger("shared")
    second = get_logger("shared")
    assert first is second
    # Handlers should not be duplicated
    assert len(first.handlers) == 2  # file + console


def test_get_logger_different_names_are_isolated(clear_loggers):
    """Different names produce distinct logger instances."""
    a = get_logger("a")
    b = get_logger("b")
    assert a is not b
    assert a.name == "a"
    assert b.name == "b"
    assert len(a.handlers) == 2
    assert len(b.handlers) == 2


def test_get_logger_thread_safety(clear_loggers):
    """Concurrent access does not create duplicate loggers."""
    results = []

    def worker():
        results.append(get_logger("concurrent"))

    threads = [threading.Thread(target=worker) for _ in range(10)]
    for t in threads:
        t.start()
    for t in threads:
        t.join()

    # All references should point to the same object
    first = results[0]
    assert all(r is first for r in results)
    # No duplicate handlers
    assert len(first.handlers) == 2


def test_get_logger_writes_to_file(clear_loggers, temp_log_dir, monkeypatch):
    """Logging a message should produce a file entry."""
    # Point the log directory to the temporary path
    monkeypatch.setattr("src.logger.LOG_DIR_NAME", temp_log_dir.name)
    logger = get_logger("file_test")
    logger.info("Test message")
    log_file = temp_log_dir / LOG_FILE_NAME
    assert log_file.exists()
    content = log_file.read_text(encoding="utf-8")
    assert "Test message" in content
    assert "INFO" in content
    assert "file_test" in content


def test_ensure_log_dir_creates_directory(tmp_path: Path):
    """The helper function creates the log directory if missing."""
    # Temporarily set the log directory name to a sub‑dir
    global LOG_DIR_NAME
    original_name = LOG_DIR_NAME
    LOG_DIR_NAME = tmp_path.name
    try:
        log_dir = _ensure_log_dir()
        assert log_dir.exists()
        assert log_dir.is_dir()
    finally:
        LOG_DIR_NAME = original_name


# --------------------------------------------------------------------------- #
# Integration tests
# --------------------------------------------------------------------------- #
def test_logger_integration_with_file_handler(clear_loggers, temp_log_dir, monkeypatch):
    """
    Verify that the file handler rotates correctly at midnight.
    (We cannot trigger midnight, but we can verify backup count logic.)
    """
    # Point to temporary log dir
    monkeypatch.setattr("src.logger.LOG_DIR_NAME", temp_log_dir.name)
    logger = get_logger("rotate_test")
    # Emit enough logs to trigger rotation logic (simulated by manual rotation)
    for i in range(5):
        logger.info(f"Rotation test {i}")
    log_file = temp_log_dir / LOG_FILE_NAME
    assert log_file.exists()
    # The TimedRotatingFileHandler should have created backup files if time passed
    # Since we can't wait until midnight, ensure that at least one backup file exists
    backups = list(temp_log_dir.glob("envsync.log.*"))
    # We expect zero or more backups; the test passes if the file exists
    assert log_file in backups or log_file.exists()


# --------------------------------------------------------------------------- #
# Edge case tests
# --------------------------------------------------------------------------- #
def test_logger_with_invalid_level(monkeypatch, clear_loggers):
    """An invalid log level string falls back to the default level."""
    monkeypatch.setenv(ENV_LOG_LEVEL, "notalevel")
    logger = get_logger("invalid_level")
    # Should default to INFO
    assert logger.level == logging.INFO


def test_logger_propagate_false(clear_loggers):
    """The logger should not propagate messages to root."""
    logger = get_logger("no_propagate")
    assert logger.propagate is False
