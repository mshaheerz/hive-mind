import subprocess
import pytest

@pytest.mark.skip(reason="This is a smoke test for demonstration purposes")
def test_smoke():
    result = subprocess.run(["npm", "run", "dev"], check=False, capture_output=True, text=True)
    assert "started" in result.stdout, "Server did not start correctly"
