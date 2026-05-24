import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { isAdmin } from '@/lib/admin-guard';

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = 'llama-3.3-70b-versatile';

export async function POST(request: NextRequest) {
  try {
    // Auth check - ensure user is admin
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!isAdmin(user)) {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 401 });
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'AI service not configured' }, { status: 500 });
    }

    const { message, history, targetUserId, userDemographics } = await request.json();
    if (!message?.trim()) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // Get admin client for full database access
    let adminClient;
    try {
      adminClient = createAdminClient();
    } catch {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    // Build context based on whether targeting specific user or system-wide
    let userContext = '';
    
    if (targetUserId) {
      // Fetch specific user's data
      try {
        // Fetch user email from auth
        const { data: authUserData } = await adminClient.auth.admin.getUserById(targetUserId);
        const authEmail = authUserData?.user?.email ?? null;

        // Fetch user profile
        const { data: profile } = await adminClient
          .from('user_profiles')
          .select('first_name, last_name, age, gender, year_level, field_of_study')
          .eq('user_id', targetUserId)
          .single();

        // Fetch last 14 daily logs
        const { data: logs } = await adminClient
          .from('daily_logs')
          .select('date, screen_time, sleep_hours, brightness, eye_strain, headaches, blurry_vision, dry_eyes, risk_level, notes')
          .eq('user_id', targetUserId)
          .order('date', { ascending: false })
          .limit(14);

        // Fetch latest 5 predictions
        const { data: predictions } = await adminClient
          .from('predictions')
          .select('risk_level, risk_percentage, fatigue_score, created_at')
          .eq('user_id', targetUserId)
          .order('created_at', { ascending: false })
          .limit(5);

        // Fetch recent recommendations
        const { data: recommendations } = await adminClient
          .from('recommendations')
          .select('recommendation, category, created_at')
          .eq('user_id', targetUserId)
          .order('created_at', { ascending: false })
          .limit(5);

        const latestLog = logs?.[0];
        const age = profile?.age ?? latestLog?.age ?? null;
        const gender = profile?.gender ?? latestLog?.gender ?? null;
        const yearLevel = profile?.year_level ?? latestLog?.year_level ?? null;
        const fieldOfStudy = profile?.field_of_study ?? latestLog?.field_of_study ?? null;
        const firstName = profile?.first_name ?? null;
        const lastName = profile?.last_name ?? null;
        const email = authEmail ?? null;

        const profileLines = [
          `User ID: ${targetUserId}`,
          email ? `- Email: ${email}` : null,
          firstName || lastName ? `- Name: ${firstName || ''} ${lastName || ''}`.trim() : null,
          age ? `- Age: ${age}` : null,
          gender ? `- Gender: ${gender}` : null,
          yearLevel ? `- Year level: ${yearLevel}` : null,
          fieldOfStudy ? `- Field of study: ${fieldOfStudy}` : null,
        ].filter(Boolean).join('\n');

        let healthLines = '';
        if (logs && logs.length > 0) {
          const riskLabels = ['Low', 'Moderate', 'High', 'Critical'];
          const recentRisks = logs.map((l: any) => l.risk_level).filter(Boolean);
          const highRiskDays = logs.filter((l: any) => l.risk_level === 'High' || l.risk_level === 'Critical').length;
          const avgScreen = (logs.reduce((s: number, l: any) => s + (l.screen_time || 0), 0) / logs.length).toFixed(1);
          const avgSleep = (logs.reduce((s: number, l: any) => s + (l.sleep_hours || 0), 0) / logs.length).toFixed(1);
          const eyeStrainDays = logs.filter((l: any) => l.eye_strain === 1).length;
          const headacheDays = logs.filter((l: any) => l.headaches === 1).length;
          const dryEyesDays = logs.filter((l: any) => l.dry_eyes === 1).length;
          const blurryVisionDays = logs.filter((l: any) => l.blurry_vision === 1).length;

          const recentNotes = logs
            .map((l: any) => l.notes?.trim())
            .filter(Boolean)
            .slice(0, 3);

          healthLines = `
HEALTH DATA (last ${logs.length} logs):
- Average daily screen time: ${avgScreen} hours
- Average sleep: ${avgSleep} hours/night
- Eye strain: ${eyeStrainDays}/${logs.length} days
- Headaches: ${headacheDays}/${logs.length} days
- Dry eyes: ${dryEyesDays}/${logs.length} days
- Blurry vision: ${blurryVisionDays}/${logs.length} days
- High/Critical risk days: ${highRiskDays}/${logs.length} days
- Recent risk levels: ${recentRisks.join(', ')}`;

          if (predictions && predictions.length > 0) {
            const latestPred = predictions[0];
            healthLines += `
- Latest risk score: ${((latestPred as any).risk_percentage ?? 0).toFixed(1)}% (${riskLabels[(latestPred as any).risk_level] ?? 'Unknown'})
- Latest fatigue score: ${((latestPred as any).fatigue_score ?? 0).toFixed(1)}/10`;
          }

          if (recentNotes.length > 0) {
            healthLines += `
- User notes from recent logs:
${recentNotes.map((n: string) => `  • ${n}`).join('\n')}`;
          }

          if (recommendations && recommendations.length > 0) {
            healthLines += `
- Recent recommendations:
${recommendations.slice(0, 3).map((r: any) => `  • (${r.category}) ${r.recommendation}`).join('\n')}`;
          }
        }

        userContext = `\nTARGET USER PROFILE:\n${profileLines || '(no profile data)'}\n${healthLines}`;
      } catch (err) {
        console.error('Error fetching user data:', err);
        userContext = `\nNote: Could not fetch full data for user ${targetUserId}`;
      }
    } else {
    // Fetch system-wide aggregate data
      try {
        const { data: logs } = await adminClient
          .from('daily_logs')
          .select('user_id, email, risk_level, screen_time, eye_strain, headaches, blurry_vision, dry_eyes, gender, age, year_level, field_of_study, date')
          .order('date', { ascending: false });

        const { data: profiles } = await adminClient
          .from('user_profiles')
          .select('user_id, gender, age, year_level, field_of_study');

        // Count real registered users from auth
        const { data: authList } = await adminClient.auth.admin.listUsers({ perPage: 1000 });
        const registeredUserCount = authList?.users?.length ?? 0;

        if (logs && logs.length > 0) {
          const registeredLogs = logs.filter((l: any) => l.user_id);
          const surveyLogs = logs.filter((l: any) => !l.user_id);
          const distinctRegisteredUsers = new Set(registeredLogs.map((l: any) => l.user_id)).size;

          // Per-user risk: use the most recent log per user key (logs are ordered desc by date)
          // This matches exactly what the UI table shows
          const userMap = new Map<string, any>();
          for (const log of logs) {
            const key = (log as any).user_id ?? `anon:${(log as any).email ?? Math.random()}`;
            if (!userMap.has(key)) userMap.set(key, log); // first = most recent
          }
          const perUserRiskCounts: Record<string, number> = { Low: 0, Moderate: 0, High: 0, Critical: 0 };
          for (const [, log] of userMap) {
            const level = (log as any).risk_level;
            if (level in perUserRiskCounts) perUserRiskCounts[level]++;
          }
          const totalUniqueUsers = userMap.size;

          const avgScreen = (logs.reduce((s: number, l: any) => s + (l.screen_time || 0), 0) / logs.length).toFixed(1);
          const eyeStrainCount = logs.filter((l: any) => l.eye_strain === 1).length;
          const headachesCount = logs.filter((l: any) => l.headaches === 1).length;

          // Gender breakdown from profiles
          const genderCounts: Record<string, number> = {};
          for (const p of profiles || []) {
            const g = (p as any).gender || 'Unknown';
            genderCounts[g] = (genderCounts[g] || 0) + 1;
          }
          const genderBreakdown = Object.entries(genderCounts)
            .map(([g, c]) => `${g}=${c}`)
            .join(', ');

          // Year level breakdown
          const yearCounts: Record<string, number> = {};
          for (const p of profiles || []) {
            const y = (p as any).year_level || 'Unknown';
            yearCounts[y] = (yearCounts[y] || 0) + 1;
          }
          const yearBreakdown = Object.entries(yearCounts)
            .map(([y, c]) => `${y}=${c}`)
            .join(', ');

          // Field of study breakdown
          const fieldCounts: Record<string, number> = {};
          for (const p of profiles || []) {
            const f = (p as any).field_of_study || 'Unknown';
            fieldCounts[f] = (fieldCounts[f] || 0) + 1;
          }
          const fieldBreakdown = Object.entries(fieldCounts)
            .map(([f, c]) => `${f}=${c}`)
            .join(', ');

          userContext = `
SYSTEM-WIDE ANALYTICS:
IMPORTANT CONTEXT: This system has two types of data:
1. REGISTERED USERS: Real users who signed up and actively use the app (${registeredUserCount} accounts in auth, ${distinctRegisteredUsers} with logs)
2. SURVEY RESPONDENTS: Imported historical survey data with no auth account (user_id = NULL, ${surveyLogs.length} log entries)

When asked "how many users", always clarify this distinction. Registered users are the active app users. Survey respondents are research data only.

- Total unique respondents (users + survey): ${totalUniqueUsers}
- Total log entries: ${logs.length} (${registeredLogs.length} from registered users, ${surveyLogs.length} from survey imports)
- Registered users with logs: ${distinctRegisteredUsers}
- Survey-only respondents: ${surveyLogs.length} entries (no auth account)

RISK DISTRIBUTION (per unique respondent, based on their most recent log — matches the UI table):
- Low: ${perUserRiskCounts.Low}
- Moderate: ${perUserRiskCounts.Moderate}
- High: ${perUserRiskCounts.High}
- Critical: ${perUserRiskCounts.Critical}
NOTE: These are unique respondent counts, not log entry counts. Always report these numbers when asked about risk levels.

- Average screen time (all logs): ${avgScreen} hours
- Eye strain reports: ${eyeStrainCount}/${logs.length} log entries
- Headache reports: ${headachesCount}/${logs.length} log entries

DEMOGRAPHICS (from user profiles of registered users, ${profiles?.length ?? 0} profiles):
- Gender breakdown: ${genderBreakdown || 'No data'}
- Year level breakdown: ${yearBreakdown || 'No data'}
- Field of study breakdown: ${fieldBreakdown || 'No data'}`;
        }
      } catch (err) {
        console.error('Error fetching system stats:', err);
      }
    }

    const systemPrompt = `You are EyeGuard AI Admin Assistant, a specialized eye health analytics tool for administrators of the EyeGuard app.

${userContext
  ? `You have access to comprehensive database information and health analytics:\n${userContext}\n\nUse this data to provide detailed analysis, identify patterns, and generate insights about user health.`
  : 'You have access to the full EyeGuard database. Provide analytics and insights based on user data.'}

Guidelines:
- You are speaking to an ADMINISTRATOR, not a regular user
- Provide detailed analytics, trends, and data-driven insights
- Answer questions about any user in the system directly and confidently
- Identify patterns in health data and risk factors
- Suggest interventions for high-risk users
- Analyze population-wide trends when appropriate
- Be analytical and precise with numbers
- Flag concerning patterns or outliers
- Reference specific data points from the logs
- You can help with population health strategy and individual user case reviews
- Maintain privacy awareness - never share PII in public contexts`;

    const messages: { role: string; content: string }[] = [
      { role: 'system', content: systemPrompt },
    ];

    // Add prior conversation history (skip the initial greeting)
    if (history && Array.isArray(history)) {
      for (const msg of history.slice(1).slice(-10)) {
        messages.push({
          role: msg.role === 'assistant' ? 'assistant' : 'user',
          content: msg.content,
        });
      }
    }

    messages.push({ role: 'user', content: message });

    const groqRes = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages,
        temperature: 0.7,
        max_tokens: 1024,
      }),
    });

    if (!groqRes.ok) {
      const errText = await groqRes.text();
      console.error('Groq API error:', groqRes.status, errText);
      return NextResponse.json({ error: 'AI service error' }, { status: 500 });
    }

    const responseData = await groqRes.json();
    const reply = responseData.choices?.[0]?.message?.content || 'No response generated';
    return NextResponse.json({ reply });
  } catch (error) {
    console.error('Chat error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
