import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { isAdmin } from '@/lib/admin-guard';

export async function POST(request: NextRequest) {
  try {
    // Auth check - ensure user is admin
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!isAdmin(user)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userId, action } = await request.json();
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    let adminClient;
    try {
      adminClient = createAdminClient();
    } catch {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    if (action === 'send-reset-email') {
      // Generate a password reset link and send via email
      try {
        const { data, error } = await adminClient.auth.admin.generateLink({
          type: 'recovery',
          email: userId,
        });

        if (error || !data?.properties?.recovery_link) {
          console.error('Generate link error:', error);
          return NextResponse.json({ error: 'Failed to generate reset link' }, { status: 500 });
        }

        // In production, you'd send the actual reset link via email
        // For now, we'll just indicate success
        return NextResponse.json({
          success: true,
          message: 'Password reset link generated. A reset email would be sent to the user in production.',
        });
      } catch (err) {
        console.error('Send reset email error:', err);
        return NextResponse.json({ error: 'Failed to send reset email' }, { status: 500 });
      }
    } else if (action === 'generate-temp-password') {
      // Generate a temporary password and update the user
      try {
        const tempPassword = Math.random().toString(36).slice(-12).toUpperCase() + Math.random().toString(36).slice(-4);

        // Update user password
        const { error: updateError } = await adminClient.auth.admin.updateUserById(userId, {
          password: tempPassword,
        });

        if (updateError) {
          console.error('Update password error:', updateError);
          return NextResponse.json({ error: 'Failed to update password' }, { status: 500 });
        }

        return NextResponse.json({
          success: true,
          message: 'Temporary password generated successfully',
          tempPassword,
          instructions: 'Share this temporary password with the user. They should change it immediately upon login.',
        });
      } catch (err) {
        console.error('Generate temp password error:', err);
        return NextResponse.json({ error: 'Failed to generate temporary password' }, { status: 500 });
      }
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Password reset error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
