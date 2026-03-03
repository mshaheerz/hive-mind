import { NextResponse } from "next/server";
import { readFlags } from "@/utils/featureFlags";

/**
 * GET /api/featureFlags?env=development
 * Returns flags filtered by the optional `env` query param.
 */
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const env = searchParams.get("env");
  const flags = await readFlags();
  const filtered = env ? flags.filter((f) => f.environment === env) : flags;
  return NextResponse.json(filtered);
}
