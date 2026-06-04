#!/usr/bin/env node
/**
 * Seed admin/staff users on Neon PostgreSQL (idempotent).
 *
 * Usage:
 *   node scripts/seed-admin-neon.mjs admin@eMed.com 'YourSecurePass'
 *   node scripts/seed-admin-neon.mjs --staff staff@eMed.com 'StaffPass123'
 */
import { existsSync, readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import pg from "pg";
import bcrypt from "bcryptjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

function loadEnv() {
  const envPath = join(root, ".env");
  if (!existsSync(envPath)) {
    console.error("Missing .env — copy .env.example and set DATABASE_URL");
    process.exit(1);
  }
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (!m || m[1].startsWith("#")) continue;
    let v = m[2].trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    if (!process.env[m[1]]) process.env[m[1]] = v;
  }
}

const args = process.argv.slice(2);
const staffMode = args.includes("--staff");
const positional = args.filter((a) => !a.startsWith("--"));
const email = String(positional[0] || "admin@eMed.com").trim().toLowerCase();
const password = positional[1] || "";
const role = staffMode ? "staff" : "admin";
const fullName = staffMode ? "Staff User" : "Admin User";

if (!password || password.length < 8) {
  console.error("Usage: node scripts/seed-admin-neon.mjs [email] 'password-min-8-chars'");
  console.error("       node scripts/seed-admin-neon.mjs --staff [email] 'password'");
  process.exit(1);
}

loadEnv();
const url = process.env.DATABASE_URL;
if (!url) {
  console.error("Set DATABASE_URL in .env (copy from .env.example)");
  process.exit(1);
}

const pool = new pg.Pool({ connectionString: url, max: 1 });

try {
  const client = await pool.connect();
  try {
    const existing = await client.query("SELECT id, role FROM users WHERE LOWER(email) = $1", [email]);
    if (existing.rows.length > 0) {
      const userId = existing.rows[0].id;
      if (existing.rows[0].role !== role) {
        await client.query("UPDATE users SET role = $1 WHERE id = $2", [role, userId]);
        console.log(`Updated role to ${role} for existing user: ${email}`);
      } else {
        console.log(`Skip: user already exists (${email}, role=${role})`);
      }
      process.exit(0);
    }

    const hash = await bcrypt.hash(password, 10);
    await client.query("BEGIN");
    const ins = await client.query(
      "INSERT INTO users (email, password, role) VALUES ($1, $2, $3) RETURNING id",
      [email, hash, role]
    );
    const userId = ins.rows[0].id;

    await client.query(
      `INSERT INTO profiles (user_id, full_name, approval_status)
       VALUES ($1, $2, 'approved')
       ON CONFLICT (user_id) DO UPDATE SET full_name = EXCLUDED.full_name`,
      [userId, fullName]
    );

    await client.query(
      `INSERT INTO user_roles (user_id, role) VALUES ($1, $2)
       ON CONFLICT (user_id, role) DO NOTHING`,
      [userId, role]
    );

    await client.query("COMMIT");
    console.log(`✓ Created ${role} user: ${email} (id=${userId})`);
  } catch (e) {
    await client.query("ROLLBACK").catch(() => {});
    throw e;
  } finally {
    client.release();
  }
} catch (e) {
  console.error("FAIL:", e.message);
  process.exit(1);
} finally {
  await pool.end();
}
