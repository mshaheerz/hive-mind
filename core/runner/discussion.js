"use strict";
/**
 * core/runner/discussion.js
 * ─────────────────────────
 * Manages agent-to-agent discussion threads for decentralized decision making.
 */

const fs = require("fs");
const path = require("path");
const { DISCUSS_DIR } = require("./config");

class DiscussionBoard {
  constructor() {
    fs.mkdirSync(DISCUSS_DIR, { recursive: true });
  }

  /**
   * Start a new discussion thread.
   * @param {string} proposalId - Unique ID for the topic (e.g. project slug or proposal hash).
   * @param {string} topic - Human-readable topic name.
   */
  startThread(proposalId, topic) {
    const thread = {
      id: proposalId,
      topic,
      messages: [],
      startedAt: new Date().toISOString(),
      status: "open",
    };
    this._saveThread(thread);
    return thread;
  }

  /**
   * Post a message to an existing thread.
   */
  post(threadId, agentName, message) {
    const thread = this.getThread(threadId);
    if (!thread) return;

    thread.messages.push({
      from: agentName.toUpperCase(),
      message,
      at: new Date().toISOString(),
    });
    this._saveThread(thread);
  }

  /**
   * Close a thread with a final resolution message.
   */
  closeThread(threadId, resolution) {
    const thread = this.getThread(threadId);
    if (!thread) return;

    thread.status = "closed";
    thread.resolution = resolution;
    thread.closedAt = new Date().toISOString();
    this._saveThread(thread);
  }

  getThread(id) {
    const f = path.join(DISCUSS_DIR, `${id}.json`);
    if (!fs.existsSync(f)) return null;
    try {
      return JSON.parse(fs.readFileSync(f, "utf8"));
    } catch {
      return null;
    }
  }

  /**
   * Retrieve all currently active discussion threads.
   */
  getAllOpen() {
    if (!fs.existsSync(DISCUSS_DIR)) return [];
    return fs
      .readdirSync(DISCUSS_DIR)
      .filter((f) => f.endsWith(".json"))
      .map((f) => {
        try {
          return JSON.parse(fs.readFileSync(path.join(DISCUSS_DIR, f), "utf8"));
        } catch {
          return null;
        }
      })
      .filter((t) => t && t.status === "open");
  }

  _saveThread(thread) {
    fs.writeFileSync(
      path.join(DISCUSS_DIR, `${thread.id}.json`),
      JSON.stringify(thread, null, 2),
    );
  }

  /**
   * Utility to flatten messages for LLM context.
   */
  formatThread(thread) {
    return thread.messages
      .map(
        (m) =>
          `[${m.from}] (${new Date(m.at).toLocaleTimeString()}): ${m.message}`,
      )
      .join("\n");
  }
}

module.exports = { DiscussionBoard };
