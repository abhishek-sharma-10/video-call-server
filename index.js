const express = require('express');
const bodyParser = require('body-parser');
const { Server } = require('socket.io');

const io = new Server({
    cors: true
});
const app = express();

app.use(bodyParser.json());

const emailToSocketMapping = new Map();
const socketToEmailMapping = new Map();

io.on('connection', (socket) => {
    console.log('--New Connection--');
    socket.on('join-room', (data) => {
        const { emailId, roomId } = data;
        emailToSocketMapping.set(emailId, socket.id);
        socketToEmailMapping.set(socket.id, emailId);
        console.log('Email', emailId, 'joined room', roomId);
        socket.join(roomId);
        io.to(socket.id).emit('joined-room', { roomId })
        io.to(roomId).emit("user-joined", { emailId, socketId: socket.id });
    });

    // socket.on('call-user', (data) => {
    //     const { emailId, offer } = data;
    //     const socketId = emailToSocketMapping.get(emailId);
    //     const fromEmail = socketToEmailMapping.get(socket.id);
    //     console.log('EmailId: ', emailId, 'FromEmail: ', fromEmail);
    //     socket.to(socketId).emit("incoming-call", { from: fromEmail, offer });
    // });

    // socket.on('call-accept', (data) => {
    //     const { to, answer } = data;
    //     const socketId = emailToSocketMapping.get(emailId);
    //     socket.to(socketId).emit("call-accepted", { answer });
    // });

    socket.on('call-user', (data) => {
        const { to, offer } = data;
        console.log('to: ', to);
        io.to(to).emit("incoming-call", { from: socket.id, offer });
    });

    socket.on('call-accept', (data) => {
        const { to, answer } = data;
        io.to(to).emit("call-accepted", { from: socket.id, answer });
    });

    socket.on('peer-nego-need', ({ to, offer }) => {
        io.to(to).emit('peer-nego-incoming', { from: socket.id, offer });
    });

    socket.on('peer-nego-done', ({ to, answer }) => {
        io.to(to).emit('peer-nego-final', { from: socket.id, answer });
    });
});

app.listen(8000, () => console.log('HTTP Server running on port 8000'));
io.listen(8001);