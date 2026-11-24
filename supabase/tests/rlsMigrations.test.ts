// Static checks over supabase/migrations: every public table has RLS enabled,
// and the anonymous table-level read policies stay dropped. These run without a
// database; pgTAP coverage is tracked in docs/testing.md.
import { assert, assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";

const migrationsDir = new URL("../migrations/", import.meta.url);

function loadMigrations(): { name: string; sql: string }[] {
  const files = [...Deno.readDirSync(migrationsDir)]
    .filter((e) => e.isFile && e.name.endsWith(".sql"))
    .map((e) => e.name)
    .sort();
  return files.map((name) => ({
    name,
    // Strip line comments so commented-out SQL does not count.
    sql: Deno.readTextFileSync(new URL(name, migrationsDir)).replace(/--[^\n]*/g, "").toLowerCase(),
  }));
}

const migrations = loadMigrations();
const allSql = migrations.map((m) => m.sql).join("\n");

function publicTables(): string[] {
  const re = /create\s+table\s+(?:if\s+not\s+exists\s+)?public\.([a-z_][a-z0-9_]*)/g;
  return [...new Set([...allSql.matchAll(re)].map((m) => m[1]))].sort();
}

/** Final state of a policy: true if its last create/drop across migrations is a create. */
function policyExists(policy: string, table: string): boolean {
  let exists = false;
  const p = policy.toLowerCase();
  const t = `public\\.${table}`;
  const re = new RegExp(`(create|drop)\\s+policy\\s+(?:if\\s+exists\\s+)?"${p}"\\s+on\\s+${t}\\b`, "g");
  for (const m of migrations) {
    for (const hit of m.sql.matchAll(re)) exists = hit[1] === "create";
  }
  return exists;
}

Deno.test("rls migrations: finds the public tables", () => {
  const tables = publicTables();
  assert(tables.includes("profiles"));
  assert(tables.includes("runtime_settings"));
  assert(tables.length >= 22, `expected >= 22 public tables, found ${tables.length}`);
});

Deno.test("rls migrations: every public table enables row level security", () => {
  const missing = publicTables().filter(
    (t) => !new RegExp(`alter\\s+table\\s+public\\.${t}\\s+enable\\s+row\\s+level\\s+security`).test(allSql),
  );
  assertEquals(missing, [], `tables without RLS: ${missing.join(", ")}`);
});

Deno.test("rls migrations: anon cannot read profiles or public_pages rows directly", () => {
  assertEquals(policyExists("anyone_reads_public_profile", "profiles"), false);
  assertEquals(policyExists("anyone_reads_public_pages", "public_pages"), false);
});

Deno.test("rls migrations: owner policies remain on profiles and public_pages", () => {
  assert(policyExists("owners_manage_profile", "profiles"));
  assert(policyExists("owners_manage_public_pages", "public_pages"));
});

Deno.test("rls migrations: public profile view is still granted to anon", () => {
  assert(/grant\s+select\s+on\s+public\.public_profile_view\s+to\s+anon/.test(allSql));
});
