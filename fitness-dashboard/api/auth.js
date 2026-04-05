import { generateToken } from './_auth.js';

export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { password } = req.body || {};
  const appPassword = process.env.APP_PASSWORD;

  if (!appPassword) {
    return res.status(500).json({ error: 'APP_PASSWORD not configured' });
  }

  if (!password || password !== appPassword) {
    return res.status(401).json({ error: 'Invalid password' });
  }

  const token = generateToken(appPassword);
  res.status(200).json({ token });
}
