import { verifyToken } from './_auth.js';

export default async function handler(req, res) {
  if (!verifyToken(req)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { endpoint, ...params } = req.query;
  if (!endpoint) {
    return res.status(400).json({ error: 'Missing endpoint parameter' });
  }

  const apiKey = process.env.HEVY_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'HEVY_API_KEY not configured' });
  }

  const qs = new URLSearchParams(params).toString();
  const url = `https://api.hevyapp.com/v1/${endpoint}${qs ? `?${qs}` : ''}`;

  try {
    const upstream = await fetch(url, {
      headers: { 'api-key': apiKey },
    });
    const data = await upstream.json();
    res.status(upstream.status).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
