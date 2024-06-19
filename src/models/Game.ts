import { GameStatus } from "../constants/GameStatus";
import { Card } from "./Card";
import { Player } from "./Player";

export interface Game {
    id: string,
    hostId: string
    shareCode: string,
    status: GameStatus,
    players: Player[],
    drawPile: Card[],
    discardPile: Card[],
    maxNumberOfPlayers: number,
    isPrivate: boolean,
    readyToStart: boolean,
    turnOrder: string[],
    currentTurnNumber: number,
    currentTurnPlayerId: string,
    winnerId: string | undefined,
    playerPickingColor: string | undefined
}