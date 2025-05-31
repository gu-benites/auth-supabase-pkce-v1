import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getMessages, sendMessage, subscribeToMessages } from '../services/chat.service';
import { Message } from '../types/chat.types';

const CHAT_KEYS = {
  messages: (channelId: string) => ['messages', channelId],
  channels: ['channels'],
} as const;

export function useMessages(channelId: string) {
  return useQuery({
    queryKey: CHAT_KEYS.messages(channelId),
    queryFn: () => getMessages(channelId),
    enabled: !!channelId,
  });
}

export function useSendMessage() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: sendMessage,
    onSuccess: (data, variables) => {
      // Optimistically update the messages list
      queryClient.setQueryData<Message[]>(
        CHAT_KEYS.messages(variables.channelId),
        (old) => (old ? [...old, data] : [data])
      );
    },
  });
}

export function useSubscribeToMessages(
  channelId: string,
  onMessage: (message: Message) => void
) {
  return useQuery({
    queryKey: [...CHAT_KEYS.messages(channelId), 'subscription'],
    enabled: !!channelId,
    queryFn: () => {
      return new Promise<null>((resolve) => {
        subscribeToMessages(channelId, (payload) => {
          onMessage(payload.new as Message);
        });
        resolve(null);
      });
    },
  });
}
