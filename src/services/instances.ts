import { GameService } from "./game.service";
import { PlayerService } from "./player.service";

export const gameServiceInstance: GameService = new GameService();
export const playerServiceInstance: PlayerService = new PlayerService();