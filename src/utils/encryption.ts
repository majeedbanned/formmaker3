import crypto from 'crypto';

// Function to ensure key is exactly 32 bytes
function normalizeKey(key: string): Buffer {
  // If key is shorter than 32 bytes, pad it with zeros
  // If key is longer than 32 bytes, truncate it
  const buffer = Buffer.from(key);
  const normalized = Buffer.alloc(32);
  buffer.copy(normalized, 0, 0, 32);
  return normalized;
}

// Use a secure key or generate one if not provided
const ENCRYPTION_KEY = normalizeKey(process.env.NEXT_PUBLIC_ENCRYPTION_KEY || 'default-encryption-key-32-bytes!!!');
const ALGORITHM = 'aes-256-cbc';

export function encryptFilter(filter: Record<string, unknown>): string {
  try {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
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
    const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
    return JSON.parse(decrypted.toString());
  } catch (error) {
    console.error('Decryption error:', error);
    return {};
  }
} 