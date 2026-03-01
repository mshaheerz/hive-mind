import pytest
from src.api.generate_docs import fetch_api_data  # Assuming this is a function in src/api/generate_docs.py

def test_fetch_api_data():
    api_data = fetch_api_data()
    assert isinstance(api_data, dict), "API data should be a dictionary"
    assert "endpoints" in api_data, "API data should contain endpoints key"
