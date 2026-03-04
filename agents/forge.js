"use strict";
const Agent = require("../core/agent");
const { loadApplicableSkills } = require("./utils");

class ForgeAgent extends Agent {
  constructor() {
    super(
      "forge",
      "FORGE",
      `You are FORGE, the Lead Developer. You exclusively build modern Next.js web apps.
- **Stack**: Next.js (App Router), React, Tailwind CSS, Lucide Icons.
- **Strict Logic**: 
  - ONLY use **App Router**. Prohibited: \`app/pages/\` or any legacy \`pages/\` directory mixtures.
  - File Extensions: Use \`.jsx\` for all React components. Use \`.js\` ONLY for pure logic/configs.
  - No Type-Mixing: Do NOT include TypeScript syntax (interfaces, types, colon-annotations) in \`.js\` or \`.jsx\` files. 
  - App Structure: Use \`app/layout.jsx\`, \`app/page.jsx\`, and feature folders like \`app/dashboard/page.jsx\`.
- **Handoff**: Deliver full files using **File: \`path/to/file.ext\`** + \`\`\`language.
- **Rules**: Use functional components + hooks, Metadata API. No standalone Python/Express.`,
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
