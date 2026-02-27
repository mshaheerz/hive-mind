/**
 * NOVA — Innovation Scout (Autonomous version)
 * Proposes ideas, handles revisions, never gives up cleanly
 */

const Agent = require('../core/agent');

class NovaAgent extends Agent {
  constructor() {
    super('nova', 'NOVA', `You are NOVA, the Innovation Scout for Hive Mind — an autonomous multi-agent AI team.

## Your Role
You autonomously discover and propose new project ideas. You run on a schedule — you don't wait to be asked.

## What You Propose
Focus on genuinely useful developer tools, automation, or utilities. Examples of good areas:
- CLI tools that save repetitive work
- Web apps and dashboards with clear value (prefer modern templates)
- Dev workflow improvements
- Data processing/analysis utilities
- API integrations that don't exist yet

## Proposal Rules
1. Each proposal must solve a REAL, SPECIFIC problem
2. Complexity must be honest — don't undersell or oversell
3. You must NOT propose anything similar to what already exists in the team's projects
4. If APEX requests revision, you REFINE and resubmit — never the same idea twice
5. You celebrate approvals, learn from rejections, improve from revisions
6. Include measurable acceptance signals (how the team will know the idea is actually successful)

## What You Are NOT
- You are not a yes-machine — don't propose trendy things just because they're trendy
- You are not a perfectionist — 70% certainty is enough to propose
- You are not defensive — APEX's feedback makes your ideas better

## Tone
Enthusiastic but grounded. You love finding the gap between "this is annoying" and "nobody built this yet."`);
  }

  async generateProposals(context = '') {
    const prompt = `You are autonomously generating new project proposals for the Hive Mind team.

${context ? `## Context (avoid duplicating these)\n${context}\n` : ''}

Generate exactly 3 new, original project ideas. Each must be different in domain.
At least 1 of the 3 should be a web project using Next.js or React + Tailwind CSS template.

Respond ONLY with a valid JSON array — no other text:
[
  {
    "title": "Short project name (3-6 words)",
    "description": "What it does in 2 sentences max",
    "problem": "The specific pain point it solves",
    "audience": "Who benefits most",
    "complexity": "Small",
    "reasoning": "Why this should be built now",
    "acceptanceSignals": ["3-5 measurable outcomes that prove value"],
    "projectType": "web_app | cli_tool | api_service | automation | library",
    "preferredStack": "e.g. Next.js 15 + TypeScript + Tailwind",
    "template": "nextjs-starter | react-vite-tailwind | node-cli | python-cli"
  },
  { ... },
  { ... }
]

Complexity options: Small (1-2 days), Medium (3-7 days), Large (2+ weeks).`;

    this.print('Generating autonomous project proposals...');
    return await this.thinkJSON(prompt);
  }

  async refineProposal(originalProposal, apexFeedback) {
    const prompt = `APEX has requested revisions to your proposal.

## Original Proposal
Title: ${originalProposal.title}
Description: ${originalProposal.description}
Goal: ${originalProposal.goal}

## APEX Feedback
${apexFeedback}

Refine this proposal to address the feedback. Make it meaningfully better, not just slightly reworded.

Respond ONLY with a JSON object:
{
  "title": "possibly revised title",
  "description": "improved description",
  "problem": "clearer problem statement",
  "audience": "refined audience",
  "complexity": "Small | Medium | Large",
  "reasoning": "why this version is better",
  "changesFromOriginal": "what you changed and why"
}`;

    this.print(`Refining proposal: "${originalProposal.title}"`);
    return await this.thinkJSON(prompt);
  }
}

module.exports = NovaAgent;
