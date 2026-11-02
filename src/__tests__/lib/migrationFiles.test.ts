/** @jest-environment node */
import { MIGRATION_NAME_RE, resolveMigrationPath } from '@/lib/migrationFiles';

describe('migration file name validation', () => {
  it.each([
    '../../.env',
    '..\\..\\x.sql',
    '../secret.sql',
    '/etc/passwd',
    'a/b.sql',
    'a.sql\0.txt',
    'file.txt',
    '',
    '.hidden.sql',
  ])('rejects %j', (name) => {
    expect(MIGRATION_NAME_RE.test(name)).toBe(false);
    expect(resolveMigrationPath(name)).toBeNull();
  });

  it('rejects non-strings', () => {
    expect(resolveMigrationPath(undefined)).toBeNull();
    expect(resolveMigrationPath({})).toBeNull();
  });

  it('accepts a plain .sql name pattern', () => {
    expect(MIGRATION_NAME_RE.test('001_add-table.sql')).toBe(true);
  });
});
