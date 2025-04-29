import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Divider,
  CircularProgress,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import { io } from 'socket.io-client';

function Chat({ meetingId, userId, userName }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [typingUsers, setTypingUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);
  const socketRef = useRef();

  useEffect(() => {
    // Connect to socket server
    socketRef.current = io('http://localhost:5000');

    // Join meeting room
    socketRef.current.emit('join-meeting', { meetingId, userId, userName });

    // Listen for previous messages
    socketRef.current.on('previous-messages', (previousMessages) => {
      setMessages(previousMessages);
      setLoading(false);
    });

    // Listen for new messages
    socketRef.current.on('new-message', (message) => {
      setMessages((prevMessages) => [...prevMessages, message]);
    });

    // Listen for user typing
    socketRef.current.on('user-typing', ({ userId, userName }) => {
      setTypingUsers((prev) => {
        if (!prev.some(user => user.userId === userId)) {
          return [...prev, { userId, userName }];
        }
        return prev;
      });
    });

    // Listen for user stopped typing
    socketRef.current.on('user-stopped-typing', ({ userId }) => {
      setTypingUsers((prev) => prev.filter(user => user.userId !== userId));
    });

    // Listen for user joined
    socketRef.current.on('user-joined', ({ userName }) => {
      setMessages((prev) => [
        ...prev,
        {
          system: true,
          content: `${userName} joined the chat`
        }
      ]);
    });

    // Listen for user left
    socketRef.current.on('user-left', ({ userName }) => {
      setMessages((prev) => [
        ...prev,
        {
          system: true,
          content: `${userName} left the chat`
        }
      ]);
    });

    return () => {
      socketRef.current.disconnect();
    };
  }, [meetingId, userId, userName]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (newMessage.trim()) {
      socketRef.current.emit('send-message', {
        message: newMessage,
        meetingId
      });
      setNewMessage('');
    }
  };

  const handleTyping = () => {
    socketRef.current.emit('typing');
  };

  const handleStopTyping = () => {
    socketRef.current.emit('stop-typing');
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" p={2}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Paper elevation={3} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box p={2} sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Typography variant="h6">Chat</Typography>
        {typingUsers.length > 0 && (
          <Typography variant="caption" color="textSecondary">
            {typingUsers.map(user => user.userName).join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
          </Typography>
        )}
      </Box>

      <List sx={{ flexGrow: 1, overflow: 'auto', p: 2 }}>
        {messages.map((message, index) => (
          <React.Fragment key={index}>
            <ListItem alignItems="flex-start">
              {!message.system && (
                <ListItemAvatar>
                  <Avatar>{message.userName.charAt(0)}</Avatar>
                </ListItemAvatar>
              )}
              <ListItemText
                primary={!message.system && message.userName}
                secondary={
                  <Typography
                    component="span"
                    variant="body2"
                    color={message.system ? "textSecondary" : "textPrimary"}
                  >
                    {message.content}
                  </Typography>
                }
                secondaryTypographyProps={{
                  component: 'div'
                }}
              />
            </ListItem>
            <Divider variant="inset" component="li" />
          </React.Fragment>
        ))}
        <div ref={messagesEndRef} />
      </List>

      <Box component="form" onSubmit={handleSendMessage} p={2}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Type a message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onFocus={handleTyping}
          onBlur={handleStopTyping}
          InputProps={{
            endAdornment: (
              <IconButton type="submit" color="primary">
                <SendIcon />
              </IconButton>
            ),
          }}
        />
      </Box>
    </Paper>
  );
}

export default Chat; 