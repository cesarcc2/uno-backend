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
            return ResponseHandler(res, 200, "Player created", {player: player});
        }).catch((error) => {
            logger.error({message: errorMessages.createPlayer, data: error});
            return ErrorHandler(res, 500, error, "Error creating player");
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
    updatePlayer = "Player updated",
}

enum errorMessages {
    createPlayer = "Error creating player",
    updatePlayer = "Error updating player",
}