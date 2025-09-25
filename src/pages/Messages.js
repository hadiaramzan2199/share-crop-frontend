import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  Avatar,
  TextField,
  IconButton,
  Badge,
  Paper,
  InputAdornment,
  Chip,
  Stack,
  Divider,
  Button,
  Tooltip,
} from '@mui/material';
import {
  Send,
  Search,
  MoreVert,
  AttachFile,
  EmojiEmotions,
  Phone,
  VideoCall,
  Info,
  Circle,
  CheckCircle,
  Schedule,
  Agriculture,
} from '@mui/icons-material';
import { authService } from '../services/auth';

const Messages = () => {
  // Mock user data since we're using authService
  const user = { name: 'John Doe', email: 'john@example.com', user_type: 'buyer' };
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const messagesEndRef = useRef(null);

  // Mock data for conversations
  useEffect(() => {
    const mockConversations = [
      {
        id: 1,
        name: 'Ahmad Ali',
        avatar: null,
        lastMessage: 'The wheat crop is looking great! Expected harvest in 2 weeks.',
        timestamp: '2024-01-10T14:30:00Z',
        unreadCount: 2,
        online: true,
        type: 'farmer',
        fieldName: 'Green Valley Farm - Plot A',
        status: 'active'
      },
      {
        id: 2,
        name: 'Fatima Khan',
        avatar: null,
        lastMessage: 'Thank you for choosing our field. Updates will be shared regularly.',
        timestamp: '2024-01-09T16:45:00Z',
        unreadCount: 0,
        online: false,
        type: 'farmer',
        fieldName: 'Sunrise Fields - Section B',
        status: 'pending'
      },
      {
        id: 3,
        name: 'Hassan Sheikh',
        avatar: null,
        lastMessage: 'Harvest completed successfully! Final report attached.',
        timestamp: '2024-01-08T10:20:00Z',
        unreadCount: 1,
        online: false,
        type: 'farmer',
        fieldName: 'Golden Harvest - Plot C',
        status: 'completed'
      },
      {
        id: 4,
        name: 'Support Team',
        avatar: null,
        lastMessage: 'How can we help you today?',
        timestamp: '2024-01-07T09:15:00Z',
        unreadCount: 0,
        online: true,
        type: 'support',
        fieldName: null,
        status: 'active'
      }
    ];
    setConversations(mockConversations);
    setSelectedConversation(mockConversations[0]);
  }, []);

  // Mock messages for selected conversation
  useEffect(() => {
    if (selectedConversation) {
      const mockMessages = [
        {
          id: 1,
          senderId: selectedConversation.id,
          senderName: selectedConversation.name,
          content: 'Hello! Welcome to our field rental program.',
          timestamp: '2024-01-10T10:00:00Z',
          type: 'text'
        },
        {
          id: 2,
          senderId: 'current_user',
          senderName: 'You',
          content: 'Thank you! I\'m excited to get started.',
          timestamp: '2024-01-10T10:05:00Z',
          type: 'text'
        },
        {
          id: 3,
          senderId: selectedConversation.id,
          senderName: selectedConversation.name,
          content: 'The wheat crop is looking great! Expected harvest in 2 weeks.',
          timestamp: '2024-01-10T14:30:00Z',
          type: 'text'
        },
        {
          id: 4,
          senderId: selectedConversation.id,
          senderName: selectedConversation.name,
          content: 'Here are some photos from today\'s inspection.',
          timestamp: '2024-01-10T14:32:00Z',
          type: 'text'
        }
      ];
      setMessages(mockMessages);
    }
  }, [selectedConversation]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = () => {
    if (newMessage.trim() && selectedConversation) {
      const message = {
        id: messages.length + 1,
        senderId: 'current_user',
        senderName: 'You',
        content: newMessage,
        timestamp: new Date().toISOString(),
        type: 'text'
      };
      setMessages([...messages, message]);
      setNewMessage('');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const filteredConversations = conversations.filter(conv =>
    conv.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conv.lastMessage.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString();
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return '#059669';
      case 'completed': return '#1d4ed8';
      case 'pending': return '#d97706';
      default: return '#6b7280';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active': return <CheckCircle sx={{ fontSize: 14 }} />;
      case 'completed': return <Agriculture sx={{ fontSize: 14 }} />;
      case 'pending': return <Schedule sx={{ fontSize: 14 }} />;
      default: return <Circle sx={{ fontSize: 14 }} />;
    }
  };

  return (
    <Box sx={{ 
      height: '100vh',
      backgroundColor: '#f8fafc',
      p: 3,
      
    
    }}>
      {/* Header Section */}
      <Box sx={{ 
        maxWidth: '1400px', 
        mx: 'auto',
        mb: 3,
      }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2.5 }}>
          <Box>
            <Typography 
              variant="h5" 
              sx={{ 
                fontWeight: 700,
                color: '#1e293b',
                mb: 0.5,
                fontSize: '1.75rem',
                marginTop: '100px',
              }}
            >
              Messages
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.9rem' }}>
              Communicate with farmers and manage your field conversations
            </Typography>
          </Box>
        </Stack>
      </Box>

      {/* Main Chat Interface */}
      <Box sx={{ 
        maxWidth: '1400px', 
        mx: 'auto',
        height: 'calc(100vh - 160px)'
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
            display: 'flex',
            flexDirection: 'column',
            height: '100%'
          }}>
            {/* Sidebar Header */}
            <Box sx={{ 
              p: 3,
              borderBottom: '1px solid #e2e8f0',
              backgroundColor: '#fafbfc'
            }}>
              <Typography 
                variant="h6" 
                sx={{ 
                  fontWeight: 600,
                  fontSize: '1.1rem',
                  color: '#1e293b',
                  mb: 2
                }}
              >
                Conversations
              </Typography>
              
              {/* Search Bar */}
              <TextField
                fullWidth
                placeholder="Search conversations..."
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
                    border: '1px solid #e2e8f0',
                    fontSize: '0.875rem',
                    '&:hover': {
                      borderColor: '#cbd5e1'
                    },
                    '&.Mui-focused': {
                      borderColor: '#4caf50',
                      backgroundColor: 'white'
                    }
                  },
                  '& .MuiOutlinedInput-input': {
                    padding: '10px 12px',
                    fontSize: '0.875rem'
                  }
                }}
              />
            </Box>
            
            {/* Conversations List */}
            <Box sx={{ 
              flex: 1,
              overflow: 'auto',
              '&::-webkit-scrollbar': {
                width: '6px'
              },
              '&::-webkit-scrollbar-track': {
                backgroundColor: '#f1f5f9'
              },
              '&::-webkit-scrollbar-thumb': {
                backgroundColor: '#cbd5e1',
                borderRadius: '3px'
              }
            }}>
              {filteredConversations.map((conversation) => (
                <Box
                  key={conversation.id}
                  onClick={() => setSelectedConversation(conversation)}
                  sx={{
                    p: 2.5,
                    cursor: 'pointer',
                    borderBottom: '1px solid #f1f5f9',
                    backgroundColor: selectedConversation?.id === conversation.id ? '#f0fdf4' : 'transparent',
                    borderLeft: selectedConversation?.id === conversation.id ? '3px solid #4caf50' : '3px solid transparent',
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                      backgroundColor: selectedConversation?.id === conversation.id ? '#f0fdf4' : '#f8fafc'
                    }
                  }}
                >
                  <Stack direction="row" spacing={2} alignItems="flex-start">
                    <Badge
                      overlap="circular"
                      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                      badgeContent={
                        conversation.online ? (
                          <Box
                            sx={{
                              width: 12,
                              height: 12,
                              borderRadius: '50%',
                              backgroundColor: '#10b981',
                              border: '2px solid white'
                            }}
                          />
                        ) : null
                      }
                    >
                      <Avatar
                        sx={{
                          width: 44,
                          height: 44,
                          backgroundColor: conversation.type === 'support' ? '#dbeafe' : '#dcfce7',
                          color: conversation.type === 'support' ? '#1d4ed8' : '#059669',
                          fontSize: '1.1rem',
                          fontWeight: 600
                        }}
                      >
                        {conversation.name.charAt(0)}
                      </Avatar>
                    </Badge>
                    
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 0.5 }}>
                        <Typography
                          variant="subtitle2"
                          sx={{
                            fontWeight: 600,
                            fontSize: '0.9rem',
                            color: '#1e293b',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {conversation.name}
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{
                            fontSize: '0.75rem',
                            color: '#64748b',
                            flexShrink: 0,
                            ml: 1
                          }}
                        >
                          {formatTime(conversation.timestamp)}
                        </Typography>
                      </Stack>
                      
                      {conversation.fieldName && (
                        <Chip
                          icon={getStatusIcon(conversation.status)}
                          label={conversation.fieldName}
                          size="small"
                          sx={{
                            height: 20,
                            fontSize: '0.7rem',
                            backgroundColor: `${getStatusColor(conversation.status)}15`,
                            color: getStatusColor(conversation.status),
                            mb: 0.5,
                            '& .MuiChip-icon': {
                              color: getStatusColor(conversation.status)
                            }
                          }}
                        />
                      )}
                      
                      <Stack direction="row" alignItems="center" justifyContent="space-between">
                        <Typography
                          variant="body2"
                          sx={{
                            fontSize: '0.8rem',
                            color: '#64748b',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            flex: 1
                          }}
                        >
                          {conversation.lastMessage}
                        </Typography>
                        {conversation.unreadCount > 0 && (
                          <Badge
                            badgeContent={conversation.unreadCount}
                            sx={{
                              '& .MuiBadge-badge': {
                                backgroundColor: '#4caf50',
                                color: 'white',
                                fontSize: '0.7rem',
                                minWidth: 18,
                                height: 18
                              }
                            }}
                          />
                        )}
                      </Stack>
                    </Box>
                  </Stack>
                </Box>
              ))}
            </Box>
          </Box>

          {/* Chat Area */}
          <Box sx={{ 
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            height: '100%'
          }}>
            {selectedConversation ? (
              <>
                {/* Chat Header */}
                <Box sx={{
                  p: 3,
                  borderBottom: '1px solid #e2e8f0',
                  backgroundColor: 'white'
                }}>
                  <Stack direction="row" alignItems="center" justifyContent="space-between">
                    <Stack direction="row" alignItems="center" spacing={2}>
                      <Badge
                        overlap="circular"
                        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                        badgeContent={
                          selectedConversation.online ? (
                            <Box
                              sx={{
                                width: 12,
                                height: 12,
                                borderRadius: '50%',
                                backgroundColor: '#10b981',
                                border: '2px solid white'
                              }}
                            />
                          ) : null
                        }
                      >
                        <Avatar
                          sx={{
                            width: 44,
                            height: 44,
                            backgroundColor: selectedConversation.type === 'support' ? '#dbeafe' : '#dcfce7',
                            color: selectedConversation.type === 'support' ? '#1d4ed8' : '#059669',
                            fontSize: '1.1rem',
                            fontWeight: 600
                          }}
                        >
                          {selectedConversation.name.charAt(0)}
                        </Avatar>
                      </Badge>
                      <Box>
                        <Typography
                          variant="h6"
                          sx={{
                            fontWeight: 600,
                            fontSize: '1rem',
                            color: '#1e293b'
                          }}
                        >
                          {selectedConversation.name}
                        </Typography>
                        {selectedConversation.fieldName && (
                          <Chip
                            icon={getStatusIcon(selectedConversation.status)}
                            label={selectedConversation.fieldName}
                            size="small"
                            sx={{
                              height: 20,
                              fontSize: '0.7rem',
                              backgroundColor: `${getStatusColor(selectedConversation.status)}15`,
                              color: getStatusColor(selectedConversation.status),
                              '& .MuiChip-icon': {
                                color: getStatusColor(selectedConversation.status)
                              }
                            }}
                          />
                        )}
                      </Box>
                    </Stack>
                    <Stack direction="row" spacing={1}>
                      <Tooltip title="Voice Call">
                        <IconButton size="small" sx={{ color: '#64748b' }}>
                          <Phone sx={{ fontSize: 20 }} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Video Call">
                        <IconButton size="small" sx={{ color: '#64748b' }}>
                          <VideoCall sx={{ fontSize: 20 }} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="More Options">
                        <IconButton size="small" sx={{ color: '#64748b' }}>
                          <MoreVert sx={{ fontSize: 20 }} />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </Stack>
                </Box>

                {/* Messages Area */}
                <Box sx={{
                  flex: 1,
                  overflow: 'auto',
                  p: 2,
                  backgroundColor: '#fafbfc',
                  '&::-webkit-scrollbar': {
                    width: '6px'
                  },
                  '&::-webkit-scrollbar-track': {
                    backgroundColor: '#f1f5f9'
                  },
                  '&::-webkit-scrollbar-thumb': {
                    backgroundColor: '#cbd5e1',
                    borderRadius: '3px'
                  }
                }}>
                  {messages.map((message) => (
                    <Box
                      key={message.id}
                      sx={{
                        display: 'flex',
                        justifyContent: message.senderId === 'current_user' ? 'flex-end' : 'flex-start',
                        mb: 2
                      }}
                    >
                      <Box
                        sx={{
                          maxWidth: '70%',
                          p: 2,
                          borderRadius: 3,
                          backgroundColor: message.senderId === 'current_user' ? '#4caf50' : 'white',
                          color: message.senderId === 'current_user' ? 'white' : '#1e293b',
                          border: message.senderId === 'current_user' ? 'none' : '1px solid #e2e8f0',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                        }}
                      >
                        <Typography
                          variant="body2"
                          sx={{
                            fontSize: '0.875rem',
                            lineHeight: 1.5,
                            mb: 0.5
                          }}
                        >
                          {message.content}
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{
                            fontSize: '0.7rem',
                            opacity: 0.8
                          }}
                        >
                          {formatTime(message.timestamp)}
                        </Typography>
                      </Box>
                    </Box>
                  ))}
                  <div ref={messagesEndRef} />
                </Box>

                {/* Message Input */}
                <Box sx={{
                  p: 3,
                  borderTop: '1px solid #e2e8f0',
                  backgroundColor: 'white'
                }}>
                  <Stack direction="row" spacing={2} alignItems="flex-end">
                    <TextField
                      fullWidth
                      multiline
                      maxRows={4}
                      placeholder="Type your message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 3,
                          backgroundColor: '#f8fafc',
                          border: '1px solid #e2e8f0',
                          fontSize: '0.875rem',
                          '&:hover': {
                            borderColor: '#cbd5e1'
                          },
                          '&.Mui-focused': {
                            borderColor: '#4caf50',
                            backgroundColor: 'white'
                          }
                        },
                        '& .MuiOutlinedInput-input': {
                          padding: '12px 16px',
                          fontSize: '0.875rem'
                        }
                      }}
                    />
                    <Stack direction="row" spacing={1}>
                      <Tooltip title="Attach File">
                        <IconButton size="small" sx={{ color: '#64748b' }}>
                          <AttachFile sx={{ fontSize: 20 }} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Add Emoji">
                        <IconButton size="small" sx={{ color: '#64748b' }}>
                          <EmojiEmotions sx={{ fontSize: 20 }} />
                        </IconButton>
                      </Tooltip>
                      <Button
                        variant="contained"
                        onClick={handleSendMessage}
                        disabled={!newMessage.trim()}
                        sx={{
                          minWidth: 44,
                          height: 44,
                          borderRadius: 3,
                          backgroundColor: '#4caf50',
                          '&:hover': {
                            backgroundColor: '#45a049'
                          },
                          '&:disabled': {
                            backgroundColor: '#e2e8f0'
                          }
                        }}
                      >
                        <Send sx={{ fontSize: 20 }} />
                      </Button>
                    </Stack>
                  </Stack>
                </Box>
              </>
            ) : (
              <Box sx={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#fafbfc'
              }}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 600,
                      color: '#64748b',
                      mb: 1
                    }}
                  >
                    Select a conversation
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      color: '#94a3b8'
                    }}
                  >
                    Choose a conversation from the sidebar to start messaging
                  </Typography>
                </Box>
              </Box>
            )}
          </Box>
        </Paper>
      </Box>
    </Box>
  );
};

export default Messages;