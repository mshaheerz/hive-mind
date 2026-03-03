"use server";

import { readFlags, writeFlags, createFlag } from "@/utils/featureFlags";

/**
 * Creates a new feature flag.
 * @param {{key:string, description:string, environment:string}} param0
 */
export async function createFeatureFlag({ key, description, environment }) {
  const flags = await readFlags();

  if (flags.some((f) => f.key === key && f.environment === environment)) {
    throw new Error("Feature flag with this key already exists in the selected environment.");
  }

  const newFlag = createFlag({ key, description, environment });
  flags.push(newFlag);
  await writeFlags(flags);
  return newFlag;
}
