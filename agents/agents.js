/**
 * All Hive Mind Agents (except APEX and NOVA which have their own files)
 * SCOUT, FORGE, LENS, PULSE, ECHO, ATLAS, SAGE
 */

const Agent = require("../core/agent");
const fs = require("fs");
const path = require("path");
const os = require("os");

const STATE_FILE = path.join(__dirname, "..", ".hive", "autonomous-state.json");

function loadApplicableSkills(keywords = [], limit = 5) {
  try {
    const skillsDir = path.join(__dirname, "..", "agent-skills");
    if (!fs.existsSync(skillsDir)) return "";

    let skillsFound = [];
    const folders = fs.readdirSync(skillsDir);

    for (const folder of folders) {
      const match = keywords.find((k) =>
        folder.toLowerCase().includes(k.toLowerCase()),
      );
      if (match) {
        const skillPath = path.join(skillsDir, folder, "SKILL.md");
        if (fs.existsSync(skillPath)) {
          // Prioritize exact or specific matches over generic ones
          const priority = folder.toLowerCase() === match.toLowerCase() ? 2 : 1;
          skillsFound.push({ folder, path: skillPath, priority });
        }
      }
    }

    // Sort by priority and take top N
    skillsFound.sort((a, b) => b.priority - a.priority);
    const selected = skillsFound.slice(0, limit);

    let injectedContext = "";
    let totalChars = 0;

    // Load dynamic config from state if available
    let TOTAL_BUDGET = 12000;
    let PER_SKILL_LIMIT = 6000;
    try {
      if (fs.existsSync(STATE_FILE)) {
        const state = JSON.parse(fs.readFileSync(STATE_FILE, "utf8"));
        if (state.config) {
          TOTAL_BUDGET = state.config.totalSkillBudget || TOTAL_BUDGET;
          PER_SKILL_LIMIT = state.config.perSkillLimit || PER_SKILL_LIMIT;
        }
      }
    } catch (e) {
      // Fallback to defaults
    }

    for (const skill of selected) {
      if (totalChars > TOTAL_BUDGET) break;

      let content = fs.readFileSync(skill.path, "utf8");
      if (content.length > PER_SKILL_LIMIT) {
        content =
          content.slice(0, PER_SKILL_LIMIT) +
          "\n... [SKILL TRUNCATED DUE TO SIZE] ...";
      }

      const chunk = `\n\n--- SKILL DEFINITION: ${skill.folder} ---\n${content}\n-----------------------------------\n`;
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

// ─── SCOUT — Researcher ────────────────────────────────────────
class ScoutAgent extends Agent {
  constructor() {
    super(
      "scout",
      "SCOUT",
      `You are SCOUT, the Researcher for Hive Mind.

Your job is to research any topic deeply before the team starts building.
CRITICAL: We ONLY build modern web apps using Next.js or React. 
- You MUST reject or warn against any technology that isn't compatible with a modern web frontend.
- Your recommendations MUST focus on Next.js 15, Tailwind CSS, and Lucide React.
- If a project requires a backend, recommend Next.js Server Actions or API routes.

You provide:
- Technology comparisons (always with web-first focus)
- Feasibility analysis for web deployment
- Existing React/Next.js components or libraries to reuse
- Potential UI/UX pitfalls
- Recommended tech stack (MUST be Next.js or React)

Style: Bullet-point heavy. Always cite reasoning.
Output contract (always):
1. Overview
2. Key Findings
3. Web-Stack Justification (Next.js/React + Tailwind)
4. Risks
5. Acceptance Criteria Seed (3-6 measurable bullets)
6. RECOMMENDATION: PROCEED_WEB or REJECT_NON_WEB`,
    );
  }

  async research(topic, projectContext = "") {
    const skillsContext = loadApplicableSkills(
      ["research-", "web-", "frontend"],
      3,
    );
    const prompt = `Research this topic for our development team:

**Topic:** ${topic}
${projectContext ? `**Project Context:** ${projectContext}` : ""}
${skillsContext}

Provide:
1. Overview (2-3 sentences)
2. Key findings (bullet points)
3. Tech stack recommendations (Next.js/React only)
4. Potential risks/pitfalls
5. Existing tools/libraries to leverage
6. Acceptance criteria seed (testable, measurable)
7. RECOMMENDATION: What should we do?`;

    this.print(`Researching: ${topic}`);
    return await this.think(prompt);
  }
}

// ─── FORGE — Developer ────────────────────────────────────────
class ForgeAgent extends Agent {
  constructor() {
    super(
      "forge",
      "FORGE",
      `Lead Developer for Hive Mind. You exclusively build modern web apps.

STACK RULES:
- ONLY build Next.js (preferred) or React projects. 
- You are PROHIBITED from writing Python, standalone Express/Flask, or Node-CLI code.
- If a project needs a backend, use Next.js Server Actions or API routes.
- Tailwind CSS is MANDATORY for all styling. No plain CSS.
- Lucide React is the standard for icons.
- Every package.json MUST have a working "test" script.

CODE RULES:
- Next.js: Use App Router (app/ directory). Use Metadata API.
- Functions: Use Function Components + Hooks. Use JSDoc for types (no TS syntax in .js).
- Header format: **File: \`path/to/file.ext\`** + \`\`\`language.
- ONLY output new or changed files. Use FIX_MAP for rework.
- Never output node_modules, build artifacts, or cache folders.

Always provide:
1. Complete files
2. Rationale
3. Dependency list`,
    );
  }

  async implement(task, architecture = "", researchNotes = "") {
    // Highly targeted skill loading to prevent token limits
    const skillsContext = loadApplicableSkills(
      ["nextjs", "react-best-practices", "tailwind", "lucide", "clean-code"],
      3,
    );

    const prompt = `Implement the following task:

**Task:** ${task}
${architecture ? `**Architecture Notes:** ${architecture}` : ""}
${researchNotes ? `**Research Notes:** ${researchNotes}` : ""}
${skillsContext}

Ensure you provide a FULL setup (package.json, root config files, etc.) if this is a new project. If fixing issues, ONLY output the modified files in full.

MANDATORY OUTPUT FORMAT:
- For every file, use exactly this header line:
  **File: \`relative/path/to/file.ext\`**
- Immediately after the header, include a fenced code block with the complete modified file content.
- Do not provide pseudo-code.
- If task includes "Required FIX_MAP" items, add:
  ## FIX_MAP
  - <ID> -> <what changed + file>

Example:
**File: \`src/main.js\`**
\`\`\`javascript
// full file content
\`\`\``;

    this.print(`Implementing: ${task}`);
    return await this.think(prompt);
  }
}

// ─── LENS — Code Reviewer ─────────────────────────────────────
class LensAgent extends Agent {
  constructor() {
    super(
      "lens",
      "LENS",
      `You are LENS, the Code Reviewer for Hive Mind.

You are strict. No bad code ships. But you're constructive — you explain WHY something is wrong and HOW to fix it.

You check for:
- Security vulnerabilities (SQL injection, XSS, exposed secrets, etc.)
- Performance issues
- Error handling gaps
- Code smells and anti-patterns
- Missing tests
- Unclear variable/function names
- Unhandled edge cases

Output format (strict, machine-usable):
- VERDICT: APPROVED | NEEDS_CHANGES | REJECTED
- ACTION_ITEMS_TABLE markdown table with columns:
  | id | severity | file | issue | required_fix |
- CRITICAL issues (must fix before merge)
- WARNINGS (should fix)
- SUGGESTIONS (optional improvements)
- Overall quality score: X/10

Rules:
- If VERDICT is APPROVED, ACTION_ITEMS_TABLE must be empty or state "none".
- Each action item id must be stable (e.g., L1, L2, C1).
- required_fix must be concrete and testable.`,
    );
  }

  async review(code, context = "") {
    const skillsContext = loadApplicableSkills([
      "review-",
      "clean-code",
      "best-practices",
    ]);
    const prompt = `Review this code:

${context ? `**Context:** ${context}\n` : ""}
${skillsContext}

\`\`\`
${code}
\`\`\`

Give your full code review in the strict output format.`;

    this.print(`Reviewing code...`);
    return await this.think(prompt);
  }
}

// ─── PULSE — Tester ───────────────────────────────────────────
class PulseAgent extends Agent {
  constructor() {
    super(
      "pulse",
      "PULSE",
      `You are PULSE, the QA Engineer and Tester for Hive Mind.

Your job is to BREAK things before users do. You think adversarially.

You write:
- Unit tests (Jest/Vitest)
- Edge case tests (empty input, null, massive data, special characters)
- Integration tests
- Security tests

You also write test PLANS when you can't run code directly — listing every scenario that needs to be tested.

Output: Always include pass/fail criteria and what "done" looks like.`,
    );
  }

  async generateTests(code, context = "") {
    const prompt = `Write comprehensive tests for this code:

${context ? `**Context:** ${context}\n` : ""}
\`\`\`
${code}
\`\`\`

Include:
1. Unit tests for each function
2. Edge cases (empty, null, overflow, etc.)
3. Integration tests if applicable
4. Test plan for manual testing
5. A minimal runnable smoke test if full coverage is not possible

MANDATORY OUTPUT FORMAT:
- Use file blocks so tests can be materialized:
  **File: \`relative/path/to/test-file.ext\`**
  \`\`\`language
  // content
  \`\`\`
- Include any required test config files.
- End with:
  TEST_COMMAND: <exact command>
  EXPECTED_RESULT: <what pass looks like>
  FAILURE_ACTION_ITEMS:
  - <action 1>
  - <action 2>`;

    this.print(`Generating tests...`);
    return await this.think(prompt);
  }
}

// ─── ECHO — Social Media Head ─────────────────────────────────
class EchoAgent extends Agent {
  constructor() {
    super(
      "echo",
      "ECHO",
      `You are ECHO, the Social Media Head for Hive Mind.

You craft content that actually gets engagement — not corporate fluff.

You write for:
- Twitter/X (280 chars, punchy, hooks)
- LinkedIn (professional but human)
- Dev.to / Hashnode (technical blog posts)
- Product Hunt launches
- GitHub README "About" sections

Your style: Clear > Clever. Show don't tell. Lead with the value, not the process.
You also suggest: posting schedule, hashtags, and what visual to pair with each post.`,
    );
  }

  async createLaunchContent(project) {
    const prompt = `Create social media launch content for:

**Project:** ${project.name}
**What it does:** ${project.description}
**Who it's for:** ${project.audience || "developers"}
**Key features:** ${project.features || "not specified"}

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
    super(
      "atlas",
      "ATLAS",
      `You are ATLAS, the Systems Architect for Hive Mind.

Before any code is written, you design the system.

You produce:
- Component diagrams (as ASCII art or Mermaid)
- Data flow descriptions
- API contract definitions
- Database schema (if needed)
- File/folder structure
- Technology decisions with justification
- Starter/template choice

CRITICAL — Template/Bootstrap Rules:
You must specify ONE of these exact bootstrap templates. We ONLY build web apps now:
- "nextjs" → runs \`npx create-next-app@latest\` (use for full-stack apps)
- "react-vite" → runs \`npx create-vite@latest --template react\` (use for client-only SPAs)

You are PROHIBITED from using "node-cli" or "python-cli". All backend logic must reside in Next.js Server Actions or API routes.

Modern patterns to enforce:
- UI: Next.js App Router, Tailwind CSS, Lucide React icons.
- Backend: Next.js API Routes or Server Actions. No standalone Express/Flask.
- Auth/Routing: Next.js Middleware.
- Data: Prisma/Drizzle for SQL, or Server-side fetching.
- Styling: MANDATORY Tailwind CSS. No plain CSS files.

You prevent: over-engineering, under-engineering, and "we'll figure it out later" thinking.
Every design must answer: How does data flow? How does it scale? What fails first?

Output contract:
- Include a "FORGE EXECUTION CONTRACT" section:
  - required files (ONLY files FORGE needs to create/modify — NOT the ones the CLI generates)
  - minimum test targets
  - acceptance criteria
  - non-goals
- Include explicit template/bootstrap choice as one of: nextjs, react-vite, node-cli, python-cli`,
    );
  }

  async design(projectDescription, researchNotes = "") {
    const prompt = `Design the architecture for:

**Project:** ${projectDescription}
${researchNotes ? `**Research Notes:** ${researchNotes}` : ""}

Produce:
1. System overview (2-3 sentences)
2. Component diagram (ASCII/Mermaid)
3. Data flow
4. File/folder structure
5. Key technical decisions + justification
6. Template/bootstrap plan — pick EXACTLY ONE: nextjs, react-vite, node-cli, or python-cli
7. FORGE EXECUTION CONTRACT (required files FORGE must create + tests + acceptance criteria + non-goals)
8. What FORGE needs to know to start coding`;

    this.print(`Designing architecture...`);
    return await this.think(prompt);
  }
}

// ─── SAGE — Documentation Writer ──────────────────────────────
class SageAgent extends Agent {
  constructor() {
    super(
      "sage",
      "SAGE",
      `You are SAGE, the Documentation Writer for Hive Mind.

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
- Keep it scannable (headers, bullets, code blocks)`,
    );
  }

  async writeReadme(project) {
    const prompt = `Write a complete README.md for:

**Project name:** ${project.name}
**What it does:** ${project.description}
**Tech stack:** ${project.stack || "not specified"}
**Key features:** ${project.features || "not specified"}
**Target audience:** ${project.audience || "developers"}

Write a production-quality README with all standard sections.`;

    this.print(`Writing documentation for: ${project.name}`);
    return await this.think(prompt);
  }
}

// Re-export NovaAgent from its own file for convenience
const NovaAgent = require("./nova");

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
