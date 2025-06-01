
// /src/features/dashboard/chat/chat-view.tsx
"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
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
  MessageSquare
} from "lucide-react";
// ChatInput component import is removed as we are replacing its functionality with the new rich input.
// import { ChatInput } from "./components/chat-input";

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

// Helper component for action buttons, now using ShadCN Button
interface ActionButtonProps {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
}
function ActionButton({ icon, label, onClick }: ActionButtonProps) {
  return (
    <Button
      type="button"
      variant="outline"
      size="sm" // Using sm size for a more compact look like in the image
      className="group flex items-center gap-2 px-3 py-1.5 rounded-full transition-colors
                 bg-card text-card-foreground 
                 border-border 
                 hover:bg-accent hover:text-accent-foreground
                 shadow-sm hover:shadow-md"
      onClick={onClick}
    >
      {icon}
      <span className="text-xs font-medium">{label}</span>
    </Button>
  );
}

export function ChatView() {
  const [messages, setMessages] = useState<{id: string, content: string, sender: string}[]>([]);
  // const [isSending, setIsSending] = useState(false); // Kept if we need to show loading on send
  const [composeValue, setComposeValue] = useState("");
  const { textareaRef, adjustHeight } = useAutoResizeTextarea({
    minHeight: 60, // Adjusted minHeight as per VercelV0Chat
    maxHeight: 200,
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = () => {
    if (composeValue.trim()) {
      setMessages(prev => [...prev, {id: Date.now().toString(), content: composeValue, sender: "User"}]);
      setComposeValue("");
      adjustHeight(true);
    }
  };
  
  const handleComposeKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Message Display Area */}
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

      {/* New Input Area based on VercelV0Chat */}
      <div className="p-2 sm:p-4 border-t bg-background">
        <div className="flex flex-col items-center w-full max-w-3xl mx-auto space-y-3 sm:space-y-4">
            <h1 className="text-xl sm:text-2xl font-semibold text-foreground text-center">
                What can I help you ship?
            </h1>

            <div className="w-full">
                <div className="relative bg-card rounded-xl border border-border shadow-md">
                    <div className="overflow-y-auto"> {/* Added to contain textarea scroll if content exceeds maxHeight */}
                        <Textarea
                            ref={textareaRef}
                            value={composeValue}
                            onChange={(e) => {
                                setComposeValue(e.target.value);
                                adjustHeight();
                            }}
                            onKeyDown={handleComposeKeyDown}
                            placeholder="Ask v0 a question..."
                            className={cn(
                                "w-full px-4 py-3", "resize-none", "bg-transparent", "border-none",
                                "text-foreground text-sm", "focus:outline-none", "focus-visible:ring-0 focus-visible:ring-offset-0",
                                "placeholder:text-muted-foreground placeholder:text-sm",
                                "min-h-[60px]" // min-h-[60px] from VercelV0Chat
                            )}
                            style={{ overflow: "hidden" }} // Hides textarea's own scrollbar
                        />
                    </div>
                    <div className="flex items-center justify-between p-2 sm:p-3 border-t border-border">
                        <div className="flex items-center gap-1 sm:gap-2">
                            <Button
                                type="button"
                                variant="ghost" 
                                size="icon"
                                className="group text-muted-foreground hover:text-accent-foreground"
                                aria-label="Attach file"
                            >
                                <Paperclip className="w-4 h-4 sm:w-5 sm:h-5" />
                                <span className="text-xs text-muted-foreground group-hover:text-accent-foreground hidden group-hover:sm:inline transition-opacity ml-1">
                                    Attach
                                </span>
                            </Button>
                        </div>
                        <div className="flex items-center gap-1 sm:gap-2">
                            <Button
                                type="button"
                                variant="secondary"
                                size="sm"
                                className="px-2 py-1 text-xs sm:text-sm"
                            >
                                <PlusIcon className="w-4 h-4 mr-1 sm:mr-2" />
                                Project
                            </Button>
                            <Button
                                type="button"
                                size="sm" // Send button typically matches project button or is icon only
                                className={cn(
                                    "px-3 py-1.5 sm:px-3 sm:py-1.5 text-xs sm:text-sm", // Adjusted padding for sm size
                                    composeValue.trim() ? "bg-primary text-primary-foreground hover:bg-primary/90" : "bg-muted text-muted-foreground cursor-not-allowed"
                                )}
                                disabled={!composeValue.trim()}
                                onClick={handleSendMessage}
                                aria-label="Send message"
                            >
                                <ArrowUpIcon className="w-4 h-4" />
                                <span className="sr-only sm:not-sr-only sm:ml-1">Send</span>
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-center gap-2 sm:gap-3 mt-3 sm:mt-4 flex-wrap px-1 sm:px-2">
                    <ActionButton icon={<ImageIcon className="w-4 h-4 text-muted-foreground group-hover:text-accent-foreground" />} label="Clone Screenshot" />
                    <ActionButton icon={<Figma className="w-4 h-4 text-muted-foreground group-hover:text-accent-foreground" />} label="Import Figma" />
                    <ActionButton icon={<FileUp className="w-4 h-4 text-muted-foreground group-hover:text-accent-foreground" />} label="Upload Project" />
                    <ActionButton icon={<MonitorIcon className="w-4 h-4 text-muted-foreground group-hover:text-accent-foreground" />} label="Landing Page" />
                    <ActionButton icon={<CircleUserRound className="w-4 h-4 text-muted-foreground group-hover:text-accent-foreground" />} label="Sign Up Form" />
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}
