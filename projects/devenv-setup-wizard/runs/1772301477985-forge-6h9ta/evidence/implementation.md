 To implement the DevEnv Setup Wizard as described, we'll need to create several files including a web server script, automation scripts for Python and Node.js, configuration management with Ansible or Puppet, and a user interface using HTML/CSS. Below is the complete implementation of all necessary files along with their contents:

### File: `src/web-server/main.py`
```python
from flask import Flask, request, jsonify
import subprocess

app = Flask(__name__)

@app.route('/setup', methods=['POST'])
def setup():
    data = request.json
    language = data['language']
    if language == 'python':
        subprocess.run(['pip', 'install', '-r', 'requirements.txt'])
    elif language == 'nodejs':
        subprocess.run(['npm', 'install'])
    return jsonify({"status": "setup started"})

if __name__ == '__main__':
    app.run(debug=True)
```

### File: `src/automation/setup_scripts.sh`
```bash
#!/bin/bash

# Install Python dependencies
pip install -r requirements.txt

# Install Node.js packages
npm install
```

### File: `templates/index.html`
```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>DevEnv Setup Wizard</title>
</head>
<body>
    <h1>Select Your Language</h1>
    <form action="/setup" method="post">
        <input type="hidden" name="language" value="python">
        <button type="submit">Python</button>
    </form>
    <form action="/setup" method="post">
        <input type="hidden" name="language" value="nodejs">
        <button type="submit">Node.js</button>
    </form>
</body>
</html>
```

### File: `config/ansible.cfg`
```ini
[defaults]
inventory = inventory
library = /path/to/ansible_libs
```

### File: `test/integration_tests.js`
```javascript
const request = require('supertest');
const app = require('../src/web-server/main.py'); // Adjust according to your file structure

describe('DevEnv Setup Wizard', () => {
    it('should setup Python environment on POST /setup with language python', async () => {
        const res = await request(app)
            .post('/setup')
            .send({ language: 'python' });
        expect(res.status).toEqual(200);
        expect(res.body.status).toEqual('setup started');
    });

    it('should setup Node.js environment on POST /setup with language nodejs', async () => {
        const res = await request(app)
            .post('/setup')
            .send({ language: 'nodejs' });
        expect(res.status).toEqual(200);
        expect(res.body.status).toEqual('setup started');
    });
});
```

### File: `package.json`
```json
{
  "name": "devenv-setup-wizard",
  "version": "1.0.0",
  "main": "src/web-server/main.py",
  "scripts": {
    "start": "python src/web-server/main.py",
    "test": "jest"
  },
  "dependencies": {
    "flask": "^2.0.1",
    "nodejs": "^14.0.0"
  },
  "devDependencies": {
    "jest": "^27.0.6",
    "supertest": "^6.1.3"
  }
}
```

### File: `requirements.txt`
```plaintext
flask
pytest
```

### Dependencies
The project dependencies include Flask for the web server, Node.js with npm for package management, and Jest for testing. The versions are specified to ensure compatibility and stability across different environments.