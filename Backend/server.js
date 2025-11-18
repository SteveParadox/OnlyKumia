import express from "express";
import http from "http";
import { Server as SocketIOServer } from "socket.io";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import corsOptions from "./corsConfig.js";

// Config
import sessionMiddleware from "./config/sessionConfig.js";
import "./config/firebaseAdmin.js"; // initializes Firebase admin

// Routers
import authRouter from './Routes/Login.js';
import signupRouter from './Routes/SignUp.js';
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

const app = express();
app.set("trust proxy", 1); // behind proxy fix

const port = process.env.PORT || 8001;
const mongoUri = process.env.DB_URI;
const server = http.createServer(app);

const io = new SocketIOServer(server, {
  cors: { origin: "*" }
});
setIO(io); // pass Socket.IO to messages router

// Middlewares
app.use(express.json());
app.use(cors(corsOptions));
app.use(sessionMiddleware);

// MongoDB connection
mongoose.connect(mongoUri)
  .then(() => console.log("✅ MongoDB connected"))
  .catch(err => console.error("❌ MongoDB connection error:", err));

// API Endpoint example
app.get('/', (req, res) => res.send("Hello World"));

// Protected example
app.get('/api/protected-resource', authMiddleware, (req, res) => {
  const { uid, email, displayName } = req.user || {};
  res.json({
    message: 'Successfully accessed protected resource',
    user: { uid, email, displayName }
  });
});

// Route mounts
app.use('/auth', authRouter);
app.use('/auth', signupRouter);
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

// -------------------
// SOCKET.IO EVENTS
// -------------------
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

// Start server
server.listen(port, () => console.log(`[Server] WebSocket server running on port ${port}`));
