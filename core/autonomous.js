"use strict";
/**
 * core/autonomous.js
 * ──────────────────
 * Backward-compatibility bridge for autonomous runner components.
 * New code should prefer the granular modules in core/runner/.
 */

const { DuplicateDetector } = require("./runner/duplicate-detector");
const { DiscussionBoard } = require("./runner/discussion");
const { DeadlineTracker } = require("./runner/deadlines");
const { AutonomousState } = require("./runner/state");
const { AGENT_SCHEDULE } = require("./runner/config");

module.exports = {
  DuplicateDetector,
  DiscussionBoard,
  DeadlineTracker,
  AutonomousState,
  AGENT_SCHEDULE,
};
