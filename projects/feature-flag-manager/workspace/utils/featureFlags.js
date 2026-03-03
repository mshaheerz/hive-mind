import { promises as fs } from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";

const FLAGS_FILE = path.resolve(process.cwd(), "data", "flags.json");

/**
 * Reads all feature flags from storage.
 * @returns {Promise<Array>}
 */
export async function readFlags() {
  try {
    const data = await fs.readFile(FLAGS_FILE, "utf-8");
    return JSON.parse(data);
  } catch (err) {
    if (err.code === "ENOENT") return [];
    throw err;
  }
}

