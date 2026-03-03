"use server";

import { readFlags } from "@/utils/featureFlags";

/**
 * Retrieves feature flags, optionally filtered by environment.
 * @param {string} [environment]
 * @returns {Promise<Array>}
 */
export async function getFeatureFlags(environment) {
  const flags = await readFlags();
  if (environment) {
    return flags.filter((f) => f.environment === environment);
  }
  return flags;
}
