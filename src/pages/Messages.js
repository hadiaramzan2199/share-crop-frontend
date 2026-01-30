import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box,
  Typography,
  Avatar,
  TextField,
  IconButton,
  Badge,
  Paper,
  InputAdornment,
  Stack,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  CircularProgress,
  useMediaQuery,
  useTheme
} from '@mui/material';
import {
  Send,
  Search,
  Schedule,
  ChatBubbleOutline,
  Add,
  ArrowBack,
  DoneAll
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { messagingService } from '../services/messaging';
import supabase from '../services/supabase';

const Messages = () => {
  const { user } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [msgLoading, setMsgLoading] = useState(false);

  // Realtime Configuration Check
  useEffect(() => {
    if (!supabase) {
      console.error('Supabase client is not initialized. check your .env variables: REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY');
    }
  }, []);

  // New Chat Dialog State
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchUserTerm, setSearchUserTerm] = useState('');
  const [foundUsers, setFoundUsers] = useState([]);
  const [searching, setSearching] = useState(false);

  const messagesEndRef = useRef(null);

  const fetchConversations = useCallback(async (showSpinner = false) => {
    try {
      if (showSpinner) setLoading(true);
      const data = await messagingService.getConversations();
      setConversations(data);
    } catch (err) {
      console.error('Error fetching conversations:', err);
    } finally {
      if (showSpinner) setLoading(false);
    }
  }, []);

  const fetchMessages = useCallback(async (convId) => {
    try {
      setMsgLoading(true);
      const data = await messagingService.getMessages(convId);
      setMessages(data);
      // Clear unread count locally for this conversation
      setConversations(prev => prev.map(c =>
        c.id === convId ? { ...c, unread_count: 0 } : c
      ));
    } catch (err) {
      console.error('Error fetching messages:', err);
    } finally {
      setMsgLoading(false);
    }
  }, []);

  const searchUsers = useCallback(async () => {
    try {
      setSearching(true);
      const data = await messagingService.searchUsers(searchUserTerm);
      // Filter out current user from search results
      setFoundUsers(data.filter(u => u.id !== user?.id));
    } catch (err) {
      console.error('Error searching users:', err);
    } finally {
      setSearching(false);
    }
  }, [user?.id, searchUserTerm]);

  // 1. Initial Data Fetching
  useEffect(() => {
    if (user) {
      fetchConversations(true); // Initial load with spinner
    }
  }, [user, fetchConversations]);

  // 2. Fetch Messages when selecting conversation
  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.id);

      // Setup Realtime Subscription for this conversation
      if (supabase) {
        const channel = supabase
          .channel(`messages-${selectedConversation.id}`)
          .on('postgres_changes', {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `conversation_id=eq.${selectedConversation.id}`
          }, payload => {
            console.log('Realtime message received:', payload);
            const newMsg = payload.new;

            setMessages(prev => {
              // 1. If message already exists by ID, ignore
              if (prev.some(m => m.id === newMsg.id)) return prev;

              // 2. If it's my message, try to find the optimistic/temp one and replace it
              if (newMsg.sender_id === user?.id) {
                const tempMatch = prev.find(m => m.is_temp && m.content === newMsg.content);
                if (tempMatch) {
                  // Replace temp with real immediately to prevent flicker
                  return prev.map(m => m.id === tempMatch.id ? newMsg : m);
                }
              }

              // 3. Otherwise add as new
              return [...prev, newMsg];
            });

            // Update sidebar preview
            setConversations(prev => prev.map(c =>
              c.id === selectedConversation.id
                ? { ...c, last_message: newMsg.content, last_message_at: newMsg.created_at }
                : c
            ));

            // If we are currently viewing this conversation, mark the message as read
            if (newMsg.sender_id !== user.id) {
              messagingService.markAsRead(selectedConversation.id);
            }
          })
          .on('postgres_changes', {
            event: 'UPDATE',
            schema: 'public',
            table: 'messages',
            filter: `conversation_id=eq.${selectedConversation.id}`
          }, payload => {
            console.log('Realtime message update received:', payload);
            const updatedMsg = payload.new;
            setMessages(prev => prev.map(m => m.id === updatedMsg.id ? updatedMsg : m));
          })
          .subscribe((status) => {
            console.log(`Subscription status for messages-${selectedConversation.id}:`, status);
          });

        return () => {
          supabase.removeChannel(channel);
        };
      }
    }
  }, [selectedConversation, user?.id, fetchMessages]);

  // 3. Realtime Subscription for Conversation List
  useEffect(() => {
    if (user && supabase) {
      const convChannel = supabase
        .channel(`conversations-updates`)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'conversations'
        }, payload => {
          console.log('Conversation list update received:', payload);
          const conv = payload.new || payload.old;
          if (conv.user1_id === user.id || conv.user2_id === user.id) {
            // Background refresh without showing loading spinner
            console.log('Relevant conversation update, fetching list...');
            fetchConversations(false);
          }
        })
        .subscribe((status) => {
          console.log('Subscription status for conversation-updates:', status);
        });

      return () => {
        supabase.removeChannel(convChannel);
      };
    }
  }, [user, fetchConversations]);

  // User Search Logic
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchUserTerm.trim().length >= 2) {
        searchUsers();
      } else {
        setFoundUsers([]);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchUserTerm, searchUsers]);

  const handleStartNewChat = async (participantId) => {
    try {
      const conv = await messagingService.startConversation(participantId);
      setIsSearchOpen(false);
      setSearchUserTerm('');

      // Check if conversation already in our list
      const existing = conversations.find(c => c.id === conv.id);
      if (existing) {
        setSelectedConversation(existing);
      } else {
        // Refresh list and select it
        await fetchConversations();
        const freshData = await messagingService.getConversations();
        const newConv = freshData.find(c => c.id === conv.id);
        if (newConv) setSelectedConversation(newConv);
      }
    } catch (err) {
      console.error('Error starting new chat:', err);
    }
  };

  const scrollToBottom = (behavior = 'smooth') => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior });
    }
  };

  // Scroll to bottom on initial message load (instant)
  useEffect(() => {
    if (messages.length > 0 && msgLoading === false) {
      scrollToBottom('auto');
    }
  }, [selectedConversation?.id, msgLoading, messages.length]);

  // Scroll to bottom on new messages (smooth)
  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom('smooth');
    }
  }, [messages.length]);

  const handleSendMessage = async () => {
    if (newMessage.trim() && selectedConversation) {
      const content = newMessage;
      const tempId = `temp-${Date.now()}`;

      // 1. Optimistic Update (Immediate Feedback)
      const optimisticMsg = {
        id: tempId,
        sender_id: user.id,
        content: content,
        created_at: new Date().toISOString(),
        is_temp: true
      };

      setMessages(prev => [...prev, optimisticMsg]);
      setNewMessage('');

      try {
        const sentMsg = await messagingService.sendMessage(selectedConversation.id, content);

        // 2. Replace optimistic message with actual server message
        // Check if realtime already added the message to avoid duplication
        setMessages(prev => {
          if (prev.some(m => m.id === sentMsg.id)) {
            return prev.filter(m => m.id !== tempId);
          }
          return prev.map(m => m.id === tempId ? sentMsg : m);
        });

        // 3. Update conversation last message preview
        setConversations(prev => prev.map(c =>
          c.id === selectedConversation.id
            ? { ...c, last_message: content, last_message_at: sentMsg.created_at }
            : c
        ));
      } catch (err) {
        console.error('Error sending message:', err);
        // Remove the optimistic message on failure
        setMessages(prev => prev.filter(m => m.id !== tempId));
        setNewMessage(content); // Restore content so user doesn't lose it
      }
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const filteredConversations = conversations.filter(conv =>
    conv.participant_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (conv.last_message && conv.last_message.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString();
    }
  };

  if (!user) return (
    <Box sx={{ p: 4, textAlign: 'center' }}>
      <Typography>Please log in to view messages.</Typography>
    </Box>
  );

  return (
    <Box sx={{
      height: '100%',
      backgroundColor: '#f8fafc',
      p: { xs: 1.5, sm: 2, md: 3 },
      pt: { xs: 2, md: 4 }, // Add breathing room
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Header Section */}
      <Box sx={{
        maxWidth: '1400px',
        width: '100%',
        mx: 'auto',
        mb: { xs: 1, md: 3 },
        mt: { xs: 2, md: 0 } // Move it down more on mobile
      }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2.5 }}>
          <Box>
            <Typography
              variant="h5"
              sx={{
                fontWeight: 700,
                color: '#1e293b',
                mb: 0.5,
                fontSize: { xs: '1.25rem', md: '1.75rem' },
              }}
            >
              Messages
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.9rem' }}>
              Communicate with other users and manage your conversations in real-time
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setIsSearchOpen(true)}
            sx={{
              bgcolor: '#4caf50',
              '&:hover': { bgcolor: '#45a049' },
              borderRadius: 2,
              mt: { xs: 0, md: 5 }
            }}
          >
            New Chat
          </Button>
        </Stack>
      </Box>

      {/* Main Chat Interface */}
      <Box sx={{
        maxWidth: '1400px',
        width: '100%',
        mx: 'auto',
        flex: 1,
        minHeight: 0, // Critical for inner scroll
        mb: { xs: 1, md: 0 }
      }}>
        <Paper
          elevation={0}
          sx={{
            height: '100%',
            border: '1px solid #e2e8f0',
            borderRadius: 3,
            backgroundColor: 'white',
            overflow: 'hidden',
            display: 'flex'
          }}
        >
          {/* Conversations Sidebar */}
          <Box sx={{
            width: { xs: '100%', md: '380px' },
            borderRight: '1px solid #e2e8f0',
            height: '100%',
            display: { xs: selectedConversation ? 'none' : 'flex', md: 'flex' },
            flexDirection: 'column',
          }}>
            {/* Sidebar Header */}
            <Box sx={{
              p: 3,
              borderBottom: '1px solid #e2e8f0',
              backgroundColor: '#fafbfc'
            }}>
              <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1.1rem', color: '#1e293b', mb: 2 }}>
                Conversations
              </Typography>

              <TextField
                fullWidth
                placeholder="Search chats..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search sx={{ fontSize: 18, color: '#64748b' }} />
                    </InputAdornment>
                  ),
                }}
                size="small"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    backgroundColor: 'white',
                    fontSize: '0.875rem',
                  }
                }}
              />
            </Box>

            {/* Conversations List */}
            <Box sx={{ flex: 1, overflow: 'auto' }}>
              {loading ? (
                <Stack alignItems="center" p={4}><CircularProgress size={30} /></Stack>
              ) : filteredConversations.length > 0 ? (
                filteredConversations.map((conv) => (
                  <Box
                    key={conv.id}
                    onClick={() => setSelectedConversation(conv)}
                    sx={{
                      p: 2.5,
                      cursor: 'pointer',
                      borderBottom: '1px solid #f1f5f9',
                      backgroundColor: selectedConversation?.id === conv.id ? '#f0fdf4' : 'transparent',
                      borderLeft: selectedConversation?.id === conv.id ? '3px solid #4caf50' : '3px solid transparent',
                      '&:hover': { backgroundColor: selectedConversation?.id === conv.id ? '#f0fdf4' : '#f8fafc' }
                    }}
                  >
                    <Stack direction="row" spacing={2} alignItems="center">
                      <Avatar
                        src={conv.participant_avatar}
                        sx={{
                          width: 44,
                          height: 44,
                          bgcolor: conv.participant_type === 'farmer' ? '#dcfce7' : '#dbeafe',
                          color: conv.participant_type === 'farmer' ? '#059669' : '#1d4ed8',
                        }}
                      >
                        {conv.participant_name.charAt(0)}
                      </Avatar>

                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Stack direction="row" alignItems="center" justifyContent="space-between">
                          <Typography variant="subtitle2" noWrap sx={{ fontWeight: 600, color: '#1e293b' }}>
                            {conv.participant_name}
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#64748b', ml: 1 }}>
                            {formatTime(conv.last_message_at)}
                          </Typography>
                        </Stack>

                        <Stack direction="row" alignItems="center" justifyContent="space-between">
                          <Typography variant="body2" noWrap sx={{ fontSize: '0.8rem', color: '#64748b', flex: 1 }}>
                            {conv.last_message || 'No messages yet'}
                          </Typography>
                          {conv.unread_count > 0 && (
                            <Badge
                              badgeContent={conv.unread_count}
                              sx={{ '& .MuiBadge-badge': { bgcolor: '#4caf50', color: 'white' } }}
                            />
                          )}
                        </Stack>
                      </Box>
                    </Stack>
                  </Box>
                ))
              ) : (
                <Box p={4} textAlign="center">
                  <Typography variant="body2" color="text.secondary">No conversations found.</Typography>
                </Box>
              )}
            </Box>
          </Box>

          {/* Chat Area */}
          <Box sx={{
            flex: 1,
            flexDirection: 'column',
            height: '100%',
            display: { xs: selectedConversation ? 'flex' : 'none', md: 'flex' }
          }}>
            {selectedConversation ? (
              <>
                {/* Chat Header */}
                <Box sx={{ p: 3, borderBottom: '1px solid #e2e8f0', backgroundColor: 'white' }}>
                  <Stack direction="row" alignItems="center" justifyContent="space-between">
                    <Stack direction="row" alignItems="center" spacing={2}>
                      {isMobile && (
                        <IconButton
                          sx={{ ml: -1 }}
                          onClick={() => setSelectedConversation(null)}
                        >
                          <ArrowBack sx={{ fontSize: 24, color: '#1e293b' }} />
                        </IconButton>
                      )}
                      <Avatar
                        src={selectedConversation.participant_avatar}
                        sx={{
                          width: 44,
                          height: 44,
                          bgcolor: selectedConversation.participant_type === 'farmer' ? '#dcfce7' : '#dbeafe',
                          color: selectedConversation.participant_type === 'farmer' ? '#059669' : '#1d4ed8'
                        }}
                      >
                        {selectedConversation.participant_name.charAt(0)}
                      </Avatar>
                      <Box>
                        <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1rem', color: '#1e293b' }}>
                          {selectedConversation.participant_name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {selectedConversation.participant_type.charAt(0).toUpperCase() + selectedConversation.participant_type.slice(1)}
                        </Typography>
                      </Box>
                    </Stack>
                  </Stack>
                </Box>

                {/* Messages Area */}
                <Box sx={{
                  flex: 1,
                  overflow: 'auto',
                  p: 2,
                  backgroundColor: '#fafbfc',
                  display: 'flex',
                  flexDirection: 'column'
                }}>
                  {msgLoading && messages.length === 0 ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress size={20} /></Box>
                  ) : (
                    messages.map((msg) => (
                      <Box
                        key={msg.id}
                        sx={{
                          display: 'flex',
                          justifyContent: msg.sender_id === user.id ? 'flex-end' : 'flex-start',
                          mb: 2
                        }}
                      >
                        <Box
                          sx={{
                            maxWidth: '70%',
                            p: 2,
                            borderRadius: 3,
                            backgroundColor: msg.sender_id === user.id ? '#4caf50' : 'white',
                            color: msg.sender_id === user.id ? 'white' : '#1e293b',
                            border: msg.sender_id === user.id ? 'none' : '1px solid #e2e8f0',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                            opacity: msg.is_temp ? 0.7 : 1, // Visual feedback for sending
                          }}
                        >
                          <Typography
                            variant="body2"
                            sx={{
                              fontSize: '0.875rem',
                              lineHeight: 1.5,
                              mb: 0.5,
                              color: msg.sender_id === user.id ? 'white' : 'inherit'
                            }}
                          >
                            {msg.content}
                          </Typography>
                          <Typography
                            variant="caption"
                            sx={{
                              fontSize: '0.7rem',
                              opacity: 0.9,
                              color: msg.sender_id === user.id ? 'white' : 'text.secondary'
                            }}
                          >
                            {formatTime(msg.created_at)}
                          </Typography>

                          {/* Read Receipts for sent messages */}
                          {msg.sender_id === user.id && (
                            <Box sx={{ display: 'inline-flex', ml: 0.5, verticalAlign: 'middle', opacity: 0.8 }}>
                              {msg.is_temp ? (
                                <Schedule sx={{ fontSize: 12 }} />
                              ) : msg.is_read ? (
                                <DoneAll sx={{ fontSize: 16, color: '#60a5fa' }} />
                              ) : (
                                <DoneAll sx={{ fontSize: 16, color: 'rgba(255,255,255,0.85)' }} />
                              )}
                            </Box>
                          )}
                        </Box>
                      </Box>
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </Box>

                {/* Message Input */}
                <Box sx={{ p: 3, borderTop: '1px solid #e2e8f0', backgroundColor: 'white' }}>
                  <Stack direction="row" spacing={isMobile ? 1 : 2} alignItems="flex-end">
                    <TextField
                      fullWidth
                      multiline
                      maxRows={4}
                      placeholder="Type your message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      size={isMobile ? "small" : "medium"}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 3,
                          backgroundColor: '#f8fafc',
                          fontSize: '0.875rem',
                        }
                      }}
                    />
                    <Button
                      variant="contained"
                      onClick={handleSendMessage}
                      disabled={!newMessage.trim()}
                      sx={{
                        minWidth: 44,
                        height: 44,
                        borderRadius: 3,
                        backgroundColor: '#4caf50',
                        '&:hover': { bgcolor: '#45a049' }
                      }}
                    >
                      <Send sx={{ fontSize: 20 }} />
                    </Button>
                  </Stack>
                </Box>
              </>
            ) : (
              <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fafbfc' }}>
                <Box sx={{ textAlign: 'center' }}>
                  <ChatBubbleOutline sx={{ fontSize: 60, color: '#cbd5e1', mb: 2 }} />
                  <Typography variant="h6" sx={{ fontWeight: 600, color: '#64748b', mb: 1 }}>
                    Select a conversation
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                    Choose a conversation or start a new chat to begin messaging
                  </Typography>
                </Box>
              </Box>
            )}
          </Box>
        </Paper>
      </Box>

      {/* New Chat Search Dialog */}
      <Dialog open={isSearchOpen} onClose={() => setIsSearchOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>New Conversation</DialogTitle>
        <DialogContent sx={{ minHeight: '300px' }}>
          <TextField
            fullWidth
            autoFocus
            placeholder="Search users by name..."
            value={searchUserTerm}
            onChange={(e) => setSearchUserTerm(e.target.value)}
            margin="dense"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
              endAdornment: searching && <CircularProgress size={20} />
            }}
          />
          <List sx={{ mt: 2 }}>
            {foundUsers.map(u => (
              <ListItem
                key={u.id}
                button
                onClick={() => handleStartNewChat(u.id)}
                sx={{ borderRadius: 2, mb: 1, '&:hover': { bgcolor: '#f0fdf4' } }}
              >
                <ListItemAvatar>
                  <Avatar
                    src={u.profile_image_url}
                    sx={{ bgcolor: u.user_type === 'farmer' ? '#4caf50' : '#2196f3' }}
                  >
                    {!u.profile_image_url && u.name.charAt(0)}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={u.name}
                  secondary={u.user_type.charAt(0).toUpperCase() + u.user_type.slice(1)}
                />
              </ListItem>
            ))}
            {searchUserTerm.length >= 2 && foundUsers.length === 0 && !searching && (
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', mt: 4 }}>
                No users found.
              </Typography>
            )}
            {searchUserTerm.length < 2 && (
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', mt: 4 }}>
                Type at least 2 characters to search.
              </Typography>
            )}
          </List>
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default Messages;