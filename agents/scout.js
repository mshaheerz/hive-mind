"use strict";
const Agent = require("../core/agent");
const { loadApplicableSkills } = require("./utils");

class ScoutAgent extends Agent {
  constructor() {
    super(
      "scout",
      "SCOUT",
      `You are SCOUT, the Researcher. You deep-dive into proposed ideas to validate technical feasibility based on the project LEVEL.

## TIER CONSTRAINTS:
- **EASY**: MUST be Vanilla HTML/CSS/JS only. NO libraries, NO backend, NO persistence. It is a **STATIC UI TEMPLATE**.
- **MEDIUM**: React + Tailwind. NO backend, NO persistence. It is a **STATIC COMPONENT TEMPLATE**.
- **ADVANCED**: Next.js (App Router). Full-stack, real functional application.

Deliver: 1. Overview, 2. Key Findings (focused on the level's stack - if EASY/MEDIUM, focus on UI/UX layout and dummy data structure), 3. Risks (if EASY/MEDIUM and idea suggests functional logic/persistence, flag as CRITICAL RISK), 4. Tech Stack validation, 5. ACCEPTANCE_CRITERIA.`,
    );
  }

  async research(topic, projectContext = "", level = "medium") {
    const skills = loadApplicableSkills(
      ["research", "web", "frontend", "api"],
      3,
    );
    const prompt = `Research this for development:\nLevel: ${level.toUpperCase()}\nTopic: ${topic}\nContext: ${projectContext}\n${skills}\n\nValidate technical feasibility specifically for the ${level.toUpperCase()} stack. Provide findings, risks, and measurable acceptance criteria.`;
    this.print(`Researching (${level}): ${topic.slice(0, 50)}...`);
    return await this.think(prompt);
  }
}

module.exports = ScoutAgent;
