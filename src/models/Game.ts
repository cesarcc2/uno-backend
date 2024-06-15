import { GameStatus } from "../constants/GameStatus";
import { Card } from "./Card";
import { Player } from "./Player";

export interface Game {
    id: string,
    shareCode: string,
    status: GameStatus,
    players: Player[],
    drawPile: Card[],
    discardPile: Card[],
    maxNumberOfPlayers: number,
    isPrivate: boolean,
    readyToStart: boolean,
    hostId: string
}