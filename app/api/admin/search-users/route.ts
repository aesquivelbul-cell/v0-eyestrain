import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { isAdmin } from '@/lib/admin-guard';

export async function GET(request: NextRequest) {
  try {
    // Auth check - ensure user is admin
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!isAdmin(user)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchQuery = request.nextUrl.searchParams.get('search')?.trim();
    if (!searchQuery || searchQuery.length < 2) {
      return NextResponse.json({ users: [] });
    }

    // Get admin client for full database access
    let adminClient;
    try {
      adminClient = createAdminClient();
    } catch {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    // Search auth.users by email first
    const { data: authList } = await adminClient.auth.admin.listUsers({ perPage: 1000 });
    const matchedAuthUsers = (authList?.users || []).filter((u) =>
      u.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Also search profiles by name
    const { data: profilesByName } = await adminClient
      .from('user_profiles')
      .select('user_id, first_name, last_name, age, gender, field_of_study, year_level')
      .or(`first_name.ilike.%${searchQuery}%,last_name.ilike.%${searchQuery}%`)
      .limit(10);

    // Build a map of user_id -> profile
    const profileMap = new Map((profilesByName || []).map((p: any) => [p.user_id, p]));

    // Collect all matched user IDs (from email search + name search)
    const emailMatchedIds = new Set(matchedAuthUsers.map((u) => u.id));
    const nameMatchedIds = new Set((profilesByName || []).map((p: any) => p.user_id));
    const allMatchedIds = new Set([...emailMatchedIds, ...nameMatchedIds]);

    // Fetch profiles for email-matched users that aren't already in profileMap
    const missingIds = [...emailMatchedIds].filter((id) => !profileMap.has(id));
    if (missingIds.length > 0) {
      const { data: extraProfiles } = await adminClient
        .from('user_profiles')
        .select('user_id, first_name, last_name, age, gender, field_of_study, year_level')
        .in('user_id', missingIds);
      for (const p of extraProfiles || []) {
        profileMap.set((p as any).user_id, p);
      }
    }

    // Build email map from auth users
    const emailMap = new Map((authList?.users || []).map((u) => [u.id, u.email || '']));

    const users = [...allMatchedIds].slice(0, 10).map((id) => {
      const p = profileMap.get(id) as any;
      return {
        id,
        email: emailMap.get(id) || '',
        name: p ? [p.first_name, p.last_name].filter(Boolean).join(' ') : '',
        age: p?.age || null,
        gender: p?.gender || null,
        fieldOfStudy: p?.field_of_study || null,
        yearLevel: p?.year_level || null,
      };
    });

    return NextResponse.json({ users });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
