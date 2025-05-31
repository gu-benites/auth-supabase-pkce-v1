'use client';

import { useAuth } from '@/features/auth/hooks/use-auth';
import { cn } from '@/lib/utils';

type Message = {
  id: string;
  content: string;
  created_at: string;
  user?: {
    id: string;
    username: string | null;
    avatar_url: string | null;
  };
};

type ChatMessagesProps = {
  messages: Message[];
  messagesEndRef: React.RefObject<HTMLDivElement>;
  className?: string;
};

export function ChatMessages({ messages, messagesEndRef, className }: ChatMessagesProps) {
  const { authUser } = useAuth();

  if (!messages?.length) {
    return (
      <div className={cn('flex-1 p-4 overflow-y-auto', className)}>
        <div className="flex items-center justify-center h-full">
          <p className="text-muted-foreground">No messages yet. Send a message to start the conversation!</p>
        </div>
        <div ref={messagesEndRef} />
      </div>
    );
  }

  return (
    <div className={cn('flex-1 p-4 overflow-y-auto', className)}>
      <div className="max-w-3xl mx-auto space-y-4">
        {messages.map((message) => {
          const isCurrentUser = authUser?.id === message.user?.id;
          const username = message.user?.username || 'Anonymous';
          
          return (
            <div
              key={message.id}
              className={cn('flex', {
                'justify-end': isCurrentUser,
                'justify-start': !isCurrentUser,
              })}
            >
              <div
                className={cn('rounded-lg px-4 py-2 max-w-[80%]', {
                  'bg-primary text-primary-foreground': isCurrentUser,
                  'bg-muted': !isCurrentUser,
                })}
              >
                {!isCurrentUser && (
                  <div className="text-xs font-semibold mb-1">{username}</div>
                )}
                <p>{message.content}</p>
                <p
                  className={cn('text-xs mt-1', {
                    'text-primary-foreground/70': isCurrentUser,
                    'text-muted-foreground': !isCurrentUser,
                  })}
                >
                  {new Date(message.created_at).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}
