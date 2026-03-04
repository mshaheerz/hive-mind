"use strict";
/**
 * agents/utils.js
 * ───────────────
 * Shared utilities for finding and loading dynamic skill definitions
 * into agent prompts.
 */

const fs = require("fs");
const path = require("path");

const HIVE_DIR = path.join(__dirname, "..", ".hive");
const STATE_FILE = path.join(HIVE_DIR, "autonomous-state.json");
const SKILLS_DIR = path.join(__dirname, "..", "agent-skills");

/**
 * Load specialized skill (.md) files from repo-root/agent-skills/ based on keywords.
 * These skills are dynamically injected into prompts to give agents "expert" knowledge.
 *
 * @param {string[]} [keywords=[]] - e.g. ["nextjs", "tailwind"]
 * @param {number} [limit=5]       - Max number of skills to load to prevent token bloat.
 * @returns {string} Injected prompt block (Markdown).
 */
function loadApplicableSkills(keywords = [], limit = 5) {
  try {
    if (!fs.existsSync(SKILLS_DIR)) return "";

    const skillsFound = [];
    const folders = fs.readdirSync(SKILLS_DIR);

    for (const folder of folders) {
      const match = keywords.find((k) =>
        folder.toLowerCase().includes(k.toLowerCase()),
      );
      if (match) {
        const skillPath = path.join(SKILLS_DIR, folder, "SKILL.md");
        if (fs.existsSync(skillPath)) {
          const priority = folder.toLowerCase() === match.toLowerCase() ? 2 : 1;
          skillsFound.push({ folder, path: skillPath, priority });
        }
      }
    }

    skillsFound.sort((a, b) => b.priority - a.priority);
    const selected = skillsFound.slice(0, limit);

    let injectedContext = "";
    let totalChars = 0;
    let TOTAL_BUDGET = 12000;
    let PER_SKILL_LIMIT = 6000;

    // Load constraints from global state
    try {
      if (fs.existsSync(STATE_FILE)) {
        const state = JSON.parse(fs.readFileSync(STATE_FILE, "utf8"));
        if (state.config) {
          TOTAL_BUDGET = state.config.totalSkillBudget || TOTAL_BUDGET;
          PER_SKILL_LIMIT = state.config.perSkillLimit || PER_SKILL_LIMIT;
        }
      }
    } catch {}

    for (const skill of selected) {
      if (totalChars > TOTAL_BUDGET) break;
      let content = fs.readFileSync(skill.path, "utf8");
      if (content.length > PER_SKILL_LIMIT) {
        content =
          content.slice(0, PER_SKILL_LIMIT) + "\n... [SKILL TRUNCATED] ...";
      }

      const chunk = `\n\n--- SKILL: ${skill.folder} ---\n${content}\n----------------\n`;
      if (totalChars + chunk.length > TOTAL_BUDGET) continue;

      injectedContext += chunk;
      totalChars += chunk.length;
    }

    return injectedContext
      ? `\n\nYou have access to the following specialized skills. Follow them critically:\n${injectedContext}`
      : "";
  } catch (e) {
    return "";
  }
}

module.exports = { loadApplicableSkills };
