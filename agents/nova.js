/**
 * NOVA — Innovation Scout (Autonomous version)
 * Proposes ideas, handles revisions, never gives up cleanly
 */

const Agent = require("../core/agent");
const { loadApplicableSkills } = require("./utils");

class NovaAgent extends Agent {
  constructor() {
    super(
      "nova",
      "NOVA",
      `You are NOVA, the Innovation Scout for Hive Mind — an autonomous multi-agent AI team.

## Your Role
You autonomously discover and propose new project ideas. You run on a schedule — you don't wait to be asked.

## What You Propose
Focus on genuinely useful web applications, developer dashboards, or SaaS utilities. Examples:
- Admin dashboards for cloud services
- Interactive documentation generators (Next.js based)
- Workflow automation portals with React frontends
- Real-time data visualization tools
- API-driven web utilities using Tailwind CSS and Lucide Icons

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
Enthusiastic but grounded. You love finding the gap between "this is annoying" and "nobody built this yet."`,
    );
  }

  async generateProposals(context = "", forcedLevel = "automatic") {
    const skills = loadApplicableSkills(
      ["innovation", "trends", "web-design"],
      3,
    );

    let levelInstruction = `Generate exactly 3 project ideas, one for each of these strict levels:
1. **EASY (Pure UI Template)**: 
   - Stack: Vanilla HTML, CSS, and Vanilla JavaScript ONLY. 
   - Constraint: NO external libraries. NO backend. NO localStorage/persistence.
   - Nature: A **STATIC DESIGN TEMPLATE**. It shouldn't DO anything functional; it should just LOOK futuristic and professional with dummy data.
2. **MEDIUM (UI Component Template)**: 
   - Stack: React + Tailwind CSS. 
   - Constraint: NO backend. NO complex state persistence.
   - Nature: A **STATIC COMPONENT TEMPLATE**. High-quality UI/UX with dummy data.
3. **ADVANCED (Full Functional Application)**: 
   - Stack: Next.js (App Router) + API Routes/Actions. 
   - Nature: A **REAL FUNCTIONAL APP**. Data persistence, real logic, complex state.`;

    if (forcedLevel !== "automatic") {
      levelInstruction = `CRITICAL: You are FORCED to ONLY propose projects at the **${forcedLevel.toUpperCase()}** level. 
If Easy or Medium, they MUST be **STATIC UI TEMPLATES** with dummy data only. NO functional logic/persistence.
Generate 3 unique ideas all at the ${forcedLevel.toUpperCase()} tier.`;
    }

    const prompt = `You are autonomously generating new project proposals for the Hive Mind team.

CRITICAL DIRECTIVE:
${levelInstruction}

${skills}\n\n${context ? `## Context (avoid duplicating these)\n${context}\n` : ""}

Respond ONLY with a valid JSON array:
[
  {
    "title": "Short project name",
    "description": "2 sentences max",
    "problem": "Pain point it solves",
    "audience": "Who benefits",
    "level": "${forcedLevel === "automatic" ? "easy | medium | advanced" : forcedLevel.toLowerCase()}",
    "reasoning": "Why this idea fits this level",
    "acceptanceSignals": ["3-5 measurable outcomes"],
    "projectType": "web_app",
    "preferredStack": "HTML/JS | React/Tailwind | Next.js/API",
    "template": "vanilla-static | react-static-tailwind | nextjs-fullstack"
  },
  { ... },
  { ... }
]`;

    this.print("Generating autonomous project proposals...");
    return await this.thinkJSON(prompt);
  }

  async refineProposal(originalProposal, apexFeedback) {
    const skills = loadApplicableSkills(
      ["refinement", "feedback-loop", "problem-solving"],
      3,
    );
    const prompt = `APEX has requested revisions to your proposal.

## Original Proposal
Title: ${originalProposal.title}
Description: ${originalProposal.description}
Goal: ${originalProposal.goal}

## APEX Feedback
${apexFeedback}\n\n${skills}

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
