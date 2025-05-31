import { useCallback, useEffect, useRef } from 'react';
import { useMessages, useSendMessage, useSubscribeToMessages } from '../queries/chat.queries';
import { Message } from '../types/chat.types';

export function useChat(channelId: string) {
  const { data: messages = [], isLoading, error } = useMessages(channelId);
  const sendMessageMutation = useSendMessage();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Handle new messages from subscription
  const handleNewMessage = useCallback(
    (_message: Message) => {
      // The message is already added by the optimistic update
      // We use the _ prefix to indicate this parameter is intentionally unused
      // This callback triggers a re-render when new messages arrive
    },
    []
  );

  // Subscribe to new messages
  useSubscribeToMessages(channelId, handleNewMessage);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = useCallback(
    async (content: string, userId: string) => {
      if (!content.trim()) return;
      
      try {
        await sendMessageMutation.mutateAsync({
          content,
          channelId,
          userId,
        });
      } catch (error) {
        console.error('Failed to send message:', error);
        // Handle error (e.g., show toast)
      }
    },
    [channelId, sendMessageMutation]
  );

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    isSending: sendMessageMutation.isPending,
    messagesEndRef,
  };
}
