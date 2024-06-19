import { CardColor } from "../constants/CardColor";
import { CardValue } from "../constants/CardValue";

export interface Card {
    id: string,
    value: CardValue,
    color: CardColor,
    hovered: boolean
}