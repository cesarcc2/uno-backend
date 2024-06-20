import express from 'express';
import { Server } from "socket.io";
import cors from 'cors'; 
import pino from 'pino'
import { gameRoutes } from './routes/game.route';
import { playerRoutes } from './routes/player.route';
import { SocketEvents } from './socket/socketEvents';
export const logger = pino();
const PORT = process.env.PORT || 3000
const app = express();
const server = require('http').createServer(app);
export const io = new Server(server,{cors: {
  origin: "http://localhost:4200",
}});

app.use(express.json());

app.use(cors({
  origin: true,
  credentials: true,
  methods: 'POST,GET,PUT,OPTIONS,DELETE'
}));

// Use room routes
app.use('/api/games', gameRoutes);
app.use('/api/players', playerRoutes);

io.on('connection', (socket) => {
  SocketEvents(socket);
});

server.listen(PORT);

