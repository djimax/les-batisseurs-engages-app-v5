import * as crypto from "crypto";
import { createHmac } from "crypto";

/**
 * Hash a password using bcrypt-like approach (simplified for demo)
 * In production, use bcryptjs or similar
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, "sha256").toString("hex");
  return `${salt}:${hash}`;
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  try {
    const [salt, storedHash] = hash.split(":");
    const computedHash = crypto.pbkdf2Sync(password, salt, 1000, 64, "sha256").toString("hex");
    return computedHash === storedHash;
  } catch (error) {
    return false;
  }
}

/**
 * Generate a random token
 */
export function generateToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

/**
 * Validate email format
 */
export function validateEmail(email: string): boolean {
  if (email.length > 320) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate password strength
 */
export function validatePassword(password: string): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push("Le mot de passe doit contenir au moins 8 caractères");
  }

  if (!/[A-Z]/.test(password)) {
    errors.push("Le mot de passe doit contenir au moins une majuscule");
  }

  if (!/[a-z]/.test(password)) {
    errors.push("Le mot de passe doit contenir au moins une minuscule");
  }

  if (!/[0-9]/.test(password)) {
    errors.push("Le mot de passe doit contenir au moins un chiffre");
  }

  if (!/[!@#$%^&*]/.test(password)) {
    errors.push("Le mot de passe doit contenir au moins un caractère spécial (!@#$%^&*)");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Create a session token using HMAC
 */
export function createSessionToken(userId: number, secret: string): string {
  const timestamp = Date.now();
  const data = `${userId}:${timestamp}`;
  const signature = createHmac("sha256", secret).update(data).digest("hex");
  return `${data}:${signature}`;
}

/**
 * Verify a session token
 */
export function verifySessionToken(token: string, secret: string): { valid: boolean; userId?: number } {
  try {
    const parts = token.split(":");
    if (parts.length !== 3) return { valid: false };

    const userId = parseInt(parts[0], 10);
    const timestamp = parseInt(parts[1], 10);
    const signature = parts[2];

    const data = `${userId}:${timestamp}`;
    const expectedSignature = createHmac("sha256", secret).update(data).digest("hex");

    if (signature !== expectedSignature) {
      return { valid: false };
    }

    // Check if token is not too old (24 hours)
    const now = Date.now();
    const tokenAge = now - timestamp;
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours

    if (tokenAge > maxAge) {
      return { valid: false };
    }

    return { valid: true, userId };
  } catch (error) {
    return { valid: false };
  }
}
