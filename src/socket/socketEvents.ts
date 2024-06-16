import { Socket } from "socket.io";
import { SocketEventTypes } from "../constants/SocketEvents";
import { gameServiceInstance } from "../services/instances";
import { Game } from "../models/Game";
import { logger } from "..";

export function SocketEvents(socket: Socket) {

  socket.on(SocketEventTypes.PlayerConnected, (gameId: string) => {
    socket.join(gameId);
    socket.broadcast.to(gameId).emit(SocketEventTypes.SendJoinedGameData, getUpdatedGame(gameId));
    logger.info("Socket - A player connected ");
  });

  socket.on(SocketEventTypes.PlayerDisconnected, (gameId: string) => {
    socket.broadcast.to(gameId).emit(SocketEventTypes.SendJoinedGameData, getUpdatedGame(gameId));
    logger.info('Socket - A player disconnected ');
  });

  socket.on(SocketEventTypes.PlayerLeft, (gameId: string) => {
    socket.leave(gameId);
    socket.broadcast.to(gameId).emit(SocketEventTypes.SendJoinedGameData, getUpdatedGame(gameId));
    logger.info('Socket - A player Left ');
  });

  socket.on(SocketEventTypes.PlayerReadyToggle, (data: {playerId: string, gameId: string}) => {
    let updatedGame = togglePlayerReady(data.playerId, data.gameId);
    socket.broadcast.to(data.gameId).emit(SocketEventTypes.SendJoinedGameData, updatedGame);
    socket.emit(SocketEventTypes.SendJoinedGameData, updatedGame);
    logger.info('Socket - A player toggled ready button ');
  });

  socket.on(SocketEventTypes.StartGame, (gameId: string) => {
    let updatedGame = gameServiceInstance.startGame(gameId);
    socket.broadcast.to(gameId).emit(SocketEventTypes.SendJoinedGameData, updatedGame);
    socket.emit(SocketEventTypes.SendJoinedGameData, updatedGame);
  });
}

const getUpdatedGame = (gameId: string): Game => {
  let updatedGame = gameServiceInstance.getGameById(gameId);
  return updatedGame!;
}

const togglePlayerReady = (playerId: string, gameId: string): Game => {
  let updatedGame = gameServiceInstance.togglePlayerReady(playerId, gameId);
  return updatedGame!;
}