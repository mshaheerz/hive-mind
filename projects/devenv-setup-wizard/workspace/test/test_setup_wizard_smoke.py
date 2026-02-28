# A minimal smoke test that simply imports the wizard and calls it with
# a dummy project name. This test should pass even if the underlying
# implementation is incomplete, as long as the public API exists.

import src.setup_wizard as wizard

def test_smoke():
    wizard.wizard("smoke_test", env_type="python")
