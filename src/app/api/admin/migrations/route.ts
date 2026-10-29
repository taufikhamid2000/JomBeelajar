// This API endpoint will apply the specified migration
import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import fs from 'fs';
import path from 'path';
// For building, we need placeholders
// These will be properly initialized at runtime
let supabaseClient: typeof import('@/lib/supabase').supabase | null = null;
let adminChecker: ((userId: string) => Promise<boolean>) | null = null;

// Only attempt to import when not in build phase
const isBuildPhase = process.env.NEXT_PHASE === 'phase-production-build';

// We use a dynamic import to avoid loading during build time
if (!isBuildPhase && typeof window === 'undefined') {
  // Server-side only imports
  Promise.all([import('@/lib/supabase'), import('@/services/adminService')])
    .then(([supabaseModule, adminServiceModule]) => {
      supabaseClient = supabaseModule.supabase;
      adminChecker = adminServiceModule.isUserAdmin;
    })
    .catch((err) => {
      logger.error('Failed to import modules:', err);
    });
}

// Helper function to read migration file
const readMigrationFile = async (fileName: string): Promise<string | null> => {
  try {
    const filePath = path.join(
      process.cwd(),
      'scripts',
      'migrations',
      fileName
    );
    if (!fs.existsSync(filePath)) {
      return null;
    }
    return fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    logger.error('Error reading migration file:', error);
    return null;
  }
};

// List all available migrations
const listAvailableMigrations = async (): Promise<string[]> => {
  try {
    const migrationsDir = path.join(process.cwd(), 'scripts', 'migrations');
    if (!fs.existsSync(migrationsDir)) {
      return [];
    }
    return fs
      .readdirSync(migrationsDir)
      .filter((file) => file.endsWith('.sql'));
  } catch (error) {
    logger.error('Error listing migrations:', error);
    return [];
  }
};

export async function GET() {
  try {
    const migrations = await listAvailableMigrations();
    return NextResponse.json({ migrations });
  } catch (error) {
    logger.error('Error in migration API:', error);
    return NextResponse.json(
      { error: 'Failed to list migrations' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // If we're in build phase or Supabase is not available, return a helpful message
    if (isBuildPhase || !supabaseClient) {
      return NextResponse.json(
        { error: 'Supabase client not available during build phase' },
        { status: 503 }
      );
    }

    // Check authorization
    const {
      data: { user },
    } = await supabaseClient.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin role
    if (!adminChecker) {
      return NextResponse.json(
        { error: 'Admin checker not available' },
        { status: 503 }
      );
    }

    const isAdmin = await adminChecker(user.id);
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Administrator privileges required' },
        { status: 403 }
      );
    }

    // Get the migration file name from the request
    const { migrationFile } = await request.json();
    if (!migrationFile) {
      return NextResponse.json(
        { error: 'No migration file specified' },
        { status: 400 }
      );
    }

    // Read the migration file
    const sql = await readMigrationFile(migrationFile);
    if (!sql) {
      return NextResponse.json(
        { error: `Migration file '${migrationFile}' not found` },
        { status: 404 }
      );
    }

    // Apply the migration
    const { error } = await supabaseClient.rpc('exec_sql', { sql });

    if (error) {
      logger.error('Migration error:', error);
      return NextResponse.json(
        { error: `Failed to apply migration: ${error.message}` },
        { status: 500 }
      );
    }

    // Log the action
    logger.log(
      `Migration '${migrationFile}' applied successfully by ${user.id}`
    );

    return NextResponse.json({
      success: true,
      message: `Migration '${migrationFile}' applied successfully`,
    });
  } catch (error) {
    logger.error('Error in migration API:', error);
    return NextResponse.json(
      { error: 'Failed to apply migration' },
      { status: 500 }
    );
  }
}
