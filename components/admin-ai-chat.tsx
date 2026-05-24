'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Bot, User, Loader2, X, Search } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface UserOption {
  id: string;
  email: string;
  name?: string;
  age?: number | null;
  gender?: string | null;
  fieldOfStudy?: string | null;
  yearLevel?: string | null;
}

const SUGGESTED_QUESTIONS = [
  'Show me high-risk users this week',
  'What are the trending eye strain symptoms?',
  'Analyze screen time patterns across all users',
  'Who needs intervention?',
  'Compare demographics and health outcomes',
];

export function AdminAiChat() {
  const defaultMsg: Message = {
    role: 'assistant',
    content:
      "Hi! I'm EyeGuard Admin AI 👋 I have access to all user data and analytics. You can ask me about specific users, system-wide trends, health patterns, or request detailed health analysis. What would you like to know?",
  };

  const [messages, setMessages] = useState<Message[]>([defaultMsg]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [targetUserId, setTargetUserId] = useState<string>('');
  const [userSearch, setUserSearch] = useState('');
  const [users, setUsers] = useState<UserOption[]>([]);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [selectedUserInfo, setSelectedUserInfo] = useState<UserOption | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Search users
  useEffect(() => {
    if (userSearch.length < 2) {
      setUsers([]);
      return;
    }

    setLoadingUsers(true);
    fetch(`/api/admin/search-users?search=${encodeURIComponent(userSearch)}`)
      .then((r) => r.json())
      .then((data) => setUsers(data.users || []))
      .catch((e) => {
        console.error('Failed to search users:', e);
        setUsers([]);
      })
      .finally(() => setLoadingUsers(false));
  }, [userSearch]);

  const selectUser = (userId: string, userName: string, userInfo: UserOption) => {
    setTargetUserId(userId);
    setUserSearch(userName);
    setSelectedUserInfo(userInfo);
    setShowUserDropdown(false);
    setMessages([
      {
        role: 'assistant',
        content: `Now analyzing ${userName}. What would you like to know about this user's health data?`,
      },
    ]);
  };

  const clearUserFilter = () => {
    setTargetUserId('');
    setUserSearch('');
    setSelectedUserInfo(null);
    setMessages([defaultMsg]);
  };

  const sendMessage = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;

    const userMsg: Message = { role: 'user', content: trimmed };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/admin/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: trimmed,
          history: messages,
          targetUserId: targetUserId || null,
          userDemographics: selectedUserInfo ? {
            email: selectedUserInfo.email,
            age: selectedUserInfo.age,
            gender: selectedUserInfo.gender,
            fieldOfStudy: selectedUserInfo.fieldOfStudy,
            yearLevel: selectedUserInfo.yearLevel,
          } : null,
        }),
      });

      const data = await res.json();
      const reply = data.reply ?? (data.error ? `Error: ${data.error}` : 'Sorry, something went wrong. Please try again.');
      setMessages([...newMessages, { role: 'assistant', content: reply }]);
    } catch (error) {
      console.error('Chat error:', error);
      setMessages([...newMessages, { role: 'assistant', content: 'Connection error. Please check your internet and try again.' }]);
    } finally {
      setIsLoading(false);
    }
  }, [messages, isLoading, targetUserId]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  return (
    <div className="flex flex-col h-full bg-background rounded-lg border">
      {/* Header with user selector */}
      <div className="border-b p-4 bg-muted/50">
        <h2 className="text-lg font-semibold mb-3">Admin Analytics Assistant</h2>
        <div className="relative">
          <div className="flex items-center gap-2">
            <div className="flex-1 relative">
              <div className="flex items-center border rounded-md bg-background px-3 py-2">
                <Search className="w-4 h-4 text-muted-foreground mr-2" />
                <input
                  type="text"
                  placeholder="Search user (email or name)..."
                  value={userSearch}
                  onChange={(e) => {
                    setUserSearch(e.target.value);
                    setShowUserDropdown(true);
                  }}
                  onFocus={() => userSearch && setShowUserDropdown(true)}
                  className="flex-1 outline-none bg-transparent text-sm"
                />
              </div>

              {/* Dropdown */}
              {showUserDropdown && userSearch && (
                <div
                  ref={dropdownRef}
                  className="absolute top-full left-0 right-0 mt-1 border rounded-md bg-background shadow-lg z-50 max-h-48 overflow-y-auto"
                >
                  {loadingUsers ? (
                    <div className="p-3 text-center text-sm text-muted-foreground">Loading users...</div>
                  ) : users.length > 0 ? (
                    users.map((user) => (
                      <button
                        key={user.id}
                        onClick={() => selectUser(user.id, user.email, user)}
                        className="w-full text-left px-4 py-2 hover:bg-muted text-sm border-b last:border-b-0"
                      >
                        <div className="font-medium">{user.name || user.email}</div>
                        {(user.age || user.gender || user.yearLevel || user.fieldOfStudy) && (
                          <div className="text-xs text-muted-foreground mt-0.5">
                            {[user.age && `${user.age}yo`, user.gender, user.yearLevel, user.fieldOfStudy].filter(Boolean).join(' • ')}
                          </div>
                        )}
                      </button>
                    ))
                  ) : (
                    <div className="p-3 text-center text-sm text-muted-foreground">No users found</div>
                  )}
                </div>
              )}
            </div>

            {targetUserId && (
              <button
                onClick={clearUserFilter}
                className="p-2 hover:bg-muted rounded-md transition-colors"
                title="Clear user filter"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {targetUserId && (
            <div className="mt-2 space-y-1">
              <div className="text-sm font-semibold text-foreground">{selectedUserInfo?.name || userSearch}</div>
              {selectedUserInfo && (selectedUserInfo.age || selectedUserInfo.gender || selectedUserInfo.yearLevel || selectedUserInfo.fieldOfStudy) && (
                <div className="text-xs text-muted-foreground">
                  {[selectedUserInfo.age && `${selectedUserInfo.age} years old`, selectedUserInfo.gender, selectedUserInfo.yearLevel, selectedUserInfo.fieldOfStudy].filter(Boolean).join(' • ')}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
            <div
              className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                msg.role === 'assistant' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
              }`}
            >
              {msg.role === 'assistant' ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
            </div>
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                msg.role === 'assistant'
                  ? 'bg-muted text-foreground rounded-tl-sm'
                  : 'bg-primary text-primary-foreground rounded-tr-sm'
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-muted text-foreground rounded-2xl rounded-tl-sm px-4 py-2.5 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Analyzing...</span>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Suggested questions */}
      {messages.length === 1 && !targetUserId && (
        <div className="px-4 pb-4 border-t">
          <p className="text-xs text-muted-foreground mb-2">Suggested questions:</p>
          <div className="grid grid-cols-1 gap-2">
            {SUGGESTED_QUESTIONS.map((q, i) => (
              <button
                key={i}
                onClick={() => sendMessage(q)}
                className="text-left text-xs p-2 rounded border border-border hover:bg-muted transition-colors"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="border-t p-4 bg-muted/30">
        <div className="flex gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              targetUserId
                ? `Ask about ${userSearch}...`
                : 'Ask about users, trends, or health patterns...'
            }
            className="flex-1 resize-none bg-background border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            rows={3}
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || isLoading}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors h-fit flex items-center gap-2"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}
