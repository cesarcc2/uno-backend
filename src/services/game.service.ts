import { generateId } from '../utils/idGenerator';
import { GameStatus } from '../constants/GameStatus';
import { Game } from '../models/Game';
import { Card } from '../models/Card';
import { CardColor } from '../constants/CardColor';
import { CardValue } from '../constants/CardValue';
import { playerServiceInstance } from './instances';

export class GameService {
    private games: Game[] = [];

    constructor() {}

    getAll(): Promise<Game[]> {
        return new Promise((resolve, reject) => {
            const games = this.games.filter(game => !game.isPrivate);
            resolve(games);
        });
    }
    createGame(playerId: string, isPrivate: boolean): Promise<Game> {
        return new Promise((resolve, reject) => {
            const game: Game = {
                id: generateId(this.games),
                shareCode: getUniqueShareCode(this.games),
                status: GameStatus.WaitingForPlayers,
                players: [],
                drawPile: [],
                discardPile: [],
                maxNumberOfPlayers: 4,
                isPrivate: isPrivate,
                readyToStart: false,
                hostId: playerId
            };
            this.games.push(game);
            resolve(game);
        });
    }

    createGameAndJoin(playerId: string, isPrivate: boolean): Promise<Game> {
        return new Promise((resolve, reject) => {
            this.createGame(playerId, isPrivate).then((createdGame: Game) => {
                this.joinGame(playerId, createdGame).then((game: Game) => {
                    resolve(game);
                }).catch(error => {
                    this.deleteGame(createdGame.id);
                    reject(error);
                });
            }).catch(error => {
                reject(error);
            });
        });
    }

    joinGame(playerId: string, game: Game | string | undefined): Promise<Game> {
        return new Promise((resolve,reject) => {
            if(typeof game === 'string') {
                if(game.length == 6) {
                    game = <Game | undefined>this.getGameByShareCode(game);
                } else {
                    game = <Game | undefined>this.getGameById(game);
                }
            }
            if(!game) {
                reject("Game not found");
            }
            const player = playerServiceInstance.getPlayer(playerId);
            if(!player) {
                reject("Player not found");
            }
            game!.players.push(player!);
            resolve(game!);
        });
    }

    leaveGame(playerId: string, game: Game | string | undefined): Promise<{game: Game | undefined, gamesList: Game[]}> {
        return new Promise((resolve,reject) => {
            if(typeof game === 'string') {
                if(game.length == 6) {
                    game = <Game | undefined>this.getGameByShareCode(game);
                } else {
                    game = <Game | undefined>this.getGameById(game);
                }
            }
            if(!game) {
                reject("Game not found");
            }
            const player = playerServiceInstance.getPlayer(playerId);
            if(!player) {
                reject("Player not found");
            }

            if(player?.isReadyToPlay) {
                player.isReadyToPlay = false;
            }

            game!.players = game!.players.filter((p) => p.id !== player!.id);
            if(game?.players.length == 0) {
                this.deleteGame(game.id);
                game = undefined;
            } else {
                game!.hostId =  game!.players[0].id;
            }
            resolve({game: game, gamesList: this.games});
        });
    }

    quickJoin(playerId: string): Promise<Game> {
        return new Promise((resolve, reject) => {
            const availableGames = this.games.filter(game => {
                if(!game.isPrivate && game.status === GameStatus.WaitingForPlayers && game.players.length < 4) {
                    return game;
                }
            });
            
            if(availableGames.length == 0) {
                this.createGameAndJoin(playerId, false).then((game: Game) => {
                    console.log("created game and joined on quickjoin ", game);
                    resolve(game);
                }).catch(error => {
                    console.log("created game and joined on quickjoin error");
                    reject(error);
                });
                return;
            }

            const randomGame = availableGames[Math.floor(Math.random() * availableGames.length)];
            
            this.joinGame(playerId, randomGame).then((game: Game) => {
                resolve(game);
            }).catch(error => {
                reject(error);
            });
        });
    }

    getGameById(id: string): Game | undefined {
        return this.games.find((g) => g.id === id)
    }

    getGameByShareCode(shareCode: string): Game | undefined {
        return this.games.find((g) => g.shareCode === shareCode)
    }

    deleteGame(id: string) {
        this.games = this.games.filter((g) => g.id !== id);
    }

    togglePlayerReady(playerId: string, gameId: string): Game {
        let game = this.getGameById(gameId)
        game!.players.find((p) => p.id === playerId)!.isReadyToPlay = !this.getGameById(gameId)!.players.find((p) => p.id === playerId)!.isReadyToPlay;
        game!.readyToStart = this.checkIfGameIsReadyToStart(game!);
        return game!;
    }

    checkIfGameIsReadyToStart(game: Game): boolean {
        return game.players.every((player) => {
            return player.isReadyToPlay;
        })
    }
}

const getUniqueShareCode = (games: Array<any>): string => {
    if(games.length == 0 ) {
        return createShareCode();
    }
    
    const shareCodes = new Set(games.map((item: Game) => item.shareCode));
    let uniqueShareCode: string;
  
    do {
        uniqueShareCode = createShareCode();
    } while (shareCodes.has(uniqueShareCode));
  
    return uniqueShareCode;
  };

const createShareCode = (): string => {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;
    let counter = 0;
    while (counter < 6) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
      counter += 1;
    }
    return result;
}


const createDrawPile = (): Card[] => {
    const drawPile: Card[] = [];

    const cardColors = Object.keys(CardColor)

    cardColors.forEach((key) => {
        if(key == "Wild") {
            // create 4 wild cards and 4 wild draw four cards
            for(let i = 0; i < 8; i++) {
                drawPile.push({
                    id: generateId(drawPile),
                    value: i < 4 ? CardValue.Wild : CardValue.WildDrawFour,
                    color: CardColor.Wild
                })
            }
        } else {
            for(let i = 1; i < 13; i++) {
                let card: Card = {
                    id: generateId(drawPile),
                    value: i,
                    color: CardColor[key]
                }
                drawPile.push(card,card)
            }
        }
    });

    return drawPile;
}