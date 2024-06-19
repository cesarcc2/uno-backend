import { Player } from "../models/Player";
import { generateId } from "../utils/idGenerator";
import { uniqueNamesGenerator, adjectives, colors, animals, names } from 'unique-names-generator';

export class PlayerService {
    private players: Player[] = [];

    constructor() {}

    createPlayer(name: string): Promise<Player>  {
        return new Promise((resolve,reject) => {
            const player: Player = {
                id: generateId(this.players),
                name: name ? name : generateRandomUsername(),
                cards: [],
                isReadyToPlay: false,
                calledUno: false,
                canCallUno: false,
                canCallAntiUno: false
            }

            console.log("Created Player ", player);
            this.players.push(player);
            resolve(player);
        });
    }

    recreatePlayer(player: Player): Promise<Player> {
        return new Promise((resolve,reject) => {
            if(this.players.find((p) => p.id === player.id)) {
                player.id = generateId(this.players);
            }
            player.isReadyToPlay = false;
            player.calledUno = false;
            player.cards = [];

            console.log("Recreated Player ", player);

            this.players.push(player);
            resolve(player);
        });
    }

    getPlayer(id: string): Player | undefined {
        return this.players.find((p) => p.id === id);
    }

    updatePlayer(player: Player): Promise<Player> {
        return new Promise((resolve,reject) => {
            const index = this.players.findIndex((p) => p.id === player.id);
            if(index === -1) {
                reject("Player not found");
            }
            console.log("Current index ", index);
            console.log("Current player ", this.players[index]);
            console.log("Updated player ", player);
            this.players[index] = player;
            resolve(player);
        });
    }
}
const generateRandomUsername = (): string => {
    let randomName = uniqueNamesGenerator({
        dictionaries: [adjectives, animals, colors, names],
        length: 2
    });
    return randomName;
}
