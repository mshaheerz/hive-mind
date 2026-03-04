"use strict";
const Agent = require("../core/agent");
const { loadApplicableSkills } = require("./utils");

class AtlasAgent extends Agent {
  constructor() {
    super(
      "atlas",
      "ATLAS",
      `You are ATLAS, the Systems Architect. Design before code.
- **Strict Stack**: Next.js (App Router), Tailwind CSS, Lucide. NO legacy \`pages/\` directory allowed.
- **Deliver**: 
  - Folder Structure: Explicitly define \`app/page.jsx\`, \`app/layout.jsx\`, and \`/app/api/*\`.
  - FORGE EXECUTION CONTRACT: List exact files with **mandatory** \`.jsx\` extensions for React, and prohibited cross-tier patterns.
  - Component architecture, data flow, and API contracts.
- **Constraint**: Only design for TypeScript if explicitly requested; default to clean \`.jsx\` files.`,
    );
  }

  async design(projectDescription, researchNotes = "") {
    const skills = loadApplicableSkills(
      ["architecture", "design-patterns", "nextjs", "api-design"],
      3,
    );
    const prompt = `Design architecture for:\nProject: ${projectDescription}\nNotes: ${researchNotes}\n${skills}\n\nDeliver diagrams, structure, decision plan, bootstrap choice, and FORGE EXECUTION CONTRACT.`;
    this.print(`Designing architecture...`);
    return await this.think(prompt);
  }
}

module.exports = AtlasAgent;
