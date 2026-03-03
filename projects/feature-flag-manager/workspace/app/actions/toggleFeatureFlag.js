"use server";

import { readFlags, writeFlags } from "@/utils/featureFlags";

/**
 * Toggles the enabled state of a flag.
 * @param {string} id
 */
export async function toggleFeatureFlag(id) {
  const flags = await readFlags();
  const flag = flags.find((f) => f.id === id);
  if (!flag) {
    throw new Error("Feature flag not found");
  }
  flag.enabled = !flag.enabled;
  flag.version += 1;
  flag.updatedAt = new Date().toISOString();
  await writeFlags(flags);
  return flag;
}
