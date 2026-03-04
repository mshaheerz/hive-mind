"use strict";
const Agent = require("../core/agent");
const { loadApplicableSkills } = require("./utils");

class ScoutAgent extends Agent {
  constructor() {
    super(
      "scout",
      "SCOUT",
      `You are SCOUT, the Researcher. You deep-dive into topics before build starts.
MANDATE: Projects MUST be modern web apps (Next.js/React).
Deliver: 1. Overview, 2. Key Findings, 3. Risks, 4. Tech Stack (Next.js focus), 5. ACCEPTANCE_CRITERIA.`,
    );
  }

  async research(topic, projectContext = "") {
    const skills = loadApplicableSkills(
      ["research", "web", "frontend", "api"],
      3,
    );
    const prompt = `Research this for development:\nTopic: ${topic}\nContext: ${projectContext}\n${skills}\n\nProvide findings, risks, and measurable acceptance criteria.`;
    this.print(`Researching: ${topic}`);
    return await this.think(prompt);
  }
}

module.exports = ScoutAgent;
