/**
 * APEX — Operations Head
 * The impartial gatekeeper. Approves/rejects all project proposals.
 * Never proposes. Never biased. Always reasons transparently.
 */

const Agent = require("../core/agent");
const { loadApplicableSkills } = require("./utils");

const APEX_PROMPT = `You are APEX, the Operations Head of a multi-agent AI development team called Hive Mind.

## Your Role
You are the FINAL AUTHORITY on all decisions. You approve or reject:
- New project proposals
- Feature additions to existing projects
- Agent-proposed changes
- Resource allocation

## Your Core Values (IMMUTABLE)
1. **Radical impartiality** — You have NO favorites except for technology standards.
2. **You never propose** — You only evaluate.
3. **Transparent reasoning** — Every decision includes full written reasoning.
4. **Structured evaluation** — Feasibility, Scope, Risk, Value scores (1-10).
5. **Modern Stack Enforcement** — You MUST REJECT any proposal that isn't Next.js or React. 
6. **No Python/Node-CLI** — We do not build standalone CLI tools or Python backends anymore.
7. **High bar by default** — If uncertain, do NOT approve.
8. **Execution discipline** — Enforce accountability.

## Evaluation Criteria
When evaluating any proposal, assess:
- **Feasibility** (1-10): Can the team build this as a modern web app?
- **Stack Alignment** (1-10): Is it Next.js or React? If NO, score 1 and REJECT.
- **Value** (1-10): Is there clear user value?

## Strict decision policy:
- APPROVED only when overall >= 8 AND it is a React/Next.js project.
- REJECTED immediately if the stack is Python, Flask, Django, or Node-CLI.

## Communication Style
- Strict, concise, and operational.
- Reject with "STRICT STACK VIOLATION" if they propose non-web tech.`;

class ApexAgent extends Agent {
  constructor() {
    super("apex", "APEX", APEX_PROMPT);
  }

  /**
   * Review a project proposal and return a decision
   */
  async reviewProposal(proposal) {
    const prompt = `## Incoming Proposal for Review

**Title:** ${proposal.title}
**Proposed by:** ${proposal.proposedBy?.toUpperCase() || "UNKNOWN"}
**Description:** ${proposal.description}
**Goal:** ${proposal.goal || "Not specified"}
**Estimated Complexity:** ${proposal.complexity || "Not specified"}\n\n${loadApplicableSkills(["evaluation", "management", "risk-assessment"], 3)}

Review this proposal and respond with a JSON object in this exact format:
{
  "decision": "APPROVED" | "REJECTED" | "REVISION_REQUESTED",
  "feasibility": <1-10>,
  "scope": <1-10>,
  "risk": <1-10>,
  "value": <1-10>,
  "overall": <1-10>,
  "reasoning": "<your full reasoning in 2-4 sentences>",
  "feedback": "<specific actionable feedback or null if approved>",
  "acceptanceCriteria": ["3-6 measurable criteria for successful delivery"],
  "nextAgent": "<which agent should act next: scout | atlas | forge | null>"
}`;

    this.print(`Reviewing proposal: "${proposal.title}"`);
    const rawDecision = await this.thinkJSON(prompt);
    const decision = this._normalizeDecision(rawDecision);
    this._logDecision(proposal, decision);
    return decision;
  }

  _normalizeDecision(rawDecision = {}) {
    const toScore = (v) => {
      const n = Number(v);
      if (!Number.isFinite(n)) return 0;
      return Math.max(0, Math.min(10, Math.round(n * 100) / 100));
    };

    const feasibility = toScore(rawDecision.feasibility);
    const scope = toScore(rawDecision.scope);
    const risk = toScore(rawDecision.risk);
    const value = toScore(rawDecision.value);
    const computedOverall =
      Math.round(((feasibility + scope + risk + value) / 4) * 100) / 100;
    const overall = toScore(rawDecision.overall || computedOverall);
    const hasWeakCategory = [feasibility, scope, risk, value].some(
      (s) => s < 6,
    );

    let decision;
    if (overall >= 8 && !hasWeakCategory) decision = "APPROVED";
    else if (overall < 6) decision = "REJECTED";
    else decision = "REVISION_REQUESTED";

    const feedback =
      decision === "APPROVED"
        ? null
        : rawDecision.feedback ||
          "Raise feasibility, tighten scope, reduce risk, and provide measurable delivery milestones.";

    const nextAgent = decision === "APPROVED" ? "scout" : "nova";
    const acceptanceCriteria = Array.isArray(rawDecision.acceptanceCriteria)
      ? rawDecision.acceptanceCriteria
          .map((x) => String(x).trim())
          .filter(Boolean)
          .slice(0, 8)
      : [];

    return {
      decision,
      feasibility,
      scope,
      risk,
      value,
      overall,
      reasoning: String(
        rawDecision.reasoning || "Decision normalized by strict APEX policy.",
      ),
      feedback,
      acceptanceCriteria,
      nextAgent,
    };
  }

  /**
   * Evaluate whether code is ready to ship
   */
  async reviewShipReadiness(project) {
    const prompt = `## Ship Readiness Review

**Project:** ${project.name}
**Code Review Status:** ${project.lensApproved ? "✅ Approved by LENS" : "❌ Pending LENS review"}
**Tests Status:** ${project.pulseApproved ? "✅ Passed PULSE tests" : "❌ Tests not passed"}
**Docs Status:** ${project.sageComplete ? "✅ Documented by SAGE" : "⚠️ Docs pending"}
**Summary:** ${project.summary || "No summary provided"}\n\n${loadApplicableSkills(["ship-readiness", "qa", "compliance"], 3)}

Can this project ship? Respond JSON:
{
  "canShip": true | false,
  "blockers": ["list of blockers if any"],
  "reasoning": "your reasoning",
  "recommendation": "what to do next"
}`;

    return await this.thinkJSON(prompt);
  }

  _logDecision(proposal, decision) {
    const fs = require("fs");
    const path = require("path");
    const queueFile = path.join(__dirname, "..", ".hive", "decisions.json");

    let decisions = [];
    if (fs.existsSync(queueFile)) {
      try {
        decisions = JSON.parse(fs.readFileSync(queueFile, "utf8"));
      } catch {}
    }

    decisions.push({
      at: new Date().toISOString(),
      proposal: proposal.title,
      proposedBy: proposal.proposedBy,
      ...decision,
    });

    fs.mkdirSync(path.dirname(queueFile), { recursive: true });
    fs.writeFileSync(queueFile, JSON.stringify(decisions, null, 2));

    const icon =
      decision.decision === "APPROVED"
        ? "✅"
        : decision.decision === "REJECTED"
          ? "❌"
          : "🔄";
    this.print(
      `${icon} Decision: ${decision.decision} (Score: ${decision.overall}/10)`,
    );
    this.print(`   ${decision.reasoning}`);
  }
}

module.exports = ApexAgent;
