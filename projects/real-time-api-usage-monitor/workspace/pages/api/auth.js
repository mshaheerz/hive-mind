/** 
 * Simple authentication mock API.
 * In a real project replace this with proper auth (JWT, OAuth, etc.).
 */
export default function handler(req, res) {
  if (req.method === 'POST') {
    // For demonstration we just echo back a static token
    const { username } = req.body;

    // Basic validation (keep it minimal for the starter)
    if (!username) {
      return res.status(400).json({ error: 'Username is required' });
    }

    return res.status(200).json({
      token: 'demo-token-12345',
      user: { name: username },
    });
  }

  // Only POST is allowed for this endpoint
  res.setHeader('Allow', ['POST']);
  return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
}
