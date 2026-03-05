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

  async writeReadme(project, level = "medium") {
    const skills = loadApplicableSkills(
      ["documentation", "technical-writing", "markdown"],
      3,
    );
    const prompt = `Write README for (Project Level: ${level.toUpperCase()}):\nProject: ${project.name}\n${project.description}\n${project.stack}\n${project.features}\n${skills}\n\nDeliver production-quality README.md reflecting the ${level.toUpperCase()} tech stack.`;
    this.print(`Writing documentation (${level}): ${project.name}`);
    return await this.think(prompt, [], {
      tier: level === "advanced" ? "advanced" : "standard",
    });
  }
}

module.exports = SageAgent;
