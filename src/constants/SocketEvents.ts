export enum SocketEventTypes {
    SendJoinedGameData = "SendJoinedGameData",
    PlayerConnected = "PlayerConnected",
    PlayerDisconnected = "PlayerDisconnected",
    PlayerLeft = "PlayerLeft",
    PlayerReadyToggle = "PlayerReadyToggle",

    StartGame = "StartGame",

    CardHovered = "CardHovered",
    CardNotHovered = "CardNotHovered",
    CardClicked = "CardClicked",

    DeckHovered = "DeckHovered",
    DeckNotHovered = "DeckNotHovered",
    DeckClicked = "DeckClicked",

    GameTurnUpdated = "GameTurnUpdated",
    Uno = "Uno",
    AntiUno = "AntiUno",
}