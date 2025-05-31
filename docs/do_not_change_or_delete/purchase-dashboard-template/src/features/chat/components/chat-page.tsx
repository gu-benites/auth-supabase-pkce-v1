"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { Textarea } from "@/components/ui/textarea";
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
} from "lucide-react";

interface UseAutoResizeTextareaProps {
  minHeight: number;
  maxHeight?: number;
}

function useAutoResizeTextarea({
  minHeight,
  maxHeight,
}: UseAutoResizeTextareaProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustHeight = useCallback(
    (reset?: boolean) => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      if (reset) {
        textarea.style.height = `${minHeight}px`;
        return;
      }

      textarea.style.height = `${minHeight}px`;
      const newHeight = Math.max(
        minHeight,
        Math.min(
          textarea.scrollHeight,
          maxHeight ?? Number.POSITIVE_INFINITY
        )
      );
      textarea.style.height = `${newHeight}px`;
    },
    [minHeight, maxHeight]
  );

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = `${minHeight}px`;
    }
  }, [minHeight]);

  useEffect(() => {
    const handleResize = () => adjustHeight();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [adjustHeight]);

  return { textareaRef, adjustHeight };
}

interface ActionButtonProps {
  icon: React.ReactNode;
  label: string;
}

function ActionButton({ icon, label }: ActionButtonProps) {
  return (
    <button
      type="button"
      className="group flex items-center gap-2 px-4 py-2 rounded-full transition-colors
                 bg-card text-card-foreground 
                 border border-border 
                 hover:bg-accent hover:text-accent-foreground
                 shadow-sm hover:shadow-md"
    >
      {icon}
      <span className="text-sm">{label}</span>
    </button>
  );
}

export function ChatPage() {
  const [value, setValue] = useState("");
  const { textareaRef, adjustHeight } = useAutoResizeTextarea({
    minHeight: 60,
    maxHeight: 200,
  });

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (value.trim()) {
        setValue("");
        adjustHeight(true);
      }
    }
  };

  return (
    <div className="flex flex-col items-center w-full max-w-4xl mx-auto p-4 space-y-8">
      <h1 className="text-4xl font-bold text-foreground">
        What can I help you ship?
      </h1>

      <div className="w-full">
        <div className="relative bg-card rounded-xl border border-border shadow-md">
          <div className="overflow-y-auto">
            <Textarea
              ref={textareaRef}
              value={value}
              onChange={(e) => {
                setValue(e.target.value);
                adjustHeight();
              }}
              onKeyDown={handleKeyDown}
              placeholder="Ask v0 a question..."
              className={cn(
                "w-full px-4 py-3",
                "resize-none",
                "bg-transparent",
                "border-none",
                "text-foreground text-sm",
                "focus:outline-none",
                "focus-visible:ring-0 focus-visible:ring-offset-0",
                "placeholder:text-muted-foreground placeholder:text-sm",
                "min-h-[60px]"
              )}
              style={{
                overflow: "hidden",
              }}
            />
          </div>
          
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
                  "px-1.5 py-1.5 rounded-lg text-sm transition-colors border border-transparent flex items-center justify-between gap-1",
                  value.trim()
                    ? "bg-primary text-primary-foreground hover:bg-primary/90"
                    : "bg-muted text-muted-foreground cursor-not-allowed"
                )}
                disabled={!value.trim()}
                aria-label="Send message"
              >
                <ArrowUpIcon className="w-4 h-4" />
                <span className="sr-only">Send</span>
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center gap-3 mt-4 flex-wrap">
          <ActionButton
            icon={<ImageIcon className="w-4 h-4 text-muted-foreground group-hover:text-accent-foreground" />}
            label="Clone a Screenshot"
          />
          <ActionButton
            icon={<Figma className="w-4 h-4 text-muted-foreground group-hover:text-accent-foreground" />}
            label="Import from Figma"
          />
          <ActionButton
            icon={<FileUp className="w-4 h-4 text-muted-foreground group-hover:text-accent-foreground" />}
            label="Upload a Project"
          />
          <ActionButton
            icon={<MonitorIcon className="w-4 h-4 text-muted-foreground group-hover:text-accent-foreground" />}
            label="Landing Page"
          />
          <ActionButton
            icon={<CircleUserRound className="w-4 h-4 text-muted-foreground group-hover:text-accent-foreground" />}
            label="Sign Up Form"
          />
        </div>
      </div>
    </div>
  );
}
