import { generateId } from '../utils/idGenerator';
import { GameStatus } from '../constants/GameStatus';
import { Game } from '../models/Game';
import { Card } from '../models/Card';
import { CardColor } from '../constants/CardColor';
import { CardValue } from '../constants/CardValue';
import { playerServiceInstance } from './instances';
import { Player } from '../models/Player';

export class GameService {
    private games: Game[] = [];
    private colorPicked: CardColor.Blue | CardColor.Green | CardColor.Red | CardColor.Yellow | undefined;

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
                hostId: playerId,
                turnOrder: [],
                currentTurnNumber: 0,
                currentTurnPlayerId: '',
                winnerId: undefined,
                playerPickingColor: undefined
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

    startGame(gameId: string): Game {
        let game = this.getGameById(gameId)!;
        if(game.readyToStart) {
            game.status = GameStatus.InProgress;
            game.drawPile = this.createDrawPile(game);
            game.discardPile = [];
            this.shuffleCards(game);

            let playersShuffled = <Player[]>shuffle(game.players);
            game.players = playersShuffled;
            game.turnOrder = playersShuffled.map(player => player.id);
            game.currentTurnNumber = 1;
            game.currentTurnPlayerId = game.turnOrder[0];

            this.dealCardsToPlayers(game);

            this.getStarterCard(game);


        }
        return game;
    }

    getStarterCard(game: Game) {
        if(game.discardPile.length > 0) {
            return;
        }
        const starterCard = game.drawPile.pop();
        if(starterCard?.value == CardValue.WildDrawFour) {
            game.discardPile.push(starterCard!);
            this.getStarterCard(game);
        }
        game.discardPile.push(starterCard!);
        if(starterCard?.value == CardValue.DrawTwo) {
            game.players.find((p) => p.id == game.currentTurnPlayerId)!.cards.push(game.drawPile.pop()!, game.drawPile.pop()!);
            game.currentTurnPlayerId = game.turnOrder[1];
            game.currentTurnNumber++;
        }
    }

    dealCardsToPlayers(game: Game) {
        game.players.forEach((player) => {
            for(let i = 0; i < 7; i++) {
                player.cards.push(game.drawPile.pop()!);
            }
        })
    }

    shuffleCards(game: Game) {
        game.drawPile = shuffle(shuffle(game.drawPile));
    }

    createDrawPile(game: Game): Card[] {
        const drawPile: Card[] = [];
    
        const cardColors = Object.keys(CardColor)
    
        cardColors.forEach((key) => {
            if(key == "Wild") {
                // create 4 wild cards and 4 wild draw four cards
                for(let i = 0; i < 8; i++) {
                    let card: Card = {
                        id: generateId(game.drawPile),
                        value: i < 4 ? CardValue.Wild : CardValue.WildDrawFour,
                        color: CardColor.Wild,
                        hovered: false
                    }
                    drawPile.push(card);
                }
            } else {
                for(let i = 1; i < 13; i++) {
                    let card: Card = {
                        id: generateId(game.drawPile),
                        value: i,
                        color: CardColor[key],
                        hovered: false
                    }
                    drawPile.push(card);
                    drawPile.push({...card, id: generateId(game.drawPile)})
                }
            }
        });
        return drawPile;
    }

    cardClicked(playerId: string, gameId: string, cardId: string): Promise<Game> {
        return new Promise<Game>((resolve, reject) => {
            let game = this.getGameById(gameId)!;
            let player = game.players.find((p) => p.id === playerId)!;
            let card = player.cards.find((c) => c.id === cardId)!;
            if(game.currentTurnPlayerId != player.id) {
                reject("Not your turn");
                return;
            }
            if(!card) {
                reject("Card not found");
                return;
            }

            // checkIfTimeDidNotRunout(); // Have request time into account so internet connection does not affect gameplay timer
            
            if(
                (card.value == CardValue.Wild || card.value == CardValue.WildDrawFour)
                ||
                !this.colorPicked &&(card.value == game.discardPile[game.discardPile.length - 1].value || card.color == game.discardPile[game.discardPile.length - 1].color || game.discardPile[game.discardPile.length - 1].color == CardColor.Wild)
                ||
                this.colorPicked && (card.color == this.colorPicked)
            ) {
                game.discardPile.push(card);
                player.cards = player.cards.filter((c) => c.id !== card.id);
            } else {
                reject("Invalid card");
                return;
            }

            let reversingWith2Players = false;
            if(card.value == CardValue.Reverse) {
                if(game.players.length == 2) {
                    reversingWith2Players = true
                } else {
                    game.turnOrder = game.turnOrder.reverse();
                }
            }

            let currentTurnIndex = game.turnOrder.findIndex((id) => id == player.id)!;
            
            
            let playerPunishedIndex =  currentTurnIndex + 1;
            if(  playerPunishedIndex >= game.turnOrder.length) {
                let difference = playerPunishedIndex - game.turnOrder.length
                playerPunishedIndex = difference;
            }

            if(card.value == CardValue.WildDrawFour || card.value == CardValue.DrawTwo) {
                let numberOfCardsToDraw = card.value == CardValue.WildDrawFour ? 4 : 2;
                if(player.canCallUno && player.cards.length > 1) {
                    player.canCallUno = false;
                }
                if(player.calledUno && player.cards.length > 1) {
                    player.calledUno = false;
                }
                for(let i = 0; i < numberOfCardsToDraw; i++) {
                    game.players[game.players.findIndex((p) => p.id == game.turnOrder[playerPunishedIndex])!].cards.push(game.drawPile.pop()!);
                    if(game.drawPile.length == 0) {
                        game = this.resetDrawPile(game);
                    }
                }
            }

            game.playerPickingColor = undefined;
            if(card.color == CardColor.Wild) {
                game.playerPickingColor = player.id;
            }
            
            let nextTurnIndex = currentTurnIndex +(card.value == CardValue.DrawTwo || card.value == CardValue.WildDrawFour || card.value == CardValue.Skip || reversingWith2Players == true ? 2 : 1);
            if(  nextTurnIndex >= game.turnOrder.length) {
                let difference = nextTurnIndex - game.turnOrder.length
                nextTurnIndex = difference;
            }
            let playerOfNextTurnId = game.turnOrder[nextTurnIndex];
            game.currentTurnPlayerId = playerOfNextTurnId;
            game.currentTurnNumber++;

            if(player.cards.length == 1) {
                player.canCallUno = true;
                game.players.forEach(player => {
                    if(player.id != player.id) {
                        player.canCallAntiUno = true;
                    }
                });
            }
            
            let playerWithNoCards: Player | undefined = game.players.find((p) => p.cards.length == 0);
            if(playerWithNoCards) {
                game.winnerId = playerWithNoCards.id;
                game.status = GameStatus.Finished;
            }

            let playerEscapedUnoIndex =  currentTurnIndex - 1;
            if(  playerEscapedUnoIndex < 0) {
                game.players.find( (p) => p.id == game.turnOrder[game.players.length -1])!.canCallUno = false;
            }else {
                game.players.find( (p) => p.id == game.turnOrder[playerEscapedUnoIndex])!.canCallUno = false;
            }
            

            resolve(game);
        });
    }

    deckClicked(playerId: string, gameId: string): Promise<Game> {
            return new Promise<Game>((resolve, reject) => {
                let game = this.getGameById(gameId)!;
                let player = game.players.find((p) => p.id === playerId)!;
                if(game.currentTurnPlayerId != player.id) {
                    reject("Not your turn");
                    return;
                }

                // checkIfTimeDidNotRunout(); // Have request time into account so internet connection does not affect gameplay timer
                player.cards.push(game.drawPile.pop()!);
                if(game.drawPile.length == 0) {
                    game = this.resetDrawPile(game);
                }
            let currentTurnIndex = game.turnOrder.findIndex((id) => id == player.id)!;
            let nextTurnIndex = currentTurnIndex + 1;

            if(  nextTurnIndex >= game.turnOrder.length) {
                let difference = nextTurnIndex - game.turnOrder.length
                nextTurnIndex = difference;
            }
            let playerOfNextTurnId = game.turnOrder[nextTurnIndex];
            game.currentTurnPlayerId = playerOfNextTurnId;
            game.currentTurnNumber++;

                resolve(game);
            });
    }

    resetDrawPile(game: Game): Game {
        let lastPlayedCard = game.discardPile.pop();
        game.drawPile = game.discardPile;
        this.shuffleCards(game);
        game.discardPile = [lastPlayedCard!];
        return game;
    }

    playerCalledUno(playerId: string, gameId: string): Promise<Game> {
        return new Promise<Game>((resolve, reject) => {
            let game = this.getGameById(gameId)!;
            let player = game.players.find((p) => p.id === playerId)!;
            player.calledUno = true;

            this.setCanCallAntiUno(game, player);
            
            resolve(game);
        });
    }

    setCanCallAntiUno(game: Game, player: Player) {
        let playersThatCanCallUno = game.players.filter(p => p.canCallUno && p.cards.length == 1);
            
            if(playersThatCanCallUno.length > 1) {
                game.players.forEach(player => {
                    player.canCallAntiUno = true;
                });
            }
            if(playersThatCanCallUno.length == 1) {
                game.players.forEach(p => {
                    if(p.id != player.id) {
                        player.canCallAntiUno = true;
                    } else {
                        player.canCallAntiUno = false;
                    }
                });
            }
            if(playersThatCanCallUno.length == 0) {
                game.players.forEach(player => {
                    player.canCallAntiUno = false;
                });
            }
    }

    playerCalledAntiUno(playerId: string, gameId: string, targetId: string): Promise<Game> {
        return new Promise<Game>((resolve, reject) => {
            let game = this.getGameById(gameId)!;
            let player = game.players.find((p) => p.id === playerId)!;
            let target = game.players.find((p) => p.id === targetId)!;
            if(target.calledUno || !target.canCallUno) {
                reject("Target already called uno");
                return;
            }
            target.canCallUno = false;

            this.setCanCallAntiUno(game, player);
            
            for(let cardsPunishment = 0; cardsPunishment < 4; cardsPunishment++) {
                target.cards.push(game.drawPile.pop()!);
                if(game.drawPile.length == 0) {
                    game = this.resetDrawPile(game);
                }
            }
            
            resolve(game);
        });
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

const shuffle = (array: Array<any>) => { 
    for (let i = array.length - 1; i > 0; i--) { 
      const j = Math.floor(Math.random() * (i + 1)); 
      [array[i], array[j]] = [array[j], array[i]]; 
    } 
    return array; 
  }; 