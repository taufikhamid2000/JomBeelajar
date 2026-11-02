import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { logger } from '@/lib/logger';
import { requireAdmin } from '@/lib/requireAdmin';

/**
 * Admin API endpoint for verifying quizzes
 * POST /api/admin/quizzes/verify
 */
export async function POST(request: NextRequest) {
  try {
    // Check if user has admin permission
    const auth = await requireAdmin();
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
    const userId = auth.userId;

    // Parse request body
    const body = await request.json();
    const { quizId, verified, feedback } = body;

    if (!quizId) {
      return NextResponse.json(
        { error: 'Quiz ID is required' },
        { status: 400 }
      );
    }

    if (typeof verified !== 'boolean') {
      return NextResponse.json(
        { error: 'Verification status (boolean) is required' },
        { status: 400 }
      );
    }

    // Update quiz verification status
    const { data, error } = await supabaseAdmin
      .from('quizzes')
      .update({
        verified,
        verified_by: userId,
        verified_at: verified ? new Date().toISOString() : null,
        verification_feedback: feedback || null,
      })
      .eq('id', quizId)
      .select(
        'id, name, verified, verified_by, verified_at, verification_feedback'
      )
      .single();

    if (error) {
      logger.error('Error updating quiz verification status:', error);
      return NextResponse.json(
        { error: 'Failed to update verification status' },
        { status: 500 }
      );
    }

    // Log the verification action
    logger.info(
      `Quiz ${verified ? 'verified' : 'unverified'} by admin (${userId}):`,
      {
        quizId,
        verified,
        adminId: userId,
        feedback: feedback || 'None provided',
      }
    );

    return NextResponse.json({
      success: true,
      message: `Quiz ${verified ? 'verified' : 'unverified'} successfully`,
      quiz: data,
    });
  } catch (error) {
    logger.error('Unexpected error in quiz verification API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
