 **File: `package.json`**
```json
{
  "name": "dev-env-setup-wizard",
  "version": "1.0.0",
  "description": "An automation tool to streamline the setup process for new projects",
  "main": "index.js",
  "scripts": {
    "start": "node src/web-server/app.js"
  },
  "dependencies": {
    "express": "^4.17.1",
    "body-parser": "^1.19.0",
    "morgan": "^1.10.0"
  }
}
```
**File: `src/web-server/app.js`**
```javascript
const express = require('express');
const bodyParser = require('body-parser');
const morgan = require('morgan');

const app = express();

// Middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(morgan('dev'));

// Routes
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/templates/index.html');
});

app.post('/setup', (req, res) => {
  const projectType = req.body.projectType;
  // Automated setup logic based on projectType
  if (projectType === 'node') {
    require('./automation/setup_scripts.sh');
  } else if (projectType === 'python') {
    require('./automation/setup_scripts.py');
  }
  res.send('Setup in progress...');
});

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});
```
**File: `src/web-server/templates/index.html`**
```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dev Env Setup Wizard</title>
</head>
<body>
    <h1>Welcome to the Dev Env Setup Wizard</h1>
    <form action="/setup" method="post">
        <label for="projectType">Select Project Type:</label>
        <select name="projectType" id="projectType">
            <option value="node">Node.js</option>
            <option value="python">Python</option>
        </select>
        <button type="submit">Start Setup</button>
    </form>
</body>
</html>
```
**File: `src/automation/setup_scripts.sh`**
```bash
#!/bin/bash

# Node.js setup script
npm init -y && npm install express body-parser morgan
echo "Node.js project setup complete"
```
**File: `config/ansible.cfg`**
```ini
[defaults]
inventory = inventory
library = /path/to/ansible_library
remote_user = root
```
## FIX_MAP
- 101 -> Added Node.js and Python setup scripts (`setup_scripts.sh` and `setup_scripts.py`) for automated setup logic based on projectType.