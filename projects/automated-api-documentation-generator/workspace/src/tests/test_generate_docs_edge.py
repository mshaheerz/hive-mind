import pytest
from src.api.generate_docs import fetch_api_data  # Assuming this is a function in src/api/generate_docs.py

def test_fetch_api_data_empty():
    with pytest.raises(Exception):
        assert not fetch_api_data(), "Fetching empty API data should raise an error"
