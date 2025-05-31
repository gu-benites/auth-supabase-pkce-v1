
// /src/features/dashboard/chat/chat-view.tsx
"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button"; // Added Button import
import { cn } from "@/lib/utils";
import {
  ImageIcon,
  FileUp,
  Figma,
  MonitorIcon,
  CircleUserRound,
  ArrowUpIcon,
  Paperclip,
  PlusIcon,
  MessageSquare // Ensured MessageSquare is imported
} from "lucide-react";
import { ChatInput } from "./components/chat-input";

// Helper hook for auto-resizing textarea
function useAutoResizeTextarea({
  minHeight,
  maxHeight,
}: { minHeight: number; maxHeight?: number }) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const adjustHeight = useCallback(
    (reset?: boolean) => {
      const textarea = textareaRef.current;
      if (!textarea) return;
      if (reset) {
        textarea.style.height = `${minHeight}px`;
        return;
      }
      textarea.style.height = `${minHeight}px`; // Reset first to get scrollHeight correctly
      const newHeight = Math.max(
        minHeight,
        Math.min(textarea.scrollHeight, maxHeight ?? Number.POSITIVE_INFINITY)
      );
      textarea.style.height = `${newHeight}px`;
    },
    [minHeight, maxHeight]
  );
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) textarea.style.height = `${minHeight}px`;
  }, [minHeight]);

  useEffect(() => {
    const handleResize = () => adjustHeight(); // Adjust on window resize
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [adjustHeight]);

  return { textareaRef, adjustHeight };
}

// Helper component for action buttons
function ActionButton({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <Button // Use Button component
      type="button"
      variant="outline" // Example variant, adjust as needed
      className="group flex items-center gap-2 px-4 py-2 rounded-full transition-colors
                 bg-card text-card-foreground 
                 border border-border 
                 hover:bg-accent hover:text-accent-foreground
                 shadow-sm hover:shadow-md"
    >
      {icon}
      <span className="text-sm">{label}</span>
    </Button>
  );
}

export function ChatView() {
  // Auth logic temporarily removed for UI/UX focus
  // const { profile, isAuthenticated, isLoadingAuth } = useAuth(); 

  const [messages, setMessages] = useState<{id: string, content: string, sender: string}[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [composeValue, setComposeValue] = useState("");
  const { textareaRef, adjustHeight } = useAutoResizeTextarea({
    minHeight: 60,
    maxHeight: 200,
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleComposeKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (composeValue.trim()) {
        setMessages(prev => [...prev, {id: Date.now().toString(), content: composeValue, sender: "User"}]); // Static sender
        setComposeValue("");
        adjustHeight(true);
      }
    }
  };

  const handleSendFromInput = async (content: string) => {
    if (!content.trim() || isSending) return;
    setIsSending(true);
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API call
    setMessages(prev => [...prev, {id: Date.now().toString(), content, sender: "User"}]); // Static sender
    setIsSending(false);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-muted/20">
        {messages.map(msg => (
          <div 
            key={msg.id} 
            className={cn(
              'p-3 rounded-lg shadow-sm max-w-[75%] w-fit break-words', 
              msg.sender === 'User' ? 'bg-primary text-primary-foreground ml-auto' : 'bg-card text-card-foreground mr-auto'
            )}
          >
            <p className="text-sm">{msg.content}</p>
          </div>
        ))}
        {!messages.length && (
          <div className="flex flex-col items-center justify-center h-full">
            <MessageSquare size={48} className="text-muted-foreground/50 mb-4" />
            <p className="text-center text-muted-foreground">No messages yet. Start typing below!</p>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-2 sm:p-4 border-t bg-background">
        <div className="flex flex-col items-center w-full max-w-3xl mx-auto space-y-3">
            <div className="w-full">
                <div className="relative bg-card rounded-xl border border-border shadow-md">
                    <Textarea
                        ref={textareaRef}
                        value={composeValue}
                        onChange={(e) => {
                            setComposeValue(e.target.value);
                            adjustHeight();
                        }}
                        onKeyDown={handleComposeKeyDown}
                        placeholder="Ask v0 a question or describe your idea..."
                        className={cn(
                            "w-full px-4 py-3", "resize-none", "bg-transparent", "border-none",
                            "text-foreground text-sm", "focus:outline-none", "focus-visible:ring-0 focus-visible:ring-offset-0",
                            "placeholder:text-muted-foreground placeholder:text-sm", "min-h-[60px]"
                        )}
                        style={{ overflow: "hidden" }}
                    />
                    <div className="flex items-center justify-between p-2 sm:p-3 border-t border-border">
                        <div className="flex items-center gap-1 sm:gap-2">
                            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground" aria-label="Attach file">
                                <Paperclip className="w-4 h-4 sm:w-5 sm:h-5" />
                            </Button>
                             <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground" aria-label="Add project">
                                <PlusIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                            </Button>
                        </div>
                        <Button
                            type="button"
                            onClick={() => { if (composeValue.trim()) { handleComposeKeyDown({ key: 'Enter', preventDefault: () => {}, shiftKey: false } as React.KeyboardEvent<HTMLTextAreaElement>); }}}
                            className={cn(
                                "px-3 py-1.5 sm:px-4 sm:py-2 text-sm",
                                composeValue.trim() ? "bg-primary text-primary-foreground hover:bg-primary/90" : "bg-muted text-muted-foreground cursor-not-allowed"
                            )}
                            disabled={!composeValue.trim()}
                            aria-label="Send message"
                        >
                            <ArrowUpIcon className="w-4 h-4 mr-0 sm:mr-2" /> <span className="hidden sm:inline">Send</span>
                        </Button>
                    </div>
                </div>
                <div className="flex items-center justify-center gap-2 sm:gap-3 mt-3 sm:mt-4 flex-wrap px-2">
                    <ActionButton icon={<ImageIcon className="w-4 h-4 text-muted-foreground group-hover:text-accent-foreground" />} label="Clone Screenshot" />
                    <ActionButton icon={<Figma className="w-4 h-4 text-muted-foreground group-hover:text-accent-foreground" />} label="Import Figma" />
                    <ActionButton icon={<MonitorIcon className="w-4 h-4 text-muted-foreground group-hover:text-accent-foreground" />} label="Landing Page" />
                </div>
            </div>
        </div>
      </div>
      
      {/* If you want the simpler input as an alternative or primary: */}
      {/* <ChatInput 
        onSend={handleSendFromInput} 
        isSending={isSending} 
        className="border-t bg-background"
      /> */}
    </div>
  );
}
