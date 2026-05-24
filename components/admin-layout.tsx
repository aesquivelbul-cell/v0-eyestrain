'use client';

import React, { useState } from 'react';
import { AdminSidebar } from './admin-sidebar';
import { AdminHeader } from './admin-header';
import { AdminAiChatBubble } from './admin-ai-chat-bubble';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar — static in flow so main content shifts correctly */}
      <div className={`flex-shrink-0 transition-all duration-300 ${sidebarOpen ? 'w-64' : 'w-0'}`}>
        <AdminSidebar isOpen={sidebarOpen} />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Header */}
        <AdminHeader onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

        {/* Page Content */}
        <main className="flex-1 overflow-auto bg-background">
          <div className="p-6 lg:p-8 max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>

      {/* Global floating AI chat bubble — visible on all admin pages */}
      <AdminAiChatBubble />
    </div>
  );
}
