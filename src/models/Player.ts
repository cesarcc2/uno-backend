import { Card } from "./Card";

export interface Player {
    id: string;
    name: string;
    cards: Card[];
    isReadyToPlay: boolean;
    canCallUno: boolean;
    canCallAntiUno: boolean;
    calledUno: boolean;
}