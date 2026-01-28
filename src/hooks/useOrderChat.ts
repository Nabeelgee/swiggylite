import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

export interface ChatMessage {
  id: string;
  order_id: string;
  sender_type: "customer" | "partner";
  sender_id: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export const useOrderChat = (orderId: string, senderType: "customer" | "partner" = "customer") => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);

  // Fetch initial messages
  useEffect(() => {
    if (!orderId || !user) return;

    const fetchMessages = async () => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("order_messages")
        .select("*")
        .eq("order_id", orderId)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Error fetching messages:", error);
      } else {
        setMessages((data as ChatMessage[]) || []);
      }
      setIsLoading(false);
    };

    fetchMessages();
  }, [orderId, user]);

  // Subscribe to realtime updates
  useEffect(() => {
    if (!orderId || !user) return;

    const channel = supabase
      .channel(`order-chat-${orderId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "order_messages",
          filter: `order_id=eq.${orderId}`,
        },
        (payload) => {
          console.log("New message received:", payload);
          const newMessage = payload.new as ChatMessage;
          setMessages((prev) => {
            // Avoid duplicates
            if (prev.some((m) => m.id === newMessage.id)) {
              return prev;
            }
            return [...prev, newMessage];
          });

          // Show notification if message is from the other party
          if (newMessage.sender_type !== senderType) {
            toast.info("New message received", {
              description: newMessage.message.slice(0, 50) + (newMessage.message.length > 50 ? "..." : ""),
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderId, user, senderType]);

  // Send a message
  const sendMessage = useCallback(
    async (message: string) => {
      if (!orderId || !user || !message.trim()) return false;

      setIsSending(true);
      try {
        const { error } = await supabase.from("order_messages").insert({
          order_id: orderId,
          sender_type: senderType,
          sender_id: user.id,
          message: message.trim(),
        });

        if (error) {
          console.error("Error sending message:", error);
          toast.error("Failed to send message");
          return false;
        }

        return true;
      } catch (err) {
        console.error("Error sending message:", err);
        toast.error("Failed to send message");
        return false;
      } finally {
        setIsSending(false);
      }
    },
    [orderId, user, senderType]
  );

  // Mark messages as read
  const markAsRead = useCallback(async () => {
    if (!orderId || !user || messages.length === 0) return;

    const unreadMessages = messages.filter(
      (m) => !m.is_read && m.sender_type !== senderType
    );

    if (unreadMessages.length === 0) return;

    const { error } = await supabase
      .from("order_messages")
      .update({ is_read: true })
      .eq("order_id", orderId)
      .neq("sender_type", senderType)
      .eq("is_read", false);

    if (error) {
      console.error("Error marking messages as read:", error);
    } else {
      setMessages((prev) =>
        prev.map((m) =>
          m.sender_type !== senderType ? { ...m, is_read: true } : m
        )
      );
    }
  }, [orderId, user, messages, senderType]);

  const unreadCount = messages.filter(
    (m) => !m.is_read && m.sender_type !== senderType
  ).length;

  return {
    messages,
    isLoading,
    isSending,
    sendMessage,
    markAsRead,
    unreadCount,
  };
};
