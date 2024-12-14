const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const multer = require('multer');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Configure file upload
const upload = multer({
  dest: 'uploads/',
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB file size limit
});

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Store connected users
const users = new Set();
const messages = [];

io.on('connection', (socket) => {
  console.log('A user connected');

  // Handle user joining
  socket.on('join', (username) => {
    // Ensure unique username
    if (users.has(username)) {
      socket.emit('username-error', 'Username is already taken');
      return;
    }

    // Add user
    users.add(username);
    socket.username = username;

    // Broadcast join notification
    io.emit('user-joined', { 
      username, 
      users: Array.from(users),
      message: `${username} has joined the chat` 
    });

    // Send existing messages to new user
    socket.emit('load-messages', messages);
  });

  // Handle new messages
  socket.on('send-message', (messageData) => {
    const message = {
      username: socket.username,
      text: messageData.text,
      type: messageData.type || 'text',
      timestamp: new Date().toISOString()
    };

    // Store message
    messages.push(message);

    // Broadcast message to all users
    io.emit('new-message', message);
  });

  // Handle file uploads
  socket.on('upload-file', (fileData) => {
    const message = {
      username: socket.username,
      file: fileData.file,
      fileName: fileData.fileName,
      fileType: fileData.fileType,
      type: 'file',
      timestamp: new Date().toISOString()
    };

    // Store message
    messages.push(message);

    // Broadcast file message to all users
    io.emit('new-message', message);
  });

  // Handle user typing
  socket.on('typing', () => {
    socket.broadcast.emit('user-typing', socket.username);
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    if (socket.username) {
      users.delete(socket.username);
      io.emit('user-left', { 
        username: socket.username, 
        users: Array.from(users),
        message: `${socket.username} has left the chat` 
      });
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});