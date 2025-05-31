// /src/app/(dashboard)/dashboard/chat/page.tsx
import { ChatView } from '@/features/dashboard/chat';

/**
 * Renders the main chat page within the dashboard.
 * This page component uses the ChatView component, which encapsulates the chat interface.
 *
 * @returns {JSX.Element} The dashboard chat page component.
 */
export default function DashboardChatPage(): JSX.Element {
  // The ChatView component will fill the available height within the dashboard layout.
  return <ChatView />;
}
