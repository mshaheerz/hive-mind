"""
src.web_server package initializer.

Exports the Flask ``app`` instance for easy import in tests and
application entry points.
"""
from .app import app  # noqa: F401
