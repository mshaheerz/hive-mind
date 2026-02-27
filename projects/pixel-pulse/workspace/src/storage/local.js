/**
 * @fileoverview Simple local‑filesystem storage implementation.
 * All images are stored under a configurable root directory.
 */

const fs = require('fs');
const path = require('path');
const { STORAGE_PATH } = require('../config');

/**
 * Ensures that the storage root exists.
 */
function ensureRoot() {
  if (!fs.existsSync(STORAGE_PATH)) {
    fs.mkdirSync(STORAGE_PATH, { recursive: true });
  }
}

/**
 * Returns the absolute path for a given relative sub‑path.
 * @param {string} subPath Relative path inside the storage root.
 * @returns {string}
 */
function getAbsolutePath(subPath) {
  ensureRoot();
  return path.join(STORAGE_PATH, subPath);
}

/**
 * Writes a Buffer to the storage.
 * @param {string} subPath Relative path where the file will be written.
 * @param {Buffer} data Buffer containing image data.
 * @returns {Promise<string>} Full path of the written file.
 */
async function writeFile(subPath, data) {
  const fullPath = getAbsolutePath(subPath);
  await fs.promises.mkdir(path.dirname(fullPath), { recursive: true });
  await fs.promises.writeFile(fullPath, data);
  return fullPath;
}

/**
 * Reads a file from storage.
 * @param {string} subPath Relative path to the file.
 * @returns {Promise<Buffer>}
 */
async function readFile(subPath) {
  const fullPath = getAbsolutePath(subPath);
  return await fs.promises.readFile(fullPath);
}

/**
 * Returns the public URL for a stored file when served via Express static middleware.
 * @param {string} subPath Relative path inside storage.
 * @returns {string}
 */
function getPublicUrl(subPath) {
  // Express will expose `/storage` as a static folder.
  return `/storage/${subPath}`;
}

module.exports = {
  writeFile,
  readFile,
  getPublicUrl,
  getAbsolutePath
};
