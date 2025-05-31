import { createBrowserClient } from '@/lib/clients/supabase';

type SendMessageParams = {
  content: string;
  channelId: string;
  userId: string;
};

export async function sendMessage({ content, channelId, userId }: SendMessageParams) {
  const supabase = createBrowserClient();
  
  const { data, error } = await supabase
    .from('messages')
    .insert([
      { 
        content, 
        channel_id: channelId, 
        user_id: userId,
      },
    ])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getMessages(channelId: string) {
  const supabase = createBrowserClient();
  
  const { data, error } = await supabase
    .from('messages')
    .select(`
      *,
      user:profiles (
        id,
        username,
        avatar_url
      )
    `)
    .eq('channel_id', channelId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data;
}

export async function subscribeToMessages(
  channelId: string,
  callback: (payload: any) => void
) {
  const supabase = createBrowserClient();
  
  const subscription = supabase
    .channel(`messages:channel_id=eq.${channelId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `channel_id=eq.${channelId}`,
      },
      (payload) => {
        callback(payload);
      }
    )
    .subscribe();

  return () => {
    subscription.unsubscribe();
  };
}
