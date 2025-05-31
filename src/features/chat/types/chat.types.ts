export interface Message {
  id: string;
  content: string;
  channel_id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  user?: {
    id: string;
    username: string | null;
    avatar_url: string | null;
  };
}

export interface Channel {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
  is_public: boolean;
  created_by: string;
}

export interface CreateChannelData {
  name: string;
  description?: string;
  is_public?: boolean;
}
