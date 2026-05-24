import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { buildWebSocketURL } from '../api/ws';
import { User, Message, Conversation } from '../types';
import { Avatar } from './Avatar';
import { Send, MessageSquare, X, Minimize2, Maximize2, ChevronDown, Search, Trash2 } from 'lucide-react';
import { deleteConversation, getConversations, getMessages, getUnreadMessageCount } from '../services/messagesService';
import { listUsers } from '../services/usersService';
import { normalizeIncomingMessage } from '../lib/normalize';
import { playNotificationSound } from '../lib/notificationSound';

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

export const ChatWidget = () => {
  const { user, token } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [messagesError, setMessagesError] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const selectedConversationRef = useRef<Conversation | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    selectedConversationRef.current = selectedConversation;
  }, [selectedConversation]);

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.trim().length > 1) {
      setIsSearching(true);
      try {
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

  useEffect(() => {
    if (token && isOpen) {
      fetchConversations();
    }
  }, [token, isOpen]);

  useEffect(() => {
    if (!token || !user) {
      setUnreadMessages(0);
      return;
    }
    let active = true;
    const load = async () => {
      try {
        const count = await getUnreadMessageCount();
        if (active) setUnreadMessages(count);
      } catch {
        if (active) setUnreadMessages(0);
      }
    };
    load();
    const id = window.setInterval(load, 30000);
    return () => {
      active = false;
      window.clearInterval(id);
    };
  }, [token, user]);

  useEffect(() => {
    if (token && isOpen) {
      const wsUrl = buildWebSocketURL(`/messages/ws/${encodeURIComponent(token)}`);
      const newSocket = new WebSocket(wsUrl);

      newSocket.onerror = (error) => console.error('WebSocket (Widget) error:', error);

      newSocket.onmessage = (event) => {
        let incomingMessage;
        try {
          incomingMessage = normalizeIncomingMessage(JSON.parse(event.data));
        } catch (err) {
          console.error('Failed to parse WS payload:', err);
          return;
        }
        if (!incomingMessage) return;

        const currentConv = selectedConversationRef.current;
        const isCurrentThread = Boolean(currentConv &&
            (incomingMessage.sender_id === currentConv.user.id ||
             incomingMessage.receiver_id === currentConv.user.id));
        if (isCurrentThread) {
          setMessages((prev) => [...prev, incomingMessage!]);
        }
        if (incomingMessage.sender_id !== user?.id) {
          playNotificationSound();
          if (isCurrentThread && currentConv?.user.id) {
            fetchMessages(currentConv.user.id);
          } else {
            setUnreadMessages((prev) => prev + 1);
          }
        }
        fetchConversations();
      };

      setSocket(newSocket);
      return () => newSocket.close();
    }
  }, [token, isOpen]);

  useEffect(() => {
    if (selectedConversation) {
      setMessages([]);
      setMessagesError('');
      fetchMessages(selectedConversation.user.id!);
    } else {
      setMessages([]);
      setMessagesError('');
    }
  }, [selectedConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchConversations = async () => {
    try {
      const items = await getConversations();
      setConversations(items);
    } catch (err) {
      console.error('Failed to fetch conversations:', err);
    }
  };

  const fetchMessages = async (otherUserId: number) => {
    setMessagesLoading(true);
    setMessagesError('');
    try {
      const items = await getMessages(otherUserId);
      setMessages(items);
      fetchConversations();
      getUnreadMessageCount().then(setUnreadMessages).catch(() => undefined);
    } catch (err: any) {
      console.error('Failed to fetch messages:', err);
      setMessagesError(err?.response?.data?.detail || 'Could not load this conversation.');
    } finally {
      setMessagesLoading(false);
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

  const handleDeleteConversation = async (conv: Conversation) => {
    if (!conv.user.id) return;
    const confirmed = window.confirm(`Delete your conversation with ${conv.user.full_name || conv.user.username || 'this person'}?`);
    if (!confirmed) return;
    await deleteConversation(conv.user.id);
    setConversations((prev) => prev.filter((item) => item.user.id !== conv.user.id));
    if (selectedConversation?.user.id === conv.user.id) {
      setSelectedConversation(null);
    }
    getUnreadMessageCount().then(setUnreadMessages).catch(() => undefined);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  if (!token || !user) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {isOpen && (
        <div className={`mb-4 flex flex-col overflow-hidden rounded-2xl border border-border-secondary bg-surface shadow-2xl transition-all duration-300 ${
          isMinimized ? 'h-14 w-72' : 'h-[500px] w-[380px]'
        }`}>
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border-secondary bg-accent p-3 text-foreground-inverse">
            <div className="flex items-center gap-2">
              {(selectedConversation || isSearching) && !isMinimized ? (
                <button 
                  onClick={() => {
                    setSelectedConversation(null);
                    setIsSearching(false);
                    setSearchQuery('');
                  }} 
                  className="hover:opacity-80"
                >
                  <ChevronDown className="rotate-90" size={20} />
                </button>
              ) : (
                <MessageSquare size={20} />
              )}
              <span className="font-bold">
                {selectedConversation ? selectedConversation.user.full_name : isSearching ? 'Search results' : 'Messages'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setIsMinimized(!isMinimized)} className="hover:opacity-80">
                {isMinimized ? <Maximize2 size={18} /> : <Minimize2 size={18} />}
              </button>
              <button onClick={() => setIsOpen(false)} className="hover:opacity-80">
                <X size={18} />
              </button>
            </div>
          </div>

          {!isMinimized && (
            <div className="flex flex-1 flex-col overflow-hidden">
              {selectedConversation ? (
                <>
                  {/* Message List */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-canvas">
                    {messagesError && (
                      <div className="rounded-lg border border-status-error/25 bg-status-error/10 px-3 py-2 text-xs font-medium text-status-error">
                        {messagesError}
                      </div>
                    )}
                    {messagesLoading && messages.length === 0 && !messagesError && (
                      <div className="text-center text-xs text-foreground-tertiary">Loading messages…</div>
                    )}
                    {!messagesLoading && !messagesError && messages.length === 0 && (
                      <div className="text-center text-xs text-foreground-tertiary">No messages yet.</div>
                    )}
                    {messages.map((msg, index) => {
                      const isMe = msg.sender_id === user?.id;
                      return (
                        <div key={msg.id || index} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[85%] rounded-2xl px-3 py-1.5 ${
                            isMe ? 'bg-accent text-foreground-inverse rounded-br-none' : 'bg-surface-muted text-foreground-primary rounded-bl-none'
                          }`}>
                            <p className="text-sm">{msg.content}</p>
                            <span className={`text-[9px] block mt-0.5 ${isMe ? 'text-foreground-inverse/70' : 'text-foreground-tertiary'}`}>
                              {formatTime(msg.created_at)}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Input Area */}
                  <form onSubmit={handleSendMessage} className="p-3 border-t border-border-secondary flex gap-2 bg-surface">
                    <input 
                      type="text" 
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type a message..."
                      className="flex-1 rounded-full border border-border-secondary bg-surface-muted px-4 py-1.5 text-sm focus:border-border-focus focus:ring-4 focus:ring-accent/10 outline-none"
                    />
                    <button 
                      type="submit"
                      disabled={!newMessage.trim()}
                      className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-foreground-inverse shadow-sm hover:bg-accent-hover disabled:opacity-50"
                    >
                      <Send size={14} />
                    </button>
                  </form>
                </>
              ) : (
                <>
                  {/* Search and Conversation List */}
                  <div className="p-3 border-b border-border-secondary bg-surface">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground-tertiary" size={14} />
                      <input 
                        type="text" 
                        value={searchQuery}
                        onChange={(e) => handleSearch(e.target.value)}
                        placeholder="Search people to message..."
                        className="w-full rounded-full border border-border-secondary bg-surface-muted py-1.5 pl-9 pr-4 text-xs outline-none"
                      />
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto bg-canvas">
                    {isSearching ? (
                      searchResults.length === 0 ? (
                        <div className="p-8 text-center text-foreground-tertiary text-sm">No people found</div>
                      ) : (
                        searchResults.map((u) => (
                          <button
                            key={u.id}
                            onClick={() => startNewChat(u)}
                            className="w-full flex items-center gap-3 p-3 text-left transition-colors hover:bg-surface-muted border-b border-border-secondary/50"
                          >
                            <Avatar name={u.full_name} username={u.username} url={u.profile_photo_url} size="sm" />
                            <div className="min-w-0 flex-1">
                              <h2 className="text-sm font-semibold truncate">{u.full_name}</h2>
                            </div>
                          </button>
                        ))
                      )
                    ) : (
                      conversations.length === 0 ? (
                        <div className="p-8 text-center text-foreground-tertiary text-sm">
                          <p>No conversations yet</p>
                          <p className="text-[10px] mt-1 text-accent">Search for someone above to start chatting</p>
                        </div>
                      ) : (
                        conversations.map((conv) => (
                          <div
                            key={conv.user.id}
                            className="group flex w-full items-center gap-2 border-b border-border-secondary/50 p-3 text-left transition-colors hover:bg-surface-muted"
                          >
                            <button
                              type="button"
                              onClick={() => setSelectedConversation(conv)}
                              className="flex min-w-0 flex-1 items-center gap-3 text-left"
                            >
                              <Avatar name={conv.user.full_name} username={conv.user.username} url={conv.user.profile_photo_url} size="sm" />
                              <div className="min-w-0 flex-1">
                              <div className="flex justify-between items-baseline">
                                <h2 className="text-sm font-semibold truncate">{conv.user.full_name}</h2>
                                <span className="text-[9px] text-foreground-tertiary whitespace-nowrap">
                                  {formatTime(conv.last_message_at)}
                                </span>
                              </div>
                                <div className="flex items-center gap-2">
                                  <p className="min-w-0 flex-1 truncate text-xs text-foreground-tertiary">{conv.last_message}</p>
                                  {(conv.unread_count ?? 0) > 0 && (
                                    <span className="rounded-full bg-status-error px-1.5 text-[9px] font-black leading-4 text-white">
                                      {(conv.unread_count ?? 0) > 9 ? '9+' : conv.unread_count}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteConversation(conv)}
                              className="rounded-md p-1.5 text-foreground-tertiary opacity-0 transition hover:bg-status-error/10 hover:text-status-error group-hover:opacity-100 focus:opacity-100"
                              aria-label="Delete conversation"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        ))
                      )
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* Floating Action Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="relative flex h-14 w-14 items-center justify-center rounded-full bg-accent text-foreground-inverse shadow-xl hover:bg-accent-hover hover:scale-105 transition-all"
        >
          <MessageSquare size={24} />
          {unreadMessages > 0 && (
            <span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-status-error px-1.5 text-[11px] font-black leading-5 text-white ring-2 ring-surface">
              {unreadMessages > 9 ? '9+' : unreadMessages}
            </span>
          )}
        </button>
      )}
    </div>
  );
};
