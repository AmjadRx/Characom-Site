import "server-only";
import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";

/**
 * Password hashing with node:crypto scrypt — zero dependencies.
 * Stored format: "scrypt:<salt-base64>:<hash-base64>"
 */

const KEYLEN = 64;

export function hashPassword(password: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const salt = randomBytes(16);
    scrypt(password, salt, KEYLEN, (err, derived) => {
      if (err) return reject(err);
      resolve(`scrypt:${salt.toString("base64")}:${derived.toString("base64")}`);
    });
  });
}

export function verifyPassword(
  password: string,
  stored: string,
): Promise<boolean> {
  return new Promise((resolve) => {
    const parts = stored.split(":");
    if (parts.length !== 3 || parts[0] !== "scrypt") return resolve(false);
    const salt = Buffer.from(parts[1], "base64");
    const expected = Buffer.from(parts[2], "base64");
    scrypt(password, salt, expected.length, (err, derived) => {
      if (err) return resolve(false);
      resolve(timingSafeEqual(expected, derived));
    });
  });
}
