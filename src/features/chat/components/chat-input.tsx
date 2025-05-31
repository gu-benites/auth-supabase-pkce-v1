'use client';

import { useState, useRef, KeyboardEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Send } from 'lucide-react';

type ChatInputProps = {
  onSend: (content: string) => void;
  isSending?: boolean;
  className?: string;
};

export function ChatInput({ onSend, isSending = false, className }: ChatInputProps) {
  const [message, setMessage] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage();
  };

  const sendMessage = () => {
    const trimmedMessage = message.trim();
    if (!trimmedMessage || isSending) return;
    
    onSend(trimmedMessage);
    setMessage('');
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <form onSubmit={handleSubmit} className={cn('border-t p-4', className)}>
      <div className="max-w-3xl mx-auto flex gap-2">
        <Input
          ref={inputRef}
          type="text"
          placeholder="Type a message..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isSending}
          className="flex-1"
        />
        <Button type="submit" size="icon" disabled={!message.trim() || isSending}>
          {isSending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </div>
    </form>
  );
}

function cn(...classes: (string | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}
