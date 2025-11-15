# Backend API Implementation - Real-time Messaging & Search

**Date**: November 14, 2025  
**Status**: ✅ COMPLETE - All 5 features implemented

---

## Overview

Implemented 5 critical backend features for real-time messaging, search, and badge count tracking.

### Completed Features
1. ✅ `/messages/history` endpoint (fetch conversations & messages)
2. ✅ `/messages/send` endpoint (send new message with WebSocket)
3. ✅ `/search` endpoint (search creators & content)
4. ✅ WebSocket events for real-time messaging
5. ✅ Unread badge count tracking

---

## 1. Messaging Endpoints

### A. Get Conversations List
**Endpoint**: `GET /messages/conversations`  
**Auth**: Required (Bearer token)  
**Description**: Fetch all conversations for authenticated user with unread counts

**Request**:
```bash
curl -H "Authorization: Bearer {token}" \
  http://localhost:8001/messages/conversations
```

**Response** (200 OK):
```json
{
  "conversations": [
    {
      "id": "user_id_123",
      "peerId": "user_id_123",
      "name": "John Doe",
      "avatar": "https://...",
      "lastMessage": "Hey, how are you?",
      "lastMessageTime": "2025-11-14T10:30:00Z",
      "unreadCount": 2,
      "status": "delivered"
    }
  ],
  "total": 3
}
```

**Error Responses**:
- `401 Unauthorized` - Invalid token
- `500 Internal Server Error` - Database error

---

### B. Get Message History
**Endpoint**: `GET /messages/history?peer={userId}&limit=50`  
**Auth**: Required  
**Description**: Fetch messages with specific peer (auto-marks as read)

**Query Parameters**:
- `peer` (required): Peer user ID
- `limit` (optional): Number of messages to fetch (default: 50, max: 200)

**Request**:
```bash
curl -H "Authorization: Bearer {token}" \
  "http://localhost:8001/messages/history?peer=user_id_456&limit=50"
```

**Response** (200 OK):
```json
{
  "messages": [
    {
      "_id": "msg_id_1",
      "from": {
        "_id": "user_id_456",
        "displayName": "Jane Smith",
        "picture": "https://...",
        "email": "jane@example.com"
      },
      "toUser": "user_id_123",
      "content": "Hi there!",
      "status": "delivered",
      "createdAt": "2025-11-14T09:00:00Z",
      "meta": { "isRead": true }
    }
  ]
}
```

**Side Effects**:
- Automatically marks all messages from `peer` to current user as `isRead: true`

---

### C. Send Message
**Endpoint**: `POST /messages/send`  
**Auth**: Required  
**Rate Limit**: 10 messages per 10 seconds per user  
**Description**: Send new message with moderation check

**Request Body**:
```json
{
  "toUser": "user_id_456",
  "content": "Hello! How are you?"
}
```

**Request**:
```bash
curl -X POST http://localhost:8001/messages/send \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"toUser": "user_id_456", "content": "Hello!"}'
```

**Response** (201 Created):
```json
{
  "message": "Message sent",
  "data": {
    "id": "msg_id_new",
    "content": "Hello!",
    "timestamp": "2025-11-14T10:35:00Z",
    "status": "delivered"
  }
}
```

**Error Responses**:
- `400 Bad Request` - Empty message, invalid JSON
- `404 Not Found` - Recipient user not found
- `403 Forbidden` - Message flagged by moderation (contains banned words)
- `429 Too Many Requests` - Rate limit exceeded

**Moderation**:
- Checks message against banned words list (`BANNED` array)
- Flagged messages saved with status `'flagged'`
- Non-flagged messages emit WebSocket events

**WebSocket Emissions** (if not flagged):
- `message:new` event to recipient's room
- `badge:update` event with new unread count

---

### D. Get Unread Count
**Endpoint**: `GET /messages/unread-count`  
**Auth**: Required  
**Description**: Fetch total unread message count for user

**Request**:
```bash
curl -H "Authorization: Bearer {token}" \
  http://localhost:8001/messages/unread-count
```

**Response** (200 OK):
```json
{
  "unreadCount": 5
}
```

---

### E. Mark Messages as Read
**Endpoint**: `PUT /messages/mark-read`  
**Auth**: Required  
**Description**: Mark all messages from specific peer as read

**Request Body**:
```json
{
  "peer": "user_id_456"
}
```

**Request**:
```bash
curl -X PUT http://localhost:8001/messages/mark-read \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"peer": "user_id_456"}'
```

**Response** (200 OK):
```json
{
  "message": "Messages marked as read"
}
```

**WebSocket Emissions**:
- `badge:update` event with updated unread count

---

## 2. Search Endpoints

### A. Unified Search
**Endpoint**: `GET /search?q=query&type=all&sort=relevance&limit=10&offset=0`  
**Auth**: Required  
**Description**: Search across creators and content

**Query Parameters**:
- `q` (required): Search query (min 2 chars)
- `type` (optional): 'all', 'creators', 'content' (default: 'all')
- `sort` (optional): 'relevance', 'newest', 'popular' (default: 'relevance')
- `limit` (optional): Results per category (default: 10, max: 50)
- `offset` (optional): Pagination offset (default: 0)

**Request**:
```bash
curl -H "Authorization: Bearer {token}" \
  "http://localhost:8001/search?q=fitness&type=all&sort=popular&limit=20"
```

**Response** (200 OK):
```json
{
  "query": "fitness",
  "results": {
    "creators": [
      {
        "id": "creator_id_1",
        "type": "creator",
        "name": "Jane Fitness",
        "avatar": "https://...",
        "email": "jane@example.com",
        "verified": true,
        "bio": "Fitness coach",
        "followers": 1200
      }
    ],
    "creatorCount": 5,
    "content": [
      {
        "id": "content_id_1",
        "type": "content",
        "title": "Morning Workout",
        "description": "30-min full body workout",
        "thumbnail": "https://...",
        "creator": "Jane Fitness",
        "creatorId": "creator_id_1",
        "creatorVerified": true,
        "views": 3400,
        "duration": "30:45",
        "uploadedAt": "2025-11-10T14:20:00Z"
      }
    ],
    "contentCount": 8
  },
  "total": 13,
  "pagination": { "limit": 20, "offset": 0 }
}
```

**Error Responses**:
- `400 Bad Request` - Query too short (< 2 chars) or missing
- `401 Unauthorized` - Invalid token
- `500 Internal Server Error` - Database error

**Search Logic**:
- **Creators**: Search by displayName, email, fullName (case-insensitive regex)
- **Content**: Search by title, description (case-insensitive regex)
- **Filters**: Only includes verified/published content, non-blacklisted users
- **Sorting**:
  - `relevance`: Verified creators first, recent content first
  - `newest`: Sort by creation date descending
  - `popular`: Sort by followers/views descending (views from metadata)

---

### B. Trending Creators
**Endpoint**: `GET /search/trending/creators?limit=10`  
**Auth**: Required  
**Description**: Fetch verified/popular creators

**Request**:
```bash
curl -H "Authorization: Bearer {token}" \
  "http://localhost:8001/search/trending/creators?limit=10"
```

**Response** (200 OK):
```json
{
  "creators": [
    {
      "id": "creator_id_1",
      "type": "creator",
      "name": "Jane Fitness",
      "avatar": "https://...",
      "verified": true,
      "bio": "Fitness coach",
      "followers": 1200
    }
  ]
}
```

---

### C. Trending Content
**Endpoint**: `GET /search/trending/content?limit=10`  
**Auth**: Required  
**Description**: Fetch popular/recent content

**Request**:
```bash
curl -H "Authorization: Bearer {token}" \
  "http://localhost:8001/search/trending/content?limit=10"
```

**Response** (200 OK):
```json
{
  "content": [
    {
      "id": "content_id_1",
      "type": "content",
      "title": "Morning Workout",
      "description": "30-min full body",
      "thumbnail": "https://...",
      "creator": "Jane Fitness",
      "creatorId": "creator_id_1",
      "creatorVerified": true,
      "views": 5200,
      "duration": "30:00",
      "uploadedAt": "2025-11-14T12:00:00Z"
    }
  ]
}
```

---

## 3. WebSocket Events

All events are real-time, bidirectional, and use Socket.io library.

### Connection Events

#### `user:join` (Client → Server)
Join user's personal message room
```javascript
socket.emit('user:join', { userId: 'user_id_123' });
```

Server-side: Joins `user_${userId}` room

#### `user:online` (Server → Client)
Broadcast when user comes online
```javascript
socket.on('user:online', ({ userId, timestamp }) => {
  console.log(`User ${userId} is online`);
});
```

---

### Direct Messaging Events

#### `message:new` (Server → Client)
Receive new message from another user
```javascript
socket.on('message:new', ({ 
  id,
  from,          // { displayName, picture, email }
  content,
  timestamp,
  conversationId
}) => {
  console.log(`New message from ${from.displayName}: ${content}`);
});
```

**Emitted by**: `/messages/send` endpoint when message delivered

#### `message:send` (Client → Server)
Send real-time message to user
```javascript
socket.emit('message:send', {
  toUserId: 'user_id_456',
  content: 'Hello!',
  messageId: 'msg_id_temp'
});
```

#### `message:read` (Bidirectional)
Notify that message was read

Client → Server:
```javascript
socket.emit('message:read', {
  messageId: 'msg_id_1',
  fromUserId: 'user_id_456'
});
```

Server → Client (to original sender):
```javascript
socket.on('message:read', ({ messageId, timestamp }) => {
  // Update message UI to show as read
});
```

---

### Typing Indicators

#### `typing:start` (Client → Server)
User is typing
```javascript
socket.emit('typing:start', {
  toUserId: 'user_id_456',
  fromUser: { id: 'user_id_123', name: 'John Doe' }
});
```

Server broadcasts to recipient:
```javascript
socket.on('typing:start', ({ fromUser, timestamp }) => {
  console.log(`${fromUser.name} is typing...`);
});
```

#### `typing:stop` (Client → Server)
User stopped typing
```javascript
socket.emit('typing:stop', {
  toUserId: 'user_id_456',
  fromUser: { id: 'user_id_123', name: 'John Doe' }
});
```

---

### Badge & Status Events

#### `badge:update` (Server → Client)
Unread message count changed
```javascript
socket.on('badge:update', ({ unreadCount }) => {
  // Update header badge: show unreadCount
});
```

**Emitted by**:
- `/messages/send` endpoint (after sending to recipient)
- `/messages/mark-read` endpoint (after marking as read)

#### `presence:update` (Bidirectional)
User status changed
```javascript
// Client emits
socket.emit('presence:update', {
  userId: 'user_id_123',
  status: 'online' // or 'typing', 'away', 'offline'
});

// Server broadcasts to all
socket.on('presence:update', ({ userId, status, timestamp }) => {
  // Update contact list UI
});
```

---

### Conversation Events

#### `conversation:join` (Client → Server)
Join a conversation room (for optimizations)
```javascript
socket.emit('conversation:join', {
  conversationId: 'user_id_456'
});
```

#### `conversation:update` (Bidirectional)
Conversation changed (new message)
```javascript
// Client can emit when sending message
socket.emit('conversation:update', {
  conversationId: 'user_id_456',
  lastMessage: 'Hello!'
});

// Server broadcasts update
socket.on('conversation:update', ({ conversationId, lastMessage, timestamp }) => {
  // Update conversation list
});
```

---

### Stream Events (Existing)

#### `joinStream`
```javascript
socket.emit('joinStream', { streamId: 'stream_id_123' });
```

#### `chatMessage`
```javascript
socket.emit('chatMessage', {
  streamId: 'stream_id_123',
  message: 'Nice stream!',
  user: { id: 'user_id', name: 'John' }
});
```

#### `tip`
```javascript
socket.emit('tip', {
  creatorId: 'creator_id_123',
  amount: 5.00,
  user: { id: 'user_id', name: 'John' }
});
```

---

## 4. Database Schema Updates

### Message Schema (Enhanced)
```javascript
{
  _id: ObjectId,
  from: { type: ObjectId, ref: 'User' },
  toUser: { type: ObjectId, ref: 'User' },
  toStream: { type: ObjectId, ref: 'Stream' },
  content: String,
  status: 'delivered|flagged|blocked',
  flaggedReason: String,
  meta: {
    isRead: Boolean,
    sentAt: Date
  },
  createdAt: Date,
  updatedAt: Date
}
```

### User Schema Notes
- Search queries expect: `displayName`, `email`, `verified_creator`, `isBlacklisted`
- Metadata should include: `fullName`, `bio`, `followers`

### Content Schema Notes
- Search queries expect: `metadata.title`, `metadata.description`, `status: 'published'`
- Metadata should include: `views`, `duration`, `thumbnail`

---

## 5. Rate Limiting

### Message Sending
- **Limit**: 10 messages per 10 seconds per user
- **Response**: `429 Too Many Requests`
- **Config**: `Backend/Auth/rate-limiter.js`

### Search
- **Limit**: General API rate limit (express-rate-limit)
- **Config**: `Backend/Auth/rate-limiter.js` (global limit)

---

## 6. Error Handling

All endpoints return standard error format:

```json
{
  "error": "Error message here"
}
```

### Common HTTP Status Codes
| Code | Meaning | Example |
|------|---------|---------|
| 200 | OK | Successful GET |
| 201 | Created | Message sent successfully |
| 400 | Bad Request | Missing query params, empty message |
| 401 | Unauthorized | Invalid token |
| 403 | Forbidden | Message flagged by moderation |
| 404 | Not Found | Recipient user not found |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server | Database error |

---

## 7. Testing Endpoints

### Quick Test Script
```bash
#!/bin/bash

# Set token and user IDs
TOKEN="your_jwt_token_here"
BASE_URL="http://localhost:8001"
USER_ID="user_123"
PEER_ID="user_456"

# Test 1: Get conversations
echo "=== GET /messages/conversations ==="
curl -H "Authorization: Bearer $TOKEN" "$BASE_URL/messages/conversations"

# Test 2: Send message
echo -e "\n=== POST /messages/send ==="
curl -X POST "$BASE_URL/messages/send" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"toUser": "'$PEER_ID'", "content": "Test message"}'

# Test 3: Get message history
echo -e "\n=== GET /messages/history ==="
curl -H "Authorization: Bearer $TOKEN" \
  "$BASE_URL/messages/history?peer=$PEER_ID&limit=10"

# Test 4: Get unread count
echo -e "\n=== GET /messages/unread-count ==="
curl -H "Authorization: Bearer $TOKEN" "$BASE_URL/messages/unread-count"

# Test 5: Search
echo -e "\n=== GET /search ==="
curl -H "Authorization: Bearer $TOKEN" \
  "$BASE_URL/search?q=fitness&type=all&limit=10"

# Test 6: Trending creators
echo -e "\n=== GET /search/trending/creators ==="
curl -H "Authorization: Bearer $TOKEN" "$BASE_URL/search/trending/creators"

# Test 7: Trending content
echo -e "\n=== GET /search/trending/content ==="
curl -H "Authorization: Bearer $TOKEN" "$BASE_URL/search/trending/content"
```

---

## 8. Frontend Integration Examples

See `zeevx/src/Pages/Messages.js` and `zeevx/src/Pages/Search.js` for UI components.

### Messages Integration
```javascript
// Fetch conversations on mount
const response = await axios.get('/messages/conversations');

// Send message
await axios.post('/messages/send', { toUser: peerId, content });

// Listen for new messages
socket.on('message:new', (msg) => {
  setMessages([...messages, msg]);
});

// Listen for badge updates
socket.on('badge:update', ({ unreadCount }) => {
  setUnreadCount(unreadCount);
});
```

### Search Integration
```javascript
// Perform search
const response = await axios.get(
  `/search?q=${query}&type=${type}&sort=${sort}&limit=20`
);

// Get trending
const trending = await axios.get('/search/trending/creators');
```

---

## 9. Deployment Checklist

Before going to production:

- [ ] Test all endpoints with real JWT tokens
- [ ] Test rate limiting (send 11 messages in 10 seconds)
- [ ] Test WebSocket connection with Socket.io client
- [ ] Verify unread count persistence in database
- [ ] Test search with various query types
- [ ] Verify all error cases (missing fields, invalid IDs)
- [ ] Load test messaging endpoints
- [ ] Verify WebSocket scales with multiple concurrent users
- [ ] Test badge updates in real-time (multiple clients)
- [ ] Verify conversation history ordering

---

## 10. Known Limitations & TODOs

### Current Limitations
1. ❌ No encryption of message content (should add before production)
2. ❌ No attachment/file sharing in messages (can be added)
3. ❌ Search doesn't index content (uses regex, slower for large datasets)
4. ❌ No conversation pinning/archiving
5. ❌ No message deletion (soft-delete possible)
6. ❌ No group messaging (currently peer-to-peer only)
7. ❌ View count tracking not implemented (use `metadata.views`)

### Recommended TODOs
1. Add message encryption (Node crypto module)
2. Implement Elasticsearch for full-text search
3. Add Redis caching for unread counts
4. Implement message search within conversations
5. Add conversation archiving/deletion
6. Implement soft-delete for messages (admin recovery)
7. Add read receipts (double-check marks)
8. Add voice/video message support
9. Add conversation muting notifications
10. Implement message reactions

---

## 11. Summary

**Files Created**:
- `Backend/Routes/search.js` - Search endpoints

**Files Modified**:
- `Backend/Routes/messages.js` - Enhanced messaging endpoints
- `Backend/server.js` - WebSocket handlers + route mounting

**Endpoints Added**: 8
- 5 messaging endpoints (history, send, conversations, unread-count, mark-read)
- 3 search endpoints (search, trending/creators, trending/content)

**WebSocket Events**: 15+
- User presence (online, offline)
- Direct messaging (send, receive, read)
- Typing indicators
- Badge updates
- Conversation updates
- Stream chat (existing)

**Status**: ✅ **COMPLETE** - Ready for frontend integration and testing

---

**Next Steps**:
1. Update frontend to call these endpoints
2. Test WebSocket events with Socket.io client
3. Implement proper authentication (JWT verification in middleware)
4. Load testing and optimization
5. Add encryption for production security
