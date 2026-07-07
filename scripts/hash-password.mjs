#!/usr/bin/env node
// Generate an ADMIN_PASSWORD_HASH value:
//   node scripts/hash-password.mjs "your-password"
import { randomBytes, scrypt } from "node:crypto";

const password = process.argv[2];
if (!password) {
  console.error('Usage: node scripts/hash-password.mjs "your-password"');
  process.exit(1);
}

const salt = randomBytes(16);
scrypt(password, salt, 64, (err, derived) => {
  if (err) throw err;
  console.log(`scrypt:${salt.toString("base64")}:${derived.toString("base64")}`);
});
