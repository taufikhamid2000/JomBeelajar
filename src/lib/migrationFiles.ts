import fs from 'fs';
import path from 'path';

/** Strict migration file name: letters, digits, _ and -, ending in .sql. */
export const MIGRATION_NAME_RE = /^[A-Za-z0-9][A-Za-z0-9_-]{0,100}\.sql$/;

export function migrationsDir(): string {
  return path.resolve(process.cwd(), 'scripts', 'migrations');
}

/**
 * Resolves a requested migration name to an absolute path inside the
 * migrations directory, or null if the name is invalid, escapes the directory,
 * or is not a regular file.
 */
export function resolveMigrationPath(name: unknown): string | null {
  if (typeof name !== 'string' || !MIGRATION_NAME_RE.test(name)) return null;
  const dir = migrationsDir();
  const full = path.resolve(dir, name);
  if (path.dirname(full) !== dir) return null;
  try {
    // Resolve symlinks so a link cannot point outside the directory.
    const real = fs.realpathSync(full);
    if (path.dirname(real) !== fs.realpathSync(dir)) return null;
    if (!fs.statSync(real).isFile()) return null;
    return real;
  } catch {
    return null;
  }
}

export function listMigrations(): string[] {
  try {
    return fs
      .readdirSync(migrationsDir())
      .filter((f) => MIGRATION_NAME_RE.test(f))
      .sort();
  } catch {
    return [];
  }
}
