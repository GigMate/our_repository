import { useState, useEffect, useRef } from 'react';
import { Send, MessageSquare, Paperclip, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

interface Message {
  id: string;
  sender_id: string;
  message: string;
  created_at: string;
  read_at?: string;
  sender?: {
    full_name: string;
    avatar_url?: string;
    user_type: string;
  };
}

interface MessagingPanelProps {
  recipientId: string;
  recipientName: string;
  recipientType: 'fan' | 'musician' | 'venue';
  bookingId?: string;
  onClose?: () => void;
}

export function MessagingPanel({
  recipientId,
  recipientName,
  recipientType,
  bookingId,
  onClose
}: MessagingPanelProps) {
  const { user, profile } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<any>(null);

  useEffect(() => {
    if (!user || !recipientId) return;

    initConversation();

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [user, recipientId, bookingId]);

  useEffect(() => {
    if (!conversationId) return;

    loadMessages();
    subscribeToMessages();

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [conversationId]);

  async function initConversation() {
    if (!user) return;

    const { data: existing } = await supabase
      .from('conversations')
      .select('id')
      .or(`and(participant_1.eq.${user.id},participant_2.eq.${recipientId}),and(participant_1.eq.${recipientId},participant_2.eq.${user.id})`)
      .eq('booking_id', bookingId || null)
      .maybeSingle();

    if (existing) {
      setConversationId(existing.id);
    } else {
      const { data: newConv } = await supabase
        .from('conversations')
        .insert({
          participant_1: user.id,
          participant_2: recipientId,
          booking_id: bookingId,
        })
        .select('id')
        .single();

      setConversationId(newConv?.id || null);
    }
  }

  async function loadMessages() {
    if (!conversationId) return;

    const { data } = await supabase
      .from('messages')
      .select(`
        id,
        sender_id,
        message,
        created_at,
        read_at,
        sender:profiles!sender_id(full_name, avatar_url, user_type)
      `)
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    setMessages(data || []);
    setLoading(false);
    scrollToBottom();

    await supabase
      .from('messages')
      .update({ read_at: new Date().toISOString() })
      .eq('conversation_id', conversationId)
      .is('read_at', null)
      .neq('sender_id', user!.id);
  }

  function subscribeToMessages() {
    if (!conversationId) return;

    const channel = supabase
      .channel(`conversation:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        async (payload) => {
          const { data: sender } = await supabase
            .from('profiles')
            .select('full_name, avatar_url, user_type')
            .eq('id', payload.new.sender_id)
            .single();

          const newMsg = {
            ...payload.new,
            sender,
          } as Message;

          setMessages((prev) => [...prev, newMsg]);
          scrollToBottom();

          if (payload.new.sender_id !== user?.id) {
            await supabase
              .from('messages')
              .update({ read_at: new Date().toISOString() })
              .eq('id', payload.new.id);
          }
        }
      )
      .subscribe();

    channelRef.current = channel;
  }

  async function sendMessage() {
    if (!newMessage.trim() || !conversationId || !user) return;

    const messageContent = newMessage.trim();
    setNewMessage('');

    await supabase.from('messages').insert({
      conversation_id: conversationId,
      sender_id: user.id,
      message: messageContent,
    });
  }

  function scrollToBottom() {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  }

  function handleKeyPress(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  if (loading) {
    return <div className="text-center py-8">Loading messages...</div>;
  }

  return (
    <div className="flex flex-col h-[600px] bg-white rounded-lg shadow-lg">
      <div className="p-4 border-b flex items-center justify-between bg-gradient-to-r from-gigmate-blue to-blue-600 text-white rounded-t-lg">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5" />
          <div>
            <h3 className="font-semibold">{recipientName}</h3>
            <p className="text-xs opacity-90 capitalize">{recipientType}</p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1 hover:bg-white/20 rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.sender_id === user?.id ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`max-w-[70%] rounded-lg p-3 ${
                  message.sender_id === user?.id
                    ? 'bg-gigmate-blue text-white'
                    : 'bg-white text-gray-900 border border-gray-200'
                }`}
              >
                {message.sender_id !== user?.id && (
                  <p className="text-xs font-medium mb-1 opacity-75">
                    {message.sender?.full_name}
                  </p>
                )}
                <p className="text-sm whitespace-pre-wrap break-words">{message.message}</p>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs opacity-70">
                    {new Date(message.created_at).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                  {message.sender_id === user?.id && message.read_at && (
                    <span className="text-xs opacity-70">Read</span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t bg-white rounded-b-lg">
        <div className="flex gap-2">
          <textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message... (Press Enter to send)"
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gigmate-blue focus:border-transparent resize-none"
            rows={2}
          />
          <button
            onClick={sendMessage}
            disabled={!newMessage.trim()}
            className="px-4 py-2 bg-gigmate-blue text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
          >
            <Send className="w-4 h-4" />
            Send
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Shift + Enter for new line
        </p>
      </div>
    </div>
  );
}
