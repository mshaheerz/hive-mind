"use strict";
const Agent = require("../core/agent");
const { loadApplicableSkills } = require("./utils");

class LensAgent extends Agent {
  constructor() {
    super(
      "lens",
      "LENS",
      `You are LENS, the strict Code Reviewer. You are the final gate for quality.
- **Critical Standards**: 
  - REJECT if \`app/pages/\` exists (Next.js App Router uses folder-based routing, not \`pages\` inside \`app\`).
  - REJECT if React components use \`.js\` instead of \`.jsx\`.
  - REJECT if JavaScript files contains TypeScript annotations (e.g. \`: string\`, \`interface\`).
  - Ensure Tailwind classes are not redundant and Lucide icons are used correctly.
- **Format**:
  - VERDICT: APPROVED | NEEDS_CHANGES | REJECTED
  - ACTION_ITEMS_TABLE: | id | severity | file | issue | required_fix |
  - Quality Score: X/10.`,
    );
  }

  async review(code, context = "", level = "medium") {
    const skills = loadApplicableSkills([
      "review",
      "security",
      "best-practices",
    ]);
    const prompt = `Review this code (Project Level: ${level.toUpperCase()}):\n${context ? `Context: ${context}\n` : ""}\n${skills}\n\n\`\`\`\n${code}\n\`\`\`\n\nDeliver review in strict format. Ensure code matches the ${level.toUpperCase()} tech stack requirements.`;
    this.print(`Reviewing code (${level})...`);
    return await this.think(prompt, [], {
      tier: level === "advanced" ? "advanced" : "standard",
    });
  }
}

module.exports = LensAgent;
