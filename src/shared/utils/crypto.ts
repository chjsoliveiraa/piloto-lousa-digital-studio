/**
 * Cryptographic Utilities
 * For checksums and digital signatures
 */

import { createHash, createSign, createVerify, randomBytes } from 'crypto';

/**
 * Compute SHA-256 checksum of a string or buffer
 */
export function computeSHA256(data: string | Buffer): string {
  const hash = createHash('sha256');
  hash.update(data);
  return hash.digest('hex');
}

/**
 * Compute SHA-512 checksum of a string or buffer
 */
export function computeSHA512(data: string | Buffer): string {
  const hash = createHash('sha512');
  hash.update(data);
  return hash.digest('hex');
}

/**
 * Compute checksum with specified algorithm
 */
export function computeChecksum(
  data: string | Buffer,
  algorithm: 'sha256' | 'sha512' = 'sha256'
): string {
  return algorithm === 'sha512' ? computeSHA512(data) : computeSHA256(data);
}

/**
 * Sign data with RSA private key
 */
export function signData(
  data: string | Buffer,
  privateKey: string,
  algorithm: 'RSA-SHA256' | 'ECDSA-SHA256' = 'RSA-SHA256'
): string {
  const sign = createSign(algorithm);
  sign.update(data);
  sign.end();
  
  const signature = sign.sign(privateKey);
  return signature.toString('base64');
}

/**
 * Verify signature with public key
 */
export function verifySignature(
  data: string | Buffer,
  signature: string,
  publicKey: string,
  algorithm: 'RSA-SHA256' | 'ECDSA-SHA256' = 'RSA-SHA256'
): boolean {
  try {
    const verify = createVerify(algorithm);
    verify.update(data);
    verify.end();
    
    return verify.verify(publicKey, Buffer.from(signature, 'base64'));
  } catch (error) {
    console.error('Signature verification failed:', error);
    return false;
  }
}

/**
 * Generate random ID
 */
export function generateId(length: number = 16): string {
  return randomBytes(length).toString('hex');
}

/**
 * Hash password (for future user authentication)
 */
export function hashPassword(password: string, salt?: string): string {
  const actualSalt = salt || randomBytes(16).toString('hex');
  const hash = createHash('sha256');
  hash.update(password + actualSalt);
  return `${actualSalt}:${hash.digest('hex')}`;
}

/**
 * Verify password hash
 */
export function verifyPassword(password: string, hashedPassword: string): boolean {
  const [salt, hash] = hashedPassword.split(':');
  const computedHash = hashPassword(password, salt);
  return computedHash === hashedPassword;
}
