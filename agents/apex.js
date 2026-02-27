/**
 * APEX — Operations Head
 * The impartial gatekeeper. Approves/rejects all project proposals.
 * Never proposes. Never biased. Always reasons transparently.
 */

const Agent = require('../core/agent');

const APEX_PROMPT = `You are APEX, the Operations Head of a multi-agent AI development team called Hive Mind.

## Your Role
You are the FINAL AUTHORITY on all decisions. You approve or reject:
- New project proposals
- Feature additions to existing projects
- Agent-proposed changes
- Resource allocation

## Your Core Values (IMMUTABLE)
1. **Radical impartiality** — You have NO favorites. The idea quality is all that matters.
2. **You never propose** — You only evaluate what others propose.
3. **Transparent reasoning** — Every decision includes full written reasoning. No black boxes.
4. **Structured evaluation** — Every proposal gets: Feasibility, Scope, Risk, Value scores (1-10).
5. **Three outcomes only**: APPROVED, REJECTED, or REVISION_REQUESTED (with specific feedback).
6. **High bar by default** — If uncertain, do NOT approve.
7. **Execution discipline** — You assign clear next steps and enforce accountability.
8. **Definition of done discipline** — Any approved proposal must have measurable acceptance criteria.

## Evaluation Criteria
When evaluating any proposal, assess:
- **Feasibility** (1-10): Can the team actually build this?
- **Scope** (1-10, 10=small/clear): Is the scope well-defined and manageable?
- **Risk** (1-10, 10=low risk): What could go wrong?
- **Value** (1-10): What's the actual benefit?
- **Overall Score**: Weighted average.
- **Strict decision policy**:
  - APPROVED only when overall >= 8 and no category is below 6.
  - REVISION_REQUESTED when overall is 6-7.9 or any category is below 6.
  - REJECTED when overall < 6.

## Communication Style
- Strict, concise, and operational
- Never vague
- Give actionable, testable feedback
- Keep decisions under 220 words

## What You Cannot Do
- Approve your own proposals (you don't make them)
- Be swayed by "but the team really wants this"
- Skip the review process for any reason
- Give approval without written reasoning`;

class ApexAgent extends Agent {
  constructor() {
    super('apex', 'APEX', APEX_PROMPT);
  }

  /**
   * Review a project proposal and return a decision
   */
  async reviewProposal(proposal) {
    const prompt = `## Incoming Proposal for Review

**Title:** ${proposal.title}
**Proposed by:** ${proposal.proposedBy?.toUpperCase() || 'UNKNOWN'}
**Description:** ${proposal.description}
**Goal:** ${proposal.goal || 'Not specified'}
**Estimated Complexity:** ${proposal.complexity || 'Not specified'}

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
    const computedOverall = Math.round(((feasibility + scope + risk + value) / 4) * 100) / 100;
    const overall = toScore(rawDecision.overall || computedOverall);
    const hasWeakCategory = [feasibility, scope, risk, value].some((s) => s < 6);

    let decision;
    if (overall >= 8 && !hasWeakCategory) decision = 'APPROVED';
    else if (overall < 6) decision = 'REJECTED';
    else decision = 'REVISION_REQUESTED';

    const feedback =
      decision === 'APPROVED'
        ? null
        : (rawDecision.feedback || 'Raise feasibility, tighten scope, reduce risk, and provide measurable delivery milestones.');

    const nextAgent = decision === 'APPROVED' ? 'scout' : 'nova';
    const acceptanceCriteria = Array.isArray(rawDecision.acceptanceCriteria)
      ? rawDecision.acceptanceCriteria.map((x) => String(x).trim()).filter(Boolean).slice(0, 8)
      : [];

    return {
      decision,
      feasibility,
      scope,
      risk,
      value,
      overall,
      reasoning: String(rawDecision.reasoning || 'Decision normalized by strict APEX policy.'),
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
**Code Review Status:** ${project.lensApproved ? '✅ Approved by LENS' : '❌ Pending LENS review'}
**Tests Status:** ${project.pulseApproved ? '✅ Passed PULSE tests' : '❌ Tests not passed'}
**Docs Status:** ${project.sageComplete ? '✅ Documented by SAGE' : '⚠️ Docs pending'}
**Summary:** ${project.summary || 'No summary provided'}

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
    const fs = require('fs');
    const path = require('path');
    const queueFile = path.join(__dirname, '..', '.hive', 'decisions.json');
    
    let decisions = [];
    if (fs.existsSync(queueFile)) {
      try { decisions = JSON.parse(fs.readFileSync(queueFile, 'utf8')); } catch {}
    }
    
    decisions.push({
      at: new Date().toISOString(),
      proposal: proposal.title,
      proposedBy: proposal.proposedBy,
      ...decision,
    });
    
    fs.mkdirSync(path.dirname(queueFile), { recursive: true });
    fs.writeFileSync(queueFile, JSON.stringify(decisions, null, 2));
    
    const icon = decision.decision === 'APPROVED' ? '✅' : 
                 decision.decision === 'REJECTED' ? '❌' : '🔄';
    this.print(`${icon} Decision: ${decision.decision} (Score: ${decision.overall}/10)`);
    this.print(`   ${decision.reasoning}`);
  }
}

module.exports = ApexAgent;
