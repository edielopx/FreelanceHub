import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { Message } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

interface UseChatOptions {
  recipientId?: number;
  enabled?: boolean;
  pollingInterval?: number;
}

export function useChat({ recipientId, enabled = true, pollingInterval = 5000 }: UseChatOptions = {}) {
  const { user } = useAuth();
  const { toast } = useToast();

  // Fetch messages for the current conversation
  const {
    data: messages = [],
    isLoading,
    error,
    refetch,
  } = useQuery<Message[]>({
    queryKey: recipientId ? [`/api/messages/${recipientId}`] : [],
    enabled: enabled && !!recipientId && !!user,
    refetchInterval: pollingInterval, // Poll for new messages
  });

  // Send a new message
  const sendMessageMutation = useMutation({
    mutationFn: async ({ recipientId, content }: { recipientId: number; content: string }) => {
      return apiRequest("POST", "/api/messages", {
        receiverId: recipientId,
        content,
      });
    },
    onSuccess: (_, variables) => {
      // Invalidate and refetch messages after sending
      queryClient.invalidateQueries({ queryKey: [`/api/messages/${variables.recipientId}`] });
    },
    onError: (error) => {
      toast({
        title: "Erro ao enviar mensagem",
        description: error.message || "Não foi possível enviar sua mensagem. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  // Get unread message count
  const {
    data: unreadCount = { count: 0 },
    isLoading: isLoadingUnread,
  } = useQuery({
    queryKey: ['/api/unread-messages'],
    enabled: !!user,
    refetchInterval: pollingInterval,
  });

  // Mark messages as read
  const markAsReadMutation = useMutation({
    mutationFn: async (senderId: number) => {
      // This would typically be an API call, but in our case reading messages
      // is handled automatically when fetching messages from a specific user
      await refetch();
    },
  });

  return {
    messages,
    isLoading,
    error,
    sendMessage: sendMessageMutation.mutate,
    isSending: sendMessageMutation.isPending,
    unreadCount: unreadCount.count,
    isLoadingUnread,
    markAsRead: markAsReadMutation.mutate,
  };
}
