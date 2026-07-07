import "server-only";
import fs from "node:fs/promises";
import path from "node:path";

/**
 * Content source adapters. Content lives as JSON (and media binaries) in the
 * GitHub repo — the repo IS the database ("Vercel and GitHub only").
 *
 *  - fs adapter: reads/writes ./content and ./media on the local filesystem.
 *    Used in dev and at build time (content is committed with the code).
 *  - github adapter: reads/writes via the GitHub Contents API. Used on Vercel
 *    (read-only filesystem) so admin edits become commits and are readable
 *    immediately after on-demand revalidation — no redeploy.
 */

export interface ContentSource {
  /** raw file text, or null when missing */
  read(filePath: string): Promise<string | null>;
  /** raw binary, or null when missing */
  readBinary(filePath: string): Promise<Buffer | null>;
  write(filePath: string, content: string, message: string): Promise<void>;
  writeBinary(filePath: string, content: Buffer, message: string): Promise<void>;
  remove(filePath: string, message: string): Promise<void>;
  /** file names (not paths) directly inside dirPath */
  list(dirPath: string): Promise<string[]>;
}

/* ── fs adapter ────────────────────────────────────────────────────────── */

const ROOT = process.cwd();

function resolveLocal(filePath: string): string {
  const abs = path.resolve(ROOT, filePath);
  if (!abs.startsWith(ROOT + path.sep)) {
    throw new Error(`Path escapes project root: ${filePath}`);
  }
  return abs;
}

const fsSource: ContentSource = {
  async read(filePath) {
    try {
      return await fs.readFile(resolveLocal(filePath), "utf8");
    } catch {
      return null;
    }
  },
  async readBinary(filePath) {
    try {
      return await fs.readFile(resolveLocal(filePath));
    } catch {
      return null;
    }
  },
  async write(filePath, content) {
    const abs = resolveLocal(filePath);
    await fs.mkdir(path.dirname(abs), { recursive: true });
    await fs.writeFile(abs, content, "utf8");
  },
  async writeBinary(filePath, content) {
    const abs = resolveLocal(filePath);
    await fs.mkdir(path.dirname(abs), { recursive: true });
    await fs.writeFile(abs, content);
  },
  async remove(filePath) {
    try {
      await fs.unlink(resolveLocal(filePath));
    } catch {
      /* already gone */
    }
  },
  async list(dirPath) {
    try {
      const entries = await fs.readdir(resolveLocal(dirPath), {
        withFileTypes: true,
      });
      return entries.filter((e) => e.isFile()).map((e) => e.name);
    } catch {
      return [];
    }
  },
};

/* ── GitHub adapter ────────────────────────────────────────────────────── */

const GH_API = "https://api.github.com";

function ghConfig() {
  const token = process.env.GITHUB_TOKEN;
  const repo = process.env.GITHUB_REPO;
  const branch = process.env.GITHUB_BRANCH || "main";
  if (!token || !repo) return null;
  return { token, repo, branch };
}

function ghHeaders(token: string, raw = false): HeadersInit {
  return {
    Authorization: `Bearer ${token}`,
    Accept: raw ? "application/vnd.github.raw+json" : "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "characom-site",
  };
}

function encodePath(filePath: string): string {
  return filePath.split("/").map(encodeURIComponent).join("/");
}

async function ghGetSha(filePath: string): Promise<string | null> {
  const cfg = ghConfig();
  if (!cfg) return null;
  const res = await fetch(
    `${GH_API}/repos/${cfg.repo}/contents/${encodePath(filePath)}?ref=${cfg.branch}`,
    { headers: ghHeaders(cfg.token), cache: "no-store" },
  );
  if (!res.ok) return null;
  const json = (await res.json()) as { sha?: string };
  return json.sha ?? null;
}

async function ghPut(
  filePath: string,
  base64Content: string,
  message: string,
): Promise<void> {
  const cfg = ghConfig();
  if (!cfg) throw new Error("GitHub content source is not configured");
  const sha = await ghGetSha(filePath);
  const res = await fetch(
    `${GH_API}/repos/${cfg.repo}/contents/${encodePath(filePath)}`,
    {
      method: "PUT",
      headers: ghHeaders(cfg.token),
      cache: "no-store",
      body: JSON.stringify({
        message,
        content: base64Content,
        branch: cfg.branch,
        ...(sha ? { sha } : {}),
      }),
    },
  );
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GitHub write failed (${res.status}): ${text.slice(0, 300)}`);
  }
}

const githubSource: ContentSource = {
  async read(filePath) {
    const buf = await githubSource.readBinary(filePath);
    return buf ? buf.toString("utf8") : null;
  },
  async readBinary(filePath) {
    const cfg = ghConfig();
    if (!cfg) return null;
    const res = await fetch(
      `${GH_API}/repos/${cfg.repo}/contents/${encodePath(filePath)}?ref=${cfg.branch}`,
      { headers: ghHeaders(cfg.token, true), cache: "no-store" },
    );
    if (!res.ok) return null;
    return Buffer.from(await res.arrayBuffer());
  },
  async write(filePath, content, message) {
    await ghPut(filePath, Buffer.from(content, "utf8").toString("base64"), message);
  },
  async writeBinary(filePath, content, message) {
    await ghPut(filePath, content.toString("base64"), message);
  },
  async remove(filePath, message) {
    const cfg = ghConfig();
    if (!cfg) throw new Error("GitHub content source is not configured");
    const sha = await ghGetSha(filePath);
    if (!sha) return;
    const res = await fetch(
      `${GH_API}/repos/${cfg.repo}/contents/${encodePath(filePath)}`,
      {
        method: "DELETE",
        headers: ghHeaders(cfg.token),
        cache: "no-store",
        body: JSON.stringify({ message, sha, branch: cfg.branch }),
      },
    );
    if (!res.ok) {
      const text = await res.text();
      throw new Error(
        `GitHub delete failed (${res.status}): ${text.slice(0, 300)}`,
      );
    }
  },
  async list(dirPath) {
    const cfg = ghConfig();
    if (!cfg) return [];
    const res = await fetch(
      `${GH_API}/repos/${cfg.repo}/contents/${encodePath(dirPath)}?ref=${cfg.branch}`,
      { headers: ghHeaders(cfg.token), cache: "no-store" },
    );
    if (!res.ok) return [];
    const json = (await res.json()) as { name: string; type: string }[];
    if (!Array.isArray(json)) return [];
    return json.filter((e) => e.type === "file").map((e) => e.name);
  },
};

/* ── selection ─────────────────────────────────────────────────────────── */

export function usingGithubSource(): boolean {
  const forced = process.env.CONTENT_SOURCE;
  if (forced === "fs") return false;
  if (forced === "github") return Boolean(ghConfig());
  // Auto: on Vercel the deployed filesystem is stale/read-only — use GitHub
  // when configured. Locally (and during `next build`) prefer the filesystem.
  return Boolean(process.env.VERCEL && ghConfig());
}

export function getSource(): ContentSource {
  return usingGithubSource() ? githubSource : fsSource;
}

/** Writes require GitHub in production (Vercel fs is read-only). */
export function canWrite(): boolean {
  if (usingGithubSource()) return true;
  return !process.env.VERCEL;
}
