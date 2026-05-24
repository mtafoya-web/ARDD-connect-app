import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { buildWebSocketURL } from '../api/ws';
import { User, Message, Conversation } from '../types';
import { Avatar } from '../components/Avatar';
import { Send, MessageSquare, UserPlus, Search } from 'lucide-react';
import { getConversations, getMessages } from '../services/messagesService';
import { getUser, listUsers } from '../services/usersService';
import { toNumericId } from '../lib/ids';

const formatTime = (dateStr: string) => {
  if (!dateStr) return '';
  try {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).format(date);
  } catch (e) {
    return '';
  }
};

export const MessagesPage = () => {
  const { user, token } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const targetUserId = searchParams.get('userId');
  const prefill = searchParams.get('prefill');

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const selectedConversationRef = useRef<Conversation | null>(null);

  useEffect(() => {
    selectedConversationRef.current = selectedConversation;
  }, [selectedConversation]);

  useEffect(() => {
    const init = async () => {
      await fetchConversations();
    };
    init();
  }, []);

  // Handle targetUserId from query params. URL-supplied values are
  // untrusted, so coerce through toNumericId — `?userId=abc` would
  // otherwise yield NaN and we'd request /users/NaN.
  useEffect(() => {
    if (targetUserId && !loading) {
      const parsedId = toNumericId(targetUserId);
      if (parsedId === null) return;
      const existingConv = conversations.find(c => c.user.id === parsedId);
      if (existingConv) {
        setSelectedConversation(existingConv);
      } else {
        // Fetch user info to start a new conversation
        fetchTargetUser(parsedId);
      }
    }
  }, [targetUserId, loading, conversations]);

  // One-shot prefill from query string (e.g. coming from a match card)
  useEffect(() => {
    if (prefill && newMessage === '') {
      setNewMessage(prefill);
      // Strip prefill from URL so reload doesn't reapply it
      const next = new URLSearchParams(searchParams);
      next.delete('prefill');
      setSearchParams(next, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefill]);

  const fetchTargetUser = async (id: number) => {
    try {
      const targetUser = await getUser(id);
      if (!targetUser) return;
      setSelectedConversation({
        user: targetUser,
        last_message: '',
        last_message_at: ''
      });
    } catch (err) {
      console.error('Failed to fetch target user:', err);
    }
  };

  useEffect(() => {
    if (token) {
      const wsUrl = buildWebSocketURL(`/messages/ws/${encodeURIComponent(token)}`);
      const newSocket = new WebSocket(wsUrl);

      newSocket.onerror = (error) => console.error('WebSocket error:', error);

      newSocket.onmessage = (event) => {
        const incomingMessage = JSON.parse(event.data);
        const currentConv = selectedConversationRef.current;
        
        // If the message belongs to the current open conversation, add it to the list
        if (currentConv && 
            (incomingMessage.sender_id === currentConv.user.id || 
             incomingMessage.receiver_id === currentConv.user.id)) {
          setMessages((prev) => [...prev, incomingMessage]);
        }
        
        // Update conversations list (refresh to show last message)
        fetchConversations();
      };

      setSocket(newSocket);

      return () => {
        newSocket.close();
      };
    }
  }, [token]);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.user.id!);
    }
  }, [selectedConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchConversations = async () => {
    try {
      // /messages/conversations is derived server-side from the Message
      // table (no Conversation table exists), so call it whenever we
      // need a fresh list — including after a new inbound WS event.
      const items = await getConversations();
      setConversations(items);
      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch conversations:', err);
      setLoading(false);
    }
  };

  const fetchMessages = async (otherUserId: number) => {
    try {
      const items = await getMessages(otherUserId);
      setMessages(items);
    } catch (err) {
      console.error('Failed to fetch messages:', err);
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation || !socket) return;

    const messageData = {
      receiver_id: selectedConversation.user.id,
      content: newMessage.trim()
    };

    socket.send(JSON.stringify(messageData));
    setNewMessage('');
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // ... (keep existing useEffects and functions)

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.trim().length > 1) {
      setIsSearching(true);
      try {
        // Service hits /users/ (trailing slash) so we don't get a
        // FastAPI 307 redirect that drops headers on some clients.
        const items = await listUsers(query);
        setSearchResults(items.filter((u: User) => u.id !== user?.id));
      } catch (err) {
        console.error('Search failed:', err);
      }
    } else {
      setIsSearching(false);
      setSearchResults([]);
    }
  };

  const startNewChat = (targetUser: User) => {
    setIsSearching(false);
    setSearchQuery('');
    setSearchResults([]);
    
    // Check if conversation already exists
    const existing = conversations.find(c => c.user.id === targetUser.id);
    if (existing) {
      setSelectedConversation(existing);
    } else {
      setSelectedConversation({
        user: targetUser,
        last_message: '',
        last_message_at: ''
      });
    }
  };

  if (loading) return <div className="p-8 text-center">Loading messages...</div>;

  return (
    <main className="mx-auto flex h-[calc(100vh-64px)] max-w-7xl overflow-hidden bg-canvas text-foreground-primary">
      {/* Conversations List */}
      <aside className="w-full border-r border-border-secondary bg-surface md:w-80 lg:w-96 flex flex-col">
        <div className="p-4 border-b border-border-secondary">
          <h1 className="text-xl font-bold">Messages</h1>
          <div className="relative mt-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground-tertiary" size={18} />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search people to message..."
              className="w-full rounded-full border border-border-secondary bg-surface-muted py-2 pl-10 pr-4 text-sm focus:border-border-focus focus:ring-4 focus:ring-accent/10 outline-none"
            />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {isSearching ? (
            <div className="divide-y divide-border-secondary/30">
              <div className="p-3 text-xs font-bold uppercase tracking-wider text-foreground-tertiary bg-surface-muted/50">
                Search Results
              </div>
              {searchResults.length === 0 ? (
                <div className="p-8 text-center text-sm text-foreground-tertiary">No people found</div>
              ) : (
                searchResults.map((u) => (
                  <button
                    key={u.id}
                    onClick={() => startNewChat(u)}
                    className="w-full flex items-center gap-3 p-4 text-left transition-colors hover:bg-surface-muted"
                  >
                    <Avatar name={u.full_name} username={u.username} url={u.profile_photo_url} />
                    <div className="min-w-0 flex-1">
                      <h2 className="font-semibold truncate">{u.full_name}</h2>
                    </div>
                  </button>
                ))
              )}
            </div>
          ) : (
            conversations.length === 0 ? (
              <div className="p-8 text-center text-foreground-tertiary">
                <MessageSquare className="mx-auto mb-4 opacity-20" size={48} />
                <p>No conversations yet</p>
                <p className="text-xs mt-2">Search for someone above to start chatting</p>
              </div>
            ) : (
              conversations.map((conv) => (
                <button
                  key={conv.user.id}
                  onClick={() => setSelectedConversation(conv)}
                  className={`w-full flex items-center gap-3 p-4 text-left transition-colors hover:bg-surface-muted ${
                    selectedConversation?.user.id === conv.user.id ? 'bg-surface-muted border-r-4 border-accent' : ''
                  }`}
                >
                  <Avatar name={conv.user.full_name} username={conv.user.username} url={conv.user.profile_photo_url} />
                  <div className="min-w-0 flex-1">
                    <div className="flex justify-between items-baseline">
                      <h2 className="font-semibold truncate">{conv.user.full_name}</h2>
                      <span className="text-[10px] text-foreground-tertiary whitespace-nowrap">
                        {formatTime(conv.last_message_at)}
                      </span>
                    </div>
                    <p className="text-sm text-foreground-tertiary truncate">{conv.last_message}</p>
                  </div>
                </button>
              ))
            )
          )}
        </div>
      </aside>

      {/* Chat Window */}
      <section className="flex-1 flex flex-col bg-surface relative">
        {selectedConversation ? (
          <>
            <header className="flex items-center gap-3 p-4 border-b border-border-secondary">
              <Avatar name={selectedConversation.user.full_name} username={selectedConversation.user.username} url={selectedConversation.user.profile_photo_url} />
              <div>
                <h2 className="font-bold">{selectedConversation.user.full_name}</h2>
              </div>
            </header>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg, index) => {
                const isMe = msg.sender_id === user?.id;
                return (
                  <div key={msg.id || index} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                      isMe ? 'bg-accent text-foreground-inverse rounded-br-none' : 'bg-surface-muted text-foreground-primary rounded-bl-none'
                    }`}>
                      <p className="text-[15px]">{msg.content}</p>
                      <span className={`text-[10px] block mt-1 ${isMe ? 'text-foreground-inverse/70' : 'text-foreground-tertiary'}`}>
                        {formatTime(msg.created_at)}
                      </span>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSendMessage} className="p-4 border-t border-border-secondary flex gap-2 bg-surface">
              <input 
                type="text" 
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 rounded-full border border-border-secondary bg-surface-muted px-4 py-2 text-sm focus:border-border-focus focus:ring-4 focus:ring-accent/10 outline-none"
              />
              <button 
                type="submit"
                disabled={!newMessage.trim()}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-accent text-foreground-inverse shadow-sm hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send size={18} />
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-foreground-tertiary">
            <div className="w-20 h-20 rounded-full bg-surface-muted flex items-center justify-center mb-6">
              <MessageSquare size={32} className="text-accent" />
            </div>
            <h2 className="text-2xl font-bold text-foreground-primary">Your messages</h2>
            <p className="max-w-xs mt-2">Choose a conversation from the left to start chatting with other ARDD members.</p>
            <button 
              onClick={() => navigate('/people')}
              className="mt-6 flex items-center gap-2 rounded-full bg-accent px-6 py-2.5 text-sm font-bold text-foreground-inverse shadow-sm hover:bg-accent-hover"
            >
              <UserPlus size={18} />
              New Message
            </button>
          </div>
        )}
      </section>
    </main>
  );
};
