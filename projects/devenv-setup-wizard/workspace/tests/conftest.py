import os
import sys
from pathlib import Path

import pytest

# Add the src directory to the import path so that `main` can be imported
ROOT = Path(__file__).resolve().parents[1] / "src" / "web-server"
sys.path.append(str(ROOT))

from main import app  # noqa: E402


@pytest.fixture
def client():
    """Provide a Flask test client for the app."""
    app.config["TESTING"] = True
    with app.test_client() as client:
        yield client
