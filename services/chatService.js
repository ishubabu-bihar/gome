const Message = require('../models/Message');

class ChatService {
  constructor(io) {
    this.io = io;
    this.setupSocketHandlers();
  }

  setupSocketHandlers() {
    this.io.on('connection', (socket) => {
      console.log('New client connected');

      // Join a meeting room
      socket.on('join-meeting', async ({ meetingId, userId, userName }) => {
        socket.join(meetingId);
        socket.meetingId = meetingId;
        socket.userId = userId;
        socket.userName = userName;

        // Get previous messages
        const messages = await Message.find({ meetingId })
          .sort({ createdAt: 1 })
          .limit(50);

        socket.emit('previous-messages', messages);

        // Notify others
        this.io.to(meetingId).emit('user-joined', {
          userId,
          userName,
          timestamp: new Date()
        });
      });

      // Handle new messages
      socket.on('send-message', async ({ message, meetingId }) => {
        const newMessage = new Message({
          meetingId,
          userId: socket.userId,
          userName: socket.userName,
          content: message,
          timestamp: new Date()
        });

        await newMessage.save();

        this.io.to(meetingId).emit('new-message', {
          _id: newMessage._id,
          userId: socket.userId,
          userName: socket.userName,
          content: message,
          timestamp: newMessage.timestamp
        });
      });

      // Handle user typing
      socket.on('typing', () => {
        socket.to(socket.meetingId).emit('user-typing', {
          userId: socket.userId,
          userName: socket.userName
        });
      });

      // Handle user stopped typing
      socket.on('stop-typing', () => {
        socket.to(socket.meetingId).emit('user-stopped-typing', {
          userId: socket.userId
        });
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        if (socket.meetingId) {
          this.io.to(socket.meetingId).emit('user-left', {
            userId: socket.userId,
            userName: socket.userName,
            timestamp: new Date()
          });
        }
        console.log('Client disconnected');
      });
    });
  }
}

module.exports = ChatService; 