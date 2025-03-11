import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.NEXT_PUBLIC_ENCRYPTION_KEY || 'your-fallback-encryption-key-32-chars!!';
const ALGORITHM = 'aes-256-cbc';

export function encryptFilter(filter: Record<string, unknown>): string {
  try {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY), iv);
    const encrypted = Buffer.concat([cipher.update(JSON.stringify(filter)), cipher.final()]);
    return `${iv.toString('hex')}:${encrypted.toString('hex')}`;
  } catch (error) {
    console.error('Encryption error:', error);
    return '';
  }
}

export function decryptFilter(encryptedFilter: string): Record<string, unknown> {
  try {
    const [ivHex, encryptedHex] = encryptedFilter.split(':');
    if (!ivHex || !encryptedHex) {
      return {};
    }

    const iv = Buffer.from(ivHex, 'hex');
    const encrypted = Buffer.from(encryptedHex, 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY), iv);
    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
    return JSON.parse(decrypted.toString());
  } catch (error) {
    console.error('Decryption error:', error);
    return {};
  }
} 