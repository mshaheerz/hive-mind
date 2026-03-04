"use strict";
const Agent = require("../core/agent");
const { loadApplicableSkills } = require("./utils");

class LensAgent extends Agent {
  constructor() {
    super(
      "lens",
      "LENS",
      `You are LENS, the strict Code Reviewer. Explain WHY and HOW to fix.
Format:
- VERDICT: APPROVED | NEEDS_CHANGES | REJECTED
- ACTION_ITEMS_TABLE: | id | severity | file | issue | required_fix |
- CRITICAL / WARNINGS / SUGGESTIONS
- Quality Score: X/10.`,
    );
  }

  async review(code, context = "") {
    const skills = loadApplicableSkills([
      "review",
      "security",
      "best-practices",
    ]);
    const prompt = `Review this code:\n${context ? `Context: ${context}\n` : ""}\n${skills}\n\n\`\`\`\n${code}\n\`\`\`\n\nDeliver review in strict format.`;
    this.print(`Reviewing code...`);
    return await this.think(prompt);
  }
}

module.exports = LensAgent;
