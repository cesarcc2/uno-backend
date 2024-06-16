import { Request, Response } from "express";
import { ErrorHandler } from "../utils/errorHandler";
import { ResponseHandler } from "../utils/responseHandler";
import { gameServiceInstance } from "../services/instances";
import { Game } from "../models/Game";
import { logger } from "..";

export const gameController  = {
    get: (req: Request, res: Response) => {
        gameServiceInstance.getAll().then((games: Game[]) => {
            // logger.info({message: successMessages.GetAll, data: games});
            return ResponseHandler(res, 200, successMessages.GetAll, {games: games});
        });
    },
    create : (req: Request, res: Response) => {
        const {playerId, isPrivate} = req.body;
        gameServiceInstance.createGameAndJoin(playerId, isPrivate).then((game: Game) => {
            logger.info({message: successMessages.CreateGameAndJoin, data: game.id});
            return ResponseHandler(res, 200, successMessages.CreateGameAndJoin, {game: game});
        }).catch((error) => {
            logger.error({message: errorMessages.CreateGameAndJoin, data: error});
            return ErrorHandler(res, 500, error, errorMessages.CreateGameAndJoin);
        });
    },
    join: (req: Request, res: Response) => {
        const {playerId, gameId} = req.body;
        gameServiceInstance.joinGame(playerId, gameId).then((game: Game) => {
            logger.info({message: successMessages.JoinGame, data: {playerId: playerId, game: game.id}});
            return ResponseHandler(res, 200, successMessages.JoinGame, {game: game});
        }).catch((error) => {
            logger.error({message: errorMessages.JoinGame, data: error});
            return ErrorHandler(res, 500, error, errorMessages.JoinGame);
        }); 
    },
    leave: (req: Request, res: Response) => {
        const {playerId, gameId} = req.body;
        gameServiceInstance.leaveGame(playerId, gameId).then((data: { game: Game | undefined, gamesList: Game[] }) => {
            logger.info({message: successMessages.LeaveGame, data: {playerId: playerId, game: data.game, gamesList: data.gamesList}});
            return ResponseHandler(res, 200, successMessages.LeaveGame, {game: data.game, gamesList: data.gamesList});
        }).catch((error) => {
            logger.error({message: errorMessages.LeaveGame, data: error});
            return ErrorHandler(res, 500, error, errorMessages.LeaveGame);
        }); 
    },
    quickJoin: (req: Request, res: Response) => {
        const {playerId} = req.body;
        gameServiceInstance.quickJoin(playerId).then((game: Game) => {
            console.log('controller quickjoin success');
            logger.info({message: successMessages.QuickJoin, data: {playerId: playerId, game: game.id}});
            return ResponseHandler(res, 200, successMessages.QuickJoin, {game: game});
        }).catch((error) => {
            console.log('controller quickjoin error');
            logger.error({message: errorMessages.QuickJoin, data: error});
            return ErrorHandler(res, 500, error, errorMessages.QuickJoin);
        }); 
    },
    start: (req: Request, res: Response) => {

    }
}

enum successMessages {
    GetAll = "Got All Games",
    CreateGameAndJoin = "Game created and joined",
    JoinGame = "Joined game",
    LeaveGame = "Left game",
    StartGame = "Started game",
    QuickJoin = "Quick joined a random game"
}

enum errorMessages {
    GetAll = "Error getting all games",
    CreateGameAndJoin = "Error creating game",
    JoinGame = "Error joining game",
    LeaveGame = "Error leaving game",
    StartGame = "Error starting game",
    QuickJoin = "Failed to quick join a random game"
}