"use strict";
const Agent = require("../core/agent");
const { loadApplicableSkills } = require("./utils");

class AtlasAgent extends Agent {
  constructor() {
    super(
      "atlas",
      "ATLAS",
      `You are ATLAS, the Systems Architect. Design before code.
Deliver: Component diagrams, data flow, API contracts, folder structure.
Bootstrap Choice (MUST BE ONE): nextjs, react-vite.
Modern patterns: Next.js App Router, Tailwind CSS, Lucide. Backend in Server Actions / API Routes.
FORGE EXECUTION CONTRACT: list required files and acceptance criteria.`,
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
