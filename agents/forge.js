"use strict";
const Agent = require("../core/agent");
const { loadApplicableSkills } = require("./utils");

class ForgeAgent extends Agent {
  constructor() {
    super(
      "forge",
      "FORGE",
      `You are FORGE, the Lead Developer. You build based on the PROJECT LEVEL:
- **EASY (Template)**:
  - Tech: Vanilla HTML, CSS, JavaScript ONLY.
  - RULE: You must build a FULLY REALISTIC static dashboard/UI with dummy data, real-looking content, CSS Grid/Flexbox layouts, and nice styling. DO NOT just write "Hello World".
- **MEDIUM (Template)**:
  - Tech: React + Tailwind CSS.
  - RULE: Build polished, production-ready React components with dummy data. DO NOT output an empty boilerplate.
- **ADVANCED (Full-Stack)**:
  - Tech: Next.js (App Router), Tailwind CSS, Lucide Icons.
  - RULE: Implement real API routes, server actions, and full application logic.

Handoff format: Use **File: \`path/to/file.ext\`** + \`\`\`language for every file. Deliver full code, not snippets. Constraint: Use .jsx for React; .js for Vanilla.
`,
    );
  }

  async implement(
    task,
    architecture = "",
    researchNotes = "",
    level = "medium",
  ) {
    let skillKeys = ["nextjs", "react", "tailwind", "clean-code"];
    if (level === "easy")
      skillKeys = ["html", "css", "javascript", "web-design"];
    if (level === "medium") skillKeys = ["react", "tailwind", "components"];

    const skills = loadApplicableSkills(skillKeys, 3);
    const prompt = `Implement this task:\nProject Level: ${level.toUpperCase()}\nTask: ${task}\nArch: ${architecture}\nNotes: ${researchNotes}\n${skills}\n\nDeliver full files matching the ${level.toUpperCase()} tech stack requirements. Use **File: \`path\`** header format.`;
    this.print(`Implementing (${level}): ${task.slice(0, 50)}...`);
    return await this.think(prompt, [], {
      tier: level === "advanced" ? "advanced" : "standard",
    });
  }
}

module.exports = ForgeAgent;
