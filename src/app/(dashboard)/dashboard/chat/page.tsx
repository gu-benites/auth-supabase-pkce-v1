
import { ChatView } from '@/features/dashboard/chat'; // Updated import

/**
 * Renders the main chat page within the dashboard.
 * This page component uses the ChatView component, which encapsulates the chat interface.
 *
 * @returns {JSX.Element} The dashboard chat page component.
 */
export default function DashboardChatPage(): JSX.Element {
  return <ChatView />;
}
