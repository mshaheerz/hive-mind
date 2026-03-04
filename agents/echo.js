"use strict";
const Agent = require("../core/agent");
const { loadApplicableSkills } = require("./utils");

class EchoAgent extends Agent {
  constructor() {
    super(
      "echo",
      "ECHO",
      `You are ECHO, the Social Media/Launch Lead.
Craft punchy, hook-driven content for Twitter/X, LinkedIn, Dev.to/Hashnode, Product Hunt.
Style: Clear > Clever. Lead with value.`,
    );
  }

  async createLaunchContent(project) {
    const skills = loadApplicableSkills(
      ["marketing", "social-media", "content-creation"],
      3,
    );
    const prompt = `Create launch content for:\nProject: ${project.name}\n${project.description}\n${project.features}\n${skills}\n\nTwitter thread, LinkedIn post, tags, etc.`;
    this.print(`Crafting launch content: ${project.name}`);
    return await this.think(prompt);
  }
}

module.exports = EchoAgent;
