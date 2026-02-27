/**
 * Base Agent Class
 * All agents extend this — handles memory, logging, and communication
 */

const fs = require('fs');
const path = require('path');
const { LLMClient } = require('./llm-client');

const MEMORY_DIR = path.join(__dirname, '..', 'memory');
const LOGS_DIR   = path.join(__dirname, '..', 'logs');

// Ensure dirs exist
[MEMORY_DIR, LOGS_DIR].forEach(d => fs.mkdirSync(d, { recursive: true }));

class Agent {
  /**
   * @param {string} name - Agent key (apex, scout, etc.)
   * @param {string} displayName - Human name (APEX, SCOUT, etc.)
   * @param {string} systemPrompt - The agent's persona & instructions
   */
  constructor(name, displayName, systemPrompt) {
    this.name = name;
    this.displayName = displayName;
    this.systemPrompt = systemPrompt;
    this.client = new LLMClient();
    this.memoryFile = path.join(MEMORY_DIR, `${name}.json`);
    this.memory = this._loadMemory();
  }

  // ─── Memory ──────────────────────────────────────────────────

  _loadMemory() {
    if (fs.existsSync(this.memoryFile)) {
      try { return JSON.parse(fs.readFileSync(this.memoryFile, 'utf8')); }
      catch { return { facts: [], history: [] }; }
    }
    return { facts: [], history: [] };
  }

  saveMemory() {
    fs.writeFileSync(this.memoryFile, JSON.stringify(this.memory, null, 2));
  }

  remember(fact) {
    this.memory.facts.push({ fact, at: new Date().toISOString() });
    this.saveMemory();
  }

  getMemoryContext() {
    if (!this.memory.facts.length) return '';
    const recent = this.memory.facts.slice(-10).map(f => `- ${f.fact}`).join('\n');
    return `\n\n## Your Memory (recent context)\n${recent}`;
  }

  // ─── Core chat ────────────────────────────────────────────────

  async think(userMessage, contextMessages = []) {
    const messages = [
      {
        role: 'system',
        content: this.systemPrompt + this.getMemoryContext(),
      },
      ...contextMessages,
      { role: 'user', content: userMessage },
    ];

    const response = await this.client.chat(this.name, messages);
    this._log(userMessage, response);

    // Store in short-term history
    this.memory.history.push({
      at: new Date().toISOString(),
      input: userMessage.slice(0, 200),
      output: response.slice(0, 200),
    });
    this.saveMemory();

    return response;
  }

  // ─── Structured output ────────────────────────────────────────

  /**
   * Ask the agent for a JSON response
   */
  async thinkJSON(prompt, contextMessages = []) {
    const jsonPrompt = `${prompt}\n\nRespond ONLY with valid JSON. No explanation, no markdown, no backticks. Just the raw JSON object.`;
    const raw = await this.think(jsonPrompt, contextMessages);

    try {
      // Strip any accidental markdown
      const clean = raw.replace(/```json|```/g, '').trim();
      return JSON.parse(clean);
    } catch {
      // Try to extract JSON from the response
      const match = raw.match(/\{[\s\S]*\}/);
      if (match) {
        try { return JSON.parse(match[0]); } catch {}
      }
      // Return wrapped as fallback
      return { raw, parseError: true };
    }
  }

  // ─── Logging ─────────────────────────────────────────────────

  _log(input, output) {
    const today = new Date().toISOString().split('T')[0];
    const logFile = path.join(LOGS_DIR, `${today}.log`);
    const entry = `\n[${new Date().toISOString()}] [${this.displayName}]\nIN: ${input.slice(0, 300)}\nOUT: ${output.slice(0, 500)}\n${'─'.repeat(60)}`;
    fs.appendFileSync(logFile, entry);
  }

  print(message) {
    const colors = {
      apex:  '\x1b[33m', // yellow
      scout: '\x1b[36m', // cyan
      forge: '\x1b[32m', // green
      lens:  '\x1b[35m', // magenta
      pulse: '\x1b[31m', // red
      echo:  '\x1b[34m', // blue
      atlas: '\x1b[94m', // bright blue
      sage:  '\x1b[37m', // white
      nova:  '\x1b[93m', // bright yellow
    };
    const reset = '\x1b[0m';
    const color = colors[this.name] || '\x1b[37m';
    console.log(`${color}[${this.displayName}]${reset} ${message}`);
  }
}

module.exports = Agent;
