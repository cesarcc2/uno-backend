import { Request, Response } from "express";
import { ErrorHandler } from "../utils/errorHandler";
import { ResponseHandler } from "../utils/responseHandler";
import { playerServiceInstance } from "../services/instances";
import { logger } from "..";
import { Player } from "../models/Player";

export const playerController  = {
    get: (req: Request, res: Response) => {
        const playerId: string = req.params.id;
        let player = playerServiceInstance.getPlayer(playerId);
        if(!player) {
            return ErrorHandler(res, 404, "Player not found");
        }
        return ResponseHandler(res, 200, "Player found", {player: player});
    },
    create : (req: Request, res: Response) => {
        const name: string = req.body.name;
        playerServiceInstance.createPlayer(name).then((player) => {
            // logger.info({message: successMessages.createPlayer, data: player});
            return ResponseHandler(res, 200, successMessages.createPlayer, {player: player});
        }).catch((error) => {
            logger.error({message: errorMessages.createPlayer, data: error});
            return ErrorHandler(res, 500, error, errorMessages.createPlayer);
        });
    },
    recreate: (req: Request, res: Response) => {
        const player: Player = req.body.player;
        playerServiceInstance.recreatePlayer(player).then((player) => {
            return ResponseHandler(res, 200, successMessages.recreatePlayer, {player: player});
        }).catch((error) => {
            logger.error({message: errorMessages.recreatePlayer, data: error});
            return ErrorHandler(res, 500, error, errorMessages.recreatePlayer);
        });
    },
    update: (req: Request, res: Response) => {
        const playerUpdated: Player = req.body.player;
        playerServiceInstance.updatePlayer(playerUpdated).then((player) => {
            // logger.info({message: successMessages.updatePlayer, data: player});
            return ResponseHandler(res, 200, "Player updated", {player: player});
        }).catch((error) => {
            logger.error({message: errorMessages.updatePlayer, data: error});
            return ErrorHandler(res, 500, error, "Error updating player");
        });
    }
}


enum successMessages {
    createPlayer = "Player created",
    recreatePlayer = "Player recreated",
    updatePlayer = "Player updated",
}

enum errorMessages {
    createPlayer = "Error creating player",
    recreatePlayer = "Error recreating player",
    updatePlayer = "Error updating player",
}