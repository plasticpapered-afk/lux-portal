import crypto from 'crypto';

const SECRET = process.env.STAFF_SECRET || 'dev-secret-change-me';
export const STAFF_PASSWORD = process.env.STAFF_PASSWORD || 'change-me';
export const HR_PASSWORD = process.env.HR_PASSWORD || 'change-me';

export function sign(payload) {
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const mac = crypto.createHmac('sha256', SECRET).update(body).digest('base64url');
  return `${body}.${mac}`;
}

export function verify(token) {
  if (!token || !token.includes('.')) return null;
  const [body, mac] = token.split('.');
  const expected = crypto.createHmac('sha256', SECRET).update(body).digest('base64url');
  if (mac.length !== expected.length) return null;
  if (!crypto.timingSafeEqual(Buffer.from(mac), Buffer.from(expected))) return null;
  try {
    const data = JSON.parse(Buffer.from(body, 'base64url').toString());
    if (data.exp && Date.now() > data.exp) return null;
    return data;
  } catch {
    return null;
  }
}

export function session(req) {
  const raw = req.cookies?.get?.('lux_staff')?.value;
  return verify(raw);
}

export function canReview(role) {
  return role === 'hr' || role === 'admin';
}

export function canManage(role) {
  return role === 'admin';
}
