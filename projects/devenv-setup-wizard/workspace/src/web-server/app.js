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
