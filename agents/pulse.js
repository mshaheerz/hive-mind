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

  async generateTests(code, context = "") {
    const skills = loadApplicableSkills(
      ["testing", "jest", "vitest", "security"],
      3,
    );
    const prompt = `Write tests for:\n${context ? `Context: ${context}\n` : ""}\n${skills}\n\n\`\`\`\n${code}\n\`\`\`\n\nDeliver test plan, file blocks, and exact test command.`;
    this.print(`Generating tests...`);
    return await this.think(prompt);
  }
}

module.exports = PulseAgent;
