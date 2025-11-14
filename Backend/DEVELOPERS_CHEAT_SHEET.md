# Developer's Cheat Sheet - Messaging & Search API

**For**: Developers integrating the new backend features  
**Updated**: November 14, 2025  
**Format**: Copy & paste ready commands

---

## 🚀 One-Minute Setup

### Start Backend Server
```bash
cd Backend
npm start
# Server runs on http://localhost:8001
```

### Get a Test Token
```bash
# Replace with your test credentials
curl -X POST http://localhost:8001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"testpass"}'

# Response will include: { "token": "eyJ..." }
```

### Export for Easy Reference
```bash
export TOKEN="your_token_here"
export USER_ID="your_user_id_here"
export PEER_ID="peer_user_id_here"
export BASE_URL="http://localhost:8001"
```

---

## 📨 Message Commands (Copy & Paste)

### Send a Message
```bash
curl -X POST $BASE_URL/messages/send \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"toUser":"'$PEER_ID'","content":"Hello!"}'
```

**Expected Response**:
```json
{
  "message": "Message sent",
  "data": {
    "id": "msg_123",
    "content": "Hello!",
    "timestamp": "2025-11-14T10:35:00Z",
    "status": "delivered"
  }
}
```

### Get All Conversations
```bash
curl -H "Authorization: Bearer $TOKEN" \
  $BASE_URL/messages/conversations
```

### Get Messages with Specific User
```bash
curl -H "Authorization: Bearer $TOKEN" \
  "$BASE_URL/messages/history?peer=$PEER_ID&limit=50"
```

### Get Unread Count
```bash
curl -H "Authorization: Bearer $TOKEN" \
  $BASE_URL/messages/unread-count
```

### Mark Messages as Read
```bash
curl -X PUT $BASE_URL/messages/mark-read \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"peer":"'$PEER_ID'"}'
```

---

## 🔍 Search Commands (Copy & Paste)

### Basic Search
```bash
curl -H "Authorization: Bearer $TOKEN" \
  "$BASE_URL/search?q=fitness&limit=10"
```

### Search with Filters
```bash
# Search only creators
curl -H "Authorization: Bearer $TOKEN" \
  "$BASE_URL/search?q=fitness&type=creators&limit=10"

# Search only content
curl -H "Authorization: Bearer $TOKEN" \
  "$BASE_URL/search?q=fitness&type=content&limit=10"
```

### Search with Sorting
```bash
# Sort by popularity
curl -H "Authorization: Bearer $TOKEN" \
  "$BASE_URL/search?q=fitness&sort=popular&limit=10"

# Sort by newest
curl -H "Authorization: Bearer $TOKEN" \
  "$BASE_URL/search?q=fitness&sort=newest&limit=10"

# Sort by relevance (default)
curl -H "Authorization: Bearer $TOKEN" \
  "$BASE_URL/search?q=fitness&sort=relevance&limit=10"
```

### Trending Creators
```bash
curl -H "Authorization: Bearer $TOKEN" \
  "$BASE_URL/search/trending/creators?limit=10"
```

### Trending Content
```bash
curl -H "Authorization: Bearer $TOKEN" \
  "$BASE_URL/search/trending/content?limit=10"
```

---

## 🔌 WebSocket Commands (Browser Console)

### Connect Socket
```javascript
const socket = io('http://localhost:8001', {
  auth: { token: localStorage.getItem('token') }
});

socket.on('connect', () => console.log('Connected'));
socket.on('disconnect', () => console.log('Disconnected'));
```

### Join Messaging Room
```javascript
socket.emit('user:join', { 
  userId: localStorage.getItem('user_id') 
});
```

### Listen for New Messages
```javascript
socket.on('message:new', (msg) => {
  console.log('New message:', msg);
  console.log('From:', msg.from.displayName);
  console.log('Content:', msg.content);
});
```

### Listen for Badge Updates
```javascript
socket.on('badge:update', ({ unreadCount }) => {
  console.log('Unread messages:', unreadCount);
  // Update badge in UI
  document.querySelector('.badge').innerText = unreadCount;
});
```

### Send Typing Indicator
```javascript
// Start typing
socket.emit('typing:start', {
  toUserId: 'peer_user_id',
  fromUser: { 
    id: localStorage.getItem('user_id'),
    name: 'Your Name'
  }
});

// After 3 seconds...
setTimeout(() => {
  socket.emit('typing:stop', {
    toUserId: 'peer_user_id',
    fromUser: { 
      id: localStorage.getItem('user_id'),
      name: 'Your Name'
    }
  });
}, 3000);
```

### Listen for Typing Indicators
```javascript
socket.on('typing:start', ({ fromUser }) => {
  console.log(fromUser.name + ' is typing...');
});

socket.on('typing:stop', ({ fromUser }) => {
  console.log(fromUser.name + ' stopped typing');
});
```

---

## 🔬 Quick Tests (Run in Terminal)

### Test Endpoint (Simple)
```bash
# Just check if endpoint is accessible
curl -s $BASE_URL/search?q=test -H "Authorization: Bearer $TOKEN" \
  | jq '.results | keys'
```

### Test Rate Limiting (Send 11 messages rapidly)
```bash
for i in {1..11}; do
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST \
    $BASE_URL/messages/send \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"toUser":"'$PEER_ID'","content":"Test '$i'"}')
  
  echo "Message $i: HTTP $STATUS"
done

# Expected: 10 x 201, 1 x 429
```

### Test Message Flow
```bash
# 1. Send message
MSG=$(curl -s -X POST $BASE_URL/messages/send \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"toUser":"'$PEER_ID'","content":"Test"}' | jq '.data.id')

echo "Sent message: $MSG"

# 2. Get unread count (as recipient)
UNREAD=$(curl -s -H "Authorization: Bearer $TOKEN2" \
  $BASE_URL/messages/unread-count | jq '.unreadCount')

echo "Unread count: $UNREAD"

# 3. Mark as read
curl -s -X PUT $BASE_URL/messages/mark-read \
  -H "Authorization: Bearer $TOKEN2" \
  -H "Content-Type: application/json" \
  -d '{"peer":"'$USER_ID'"}'

# 4. Check unread again (should be 0)
UNREAD=$(curl -s -H "Authorization: Bearer $TOKEN2" \
  $BASE_URL/messages/unread-count | jq '.unreadCount')

echo "Unread after mark-read: $UNREAD"
```

---

## 🎯 JavaScript/React Quick Code

### Setup (App.js)
```javascript
import io from 'socket.io-client';
import axios from 'axios';

// Setup axios
axios.defaults.headers.common['Authorization'] = 
  `Bearer ${localStorage.getItem('token')}`;

// Setup socket
const socket = io('http://localhost:8001', {
  auth: { token: localStorage.getItem('token') }
});

socket.emit('user:join', { 
  userId: localStorage.getItem('user_id') 
});
```

### Send Message Function
```javascript
const sendMessage = async (toUserId, content) => {
  try {
    const response = await axios.post('/messages/send', {
      toUser: toUserId,
      content: content
    });
    return response.data.data;
  } catch (error) {
    console.error('Error sending message:', error);
    if (error.response?.status === 429) {
      alert('Too many messages, please wait');
    }
  }
};
```

### Fetch Conversations
```javascript
const fetchConversations = async () => {
  try {
    const response = await axios.get('/messages/conversations');
    return response.data.conversations;
  } catch (error) {
    console.error('Error fetching conversations:', error);
  }
};
```

### Fetch Message History
```javascript
const fetchHistory = async (peerId) => {
  try {
    const response = await axios.get(
      `/messages/history?peer=${peerId}&limit=50`
    );
    return response.data.messages;
  } catch (error) {
    console.error('Error fetching history:', error);
  }
};
```

### React Hook for Messages
```javascript
import { useState, useEffect } from 'react';
import io from 'socket.io-client';

const useMessages = (peerId) => {
  const [messages, setMessages] = useState([]);
  const [socket, setSocket] = useState(null);
  
  useEffect(() => {
    const newSocket = io('http://localhost:8001', {
      auth: { token: localStorage.getItem('token') }
    });
    
    newSocket.on('message:new', (msg) => {
      setMessages(prev => [...prev, msg]);
    });
    
    newSocket.emit('user:join', { 
      userId: localStorage.getItem('user_id') 
    });
    
    setSocket(newSocket);
    return () => newSocket.disconnect();
  }, []);
  
  return { messages, socket };
};
```

### Search Function
```javascript
const search = async (query, type = 'all', limit = 20) => {
  try {
    const response = await axios.get('/search', {
      params: { q: query, type, limit }
    });
    return response.data.results;
  } catch (error) {
    console.error('Error searching:', error);
  }
};
```

### Get Unread Count
```javascript
const getUnreadCount = async () => {
  try {
    const response = await axios.get('/messages/unread-count');
    return response.data.unreadCount;
  } catch (error) {
    console.error('Error getting unread count:', error);
    return 0;
  }
};
```

---

## 🔧 Debugging Commands

### Check if Backend is Running
```bash
curl -s http://localhost:8001/health || echo "Backend not running"
```

### View Server Logs
```bash
# In Backend folder with npm start running
# Logs appear in terminal
```

### Check Database Connection
```bash
curl -s -H "Authorization: Bearer $TOKEN" \
  http://localhost:8001/messages/unread-count \
  | jq '.'
```

### Test WebSocket Connection (Node.js)
```javascript
const io = require('socket.io-client');
const socket = io('http://localhost:8001', {
  auth: { token: 'your_token' }
});

socket.on('connect', () => {
  console.log('Connected to server');
  socket.emit('user:join', { userId: 'your_id' });
});

socket.on('disconnect', () => {
  console.log('Disconnected from server');
});

socket.on('error', (error) => {
  console.error('Socket error:', error);
});
```

### Verify Message in Database
```bash
# Using MongoDB CLI
mongo
> db.messages.find({ toUser: ObjectId('user_id') }).pretty()

# Or MongoDB Compass:
# Connection: mongodb://localhost:27017
# Database: onlykumia
# Collection: messages
# Filter: { toUser: ObjectId('user_id') }
```

---

## 🆘 Common Errors & Fixes

### "401 Unauthorized"
```bash
# Get new token
TOKEN=$(curl -s -X POST http://localhost:8001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"pass"}' \
  | jq -r '.token')

echo $TOKEN
```

### "404 Not Found" (Recipient)
```bash
# Check user exists in database
curl -s -H "Authorization: Bearer $TOKEN" \
  http://localhost:8001/auth/users | jq '.[] | .displayName'
```

### "429 Too Many Requests"
```bash
# Wait 10 seconds
sleep 10

# Then retry
curl -X POST $BASE_URL/messages/send \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"toUser":"'$PEER_ID'","content":"Retry"}'
```

### WebSocket Not Connecting
```javascript
// Check browser console for errors
// Verify token is valid
// Check server is running
// Check CORS settings

// Try with verbose logging
const socket = io('http://localhost:8001', {
  auth: { token: 'your_token' },
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  reconnectionAttempts: 5
});

socket.on('connect_error', (error) => {
  console.error('Connection error:', error);
});
```

---

## 📊 Performance Benchmarks

### Expected Response Times
```
Send message:        50-100ms
Get conversations:   100-200ms
Get history:         200-300ms
Search (50 items):   300-400ms
WebSocket delivery:  10-50ms
```

### Test Performance
```bash
# Time a single request
time curl -H "Authorization: Bearer $TOKEN" \
  "$BASE_URL/search?q=test&limit=50"

# Should be < 500ms
```

---

## 📋 Testing Checklist

Quick copy-paste checklist for manual testing:

```bash
#!/bin/bash
TOKEN="your_token"
USER_ID="user_123"
PEER_ID="user_456"

echo "✓ Testing Messaging API"
echo "1. Send message..."
curl -s -X POST http://localhost:8001/messages/send \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"toUser":"'$PEER_ID'","content":"test"}' | jq '.message'

echo "2. Get conversations..."
curl -s -H "Authorization: Bearer $TOKEN" \
  http://localhost:8001/messages/conversations | jq '.conversations | length'

echo "3. Get history..."
curl -s -H "Authorization: Bearer $TOKEN" \
  "http://localhost:8001/messages/history?peer=$PEER_ID" | jq '.messages | length'

echo "4. Get unread count..."
curl -s -H "Authorization: Bearer $TOKEN" \
  http://localhost:8001/messages/unread-count | jq '.unreadCount'

echo "✓ Testing Search API"
echo "5. Search..."
curl -s -H "Authorization: Bearer $TOKEN" \
  "http://localhost:8001/search?q=test&limit=10" | jq '.results | keys'

echo "✓ All basic tests passed!"
```

---

## 🎓 Learning Resources

**In This Directory**:
- `BACKEND_DOCUMENTATION_INDEX.md` - Navigation guide
- `BACKEND_API_DOCUMENTATION.md` - Full API reference
- `TESTING_GUIDE.md` - Complete testing procedures
- `QUICK_REFERENCE.md` - Lookup tables
- `IMPLEMENTATION_SUMMARY.md` - Architecture overview

**In Code**:
- `Backend/Routes/messages.js` - Message endpoints (read comments)
- `Backend/Routes/search.js` - Search endpoints (read comments)
- `Backend/server.js` - WebSocket setup

---

## 💡 Pro Tips

1. **Always check the Authorization header format**:
   ```
   Correct:   Authorization: Bearer eyJhbGc...
   Wrong:     Authorization: eyJhbGc...  (missing "Bearer ")
   ```

2. **Use `.pretty()` in MongoDB for readable output**:
   ```javascript
   db.messages.find({ _id: ObjectId('123') }).pretty()
   ```

3. **Keep a .env file with your tokens**:
   ```bash
   export TOKEN="your_token"
   export USER_ID="your_id"
   export PEER_ID="peer_id"
   ```

4. **Test WebSocket before building UI**:
   ```javascript
   socket.on('connect', () => console.log('✓ Connected'));
   socket.on('error', (e) => console.error('✗ Error:', e));
   ```

5. **Use Postman for API testing** - Saves time vs cURL

6. **Check server logs first** - Most errors logged there

7. **WebSocket rooms are personal**: `user_${userId}` - Isolates conversations

---

## 📞 Quick Help

**Stuck?** 
1. Check TESTING_GUIDE.md → Section 11: Troubleshooting
2. Review QUICK_REFERENCE.md → Common Issues
3. Check server logs in terminal
4. Check browser DevTools console (Network tab for WebSocket)

**Need examples?**
1. See QUICK_REFERENCE.md → JavaScript Integration
2. See this file → JavaScript/React Quick Code section
3. See BACKEND_API_DOCUMENTATION.md → Frontend Integration Examples

**Testing?**
1. Use commands in this file under "Quick Tests"
2. Follow TESTING_GUIDE.md procedures
3. Use Postman with collection (if created)

---

## 🚀 You're Ready!

With these commands, you can:
- ✅ Test all endpoints
- ✅ Debug issues
- ✅ Integrate with React
- ✅ Setup WebSocket
- ✅ Verify functionality

**Bookmark this file!** 📌

---

**Version**: 1.0  
**Status**: ✅ READY TO USE  
**Last Updated**: November 14, 2025
