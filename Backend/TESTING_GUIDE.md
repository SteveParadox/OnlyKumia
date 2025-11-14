# Testing Guide - Real-time Messaging & Search Backend

**Last Updated**: November 14, 2025

---

## 1. Prerequisites

### Tools Required
- **Postman** (API testing) or **cURL** (command-line)
- **Socket.io Client** (for real-time testing)
- **MongoDB Compass** (database inspection)
- **VS Code** or text editor for logs

### Setup
1. Ensure backend server running: `npm start` in `Backend/` folder
2. Ensure frontend running: `npm start` in `zeevx/` folder
3. Have at least 2 test user accounts in database
4. Get valid JWT tokens for both test users

---

## 2. Obtaining Test Tokens

### Option A: Login via API
```bash
curl -X POST http://localhost:8001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test1@example.com", "password": "password123"}'
```

Response:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": { "_id": "user_id_123", "displayName": "Test User 1" }
}
```

### Option B: Manual Database Entry
```javascript
// In MongoDB
db.users.insertOne({
  displayName: "Test User 1",
  email: "test1@example.com",
  password: "$2b$10$...", // bcrypt hash
  picture: "https://...",
  role: "user",
  verified_creator: false,
  kyc_status: "pending"
})
```

### Store Tokens
```bash
# Create .env.test file
TOKEN_USER1="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
TOKEN_USER2="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
USER1_ID="user_id_123"
USER2_ID="user_id_456"
```

---

## 3. API Endpoint Tests

### Test Suite 1: Messaging Endpoints

#### Test 1.1: Send Message
**Purpose**: Verify message creation and validation

```bash
# Setup
USER1_TOKEN="token_123"
USER2_ID="user_id_456"

# Test: Send valid message
curl -X POST http://localhost:8001/messages/send \
  -H "Authorization: Bearer $USER1_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "toUser": "'$USER2_ID'",
    "content": "Hello from User 1!"
  }'

# Expected Response (201 Created)
# {
#   "message": "Message sent",
#   "data": {
#     "id": "msg_id_xxx",
#     "content": "Hello from User 1!",
#     "timestamp": "2025-11-14T...",
#     "status": "delivered"
#   }
# }
```

**Test Cases**:
| Case | Input | Expected | Pass/Fail |
|------|-------|----------|-----------|
| Valid message | `{toUser, content}` | 201 Created | ❓ |
| Empty message | `{toUser, content: ""}` | 400 Bad Request | ❓ |
| Missing toUser | `{content}` | 400 Bad Request | ❓ |
| Invalid user ID | `{toUser: "invalid"}` | 404 Not Found | ❓ |
| Banned word | `{toUser, content: "badword"}` | 201 (flagged) | ❓ |
| Rate limit | 11 messages in 10s | 429 Too Many | ❓ |

---

#### Test 1.2: Get Conversations List
**Purpose**: Verify conversation aggregation and unread counts

```bash
USER1_TOKEN="token_123"

curl -H "Authorization: Bearer $USER1_TOKEN" \
  http://localhost:8001/messages/conversations

# Expected Response (200 OK)
# {
#   "conversations": [
#     {
#       "id": "user_id_456",
#       "name": "User 2",
#       "lastMessage": "Hello from User 1!",
#       "unreadCount": 0,
#       "lastMessageTime": "2025-11-14T..."
#     }
#   ]
# }
```

**Verification**:
- [ ] Lists all conversations for user
- [ ] Unread count is accurate
- [ ] Sorted by most recent message
- [ ] Includes peer user info (name, avatar)

---

#### Test 1.3: Get Message History
**Purpose**: Verify message retrieval and auto-read functionality

```bash
USER1_TOKEN="token_123"
USER2_ID="user_id_456"

curl -H "Authorization: Bearer $USER1_TOKEN" \
  "http://localhost:8001/messages/history?peer=$USER2_ID&limit=10"

# Expected Response (200 OK)
# {
#   "messages": [
#     {
#       "_id": "msg_id_123",
#       "from": {
#         "_id": "user_id_456",
#         "displayName": "User 2",
#         "picture": "https://..."
#       },
#       "content": "Hello from User 1!",
#       "status": "delivered",
#       "createdAt": "2025-11-14T...",
#       "meta": { "isRead": true }
#     }
#   ]
# }
```

**Verification**:
- [ ] Returns messages from conversation with peer
- [ ] Messages marked as `isRead: true` after fetch
- [ ] Includes populated user data (displayName, picture)
- [ ] Returns in chronological order
- [ ] Respects limit parameter

**Check Database**:
```javascript
// Verify messages marked as read in MongoDB
db.messages.find({
  toUser: ObjectId(USER1_ID),
  from: ObjectId(USER2_ID)
}).pretty()
// All should have meta.isRead = true
```

---

#### Test 1.4: Get Unread Count
**Purpose**: Verify accurate unread tracking

```bash
USER1_TOKEN="token_123"

curl -H "Authorization: Bearer $USER1_TOKEN" \
  http://localhost:8001/messages/unread-count

# Expected Response (200 OK)
# { "unreadCount": 5 }
```

**Test Sequence**:
1. Send 5 messages from User 2 to User 1 (without User 1 fetching history)
2. Get unread count → should be 5
3. Fetch history for User 2
4. Get unread count → should be 0

---

#### Test 1.5: Mark Messages as Read
**Purpose**: Verify read marking and badge updates

```bash
USER1_TOKEN="token_123"
USER2_ID="user_id_456"

# Send unread messages first
for i in {1..3}; do
  curl -X POST http://localhost:8001/messages/send \
    -H "Authorization: Bearer TOKEN_USER2" \
    -H "Content-Type: application/json" \
    -d '{"toUser": "USER1_ID", "content": "Message '$i'"}'
done

# Now mark as read
curl -X PUT http://localhost:8001/messages/mark-read \
  -H "Authorization: Bearer $USER1_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"peer": "'$USER2_ID'"}'

# Expected Response (200 OK)
# { "message": "Messages marked as read" }

# Verify unread count is 0
curl -H "Authorization: Bearer $USER1_TOKEN" \
  http://localhost:8001/messages/unread-count
# Should return { "unreadCount": 0 }
```

---

### Test Suite 2: Search Endpoints

#### Test 2.1: Unified Search
**Purpose**: Verify search functionality with filters

```bash
TOKEN="token_123"

# Test 1: Search all
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:8001/search?q=fitness&type=all&limit=10"

# Test 2: Search creators only
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:8001/search?q=fitness&type=creators&limit=10"

# Test 3: Search content only
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:8001/search?q=fitness&type=content&limit=10"

# Test 4: Search with sorting
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:8001/search?q=fitness&sort=popular&limit=10"

# Expected Response (200 OK)
# {
#   "query": "fitness",
#   "results": {
#     "creators": [{ id, name, verified, ... }],
#     "creatorCount": 3,
#     "content": [{ id, title, views, ... }],
#     "contentCount": 15
#   },
#   "total": 18,
#   "pagination": { "limit": 10, "offset": 0 }
# }
```

**Test Cases**:
| Case | Input | Expected | Pass/Fail |
|------|-------|----------|-----------|
| Valid search | `q=fitness` | 200 OK, results | ❓ |
| Query too short | `q=a` | 400 Bad Request | ❓ |
| No query | (empty) | 400 Bad Request | ❓ |
| No results | `q=zzzzzxxx` | 200 OK, empty arrays | ❓ |
| Pagination | `limit=5&offset=5` | 200 OK, next 5 | ❓ |
| Sorting | `sort=popular` | 200 OK, sorted | ❓ |

---

#### Test 2.2: Trending Creators
**Purpose**: Verify trending creator list

```bash
TOKEN="token_123"

curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:8001/search/trending/creators?limit=10"

# Expected Response (200 OK)
# {
#   "creators": [
#     {
#       "id": "creator_id_1",
#       "name": "Jane Fitness",
#       "verified": true,
#       "followers": 1200,
#       ...
#     }
#   ]
# }
```

**Verification**:
- [ ] Only verified creators shown
- [ ] Limited to 10 results
- [ ] Sorted by verification/popularity

---

#### Test 2.3: Trending Content
**Purpose**: Verify trending content list

```bash
TOKEN="token_123"

curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:8001/search/trending/content?limit=10"

# Expected Response (200 OK)
# {
#   "content": [
#     {
#       "id": "content_id_1",
#       "title": "Morning Workout",
#       "views": 5200,
#       "uploadedAt": "2025-11-14T...",
#       ...
#     }
#   ]
# }
```

**Verification**:
- [ ] Only published content shown
- [ ] Sorted by views descending
- [ ] Limited to 10 results

---

## 4. WebSocket Tests

### Test 4.1: Connection & User Join

**Setup** (in browser console or Node.js):
```javascript
// Install: npm install socket.io-client
const io = require('socket.io-client');

const socket1 = io('http://localhost:8001', {
  auth: { token: USER1_TOKEN }
});

const socket2 = io('http://localhost:8001', {
  auth: { token: USER2_TOKEN }
});

// User 1 joins
socket1.emit('user:join', { userId: USER1_ID });

// User 2 joins
socket2.emit('user:join', { userId: USER2_ID });

// Check for online event
socket1.on('user:online', (data) => {
  console.log('User online:', data);
});
```

**Verification**:
- [ ] Sockets connect without error
- [ ] `user:online` event received
- [ ] Can emit and receive events

---

### Test 4.2: Real-time Message Receive

**Setup**:
```javascript
// User 1 listens for new messages
socket1.on('message:new', (msg) => {
  console.log('New message:', msg);
});

// User 2 sends message via API
curl -X POST http://localhost:8001/messages/send \
  -H "Authorization: Bearer TOKEN_USER2" \
  -H "Content-Type: application/json" \
  -d '{"toUser": "USER1_ID", "content": "Hello via API!"}'
```

**Verification**:
- [ ] User 1 receives `message:new` event in real-time
- [ ] Message includes: id, from, content, timestamp
- [ ] No delay (< 1 second)

---

### Test 4.3: Typing Indicators

```javascript
// User 2 starts typing
socket2.emit('typing:start', {
  toUserId: USER1_ID,
  fromUser: { id: USER2_ID, name: 'User 2' }
});

// User 1 listens
socket1.on('typing:start', (data) => {
  console.log('User is typing:', data.fromUser.name);
});

// User 2 stops typing
setTimeout(() => {
  socket2.emit('typing:stop', {
    toUserId: USER1_ID,
    fromUser: { id: USER2_ID, name: 'User 2' }
  });
}, 3000);

socket1.on('typing:stop', (data) => {
  console.log('User stopped typing:', data.fromUser.name);
});
```

**Verification**:
- [ ] `typing:start` event received on target
- [ ] `typing:stop` event received after 3 seconds
- [ ] No message created (typing only)

---

### Test 4.4: Badge Updates

```javascript
// Setup: User 1 listens for badge updates
socket1.on('badge:update', ({ unreadCount }) => {
  console.log('Unread count updated:', unreadCount);
});

// User 2 sends message
curl -X POST http://localhost:8001/messages/send \
  -H "Authorization: Bearer TOKEN_USER2" \
  -H "Content-Type: application/json" \
  -d '{"toUser": "USER1_ID", "content": "Test message"}'

// Verify: badge:update event should be received with unreadCount = 1
```

**Verification**:
- [ ] `badge:update` event received immediately
- [ ] Unread count is correct (1)
- [ ] Badge count increases with each new message
- [ ] Badge count resets to 0 after marking read

---

### Test 4.5: Read Receipts

```javascript
// Setup
socket1.on('message:read', ({ messageId, timestamp }) => {
  console.log('Message read receipt:', messageId);
});

// User 1 marks message as read
curl -X PUT http://localhost:8001/messages/mark-read \
  -H "Authorization: Bearer TOKEN_USER1" \
  -H "Content-Type: application/json" \
  -d '{"peer": "USER2_ID"}'

// Verify: User 2 receives message:read event
```

**Verification**:
- [ ] `message:read` event sent to sender
- [ ] Event received with messageId and timestamp
- [ ] Can update UI to show double-check marks

---

## 5. Integration Tests

### Test 5.1: Full Conversation Flow

```bash
#!/bin/bash

echo "=== Full Conversation Flow Test ==="

# Step 1: User 1 sends initial message
MSG1=$(curl -s -X POST http://localhost:8001/messages/send \
  -H "Authorization: Bearer TOKEN_USER1" \
  -H "Content-Type: application/json" \
  -d '{"toUser": "USER2_ID", "content": "Hi User 2!"}' \
  | jq -r '.data.id')

echo "Step 1: User 1 sent message: $MSG1"

# Step 2: Check User 2's unread count (should be 1)
UNREAD=$(curl -s -H "Authorization: Bearer TOKEN_USER2" \
  http://localhost:8001/messages/unread-count | jq '.unreadCount')

echo "Step 2: User 2 unread count: $UNREAD (expected: 1)"

# Step 3: User 2 fetches history (auto-marks as read)
curl -s -H "Authorization: Bearer TOKEN_USER2" \
  "http://localhost:8001/messages/history?peer=USER1_ID" > /dev/null

# Step 4: Check unread count again (should be 0)
UNREAD=$(curl -s -H "Authorization: Bearer TOKEN_USER2" \
  http://localhost:8001/messages/unread-count | jq '.unreadCount')

echo "Step 4: User 2 unread count: $UNREAD (expected: 0)"

# Step 5: User 2 responds
curl -s -X POST http://localhost:8001/messages/send \
  -H "Authorization: Bearer TOKEN_USER2" \
  -H "Content-Type: application/json" \
  -d '{"toUser": "USER1_ID", "content": "Hi User 1!"}' > /dev/null

# Step 6: Get conversation list for User 1
CONVS=$(curl -s -H "Authorization: Bearer TOKEN_USER1" \
  http://localhost:8001/messages/conversations | jq '.conversations | length')

echo "Step 6: User 1 has $CONVS conversations"

echo "=== Test Complete ==="
```

---

## 6. Performance Tests

### Test 6.1: Message Rate Limiting

```bash
#!/bin/bash

echo "=== Rate Limit Test ==="

# Send 11 messages in rapid succession
for i in {1..11}; do
  echo "Sending message $i..."
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST \
    http://localhost:8001/messages/send \
    -H "Authorization: Bearer TOKEN_USER1" \
    -H "Content-Type: application/json" \
    -d '{"toUser": "USER2_ID", "content": "Message '$i'"}')
  
  if [ "$i" -le 10 ]; then
    if [ "$STATUS" = "201" ]; then
      echo "  ✓ Message $i sent (201 Created)"
    else
      echo "  ✗ Unexpected status: $STATUS"
    fi
  else
    if [ "$STATUS" = "429" ]; then
      echo "  ✓ Message $i blocked (429 Too Many Requests) - Rate limit working!"
    else
      echo "  ✗ Expected 429, got: $STATUS"
    fi
  fi
done

echo "=== Test Complete ==="
```

**Expected Output**:
```
Sending message 1...
  ✓ Message 1 sent (201 Created)
...
Sending message 10...
  ✓ Message 10 sent (201 Created)
Sending message 11...
  ✓ Message 11 blocked (429 Too Many Requests) - Rate limit working!
=== Test Complete ===
```

---

### Test 6.2: Search Performance

```javascript
// Test search with large result set
console.time('search-large');

fetch('http://localhost:8001/search?q=test&limit=50', {
  headers: { 'Authorization': `Bearer ${TOKEN}` }
})
  .then(r => r.json())
  .then(data => {
    console.timeEnd('search-large');
    console.log('Results:', data.results.creatorCount, data.results.contentCount);
  });

// Expected: < 500ms response time for 50 results
```

---

## 7. Error Handling Tests

### Test 7.1: Invalid Token

```bash
curl -X POST http://localhost:8001/messages/send \
  -H "Authorization: Bearer invalid_token_123" \
  -H "Content-Type: application/json" \
  -d '{"toUser": "USER2_ID", "content": "Test"}'

# Expected: 401 Unauthorized
```

---

### Test 7.2: Missing Required Fields

```bash
# Missing content
curl -X POST http://localhost:8001/messages/send \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"toUser": "USER2_ID"}'

# Expected: 400 Bad Request
```

---

### Test 7.3: Non-existent User

```bash
curl -X POST http://localhost:8001/messages/send \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"toUser": "non_existent_id", "content": "Test"}'

# Expected: 404 Not Found
```

---

## 8. Database Verification

### Check Message Documents

```javascript
// MongoDB Query
db.messages.find({
  from: ObjectId("USER1_ID"),
  toUser: ObjectId("USER2_ID")
}).sort({ createdAt: -1 }).pretty()

// Verify fields:
// - status: "delivered" or "flagged"
// - meta.isRead: true or false
// - content: message text
// - createdAt: timestamp
```

---

### Check Unread Messages

```javascript
// Count unread for User 1
db.messages.countDocuments({
  toUser: ObjectId("USER1_ID"),
  "meta.isRead": false
})

// Should match /messages/unread-count response
```

---

## 9. Browser Console Testing

### Quick Test in React App

```javascript
// In zeevx browser console
const token = localStorage.getItem('token');
const user1_id = localStorage.getItem('user_id');

// Test 1: Get conversations
fetch('/messages/conversations', {
  headers: { 'Authorization': `Bearer ${token}` }
})
  .then(r => r.json())
  .then(data => console.log('Conversations:', data));

// Test 2: Send message
fetch('/messages/send', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    toUser: 'another_user_id',
    content: 'Test from browser!'
  })
})
  .then(r => r.json())
  .then(data => console.log('Sent:', data));

// Test 3: Search
fetch('/search?q=fitness&limit=10', {
  headers: { 'Authorization': `Bearer ${token}` }
})
  .then(r => r.json())
  .then(data => console.log('Search results:', data));
```

---

## 10. Checklist for Deployment

Before deploying to production:

- [ ] All API endpoints tested with valid JWT tokens
- [ ] Rate limiting tested (429 responses working)
- [ ] WebSocket connections stable with multiple clients
- [ ] Message persistence verified in MongoDB
- [ ] Unread count accurate after mark-read operations
- [ ] Search queries return correct results
- [ ] Trending endpoints show relevant data
- [ ] Error responses properly formatted
- [ ] Performance acceptable (< 500ms for all queries)
- [ ] No console errors in browser DevTools
- [ ] No unhandled promise rejections
- [ ] Database indexes created (optional but recommended)
- [ ] Environment variables configured correctly
- [ ] CORS properly configured for frontend domain
- [ ] WebSocket namespace properly scoped

---

## 11. Troubleshooting

### Issue: 401 Unauthorized on all endpoints

**Solution**:
- Verify JWT token is valid: `curl -H "Authorization: Bearer TOKEN" http://localhost:8001/auth/verify`
- Check token hasn't expired
- Verify `Authorization` header format: `Bearer <token>` (space between Bearer and token)

---

### Issue: WebSocket not receiving events

**Solution**:
- Check browser DevTools Network tab for WebSocket connection
- Verify socket.io client version matches server version
- Check `user:join` event was emitted successfully
- Verify correct room name: `user_${userId}`
- Check server console for errors

---

### Issue: Unread count not updating

**Solution**:
- Verify message sent successfully (201 response)
- Check `meta.isRead` field in database
- Verify `badge:update` event emitted from server
- Check client listening to correct event name

---

### Issue: Search returns no results

**Solution**:
- Verify test data exists in database
- Check search query is at least 2 characters
- Try searching for common terms
- Verify content documents have `metadata.title` and `metadata.description`
- Check creator documents have `displayName` and `verified_creator` fields

---

## 12. Sample Test Data Creation

### Create Test Users

```javascript
// MongoDB Insert
db.users.insertMany([
  {
    displayName: "Test Creator 1",
    email: "creator1@test.com",
    password: "$2b$10$encrypted_hash_1",
    picture: "https://i.pravatar.cc/150?img=1",
    role: "creator",
    verified_creator: true,
    kyc_status: "approved",
    metadata: {
      fullName: "John Smith Creator",
      bio: "Fitness content creator",
      followers: 1200
    },
    isBlacklisted: false
  },
  {
    displayName: "Test Creator 2",
    email: "creator2@test.com",
    password: "$2b$10$encrypted_hash_2",
    picture: "https://i.pravatar.cc/150?img=2",
    role: "creator",
    verified_creator: false,
    kyc_status: "pending",
    metadata: {
      fullName: "Jane Doe Creator",
      bio: "Wellness coach",
      followers: 450
    },
    isBlacklisted: false
  },
  {
    displayName: "Test User 1",
    email: "user1@test.com",
    password: "$2b$10$encrypted_hash_3",
    picture: "https://i.pravatar.cc/150?img=3",
    role: "user",
    verified_creator: false,
    kyc_status: "not_applicable",
    metadata: { fullName: "John Fan" },
    isBlacklisted: false
  },
  {
    displayName: "Test User 2",
    email: "user2@test.com",
    password: "$2b$10$encrypted_hash_4",
    picture: "https://i.pravatar.cc/150?img=4",
    role: "user",
    verified_creator: false,
    kyc_status: "not_applicable",
    metadata: { fullName: "Jane Fan" },
    isBlacklisted: false
  }
])
```

### Create Test Content

```javascript
// MongoDB Insert
db.contents.insertMany([
  {
    user: ObjectId("creator1_id"),
    filename: "fitness_workout_1.mp4",
    s3Key: "uploads/fitness_workout_1.mp4",
    size: 524288000,
    contentType: "video/mp4",
    fileHash: "abc123def456",
    status: "published",
    metadata: {
      title: "Morning Fitness Workout",
      description: "30-minute full body workout for beginners",
      duration: "30:45",
      views: 3200,
      thumbnail: "https://..."
    },
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    user: ObjectId("creator1_id"),
    filename: "yoga_meditation.mp4",
    s3Key: "uploads/yoga_meditation.mp4",
    size: 314572800,
    contentType: "video/mp4",
    fileHash: "def456ghi789",
    status: "published",
    metadata: {
      title: "Yoga and Meditation",
      description: "Relaxing yoga session with meditation",
      duration: "45:30",
      views: 5100,
      thumbnail: "https://..."
    },
    createdAt: new Date(),
    updatedAt: new Date()
  }
])
```

---

**Happy Testing!** 🚀

For issues, check server logs: `tail -f logs/server.log`
