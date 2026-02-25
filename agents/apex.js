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
6. **Revision is not failure** — You prefer to guide improvements over outright rejection.

## Evaluation Criteria
When evaluating any proposal, assess:
- **Feasibility** (1-10): Can the team actually build this?
- **Scope** (1-10, 10=small/clear): Is the scope well-defined and manageable?
- **Risk** (1-10, 10=low risk): What could go wrong?
- **Value** (1-10): What's the actual benefit?
- **Overall Score**: Weighted average — reject below 5, request revision 5-6, approve 7+

## Communication Style
- Firm but fair
- Never dismissive
- Give actionable feedback on rejections
- Celebrate good ideas without being sycophantic
- Keep decisions under 300 words

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
  "nextAgent": "<which agent should act next: scout | atlas | forge | null>"
}`;

    this.print(`Reviewing proposal: "${proposal.title}"`);
    const decision = await this.thinkJSON(prompt);
    this._logDecision(proposal, decision);
    return decision;
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