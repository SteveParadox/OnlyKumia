import express from "express";
import http from "http";
import { Server as SocketIOServer } from "socket.io";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";

// Routers
import authRouter from './Routes/Login.js';
import CardRouter from './Routes/Cards.js';
import UploadRouter from './Routes/dataUpload.js';
import moderationRouter from './Routes/moderation.js';
import paymentsRouter from './Routes/payments.js';
import streamsRouter from './Routes/streams.js';
import messagesRouter, { setIO } from './Routes/messages.js';
import tipsRouter from './Routes/tips.js';
import searchRouter from './Routes/search.js';
import adminRouter from './Routes/admin.js';
import exportRouter from './Routes/export.js';

// Middleware
import authMiddleware from './Auth/authMiddleware.js';

dotenv.config();

// App config
const app = express();
app.set("trust proxy", 1); // Fix for express-rate-limit warnings behind proxies

const port = process.env.PORT || 8001;
const uri = process.env.DB_URI;
const server = http.createServer(app);

const io = new SocketIOServer(server, {
  cors: { origin: "*" }
});

// Pass Socket.IO instance to messages router
setIO(io);

// Middlewares
app.use(express.json());
app.use(cors({
  origin: [/\.app\.github\.dev$/, 'http://localhost:3000', 'http://localhost:8001'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Protected route example
app.get('/api/protected-resource', authMiddleware, (req, res) => {
  const { uid, email, displayName } = req.user || {};
  res.json({
    message: 'Successfully accessed protected resource',
    user: { uid, email, displayName }
  });
});

// MongoDB connection
mongoose.connect(uri)
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.error("MongoDB connection error:", err));

// API Endpoint
app.get('/', (req, res) => res.send("Hello World"));

// Route mounts
app.use('/auth', authRouter);
app.use('/cards', CardRouter);
app.use('/uploads', UploadRouter);
app.use('/moderation', moderationRouter);
app.use('/payments', paymentsRouter);
app.use('/streams', streamsRouter);
app.use('/messages', messagesRouter);
app.use('/tips', tipsRouter);
app.use('/search', searchRouter);
app.use('/admin', adminRouter);
app.use('/export', exportRouter);

// Socket.IO events
io.on("connection", (socket) => {
  console.log(`[WS] User connected: ${socket.id}`);

  // USER PRESENCE
  socket.on("user:join", ({ userId }) => {
    if (!userId) return;
    socket.join(`user_${userId}`);
    console.log(`[WS] User ${userId} joined personal room`);
    socket.broadcast.emit('user:online', { userId, timestamp: new Date() });
  });

  socket.on("disconnect", () => console.log(`[WS] User disconnected: ${socket.id}`));

  // STREAM CHAT & TIPPING
  socket.on("joinStream", ({ streamId }) => streamId && socket.join(`stream_${streamId}`));
  socket.on("chatMessage", ({ streamId, message, user }) => {
    if (streamId && message) io.to(`stream_${streamId}`).emit("chatMessage", { message, user, timestamp: new Date() });
  });
  socket.on("tip", ({ creatorId, amount, user }) => {
    if (creatorId && amount) io.to(`creator_${creatorId}`).emit("tip", { amount, user, timestamp: new Date() });
  });
  socket.on("joinCreator", ({ creatorId }) => creatorId && socket.join(`creator_${creatorId}`));

  // DIRECT MESSAGING
  socket.on("message:send", ({ toUserId, content, messageId }) => {
    if (toUserId && content) io.to(`user_${toUserId}`).emit("message:new", { messageId, content, timestamp: new Date(), conversationId: toUserId });
  });
  socket.on("typing:start", ({ toUserId, fromUser }) => toUserId && io.to(`user_${toUserId}`).emit("typing:start", { fromUser, timestamp: new Date() }));
  socket.on("typing:stop", ({ toUserId, fromUser }) => toUserId && io.to(`user_${toUserId}`).emit("typing:stop", { fromUser, timestamp: new Date() }));
  socket.on("message:read", ({ messageId, fromUserId }) => fromUserId && io.to(`user_${fromUserId}`).emit("message:read", { messageId, timestamp: new Date() }));
  socket.on("unread:fetch", ({ userId }) => userId && socket.emit("unread:fetch", { userId }));

  // PRESENCE & STATUS
  socket.on("presence:update", ({ userId, status }) => io.emit("presence:update", { userId, status, timestamp: new Date() }));

  // CONVERSATION UPDATES
  socket.on("conversation:update", ({ conversationId, lastMessage }) => conversationId && io.to(`conversation_${conversationId}`).emit("conversation:update", { conversationId, lastMessage, timestamp: new Date() }));
  socket.on("conversation:join", ({ conversationId }) => conversationId && socket.join(`conversation_${conversationId}`));
});

server.listen(port, () => console.log(`[Server] WebSocket server initialized on port ${port}`));
