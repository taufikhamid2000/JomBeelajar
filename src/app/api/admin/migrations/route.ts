// Applies a SQL migration from scripts/migrations via the exec_sql RPC.
// DISABLED unless ADMIN_MIGRATIONS_ENABLED=true, and never in production.
// Migrations normally belong in CI/CLI (scripts/apply-migrations.mjs).
import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import { logger } from '@/lib/logger';
import { requireAdmin } from '@/lib/requireAdmin';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { listMigrations, resolveMigrationPath } from '@/lib/migrationFiles';

function routeEnabled(): boolean {
  return (
    process.env.ADMIN_MIGRATIONS_ENABLED === 'true' &&
    process.env.NODE_ENV !== 'production' &&
    process.env.VERCEL_ENV !== 'production'
  );
}

const disabled = () =>
  NextResponse.json({ error: 'Not found' }, { status: 404 });

export async function GET() {
  if (!routeEnabled()) return disabled();
  const auth = await requireAdmin();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  return NextResponse.json({ migrations: listMigrations() });
}

export async function POST(request: NextRequest) {
  if (!routeEnabled()) return disabled();
  try {
    const auth = await requireAdmin();
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const body = await request.json().catch(() => null);
    const filePath = resolveMigrationPath(body?.migrationFile);
    if (!filePath) {
      return NextResponse.json(
        { error: 'Invalid or unknown migration file' },
        { status: 400 }
      );
    }

    const sql = fs.readFileSync(filePath, 'utf8');
    const { error } = await supabaseAdmin.rpc('exec_sql', { sql });
    if (error) {
      logger.error('Migration error:', error);
      return NextResponse.json(
        { error: 'Failed to apply migration' },
        { status: 500 }
      );
    }

    logger.info(`Migration applied by ${auth.userId}`);
    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Error in migration API:', error);
    return NextResponse.json(
      { error: 'Failed to apply migration' },
      { status: 500 }
    );
  }
}
