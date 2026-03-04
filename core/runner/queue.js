"use strict";
/**
 * core/runner/queue.js
 * ─────────────────────
 * Proposal queue I/O and CEO ↔ APEX bridge file management.
 */

const fs = require("fs");
const path = require("path");
const { QUEUE_FILE, CEO_BRIDGE_FILE } = require("./config");

/**
 * Load the APEX proposal queue from disk.
 * Returns an empty array on first run or if the file is corrupt.
 *
 * @returns {object[]} Array of proposal objects.
 */
function loadQueue() {
  if (!fs.existsSync(QUEUE_FILE)) return [];
  try {
    return JSON.parse(fs.readFileSync(QUEUE_FILE, "utf8"));
  } catch {
    return [];
  }
}

/**
 * Persist the proposal queue to disk.
 *
 * @param {object[]} q - Array of proposals to persist.
 */
function saveQueue(q) {
  fs.mkdirSync(path.dirname(QUEUE_FILE), { recursive: true });
  fs.writeFileSync(QUEUE_FILE, JSON.stringify(q, null, 2));
}

/**
 * Load the CEO ↔ APEX communication bridge.
 * The bridge is how humans send real-time commands to the running agents.
 *
 * @returns {{ messages: object[] }} Bridge payload.
 */
function loadCeoBridge() {
  if (!fs.existsSync(CEO_BRIDGE_FILE)) return { messages: [] };
  try {
    const parsed = JSON.parse(fs.readFileSync(CEO_BRIDGE_FILE, "utf8"));
    if (!Array.isArray(parsed.messages)) return { messages: [] };
    return parsed;
  } catch {
    return { messages: [] };
  }
}

/**
 * Persist the CEO bridge (with messages + timestamp) to disk.
 *
 * @param {{ messages: object[] }} data - Bridge payload to save.
 */
function saveCeoBridge(data) {
  fs.mkdirSync(path.dirname(CEO_BRIDGE_FILE), { recursive: true });
  const payload = {
    messages: Array.isArray(data?.messages) ? data.messages : [],
    updatedAt: new Date().toISOString(),
  };
  fs.writeFileSync(CEO_BRIDGE_FILE, JSON.stringify(payload, null, 2));
}

module.exports = { loadQueue, saveQueue, loadCeoBridge, saveCeoBridge };
