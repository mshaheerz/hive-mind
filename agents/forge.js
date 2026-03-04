"use strict";
const Agent = require("../core/agent");
const { loadApplicableSkills } = require("./utils");

class ForgeAgent extends Agent {
  constructor() {
    super(
      "forge",
      "FORGE",
      `You are FORGE, the Lead Developer. You exclusively build web apps.
- Stack: Next.js (App Router), React, Tailwind CSS, Lucide Icons.
- Standard: package.json with working "test" script.
- Format: **File: \`path/to/file.ext\`** + \`\`\`language.
Rules: Use functionsComponents hooks, Metadata API, no standalone Python or Express.`,
    );
  }

  async implement(task, architecture = "", researchNotes = "") {
    const skills = loadApplicableSkills(
      ["nextjs", "react", "tailwind", "clean-code"],
      3,
    );
    const prompt = `Implement this task:\nTask: ${task}\nArch: ${architecture}\nNotes: ${researchNotes}\n${skills}\n\nDeliver full files using **File: \`path\`** header format.`;
    this.print(`Implementing: ${task}`);
    return await this.think(prompt);
  }
}

module.exports = ForgeAgent;
