import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  TextField,
  IconButton,
  Box,
  Typography,
  Avatar,
  Grid,
  Chip,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import SearchIcon from '@mui/icons-material/Search';
import DeleteIcon from '@mui/icons-material/Delete';
import { useParams } from 'react-router-dom';
import { useAuth } from '../Auth/Auth';
import axios from '../Utils/axios';
import '../Css/Messages.css';

/**
 * Messages Page
 * - Left sidebar: list of conversations
 * - Right panel: chat thread with message input
 * - Real-time updates via WebSocket (socket.io)
 */
function Messages() {
  const { auth } = useAuth();
  const { conversationId } = useParams();

  // Mock conversations (replace with real API call)
  const [conversations, setConversations] = useState([
    {
      id: 'conv1',
      name: 'Lina Gardner',
      avatar: '/avatars/user1.jpg',
      lastMessage: 'Hey — loved your last workout stream!',
      timestamp: '2h',
      unread: 2,
      userId: 'user1',
    },
    {
      id: 'conv2',
      name: 'Marcus Li',
      avatar: '/avatars/user2.jpg',
      lastMessage: 'Can you share the reps?',
      timestamp: 'Yesterday',
      unread: 0,
      userId: 'user2',
    },
    {
      id: 'conv3',
      name: 'Studio Support',
      avatar: '/avatars/support.jpg',
      lastMessage: 'Your payout was processed.',
      timestamp: '3d',
      unread: 0,
      userId: 'support',
    },
  ]);

  const [messages, setMessages] = useState([
    {
      id: 'msg1',
      conversationId: 'conv1',
      senderId: 'user1',
      senderName: 'Lina Gardner',
      senderAvatar: '/avatars/user1.jpg',
      content: 'Hey — loved your last workout stream!',
      timestamp: new Date(Date.now() - 7200000), // 2h ago
    },
    {
      id: 'msg2',
      conversationId: 'conv1',
      senderId: auth?.uid,
      senderName: auth?.displayName || 'You',
      senderAvatar: auth?.picture,
      content: 'Thanks! Next one is Thursday.',
      timestamp: new Date(Date.now() - 3600000), // 1h ago
    },
  ]);

  const [messageInput, setMessageInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedConv, setSelectedConv] = useState(conversationId || conversations[0]?.id);

  // Load messages for selected conversation
  useEffect(() => {
    if (selectedConv) {
      // In production: fetch from backend
      // const fetchMessages = async () => {
      //   const { data } = await axios.get(`/messages/history?conversationId=${selectedConv}`);
      //   setMessages(data.messages);
      // };
      // fetchMessages();
    }
  }, [selectedConv]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageInput.trim()) return;

    const newMsg = {
      id: `msg_${Date.now()}`,
      conversationId: selectedConv,
      senderId: auth?.uid,
      senderName: auth?.displayName || 'You',
      senderAvatar: auth?.picture,
      content: messageInput,
      timestamp: new Date(),
    };

    // TODO: Send to backend
    // await axios.post('/messages/send', {
    //   toUserId: selectedConvUser.userId,
    //   content: messageInput,
    // });

    setMessages([...messages, newMsg]);
    setMessageInput('');
  };

  const currentConv = conversations.find((c) => c.id === selectedConv);
  const convMessages = messages.filter((m) => m.conversationId === selectedConv);
  const filteredConvs = conversations.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Container maxWidth="lg" className="messages-page">
      <Grid container spacing={2} style={{ height: 'calc(100vh - 100px)' }}>
        {/* LEFT: Conversation List */}
        <Grid item xs={12} sm={4} className="messages-sidebar">
          <Paper className="conversation-list">
            {/* Search Conversations */}
            <Box className="conversation-search">
              <TextField
                placeholder="Search conversations..."
                variant="outlined"
                size="small"
                fullWidth
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: <SearchIcon style={{ marginRight: 8 }} />,
                }}
              />
            </Box>

            <Divider />

            {/* Conversations */}
            <List>
              {filteredConvs.map((conv) => (
                <div key={conv.id}>
                  <ListItemButton
                    selected={selectedConv === conv.id}
                    onClick={() => setSelectedConv(conv.id)}
                    className={`conversation-item ${conv.unread ? 'unread' : ''}`}
                  >
                    <ListItemIcon>
                      <Avatar src={conv.avatar} alt={conv.name} />
                    </ListItemIcon>
                    <ListItemText
                      primary={<strong>{conv.name}</strong>}
                      secondary={
                        <span className="conversation-preview">
                          {conv.lastMessage.substring(0, 40)}...
                          <span className="conversation-time" style={{ marginLeft: '8px' }}>
                            {conv.timestamp}
                          </span>
                        </span>
                      }
                    />
                    {conv.unread > 0 && (
                      <Chip
                        label={conv.unread}
                        size="small"
                        color="info"
                        variant="filled"
                        style={{ marginLeft: '8px' }}
                      />
                    )}
                  </ListItemButton>
                  <Divider />
                </div>
              ))}
            </List>
          </Paper>
        </Grid>

        {/* RIGHT: Chat Thread */}
        <Grid item xs={12} sm={8} className="messages-chat">
          <Paper className="chat-container">
            {/* Header */}
            <Box className="chat-header">
              <Box style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Avatar src={currentConv?.avatar} alt={currentConv?.name} />
                <div>
                  <Typography variant="subtitle1" style={{ fontWeight: 600 }}>
                    {currentConv?.name}
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    Active now
                  </Typography>
                </div>
              </Box>
            </Box>

            <Divider />

            {/* Messages */}
            <Box className="messages-thread">
              {convMessages.length === 0 ? (
                <Box style={{ padding: '20px', textAlign: 'center' }}>
                  <Typography color="textSecondary">No messages yet. Start the conversation!</Typography>
                </Box>
              ) : (
                convMessages.map((msg) => (
                  <Box
                    key={msg.id}
                    className={`message ${msg.senderId === auth?.uid ? 'sent' : 'received'}`}
                    style={{
                      display: 'flex',
                      gap: '8px',
                      margin: '8px 0',
                      justifyContent: msg.senderId === auth?.uid ? 'flex-end' : 'flex-start',
                    }}
                  >
                    {msg.senderId !== auth?.uid && <Avatar src={msg.senderAvatar} alt={msg.senderName} style={{ width: 32, height: 32 }} />}
                    <Box
                      style={{
                        maxWidth: '60%',
                        backgroundColor: msg.senderId === auth?.uid ? '#0ea5e9' : '#1e293b',
                        color: 'white',
                        padding: '8px 12px',
                        borderRadius: '12px',
                        wordWrap: 'break-word',
                      }}
                    >
                      <Typography variant="body2">{msg.content}</Typography>
                      <Typography variant="caption" style={{ opacity: 0.7 }}>
                        {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </Typography>
                    </Box>
                  </Box>
                ))
              )}
            </Box>

            <Divider />

            {/* Message Input */}
            <Box component="form" onSubmit={handleSendMessage} className="message-input-box">
              <TextField
                placeholder="Type a message..."
                variant="outlined"
                size="small"
                fullWidth
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
              />
              <IconButton type="submit" color="primary" aria-label="Send message">
                <SendIcon />
              </IconButton>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
}

export default Messages;
