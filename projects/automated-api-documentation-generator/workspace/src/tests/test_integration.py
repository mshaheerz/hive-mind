import subprocess
import json
import pytest
from src.api.generate_docs import fetch_api_data  # Assuming this is a function in src/api/generate_docs.py

def test_integration():
    result = subprocess.run(["npm", "run", "build"], check=False, capture_output=True, text=True)
    assert "built" in result.stdout, "Build script did not run correctly"
    
    api_data = fetch_api_data()
    with open('src/api/api_data.json', 'w') as f:
        json.dump(api_data, f)
    assert isinstance(api_data, dict), "API data should be a dictionary"
