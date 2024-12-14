const socket = io();

// UI Elements
const joinContainer = document.getElementById('join-container');
const chatContainer = document.getElementById('chat-container');
const usernameInput = document.getElementById('username-input');
const joinBtn = document.getElementById('join-btn');
const messageInput = document.getElementById('message-input');
const sendBtn = document.getElementById('send-btn');
const messagesList = document.getElementById('messages-list');
const usersList = document.getElementById('users-list');
const typingIndicator = document.getElementById('typing-indicator');
const themeToggle = document.getElementById('theme-toggle');
const fileInput = document.getElementById('file-input');
const emojiBtn = document.getElementById('emoji-btn');
const emojiContainer = document.getElementById('emoji-container');

let currentUsername = '';

// Emoji List
const emojis = [
  '😀', '😍', '👍', '❤️', '🎉', '😂', '🤔', '👏', '🙌', '😱',
  '🌟', '🚀', '🍕', '🎸', '🌈', '🐶', '🤖', '🌺', '🍦', '�'
];

// Populate Emoji Container
emojis.forEach(emoji => {
  const emojiElement = document.createElement('span');
  emojiElement.textContent = emoji;
  emojiElement.classList.add('emoji-item');
  emojiElement.addEventListener('click', () => {
    messageInput.value += emoji;
    messageInput.focus();
    emojiContainer.style.display = 'none';
  });
  emojiContainer.appendChild(emojiElement);
});

// Join Chat
joinBtn.addEventListener('click', () => {
  const username = usernameInput.value.trim();
  
  if (username) {
    socket.emit('join', username);
  }
});

// Send Message
function sendMessage() {
  const messageText = messageInput.value.trim();
  
  if (messageText) {
    socket.emit('send-message', { 
      text: messageText,
      type: 'text'
    });
    messageInput.value = '';
  }
}

sendBtn.addEventListener('click', sendMessage);
messageInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    sendMessage();
  }
});

// File Upload
fileInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (event) => {
      socket.emit('upload-file', {
        file: event.target.result,
        fileName: file.name,
        fileType: file.type
      });
    };
    reader.readAsDataURL(file);
  }
});

// Emoji Toggle
emojiBtn.addEventListener('click', () => {
  emojiContainer.style.display = 
    emojiContainer.style.display === 'none' ? 'flex' : 'none';
});

// Typing Indicator
messageInput.addEventListener('input', () => {
  socket.emit('typing');
});

// Socket Event Listeners
socket.on('username-error', (error) => {
  alert(error);
});

socket.on('user-joined', (data) => {
  addSystemMessage(data.message);
  updateUsersList(data.users);
});

socket.on('user-left', (data) => {
  addSystemMessage(data.message);
  updateUsersList(data.users);
});

socket.on('load-messages', (messages) => {
  messages.forEach(renderMessage);
});

socket.on('new-message', renderMessage);

socket.on('user-typing', (username) => {
  typingIndicator.textContent = `${username} is typing...`;
  typingIndicator.style.display = 'block';
  
  setTimeout(() => {
    typingIndicator.style.display = 'none';
  }, 1500);
});

// Render Functions
function renderMessage(message) {
  const messageElement = document.createElement('li');
  messageElement.classList.add('message');
  
  const isCurrentUser = message.username === currentUsername;
  messageElement.classList.add(isCurrentUser ? 'sent' : 'received');
  
  let content = '';
  switch(message.type) {
    case 'text':
      content = `
        <span class="message-username">${message.username}</span>
        <p class="message-text">${message.text}</p>
      `;
      break;
    case 'file':
      const isImage = message.fileType.startsWith('image/');
      content = `
        <span class="message-username">${message.username}</span>
        ${isImage 
          ? `<img src="${message.file}" alt="${message.fileName}" class="message-image">` 
          : `<div class="message-file">
               📄 ${message.fileName}
               <a href="${message.file}" download="${message.fileName}">Download</a>
             </div>`
        }
      `;
      break;
  }

  messageElement.innerHTML = `
    ${content}
    <small class="message-time">${formatTime(message.timestamp)}</small>
  `;
  
  messagesList.appendChild(messageElement);
  messagesList.scrollTop = messagesList.scrollHeight;
}

function addSystemMessage(message) {
  const systemMessage = document.createElement('li');
  systemMessage.classList.add('system-message');
  systemMessage.textContent = message;
  messagesList.appendChild(systemMessage);
}

function updateUsersList(users) {
  usersList.innerHTML = '';
  users.forEach(username => {
    const userElement = document.createElement('li');
    userElement.textContent = username;
    usersList.appendChild(userElement);
  });
}

function formatTime(timestamp) {
  return new Date(timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
}

// Theme Toggle
themeToggle.addEventListener('click', () => {
  document.body.classList.toggle('dark-mode');
});

// On successful join
socket.on('user-joined', (data) => {
  if (data.username === usernameInput.value.trim()) {
    currentUsername = data.username;
    joinContainer.style.display = 'none';
    chatContainer.style.display = 'flex';
  }
});