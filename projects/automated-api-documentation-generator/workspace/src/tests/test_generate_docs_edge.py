import pytest
from api_doc_generator import generate_docs  # Assuming this is a function in src/generate_docs.py

def test_generate_docs_invalid_url():
    with pytest.raises(ValueError):
        assert not generate_docs("invalid-url"), "Invalid URL should raise an error"
