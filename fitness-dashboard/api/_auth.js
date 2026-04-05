import crypto from 'crypto';

export function generateToken(password) {
  return crypto
    .createHmac('sha256', password)
    .update('fitness-dashboard-auth')
    .digest('hex');
}

export function verifyToken(req) {
  const token = req.headers['x-auth-token'];
  const appPassword = process.env.APP_PASSWORD;
  if (!token || !appPassword) return false;
  const expected = generateToken(appPassword);
  return token === expected;
}
