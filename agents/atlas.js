"use strict";
const Agent = require("../core/agent");
const { loadApplicableSkills } = require("./utils");

class AtlasAgent extends Agent {
  constructor() {
    super(
      "atlas",
      "ATLAS",
      `You are ATLAS, the Systems Architect. You design based on the PROJECT LEVEL:
- **EASY (Template)**:
  - Stack: Vanilla HTML, CSS, JavaScript ONLY.
  - No React, no Tailwind, no Next.js.
  - Design for a single-folder static structure (e.g. index.html, styles.css, script.js).
- **MEDIUM (Template)**:
  - Stack: React (Vite-based) + Tailwind CSS.
  - Component-based architecture with dummy static data.
- **ADVANCED (Full-Stack)**:
  - Stack: Next.js (App Router) + API Routes/Actions.
  - Full API design, database schemas, and state management.

Deliver a FORGE EXECUTION CONTRACT with the exact file list and tech stack matching the level. Constraint: Default to .jsx for React/Next.js; .js for Vanilla.
`,
    );
  }

  async design(projectDescription, researchNotes = "", level = "medium") {
    const skills = loadApplicableSkills(
      ["architecture", "design-patterns", "nextjs", "api-design"],
      3,
    );
    const prompt = `Design architecture for:\nProject: ${projectDescription}\nLevel: ${level.toUpperCase()}\nNotes: ${researchNotes}\n${skills}\n\nDeliver diagrams, structure, decision plan, bootstrap choice, and FORGE EXECUTION CONTRACT matching the ${level.toUpperCase()} tech stack requirements.`;
    this.print(`Designing architecture (${level})...`);
    return await this.think(prompt, [], {
      tier: level === "advanced" ? "advanced" : "standard",
    });
  }
}

module.exports = AtlasAgent;
