# Quick Reference - Backend API & WebSocket

**For**: Developers integrating messaging & search  
**Last Updated**: November 14, 2025  
**Format**: Quick lookup tables

---

## API Endpoints Summary

| Method | Endpoint | Auth | Rate Limit | Purpose |
|--------|----------|------|-----------|---------|
| POST | `/messages/send` | Yes | 10/10s | Send message to user |
| GET | `/messages/history?peer={id}` | Yes | No | Get message thread |
| GET | `/messages/conversations` | Yes | No | Get all conversations |
| GET | `/messages/unread-count` | Yes | No | Get unread count |
| PUT | `/messages/mark-read` | Yes | No | Mark messages read |
| GET | `/search?q=...` | Yes | No | Search creators/content |
| GET | `/search/trending/creators` | Yes | No | Get trending creators |
| GET | `/search/trending/content` | Yes | No | Get trending content |

---

## HTTP Status Codes

| Code | Meaning | Cause |
|------|---------|-------|
| 200 | OK | Successful GET/PUT |
| 201 | Created | Message sent successfully |
| 400 | Bad Request | Missing fields, invalid input |
| 401 | Unauthorized | Invalid/expired token |
| 403 | Forbidden | Message flagged (banned word) |
| 404 | Not Found | Recipient not found |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Server Error | Database/server error |

---

## WebSocket Events

### ⬆️ Client → Server

| Event | Payload | Purpose |
|-------|---------|---------|
| `user:join` | `{ userId }` | Join personal message room |
| `message:send` | `{ toUserId, content, messageId }` | Send real-time message |
| `typing:start` | `{ toUserId, fromUser }` | Start typing indicator |
| `typing:stop` | `{ toUserId, fromUser }` | Stop typing indicator |
| `message:read` | `{ messageId, fromUserId }` | Mark message read |
| `presence:update` | `{ userId, status }` | Update user status |
| `conversation:join` | `{ conversationId }` | Join conversation room |

### ⬇️ Server → Client

| Event | Payload | Trigger |
|-------|---------|---------|
| `message:new` | `{ id, from, content, timestamp }` | Message received (via API) |
| `badge:update` | `{ unreadCount }` | Unread count changed |
| `user:online` | `{ userId, timestamp }` | User joined |
| `typing:start` | `{ fromUser, timestamp }` | Peer typing |
| `typing:stop` | `{ fromUser, timestamp }` | Peer stopped typing |
| `message:read` | `{ messageId, timestamp }` | Message marked read |
| `presence:update` | `{ userId, status, timestamp }` | Peer status changed |

---

## Quick cURL Examples

### Send Message
```bash
curl -X POST http://localhost:8001/messages/send \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"toUser":"USER_ID","content":"Hello!"}'
```

### Get Conversations
```bash
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:8001/messages/conversations
```

### Get Message History
```bash
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:8001/messages/history?peer=USER_ID"
```

### Get Unread Count
```bash
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:8001/messages/unread-count
```

### Mark as Read
```bash
curl -X PUT http://localhost:8001/messages/mark-read \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"peer":"USER_ID"}'
```

### Search
```bash
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:8001/search?q=fitness&type=all&limit=10"
```

### Trending Creators
```bash
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:8001/search/trending/creators?limit=10"
```

### Trending Content
```bash
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:8001/search/trending/content?limit=10"
```

---

## JavaScript/React Integration

### Setup Socket Connection
```javascript
import io from 'socket.io-client';

const socket = io('http://localhost:8001', {
  auth: { token: localStorage.getItem('token') }
});

// User joins on login
socket.emit('user:join', { userId: currentUser.id });
```

### Send Message (API)
```javascript
const response = await axios.post('/messages/send', {
  toUser: recipientId,
  content: messageText
}, {
  headers: { Authorization: `Bearer ${token}` }
});
```

### Listen for New Messages
```javascript
socket.on('message:new', ({ id, from, content, timestamp }) => {
  console.log(`Message from ${from.displayName}: ${content}`);
  // Update UI
});
```

### Listen for Badge Updates
```javascript
socket.on('badge:update', ({ unreadCount }) => {
  // Update unread badge in header
  setUnreadCount(unreadCount);
});
```

### Send Typing Indicator
```javascript
socket.emit('typing:start', {
  toUserId: recipientId,
  fromUser: { id: currentUser.id, name: currentUser.displayName }
});

// Later...
socket.emit('typing:stop', {
  toUserId: recipientId,
  fromUser: { id: currentUser.id, name: currentUser.displayName }
});
```

### Search
```javascript
const response = await axios.get('/search', {
  params: {
    q: searchQuery,
    type: 'all',      // or 'creators', 'content'
    sort: 'relevance', // or 'newest', 'popular'
    limit: 20
  },
  headers: { Authorization: `Bearer ${token}` }
});

const { creators, content } = response.data.results;
```

---

## Database Field Reference

### Message Document
```javascript
{
  _id: ObjectId,
  from: ObjectId,           // User ref
  toUser: ObjectId,         // User ref
  toStream: ObjectId,       // Stream ref (optional)
  content: String,
  status: String,           // 'delivered' | 'flagged'
  flaggedReason: String,    // If flagged
  meta: {
    isRead: Boolean,
    sentAt: Date
  },
  createdAt: Date,
  updatedAt: Date
}
```

### User Document (for search)
```javascript
{
  _id: ObjectId,
  displayName: String,
  email: String,
  picture: String,
  verified_creator: Boolean,
  isBlacklisted: Boolean,
  metadata: {
    fullName: String,
    bio: String,
    followers: Number
  }
}
```

### Content Document (for search)
```javascript
{
  _id: ObjectId,
  user: ObjectId,           // Creator User ref
  status: String,           // 'published' | 'flagged' | etc
  metadata: {
    title: String,
    description: String,
    views: Number,
    duration: String,
    thumbnail: String
  }
}
```

---

## Common Issues & Solutions

### "401 Unauthorized"
**Cause**: Invalid/expired token  
**Fix**: Get new token via login endpoint

### "404 Not Found"
**Cause**: User ID doesn't exist  
**Fix**: Verify user exists in database, check user ID format

### "429 Too Many Requests"
**Cause**: Exceeded rate limit (10 messages/10s)  
**Fix**: Wait 10 seconds before next message

### "Message not arriving in real-time"
**Cause**: WebSocket not connected or recipient not listening  
**Fix**: Verify socket.io connection, check server logs

### "Unread count not updating"
**Cause**: Badge update event not emitted  
**Fix**: Check `message:new` returned 201, verify message wasn't flagged

### "Search returns no results"
**Cause**: Query too short or no matching documents  
**Fix**: Query must be ≥ 2 chars, verify test data exists

---

## File Locations

| File | Purpose | Location |
|------|---------|----------|
| Messages Router | Message CRUD + unread | `Backend/Routes/messages.js` |
| Search Router | Search API | `Backend/Routes/search.js` |
| Server Config | WebSocket setup | `Backend/server.js` |
| Messages Component | UI for messages | `zeevx/src/Pages/Messages.js` |
| Search Component | UI for search | `zeevx/src/Pages/Search.js` |
| Socket Utils | Socket.io client setup | `zeevx/src/Utils/socket.js` |

---

## Environment Variables

Required in `Backend/.env`:

```bash
PORT=8001
MONGODB_URI=mongodb://localhost:27017/onlykumia
JWT_SECRET=your_secret_here
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

---

## Testing Quick Commands

### Test all endpoints at once
```bash
# In Backend folder
npm test  # (if test suite set up)
```

### Manual test with cURL
```bash
# Get token first
TOKEN=$(curl -s -X POST http://localhost:8001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"pass"}' | jq -r '.token')

# Test message endpoint
curl -X POST http://localhost:8001/messages/send \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"toUser":"user_id","content":"test"}'
```

### Test WebSocket
```javascript
// Browser console
const socket = io('http://localhost:8001', {
  auth: { token: localStorage.getItem('token') }
});

socket.on('connect', () => console.log('Connected'));
socket.emit('user:join', { userId: 'my_user_id' });
socket.on('message:new', (msg) => console.log('Got message:', msg));
```

---

## Performance Notes

| Operation | Typical Time |
|-----------|--------------|
| Send message | < 100ms |
| Get conversations | < 200ms |
| Get history (50 msgs) | < 300ms |
| Search (50 results) | < 400ms |
| WebSocket delivery | < 50ms |

---

## Security Checklist

- ✅ All endpoints require JWT authentication
- ✅ Rate limiting on message sending
- ✅ Moderation check on message content
- ✅ Blacklist check on users
- ✅ Published content only in search results
- ⚠️ TODO: Add message encryption for production
- ⚠️ TODO: Add HTTPS for production

---

## Next Steps for Integration

1. **Frontend Integration**
   - Call `/messages/conversations` on mount
   - Listen to `message:new` and `badge:update` events
   - Emit `typing:start` / `typing:stop` during input

2. **Real-time Features**
   - Setup socket connection on login
   - Implement typing indicators
   - Implement read receipts

3. **Search UI**
   - Call `/search` with user input
   - Debounce search input (300ms)
   - Cache trending results

4. **Testing**
   - Test with 2+ concurrent users
   - Test rate limiting
   - Test WebSocket reconnection

5. **Production Deployment**
   - Add message encryption
   - Enable HTTPS/WSS
   - Setup database indexes
   - Configure proper CORS
   - Setup monitoring/logging

---

**For detailed documentation**: See `BACKEND_API_DOCUMENTATION.md`  
**For testing procedures**: See `TESTING_GUIDE.md`  
**For code walkthrough**: See implementation comments in `Backend/Routes/messages.js` and `Backend/Routes/search.js`
