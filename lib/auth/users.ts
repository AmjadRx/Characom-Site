import "server-only";
import { verifyPassword } from "./password";
import type { Role } from "@/lib/content/types";

/**
 * Admin users come from environment variables — no database ("Vercel and
 * GitHub only"). Owner: ADMIN_EMAIL + ADMIN_PASSWORD_HASH. Optional editors:
 * ADMIN_EDITORS="a@x.com:scrypt:...:...,b@y.com:scrypt:...:..."
 *
 * Dev fallback (NODE_ENV=development, no hash configured):
 * admin@characom.dev / characom
 */

interface AdminUser {
  email: string;
  passwordHash: string;
  role: Role;
}

const DEV_FALLBACK: AdminUser = {
  email: "admin@characom.dev",
  // scrypt hash of "characom" — dev only, never honored in production
  passwordHash: "",
  role: "owner",
};

export function isDevFallbackActive(): boolean {
  return (
    process.env.NODE_ENV === "development" && !process.env.ADMIN_PASSWORD_HASH
  );
}

export function listUsers(): AdminUser[] {
  const users: AdminUser[] = [];
  const email = process.env.ADMIN_EMAIL;
  const hash = process.env.ADMIN_PASSWORD_HASH;
  if (email && hash) {
    users.push({ email: email.toLowerCase(), passwordHash: hash, role: "owner" });
  }
  const editors = process.env.ADMIN_EDITORS;
  if (editors) {
    for (const entry of editors.split(",")) {
      const idx = entry.indexOf(":");
      if (idx === -1) continue;
      const editorEmail = entry.slice(0, idx).trim().toLowerCase();
      const editorHash = entry.slice(idx + 1).trim();
      if (editorEmail && editorHash.startsWith("scrypt:")) {
        users.push({ email: editorEmail, passwordHash: editorHash, role: "editor" });
      }
    }
  }
  return users;
}

export async function authenticate(
  email: string,
  password: string,
): Promise<{ email: string; role: Role } | null> {
  const normalized = email.trim().toLowerCase();

  if (isDevFallbackActive()) {
    if (normalized === DEV_FALLBACK.email && password === "characom") {
      return { email: DEV_FALLBACK.email, role: "owner" };
    }
  }

  for (const user of listUsers()) {
    if (user.email !== normalized) continue;
    if (await verifyPassword(password, user.passwordHash)) {
      return { email: user.email, role: user.role };
    }
  }
  return null;
}
