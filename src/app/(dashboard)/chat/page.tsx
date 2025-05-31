import { ChatPage } from '@/features/chat/components';

export default function DashboardChatPage() {
  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-hidden">
        <ChatPage />
      </div>
    </div>
  );
}
