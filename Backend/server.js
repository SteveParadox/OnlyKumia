import express from "express";
import http from "http";
import adminRouter from './Routes/admin.js';
import exportRouter from './Routes/export.js';
import { Server as SocketIOServer } from "socket.io";
import mongoose from "mongoose";
import cors from "cors";
import corsOptions from './corsConfig.js';

import authRouter from './Routes/Login.js'; // <-- consolidated auth routes
import CardRouter from './Routes/Cards.js';
import UploadRouter from './Routes/dataUpload.js';
import User from './DB/User.js';    
import authMiddleware from './Auth/authMiddleware.js';
import moderationRouter from './Routes/moderation.js';
import paymentsRouter from './Routes/payments.js';
import streamsRouter from './Routes/streams.js';
import messagesRouter from './Routes/messages.js';
import tipsRouter from './Routes/tips.js';
import searchRouter from './Routes/search.js';
import { setIO } from './Routes/messages.js';

import dotenv from 'dotenv';
dotenv.config();

// App Config
const app = express();
const port = process.env.PORT || 8001;
const uri = process.env.DB_URI;
const server = http.createServer(app);
const io = new SocketIOServer(server, {
    cors: { origin: "*" }
});

// Pass io instance to messages router for WebSocket emission
setIO(io);

// Middlewares
app.use(express.json());
app.use(cors(corsOptions));

// Protected route example
app.get('/api/protected-resource', authMiddleware, (req, res) => {
    try {
        const { uid, email, displayName } = req.user;
        res.json({ 
            message: 'Successfully accessed protected resource', 
            user: { uid, email, displayName }
        });
    } catch (error) {
        console.error('Error accessing protected resource:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// DB Config
mongoose.connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

// API Endpoint
app.get('/', (req, res) => res.status(200).send("Hello World"));

// Route mounts
app.use('/auth', authRouter);          // <-- all auth routes in one place
app.use('/cards', CardRouter);
app.use('/uploads', UploadRouter);
app.use('/moderation', moderationRouter);
app.use('/payments', paymentsRouter);
app.use('/streams', streamsRouter);
app.use('/messages', messagesRouter);
app.use('/tips', tipsRouter);
app.use('/search', searchRouter);       // <-- NEW search route
app.use('/admin', adminRouter);
app.use('/export', exportRouter);

// Listener
server.listen(port, () => console.log(`listening on localhost: ${port}`));

// WebSocket event handlers
/**
 * Real-time messaging, typing indicators, and presence tracking
 */
io.on("connection", (socket) => {
    console.log(`[WS] User connected: ${socket.id}`);

    // ========================================
    // 1. USER CONNECTION & PRESENCE
    // ========================================
    
    // User joins their personal room for receiving messages
    socket.on("user:join", ({ userId }) => {
        if (userId) {
            socket.join(`user_${userId}`);
            console.log(`[WS] User ${userId} joined personal room`);
            
            // Notify others this user is online (optional: emit to friends list)
            socket.broadcast.emit('user:online', { userId, timestamp: new Date() });
        }
    });

    // User leaves (disconnect)
    socket.on("disconnect", () => {
        console.log(`[WS] User disconnected: ${socket.id}`);
    });

    // ========================================
    // 2. STREAM CHAT & TIPPING
    // ========================================
    
    // Join stream room for chat
    socket.on("joinStream", ({ streamId }) => {
        if (streamId) {
            socket.join(`stream_${streamId}`);
            console.log(`[WS] User joined stream: ${streamId}`);
        }
    });

    // Chat message relay
    socket.on("chatMessage", ({ streamId, message, user }) => {
        if (streamId && message) {
            io.to(`stream_${streamId}`).emit("chatMessage", { 
                message, 
                user,
                timestamp: new Date()
            });
            console.log(`[WS] Stream ${streamId} message from ${user.name}`);
        }
    });

    // Tip relay
    socket.on("tip", ({ creatorId, amount, user }) => {
        if (creatorId && amount) {
            io.to(`creator_${creatorId}`).emit("tip", { amount, user, timestamp: new Date() });
            console.log(`[WS] Tip to creator ${creatorId}: $${amount}`);
        }
    });

    // Join creator room for tips
    socket.on("joinCreator", ({ creatorId }) => {
        if (creatorId) socket.join(`creator_${creatorId}`);
    });

    // ========================================
    // 3. DIRECT MESSAGING (Real-time)
    // ========================================

    // Send real-time message to specific user
    socket.on("message:send", ({ toUserId, content, messageId }) => {
        if (toUserId && content) {
            // Emit to recipient's personal room
            io.to(`user_${toUserId}`).emit("message:new", {
                messageId,
                content,
                timestamp: new Date(),
                conversationId: toUserId
            });
            console.log(`[WS] Message sent to user ${toUserId}`);
        }
    });

    // Typing indicator
    socket.on("typing:start", ({ toUserId, fromUser }) => {
        if (toUserId && fromUser) {
            io.to(`user_${toUserId}`).emit("typing:start", {
                fromUser,
                timestamp: new Date()
            });
        }
    });

    socket.on("typing:stop", ({ toUserId, fromUser }) => {
        if (toUserId && fromUser) {
            io.to(`user_${toUserId}`).emit("typing:stop", {
                fromUser,
                timestamp: new Date()
            });
        }
    });

    // Mark message as read
    socket.on("message:read", ({ messageId, fromUserId }) => {
        if (fromUserId) {
            io.to(`user_${fromUserId}`).emit("message:read", {
                messageId,
                timestamp: new Date()
            });
            console.log(`[WS] Message ${messageId} marked as read`);
        }
    });

    // Request unread count (sender will respond with badge:update)
    socket.on("unread:fetch", ({ userId }) => {
        if (userId) {
            socket.emit("unread:fetch", { userId });
            console.log(`[WS] Unread count requested for user ${userId}`);
        }
    });

    // ========================================
    // 4. PRESENCE & STATUS
    // ========================================

    // Broadcast that user is currently typing a message
    socket.on("presence:update", ({ userId, status }) => {
        io.emit("presence:update", {
            userId,
            status, // 'online', 'typing', 'away', 'offline'
            timestamp: new Date()
        });
    });

    // ========================================
    // 5. CONVERSATION LIST UPDATES
    // ========================================

    // When a conversation is updated (new message), notify all participants
    socket.on("conversation:update", ({ conversationId, lastMessage }) => {
        io.to(`conversation_${conversationId}`).emit("conversation:update", {
            conversationId,
            lastMessage,
            timestamp: new Date()
        });
    });

    // Join a specific conversation room
    socket.on("conversation:join", ({ conversationId }) => {
        if (conversationId) {
            socket.join(`conversation_${conversationId}`);
            console.log(`[WS] User joined conversation: ${conversationId}`);
        }
    });
});

console.log(`[Server] WebSocket server initialized on port ${port}`);
