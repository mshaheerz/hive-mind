const express = require("express");
const bodyParser = require("body-parser");
const morgan = require("morgan");

const app = express();

// Middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(morgan("dev"));

const { exec } = require("child_process");
const path = require("path");

// Routes
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "templates", "index.html"));
});

app.post("/setup", (req, res) => {
  const projectType = req.body.projectType;
  let scriptPath = "";

  if (projectType === "node") {
    scriptPath = "src/automation/setup_scripts.sh";
  } else if (projectType === "python") {
    scriptPath = "src/automation/setup_scripts.py";
  }

  if (scriptPath) {
    exec(`bash ${scriptPath}`, (error, stdout, stderr) => {
      if (error) {
        console.error(`exec error: ${error}`);
        return;
      }
      console.log(`stdout: ${stdout}`);
      console.error(`stderr: ${stderr}`);
    });
    res.send("Setup initiated successfully. Check server logs for details.");
  } else {
    res.status(400).send("Invalid project type");
  }
});

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
