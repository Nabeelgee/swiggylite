import React, { useState, useRef, useEffect } from "react";
import { Send, MessageCircle, X, User, Bike } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { useOrderChat, ChatMessage } from "@/hooks/useOrderChat";
import { useAuth } from "@/context/AuthContext";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface OrderChatProps {
  orderId: string;
  senderType?: "customer" | "partner";
  partnerName?: string;
  className?: string;
}

const OrderChat: React.FC<OrderChatProps> = ({
  orderId,
  senderType = "customer",
  partnerName = "Delivery Partner",
  className,
}) => {
  const { user } = useAuth();
  const { messages, isLoading, isSending, sendMessage, markAsRead, unreadCount } = useOrderChat(orderId, senderType);
  const [isOpen, setIsOpen] = useState(false);
  const [inputMessage, setInputMessage] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Mark messages as read when chat is opened
  useEffect(() => {
    if (isOpen) {
      markAsRead();
    }
  }, [isOpen, markAsRead]);

  const handleSend = async () => {
    if (!inputMessage.trim() || isSending) return;

    const success = await sendMessage(inputMessage);
    if (success) {
      setInputMessage("");
      inputRef.current?.focus();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const otherPartyName = senderType === "customer" ? partnerName : "Customer";

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className={cn("relative rounded-full", className)}
        >
          <MessageCircle className="w-5 h-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 w-5 h-5 p-0 flex items-center justify-center text-[10px]"
            >
              {unreadCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>

      <SheetContent side="bottom" className="h-[80vh] sm:h-[70vh] rounded-t-3xl p-0 flex flex-col">
        {/* Header */}
        <SheetHeader className="p-4 border-b border-border bg-card flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                {senderType === "customer" ? (
                  <Bike className="w-5 h-5 text-primary" />
                ) : (
                  <User className="w-5 h-5 text-primary" />
                )}
              </div>
              <div>
                <SheetTitle className="text-left">Chat with {otherPartyName}</SheetTitle>
                <p className="text-xs text-muted-foreground">Order #{orderId.slice(0, 8)}</p>
              </div>
            </div>
          </div>
        </SheetHeader>

        {/* Messages */}
        <ScrollArea className="flex-1 p-4" ref={scrollRef}>
          {isLoading ? (
            <div className="flex items-center justify-center h-40">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-center">
              <MessageCircle className="w-12 h-12 text-muted-foreground/30 mb-3" />
              <p className="text-muted-foreground text-sm">No messages yet</p>
              <p className="text-muted-foreground/70 text-xs mt-1">
                Send a message to start the conversation
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {messages.map((message, index) => (
                <MessageBubble
                  key={message.id}
                  message={message}
                  isOwn={message.sender_type === senderType}
                  showTimestamp={
                    index === 0 ||
                    new Date(message.created_at).getTime() -
                      new Date(messages[index - 1].created_at).getTime() >
                      300000 // 5 minutes
                  }
                />
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Input */}
        <div className="p-4 border-t border-border bg-card flex-shrink-0">
          <div className="flex gap-2">
            <Input
              ref={inputRef}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              className="rounded-full bg-muted/50"
              disabled={isSending}
            />
            <Button
              onClick={handleSend}
              disabled={!inputMessage.trim() || isSending}
              size="icon"
              className="rounded-full shrink-0"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-[10px] text-muted-foreground text-center mt-2">
            Messages are end-to-end encrypted
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
};

interface MessageBubbleProps {
  message: ChatMessage;
  isOwn: boolean;
  showTimestamp: boolean;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, isOwn, showTimestamp }) => {
  return (
    <div className={cn("flex flex-col", isOwn ? "items-end" : "items-start")}>
      {showTimestamp && (
        <p className="text-[10px] text-muted-foreground mb-1 px-2">
          {format(new Date(message.created_at), "MMM d, h:mm a")}
        </p>
      )}
      <div
        className={cn(
          "max-w-[80%] px-4 py-2.5 rounded-2xl",
          isOwn
            ? "bg-primary text-primary-foreground rounded-br-md"
            : "bg-muted text-foreground rounded-bl-md"
        )}
      >
        <p className="text-sm leading-relaxed break-words">{message.message}</p>
      </div>
      {isOwn && message.is_read && (
        <p className="text-[10px] text-muted-foreground mt-0.5 px-2">Read</p>
      )}
    </div>
  );
};

export default OrderChat;
