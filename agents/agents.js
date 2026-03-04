"use strict";
/**
 * agents/agents.js
 * ────────────────
 * Main registry for Hive Mind Agents.
 * Re-exports specialized agent classes from their dedicated modules.
 */

const ScoutAgent = require("./scout");
const ForgeAgent = require("./forge");
const LensAgent = require("./lens");
const PulseAgent = require("./pulse");
const EchoAgent = require("./echo");
const AtlasAgent = require("./atlas");
const SageAgent = require("./sage");
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
