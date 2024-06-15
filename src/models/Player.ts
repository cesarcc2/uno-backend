import { Card } from "./Card";

export interface Player {
    id: string;
    name: string;
    cards: Card[];
    calledUno: boolean;
    isReadyToPlay: boolean;
}