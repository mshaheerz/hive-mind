 **File: `vite.config.js`**
```javascript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

**File: `package.json`**
```json
{
  "name": "devenv-setup-wizard",
  "version": "1.0.0",
  "scripts": {
    "start": "node src/main.js"
  },
  "dependencies": {
    "express": "^4.17.1",
    "inquirer": "^8.2.0",
    "vite": "^2.6.4"
  }
}
```

**File: `src/main.js`**
```javascript
import express from 'express';
import inquirer from 'inquirer';

const app = express();
const port = process.env.DEV_ENV_PORT || 5000;
const host = process.env.DEV_ENV_HOST || '127.0.0.1';

app.get('/setup', (req, res) => {
  inquirer
    .prompt([
      { type: 'list', name: 'language', message: 'Choose a language:', choices: ['Python', 'Node.js'] },
    ])
    .then((answers) => {
      if (answers.language === 'Python') {
        // Python setup logic here
      } else if (answers.language === 'Node.js') {
        // Node.js setup logic here
      }
      res.send('Setup initiated');
    });
});

app.listen(port, host, () => {
  console.log(`Server running at http://${host}:${port}/`);
});
```

**File: `templates/index.html`**
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>DevEnv Setup Wizard</title>
</head>
<body>
  <h1>Welcome to the DevEnv Setup Wizard</h1>
  <button id="setupButton">Start Setup</button>
  <script src="/src/main.js"></script>
</body>
</html>
```

## FIX_MAP
- FORGE-001 -> Add setup logic for both Python and Node.js in `src/main.js`