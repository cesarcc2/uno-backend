import { Socket } from "socket.io";
import { SocketEventTypes } from "../constants/SocketEvents";
import { gameServiceInstance } from "../services/instances";
import { Game } from "../models/Game";
import { logger } from "..";

export function SocketEvents(socket: Socket) {

  socket.on(SocketEventTypes.PlayerConnected, (data: {metadata: {playerId: string, gameId: string}}) => {
    socket.join(data.metadata.gameId);
    socket.broadcast.to(data.metadata.gameId).emit(SocketEventTypes.SendJoinedGameData, getUpdatedGame(data.metadata.gameId));
    logger.info("Socket - A player connected ");
  });

  socket.on(SocketEventTypes.PlayerDisconnected, (data: {metadata: {playerId: string, gameId: string}}) => {
    socket.broadcast.to(data.metadata.gameId).emit(SocketEventTypes.SendJoinedGameData, getUpdatedGame(data.metadata.gameId));
    logger.info('Socket - A player disconnected ');
  });

  socket.on(SocketEventTypes.PlayerLeft, (data: {metadata: {playerId: string, gameId: string}}) => {
    socket.leave(data.metadata.gameId);
    socket.broadcast.to(data.metadata.gameId).emit(SocketEventTypes.SendJoinedGameData, getUpdatedGame(data.metadata.gameId));
    logger.info('Socket - A player Left ');
  });

  socket.on(SocketEventTypes.PlayerReadyToggle, (data: {metadata: {playerId: string, gameId: string}}) => {
    let updatedGame = togglePlayerReady(data.metadata.playerId, data.metadata.gameId);
    socket.broadcast.to(data.metadata.gameId).emit(SocketEventTypes.SendJoinedGameData, updatedGame);
    socket.emit(SocketEventTypes.SendJoinedGameData, updatedGame);
    logger.info('Socket - A player toggled ready button ');
  });

  socket.on(SocketEventTypes.StartGame, (data: {metadata: {playerId: string, gameId: string}}) => {
    let updatedGame = gameServiceInstance.startGame(data.metadata.gameId);
    socket.broadcast.to(data.metadata.gameId).emit(SocketEventTypes.SendJoinedGameData, updatedGame);
    socket.emit(SocketEventTypes.SendJoinedGameData, updatedGame);
  });

  socket.on(SocketEventTypes.CardHovered, (data: {metadata: {playerId: string, gameId: string}, cardId: string }) => {
    socket.broadcast.to(data.metadata.gameId).emit(SocketEventTypes.CardHovered, data.cardId);
  });

  socket.on(SocketEventTypes.CardNotHovered, (data: {metadata: {playerId: string, gameId: string}}) => {
    socket.broadcast.to(data.metadata.gameId).emit(SocketEventTypes.CardHovered);
  });

  socket.on(SocketEventTypes.CardClicked, (data: {metadata: {playerId: string, gameId: string}, cardId: string }) => {
    gameServiceInstance.cardClicked(data.metadata.playerId, data.metadata.gameId, data.cardId).then(updatedGame => {
      socket.broadcast.to(data.metadata.gameId).emit(SocketEventTypes.GameTurnUpdated, updatedGame);
      socket.emit(SocketEventTypes.GameTurnUpdated, updatedGame);
    }).catch(error => {
      console.log("Card Clicked Error", error);
    });
    socket.broadcast.to(data.metadata.gameId).emit(SocketEventTypes.CardClicked, data.cardId);
  });

  socket.on(SocketEventTypes.DeckHovered, (data: {metadata: {playerId: string, gameId: string}, cardId: string }) => {
    socket.broadcast.to(data.metadata.gameId).emit(SocketEventTypes.DeckHovered, data.cardId);
  });

  socket.on(SocketEventTypes.DeckNotHovered, (data: {metadata: {playerId: string, gameId: string}}) => {
    socket.broadcast.to(data.metadata.gameId).emit(SocketEventTypes.DeckNotHovered);
  });

  socket.on(SocketEventTypes.DeckClicked, (data: {metadata: {playerId: string, gameId: string}}) => {
    gameServiceInstance.deckClicked(data.metadata.playerId, data.metadata.gameId).then(updatedGame => {
      socket.broadcast.to(data.metadata.gameId).emit(SocketEventTypes.GameTurnUpdated, updatedGame);
      socket.emit(SocketEventTypes.GameTurnUpdated, updatedGame);
    }).catch(error => {
      console.log("Deck Clicked Error", error);
    });
    socket.broadcast.to(data.metadata.gameId).emit(SocketEventTypes.DeckClicked);
  });

  socket.on(SocketEventTypes.Uno, (data: {metadata: {playerId: string, gameId: string}}) => {
    gameServiceInstance.playerCalledUno(data.metadata.playerId, data.metadata.gameId).then(updatedGame => {
      socket.broadcast.to(data.metadata.gameId).emit(SocketEventTypes.GameTurnUpdated, updatedGame);
      socket.emit(SocketEventTypes.GameTurnUpdated, updatedGame);
    }).catch(error => {
      console.log("player Called Uno Error", error);
    });
    socket.broadcast.to(data.metadata.gameId).emit(SocketEventTypes.DeckClicked);
  });
  socket.on(SocketEventTypes.AntiUno, (data: {metadata: {playerId: string, gameId: string},targetPlayerId: string}) => {
    gameServiceInstance.playerCalledAntiUno(data.metadata.playerId, data.metadata.gameId, data.targetPlayerId).then(updatedGame => {
      socket.broadcast.to(data.metadata.gameId).emit(SocketEventTypes.GameTurnUpdated, updatedGame);
      socket.emit(SocketEventTypes.GameTurnUpdated, updatedGame);
    }).catch(error => {
      console.log("player Called Anti Uno Error", error);
    });
    socket.broadcast.to(data.metadata.gameId).emit(SocketEventTypes.DeckClicked);
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