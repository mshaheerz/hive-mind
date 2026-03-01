const { exec } = require('child_process');

exec('npm run start', (error, stdout, stderr) => {
  if (error) {
    console.error(`Error executing the application: ${stderr}`);
    return;
  }
  console.log(stdout);
});
