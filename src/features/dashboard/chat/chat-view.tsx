
// /src/features/dashboard/chat/chat-view.tsx
"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { Textarea } from "@/components/ui/textarea"; // Project's Textarea component
import { Button as ShadCnButton } from "@/components/ui/button"; // Alias for ActionButton
import { cn } from "@/lib/utils"; // Project's cn utility
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

// Helper component for action buttons, using ShadCN Button
interface ActionButtonProps {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
}
function ActionButton({ icon, label, onClick }: ActionButtonProps) {
  return (
    <ShadCnButton // Using the aliased ShadCN Button
      type="button"
      variant="outline"
      size="sm"
      className="group flex items-center gap-2 px-3 py-1.5 rounded-full transition-colors
                 bg-card text-card-foreground 
                 border-border 
                 hover:bg-accent hover:text-accent-foreground
                 shadow-sm hover:shadow-md"
      onClick={onClick}
    >
      {icon}
      <span className="text-xs font-medium">{label}</span>
    </ShadCnButton>
  );
}

export function ChatView() {
  const [messages, setMessages] = useState<{id: string, content: string, sender: string}[]>([]);
  const [composeValue, setComposeValue] = useState("");
  const { textareaRef, adjustHeight } = useAutoResizeTextarea({
    minHeight: 60,
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

      {/* Input Area based on VercelV0Chat */}
      <div className="p-2 sm:p-4 border-t bg-background">
        <div className="flex flex-col items-center w-full max-w-3xl mx-auto space-y-3 sm:space-y-4">
            <h1 className="text-xl sm:text-2xl font-semibold text-foreground text-center">
                What can I help you ship?
            </h1>

            <div className="w-full">
                <div className="relative bg-card rounded-xl border border-border shadow-md">
                    <div className="overflow-y-auto">
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
                                "min-h-[60px]"
                            )}
                            style={{ overflow: "hidden" }}
                        />
                    </div>
                    {/* Toolbar with Attach, Project, Send buttons - Reverted to raw buttons */}
                    <div className="flex items-center justify-between p-3 border-t border-border">
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                className="group p-2 hover:bg-accent rounded-lg transition-colors flex items-center gap-1"
                                aria-label="Attach file"
                            >
                                <Paperclip className="w-4 h-4 text-muted-foreground group-hover:text-accent-foreground" />
                                <span className="text-xs text-muted-foreground group-hover:text-accent-foreground hidden group-hover:inline transition-opacity">
                                    Attach
                                </span>
                            </button>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                className="px-2 py-1 rounded-lg text-sm bg-secondary text-secondary-foreground transition-colors border border-transparent hover:bg-secondary/90 flex items-center justify-between gap-1"
                            >
                                <PlusIcon className="w-4 h-4" />
                                Project
                            </button>
                            <button
                                type="button"
                                className={cn(
                                    "px-1.5 py-1.5 rounded-lg text-sm transition-colors border border-transparent flex items-center justify-center gap-1", // ensure justify-center for icon only
                                    composeValue.trim()
                                        ? "bg-primary text-primary-foreground hover:bg-primary/90"
                                        : "bg-muted text-muted-foreground cursor-not-allowed"
                                )}
                                disabled={!composeValue.trim()}
                                onClick={handleSendMessage}
                                aria-label="Send message"
                            >
                                <ArrowUpIcon className="w-4 h-4" />
                                <span className="sr-only">Send</span>
                            </button>
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
