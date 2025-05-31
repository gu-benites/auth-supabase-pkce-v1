
'use client';

import { ChatPage } from '@/features/chat/components/chat-page'; // Import the existing ChatPage
import React from 'react';

/**
 * A view component specifically for rendering the chat feature within the dashboard context.
 * It wraps the main ChatPage component and provides the necessary layout structure.
 */
export function ChatView(): JSX.Element {
  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-hidden">
        <ChatPage />
      </div>
    </div>
  );
}
