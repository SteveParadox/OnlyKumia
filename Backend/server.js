import express from "express";
import http from "http";
import adminRouter from './Routes/admin.js';
import exportRouter from './Routes/export.js';
import { Server as SocketIOServer } from "socket.io";
import mongoose from "mongoose";
import cors from "cors"
import corsOptions from './corsConfig.js';

import googleLoginRouter from './Routes/Login.js';
import signUpRouter from './Routes/SignUp.js';
import CardRouter from './Routes/Cards.js';
import UploadRouter from './Routes/dataUpload.js';
import User from './DB/User.js';
import authMiddleware from './Auth/authMiddleware.js';
import moderationRouter from './Routes/moderation.js';
import paymentsRouter from './Routes/payments.js';
import streamsRouter from './Routes/streams.js';
import messagesRouter from './Routes/messages.js';
import tipsRouter from './Routes/tips.js';


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


//Db Config
mongoose.connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})


//Api Endpoint
app.get('/', (req, res) => res.status(200).
send(
"   Hello World"
));

app.use('/auth', googleLoginRouter);
app.use('/auth', signUpRouter);
app.use('/cards', CardRouter);
app.use('/uploads', UploadRouter);
app.use('/moderation', moderationRouter);
app.use('/payments', paymentsRouter);
app.use('/streams', streamsRouter);
app.use('/messages', messagesRouter);
app.use('/tips', tipsRouter);
app.use('/admin', adminRouter);
app.use('/export', exportRouter);


// Listener
server.listen(port, () => console.log(`listening on localhost: ${port}`));
// WebSocket event handlers
io.on("connection", (socket) => {
    // Join stream room for chat
    socket.on("joinStream", ({ streamId }) => {
        if (streamId) socket.join(`stream_${streamId}`);
    });
    // Chat message relay
    socket.on("chatMessage", ({ streamId, message, user }) => {
        if (streamId && message) {
            io.to(`stream_${streamId}`).emit("chatMessage", { message, user });
        }
    });
    // Tip relay
    socket.on("tip", ({ creatorId, amount, user }) => {
        if (creatorId && amount) {
            io.to(`creator_${creatorId}`).emit("tip", { amount, user });
        }
    });
    // Join creator room for tips
    socket.on("joinCreator", ({ creatorId }) => {
        if (creatorId) socket.join(`creator_${creatorId}`);
    });
});

