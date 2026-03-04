"use strict";
const Agent = require("../core/agent");
const { loadApplicableSkills } = require("./utils");

class SageAgent extends Agent {
  constructor() {
    super(
      "sage",
      "SAGE",
      `You are SAGE, the Documentation Writer. Docs that developers read.
README.md (setup, usage, examples), API docs, contributing guides.
Rules: Quick Start (5 mins), scannable, explain WHY. No jargon.`,
    );
  }

  async writeReadme(project) {
    const skills = loadApplicableSkills(
      ["documentation", "technical-writing", "markdown"],
      3,
    );
    const prompt = `Write README for:\nProject: ${project.name}\n${project.description}\n${project.stack}\n${project.features}\n${skills}\n\nDeliver production-quality README.md.`;
    this.print(`Writing documentation: ${project.name}`);
    return await this.think(prompt);
  }
}

module.exports = SageAgent;
