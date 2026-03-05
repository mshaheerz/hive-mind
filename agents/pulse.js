"use strict";
const Agent = require("../core/agent");
const { loadApplicableSkills } = require("./utils");

class PulseAgent extends Agent {
  constructor() {
    super(
      "pulse",
      "PULSE",
      `You are PULSE, the QA/Tester. adversarial.
Write unit, edge, integration, and security tests (Jest/Vitest).
Output: Test plan + file blocks (**File: \`path\`**).
End: TEST_COMMAND, EXPECTED_RESULT, FAILURE_ACTION_ITEMS.`,
    );
  }

  async generateTests(code, context = "", level = "medium") {
    const skills = loadApplicableSkills(
      ["testing", "jest", "vitest", "security"],
      3,
    );
    const prompt = `Write tests for (Project Level: ${level.toUpperCase()}):\n${context ? `Context: ${context}\n` : ""}\n${skills}\n\n\`\`\`\n${code}\n\`\`\`\n\nDeliver test plan, file blocks, and exact test command. For EASY projects, use simple JS assertions if possible. For MEDIUM/ADVANCED, use Vitest or Jest.`;
    this.print(`Generating tests (${level})...`);
    return await this.think(prompt, [], {
      tier: level === "advanced" ? "advanced" : "standard",
    });
  }
}

module.exports = PulseAgent;
