import { createHash, randomInt, timingSafeEqual } from 'crypto';

export function generateSixDigitCode(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, '0');
}

export function hashEmailChangeCode(userId: string, code: string): string {
  const secret = process.env.EMAIL_CHANGE_CODE_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  return createHash('sha256').update(`${userId}:${code}:${secret}`).digest('hex');
}

export function hashesEqualHex(a: string, b: string): boolean {
  try {
    const bufa = Buffer.from(a, 'hex');
    const bufb = Buffer.from(b, 'hex');
    if (bufa.length !== bufb.length) return false;
    return timingSafeEqual(bufa, bufb);
  } catch {
    return false;
  }
}
