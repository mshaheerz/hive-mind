"use strict";
/**
 * core/runner/duplicate-detector.js
 * ─────────────────────────────────
 * Lightweight similarity matching to prevent the team from
 * working on multiple identical project ideas.
 */

const fs = require("fs");
const path = require("path");
const { IDEA_INDEX_FILE } = require("./config");

/** Common English words to ignore to improve similarity accuracy. */
const STOPWORDS = new Set([
  "a",
  "an",
  "the",
  "and",
  "or",
  "but",
  "in",
  "on",
  "at",
  "to",
  "for",
  "of",
  "with",
  "by",
  "from",
  "is",
  "are",
  "was",
  "were",
  "be",
  "been",
  "being",
  "have",
  "has",
  "had",
  "do",
  "does",
  "did",
  "will",
  "would",
  "could",
  "should",
  "may",
  "might",
  "it",
  "its",
  "this",
  "that",
  "these",
  "those",
  "i",
  "we",
  "you",
  "they",
  "he",
  "she",
]);

class DuplicateDetector {
  constructor() {
    this.index = this._load();
  }

  _load() {
    if (fs.existsSync(IDEA_INDEX_FILE)) {
      try {
        return JSON.parse(fs.readFileSync(IDEA_INDEX_FILE, "utf8"));
      } catch {}
    }
    return { ideas: [], projects: [] };
  }

  _save() {
    fs.mkdirSync(path.dirname(IDEA_INDEX_FILE), { recursive: true });
    fs.writeFileSync(IDEA_INDEX_FILE, JSON.stringify(this.index, null, 2));
  }

  /**
   * Check if a text (e.g. title + desk) overlaps significantly with an existing project.
   * Simple Jaccard similarity based on cleaned keywords.
   */
  isDuplicate(title, description) {
    const incomingKeywords = this._extractKeywords(`${title} ${description}`);

    for (const existing of [...this.index.ideas, ...this.index.projects]) {
      const existingKeywords = this._extractKeywords(
        `${existing.title} ${existing.description}`,
      );
      const overlap = this._calculateOverlap(
        incomingKeywords,
        existingKeywords,
      );

      // 60% overlap threshold for high-confidence duplicates
      if (overlap >= 0.6) {
        return { isDuplicate: true, similarTo: existing, similarity: overlap };
      }
    }
    return { isDuplicate: false };
  }

  /**
   * Permanently register an idea or project to prevent future duplicates.
   */
  register(title, description, type = "idea") {
    const entry = {
      title,
      description: description.slice(0, 2000),
      keywords: this._extractKeywords(`${title} ${description}`),
      registeredAt: new Date().toISOString(),
    };

    if (type === "project") {
      this.index.projects.push(entry);
    } else {
      this.index.ideas.push(entry);
    }
    this._save();
  }

  _extractKeywords(text) {
    return (text || "")
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 3 && !STOPWORDS.has(w));
  }

  _calculateOverlap(a, b) {
    const setA = new Set(a);
    const setB = new Set(b);
    const intersection = [...setA].filter((x) => setB.has(x)).length;
    const union = new Set([...setA, ...setB]).size;
    return union === 0 ? 0 : intersection / union;
  }
}

module.exports = { DuplicateDetector };
