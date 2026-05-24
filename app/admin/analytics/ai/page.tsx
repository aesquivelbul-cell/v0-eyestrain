'use client';

import { AdminAiChat } from '@/components/admin-ai-chat';

export default function AdminAiAnalyticsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">AI Analytics Assistant</h1>
        <p className="text-muted-foreground mt-2">
          Analyze user data, identify trends, and get data-driven insights
        </p>
      </div>

      <div className="h-[600px]">
        <AdminAiChat />
      </div>
    </div>
  );
}
