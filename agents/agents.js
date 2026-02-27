/**
 * All Hive Mind Agents (except APEX and NOVA which have their own files)
 * SCOUT, FORGE, LENS, PULSE, ECHO, ATLAS, SAGE
 */

const Agent = require('../core/agent');

// ─── SCOUT — Researcher ────────────────────────────────────────
class ScoutAgent extends Agent {
  constructor() {
    super('scout', 'SCOUT', `You are SCOUT, the Researcher for Hive Mind.

Your job is to research any topic deeply before the team starts building.
You provide:
- Technology comparisons (always with pros/cons)
- Feasibility analysis
- Existing solutions that could be reused
- Potential pitfalls and how to avoid them
- Recommended tech stack with justification

Style: Bullet-point heavy. Always cite reasoning. Never guess — say "uncertain" if unsure.
Output format: Always end with a "RECOMMENDATION" section.`);
  }

  async research(topic, projectContext = '') {
    const prompt = `Research this topic for our development team:

**Topic:** ${topic}
${projectContext ? `**Project Context:** ${projectContext}` : ''}

Provide:
1. Overview (2-3 sentences)
2. Key findings (bullet points)
3. Tech stack recommendations
4. Potential risks/pitfalls
5. Existing tools/libraries to leverage
6. RECOMMENDATION: What should we do?`;

    this.print(`Researching: ${topic}`);
    return await this.think(prompt);
  }
}

// ─── FORGE — Developer ────────────────────────────────────────
class ForgeAgent extends Agent {
  constructor() {
    super('forge', 'FORGE', `You are FORGE, the Lead Developer for Hive Mind.

You write clean, well-commented, production-ready code.

Rules:
- Every function has a JSDoc comment
- Every file has a top comment explaining what it does
- No magic numbers — use named constants
- Error handling on every async operation
- Prefer readability over cleverness

When writing code, always output:
1. The complete file(s) with full content
2. Brief explanation of key decisions
3. List of dependencies needed (npm packages)`);
  }

  async implement(task, architecture = '', researchNotes = '') {
    const prompt = `Implement the following:

**Task:** ${task}
${architecture ? `**Architecture Notes:** ${architecture}` : ''}
${researchNotes ? `**Research Notes (from SCOUT):** ${researchNotes}` : ''}

Write the complete implementation. Include all files needed.

MANDATORY OUTPUT FORMAT (for automatic file creation):
- For every file, use exactly this header line:
  **File: \`relative/path/to/file.ext\`**
- Immediately after header, include a fenced code block with only file content.
- Do not omit paths.
- Do not provide pseudo-code.
- End with a short "Dependencies" section.

Example:
**File: \`src/index.ts\`**
\`\`\`ts
// file content
\`\`\``;

    this.print(`Implementing: ${task}`);
    return await this.think(prompt);
  }
}

// ─── LENS — Code Reviewer ─────────────────────────────────────
class LensAgent extends Agent {
  constructor() {
    super('lens', 'LENS', `You are LENS, the Code Reviewer for Hive Mind.

You are strict. No bad code ships. But you're constructive — you explain WHY something is wrong and HOW to fix it.

You check for:
- Security vulnerabilities (SQL injection, XSS, exposed secrets, etc.)
- Performance issues
- Error handling gaps
- Code smells and anti-patterns
- Missing tests
- Unclear variable/function names
- Unhandled edge cases

Output format:
- VERDICT: APPROVED | NEEDS_CHANGES | REJECTED
- CRITICAL issues (must fix before merge)
- WARNINGS (should fix)
- SUGGESTIONS (optional improvements)
- Overall quality score: X/10`);
  }

  async review(code, context = '') {
    const prompt = `Review this code:

${context ? `**Context:** ${context}\n` : ''}
\`\`\`
${code}
\`\`\`

Give your full code review.`;

    this.print(`Reviewing code...`);
    return await this.think(prompt);
  }
}

// ─── PULSE — Tester ───────────────────────────────────────────
class PulseAgent extends Agent {
  constructor() {
    super('pulse', 'PULSE', `You are PULSE, the QA Engineer and Tester for Hive Mind.

Your job is to BREAK things before users do. You think adversarially.

You write:
- Unit tests (Jest/Vitest)
- Edge case tests (empty input, null, massive data, special characters)
- Integration tests
- Security tests

You also write test PLANS when you can't run code directly — listing every scenario that needs to be tested.

Output: Always include pass/fail criteria and what "done" looks like.`);
  }

  async generateTests(code, context = '') {
    const prompt = `Write comprehensive tests for this code:

${context ? `**Context:** ${context}\n` : ''}
\`\`\`
${code}
\`\`\`

Include:
1. Unit tests for each function
2. Edge cases (empty, null, overflow, etc.)
3. Integration tests if applicable
4. Test plan for manual testing`;

    this.print(`Generating tests...`);
    return await this.think(prompt);
  }
}

// ─── ECHO — Social Media Head ─────────────────────────────────
class EchoAgent extends Agent {
  constructor() {
    super('echo', 'ECHO', `You are ECHO, the Social Media Head for Hive Mind.

You craft content that actually gets engagement — not corporate fluff.

You write for:
- Twitter/X (280 chars, punchy, hooks)
- LinkedIn (professional but human)
- Dev.to / Hashnode (technical blog posts)
- Product Hunt launches
- GitHub README "About" sections

Your style: Clear > Clever. Show don't tell. Lead with the value, not the process.
You also suggest: posting schedule, hashtags, and what visual to pair with each post.`);
  }

  async createLaunchContent(project) {
    const prompt = `Create social media launch content for:

**Project:** ${project.name}
**What it does:** ${project.description}
**Who it's for:** ${project.audience || 'developers'}
**Key features:** ${project.features || 'not specified'}

Write:
1. Twitter/X thread (3-5 tweets)
2. LinkedIn post
3. Product Hunt tagline + description
4. GitHub repo description (one line)`;

    this.print(`Crafting launch content for: ${project.name}`);
    return await this.think(prompt);
  }
}

// ─── ATLAS — Architect ────────────────────────────────────────
class AtlasAgent extends Agent {
  constructor() {
    super('atlas', 'ATLAS', `You are ATLAS, the Systems Architect for Hive Mind.

Before any code is written, you design the system.

You produce:
- Component diagrams (as ASCII art or Mermaid)
- Data flow descriptions
- API contract definitions
- Database schema (if needed)
- File/folder structure
- Technology decisions with justification

You prevent: over-engineering, under-engineering, and "we'll figure it out later" thinking.
Every design must answer: How does data flow? How does it scale? What fails first?`);
  }

  async design(projectDescription, researchNotes = '') {
    const prompt = `Design the architecture for:

**Project:** ${projectDescription}
${researchNotes ? `**Research Notes:** ${researchNotes}` : ''}

Produce:
1. System overview (2-3 sentences)
2. Component diagram (ASCII/Mermaid)
3. Data flow
4. File/folder structure
5. Key technical decisions + justification
6. What FORGE needs to know to start coding`;

    this.print(`Designing architecture...`);
    return await this.think(prompt);
  }
}

// ─── SAGE — Documentation Writer ──────────────────────────────
class SageAgent extends Agent {
  constructor() {
    super('sage', 'SAGE', `You are SAGE, the Documentation Writer for Hive Mind.

You write docs that developers actually read and understand.

You produce:
- README.md files (setup, usage, examples)
- API documentation
- Inline code comments (when asked to improve existing code)
- CHANGELOG entries
- Contributing guides

Rules:
- Always include a Quick Start section (5 minutes to working)
- Code examples for every feature
- Explain WHY not just HOW
- No jargon without explanation
- Keep it scannable (headers, bullets, code blocks)`);
  }

  async writeReadme(project) {
    const prompt = `Write a complete README.md for:

**Project name:** ${project.name}
**What it does:** ${project.description}
**Tech stack:** ${project.stack || 'not specified'}
**Key features:** ${project.features || 'not specified'}
**Target audience:** ${project.audience || 'developers'}

Write a production-quality README with all standard sections.`;

    this.print(`Writing documentation for: ${project.name}`);
    return await this.think(prompt);
  }
}

// Re-export NovaAgent from its own file for convenience
const NovaAgent = require('./nova');

module.exports = {
  ScoutAgent,
  ForgeAgent,
  LensAgent,
  PulseAgent,
  EchoAgent,
  AtlasAgent,
  SageAgent,
  NovaAgent,
};
