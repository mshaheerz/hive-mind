"use strict";
/**
 * core/runner/lens-utils.js
 * ────────────────────────
 * Utility functions for parsing and summarising output from the LENS agent.
 * LENS is the "gatekeeper" — it reviews FORGE's work and decides if it
 * meets requirements.
 */

/**
 * Summarise a long LENS review into a few lines.
 * Looks for "Verdict" and critical issue lines.
 *
 * @param {string} [text=""]
 * @returns {string}
 */
function summarizeLensReview(text = "") {
  const raw = String(text || "").replace(/\r/g, "");
  const lines = raw
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  const picked = [];

  const verdict = lines.find((l) => /verdict\s*:/i.test(l));
  if (verdict) picked.push(verdict);

  const critical = lines.filter((l) =>
    /critical|must fix|security|needs_changes|rejected/i.test(l),
  );
  for (const line of critical) {
    if (picked.length >= 4) break;
    if (!picked.includes(line)) picked.push(line);
  }

  if (!picked.length) {
    const first = lines.slice(0, 2).join(" ");
    return first.slice(0, 260) || "LENS requested changes before merge.";
  }

  return picked.join(" | ").slice(0, 520);
}

/**
 * Extract action items (required fixes) from LENS output.
 * Tries to parse JSON blocks first, then falls back to Markdown table parsing.
 *
 * @param {string} [text=""]
 * @param {number} [maxItems=5]
 * @returns {object[]} Array of requirements: { id, severity, file, requirement }
 */
function extractLensActionItems(text = "", maxItems = 5) {
  const raw = String(text || "").replace(/\r/g, "");

  // 1. Try parsing JSON block if present
  try {
    let jsonStr = "";
    const blockMatch = raw.match(/```(?:json)?\s*([\s\S]+?)\s*```/);
    if (blockMatch) jsonStr = blockMatch[1];
    else {
      const firstBrace = raw.indexOf("{");
      const lastBrace = raw.lastIndexOf("}");
      if (firstBrace >= 0 && lastBrace > firstBrace)
        jsonStr = raw.substring(firstBrace, lastBrace + 1);
    }

    if (jsonStr) {
      const parsed = JSON.parse(jsonStr);
      let itemsArray =
        parsed.ACTION_ITEMS_TABLE ||
        parsed.CRITICAL ||
        parsed.issues ||
        parsed.action_items ||
        [];
      if (Array.isArray(itemsArray) && itemsArray.length > 0) {
        return itemsArray
          .map((i, idx) => {
            const idCandidate = String(i.id || `L${idx + 1}`)
              .replace(/[^\w-]/g, "")
              .toUpperCase();
            const severityRaw = String(i.severity || "critical").toLowerCase();
            const severity = /warn|low|non.?critical|should/.test(severityRaw)
              ? "warning"
              : "critical";
            const file =
              i.file && String(i.file).includes(".") ? i.file : undefined;
            const requirement =
              `${file ? file + " " : ""}${i.issue || i.description || ""} ${i.required_fix || i.fix || i.recommendation || ""}`
                .replace(/\s+/g, " ")
                .trim();
            return { id: idCandidate, severity, file, requirement };
          })
          .slice(0, maxItems);
      }
    }
  } catch {}

  // 2. Fall back to Markdown Table parsing
  const lines = raw.split("\n");
  const items = [];
  const HEADER_WORDS = new Set([
    "ID",
    "SEVERITY",
    "ISSUE",
    "DESCRIPTION",
    "FIX",
    "RECOMMENDATION",
    "CODE",
    "FILE",
    "COLUMN",
  ]);

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed.startsWith("|") || /^\|\s*-+/.test(trimmed)) continue;

    const cols = trimmed
      .split("|")
      .map((c) => c.trim())
      .filter(Boolean);
    if (cols.length < 4) continue;

    const idCandidate = String(cols[0] || "")
      .replace(/[^\w-]/g, "")
      .toUpperCase();
    if (
      HEADER_WORDS.has(idCandidate) ||
      !/^[A-Z]\d+$|^[A-Z]{1,3}$/.test(idCandidate)
    )
      continue;

    const issue = cols[2] || "";
    const fix = cols[4] || cols[3] || "";
    const requirement = `${issue} ${fix}`.replace(/\s+/g, " ").trim();
    if (!requirement) continue;

    const severityRaw = `${cols[1] || ""} ${cols[2] || ""}`.toLowerCase();
    const severity = /warn|non.?critical|should/.test(severityRaw)
      ? "warning"
      : "critical";
    const file = (cols[2] || "").includes(".") ? cols[2] : undefined;

    items.push({ id: idCandidate, severity, file, requirement });
    if (items.length >= maxItems) break;
  }

  if (items.length) return items;

  // 3. Last fallback: high-signal lines (greedy)
  return lines
    .map((l) => l.trim())
    .filter((l) =>
      /critical|must fix|security|validation|tests|injection/i.test(l),
    )
    .slice(0, maxItems)
    .map((l, idx) => ({
      id: `L${idx + 1}`,
      severity: /warning|should/i.test(l) ? "warning" : "critical",
      requirement: l.replace(/\s+/g, " ").trim(),
    }));
}

/**
 * Parse a FORGE "fix map" which correlates LENS issue IDs to forge.md sections.
 * Format: "L1 => fixed in logic section"
 *
 * @param {string} [text=""]
 * @returns {object} Map of issue ID → description.
 */
function parseForgeFixMap(text = "") {
  const lines = String(text || "")
    .replace(/\r/g, "")
    .split("\n");
  const mappings = {};
  for (const line of lines) {
    const m = line.match(/(?:^|\s)([A-Z]\d+)\s*(?:=>|->|:)\s*(.+)$/i);
    if (!m) continue;
    mappings[m[1].toUpperCase()] = String(m[2] || "").trim();
  }
  return mappings;
}

module.exports = {
  summarizeLensReview,
  extractLensActionItems,
  parseForgeFixMap,
};
