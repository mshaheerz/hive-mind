import type { NextApiRequest, NextApiResponse } from "next";

/**
 * Mock authentication endpoint.
 *
 * POST /api/auth
 *   body: { username: string, password: string }
 *
 * Returns a fake JWT token for any non‑empty credentials.
 */
export default function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: "Missing username or password" });
  }

  // In a real app you'd verify credentials against a DB.
  // Here we just return a dummy token.
  const fakeToken = Buffer.from(`${username}:dummy`).toString("base64");

  return res.status(200).json({
    token: fakeToken,
    user: { name: username },
  });
}
