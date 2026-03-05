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

  async createLaunchContent(project, level = "medium") {
    const skills = loadApplicableSkills(
      ["marketing", "social-media", "content-creation"],
      3,
    );
    const prompt = `Create launch content for (Project Level: ${level.toUpperCase()}):\nProject: ${project.name}\n${project.description}\n${project.features}\n${skills}\n\nTwitter thread, LinkedIn post, tags, etc. Highlight that this is a ${level.toUpperCase()} project.`;
    this.print(`Crafting launch content (${level}): ${project.name}`);
    return await this.think(prompt, [], {
      tier: level === "advanced" ? "advanced" : "standard",
    });
  }
}

module.exports = EchoAgent;
