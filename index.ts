import fs from 'fs'
class Player {
    id: number
    position: number
    inventory = {
        [Piece.Bracelet]: false,
        [Piece.Crown]: false,
        [Piece.CursedRing]: false,
        [Piece.Earring]: [] as Array<boolean>,
        [Piece.Ring]: false,
    }
    game: Game

    constructor(id:number, game:Game) {
        this.game = game
        this.id = id
        this.position = 0
    }

    takeTurn() {
        const movements = this.game.spin()
        const piece = this.game.moveSpaces(this, movements)

        switch(piece) {
            case Piece.Bracelet:
            case Piece.Crown:
            case Piece.CursedRing:
            case Piece.Ring:
                case Piece.Earring:
                this.take(piece)
                break;
            case Piece.PutBack:
                this.putBackRandom()
                break;
            case Piece.TakePiece:
                this.takeRandom()
                break;
        }
    }

    takeRandom() {
        const unOwned = Object.entries(this.inventory).filter(([_key, value]) => (
                (value instanceof Array && value.length < 2)
                || !value
        )).map(([key, _value]) => key)

        if (unOwned.length <= 0) {
            return
        }

        // If you do not have the crown, you should prefer taking that
        const selection = Number.parseInt(unOwned.find(
            (element) => Number.parseInt(element) === Piece.Crown
        ) ?? shuffleArray(unOwned)[0])

        this.take(selection)
    }

    putBackRandom() {
        const owned = Object.entries(this.inventory).filter(([_key, value]) => (
                (value instanceof Array && value.length)
                || value
        )).map(([key, _value]) => key)

        if (owned.length <= 0) {
            return
        }

        // If you have the cursed ring... always prefer to put that back
        const selection = Number.parseInt(owned.find(
            (element) => Number.parseInt(element) === Piece.CursedRing
        ) ?? shuffleArray(owned)[0])

        this.putBack(selection)
    }

    putBack(piece: Piece) {
        switch (piece) {
            case Piece.Crown:
            case Piece.CursedRing:
            case Piece.Bracelet:
            case Piece.Ring:
                this.inventory[piece] = false
                break;
            case Piece.Earring:
                this.inventory[piece].pop()
                break;
        }
        this.game.returnPiece(piece)
    }

    take(piece: Piece) {
        switch (piece) {
            case Piece.Crown:
            case Piece.CursedRing:
            case Piece.Bracelet:
            case Piece.Ring:
                this.inventory[piece] = true
                break;
            case Piece.Earring:
                this.inventory[piece].push(true)
                break;
        }
        this.game.takePiece(this, piece)
    }

    hasWon(): boolean{
        const loseConditions = Object.entries(this.inventory).filter(([key, value]) => {
            switch(Number.parseInt(key)) {
                case Piece.CursedRing:
                    return value
                case Piece.Crown:
                case Piece.Bracelet:
                case Piece.Ring:
                    return !value
                case Piece.Earring:
                    return (value as Array<boolean>).length < 2
            }

        })

        return loseConditions.length === 0
    }
}

enum Piece {
    Bracelet,
    Crown,
    CursedRing,
    Earring,
    Necklace,
    PutBack,
    Ring,
    TakePiece,
}

class CircularStack<T> {
    stack: Array<T> = []

    // Set current to -1 so the first time an element is accessed it will
    // begin at the first enqued element
    current = -1

    enque(element: T) {
        this.stack.push(element)
    }

    next(): T {
        this.current += 1
        if (this.current >= this.stack.length) {
            this.current = 0
        }
        return this.stack[this.current]
    }
}

class Game {
    tiles = {
        blue: [Piece.Necklace, Piece.PutBack, Piece.Bracelet, Piece.TakePiece],
        pink: [Piece.Ring, Piece.CursedRing, Piece.Earring, Piece.Crown],
        yellow: [Piece.Necklace, Piece.PutBack, Piece.Bracelet, Piece.TakePiece],
        purple: [Piece.Ring, Piece.CursedRing, Piece.Earring, Piece.Crown],
    }

    players: CircularStack<Player> = new CircularStack()
    positions: Record<number, number> = {}
    board: Array<Piece> = []
    turnCount: number = 0
    crownBearer?: Player
    cursedRingBearer?: Player
    winner?: Player

    constructor() {
        this.board = Object.entries(this.tiles).flatMap(([_k, v]) => v)
    }

    returnPiece(piece: Piece) {
        switch (piece) {
            case Piece.Crown:
                this.crownBearer = undefined
                break;
            case Piece.CursedRing:
                this.cursedRingBearer = undefined
                break;
        }
    }

    takePiece(newOwner: Player, piece: Piece) {
        switch (piece) {
            case Piece.Crown:
                this.takeCrown(newOwner);
                break;
            case Piece.CursedRing:
                this.takeCursedRing(newOwner)
                break;
        }
    }

    takeCursedRing(newOwner: Player) {
        this.cursedRingBearer?.putBack(Piece.CursedRing)
        this.cursedRingBearer = newOwner
    }

    takeCrown(newOwner: Player) {
        this.crownBearer?.putBack(Piece.Crown)
        this.crownBearer = newOwner
    }

    addPlayer(p: Player) {
        this.players.enque(p)
        this.positions[p.id] = Math.floor(Math.random() * this.board.length + 1)
    }

    moveSpaces(p: Player, spaces: number): Piece {
        const startPos = this.positions[p.id]
        const endPos = (startPos + spaces) % this.board.length
        this.positions[p.id] = endPos

        return this.board[endPos]
    }

    getNextPlayer(): Player {
        this.turnCount++
        return this.players.next()
    }

    spin(): number {
        const MAX = 4
        const MIN = 1
        return Math.floor(Math.random() * (MAX + 1 - MIN)) + MIN
    }

    play() {
        let counter = 0;
        while (true) {
            counter++
            let player = this.getNextPlayer()
            player.takeTurn()
            if (player.hasWon()) {
                this.winner = player
                break;
            }
        }
        return {
            turns: this.turnCount,
            rounds: Math.floor(this.turnCount / Object.keys(this.positions).length)
        }
    }
}

function shuffleArray<T>(array: Array<T>): Array<T> {
  let currentIndex = array.length, randomIndex;
  while (currentIndex !== 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
  }

  return array;
}

async function main() {
    const NUM_GAMES = 100 * 100 * 100;
    const stats: Array<any> = [];
    [2, 3, 4].forEach(numPlayers => {
        const totalTurns: Array<number> = []
        const runningTotals = {
            count: 0,
            min: Infinity,
            max: 0,
            sumTurns: 0,
            sumRounds: 0
        }
        for (let i = 0; i < NUM_GAMES; i++) {
            let game: (Game | undefined) = new Game()

            for (let i = 1; i <= numPlayers; i++) {
                game.addPlayer(new Player(i, game))
            }

            const {rounds, turns} = game.play()
            runningTotals.count++
            runningTotals.sumTurns += turns
            runningTotals.sumRounds += rounds
            if (turns < runningTotals.min) {
                runningTotals.min = turns
            }

            if (turns > runningTotals.max) {
                runningTotals.max = turns
            }
            totalTurns.push(turns)
        }
        totalTurns.sort((a,b) => a - b)
        stats.push({
            playerCount: numPlayers,
            games: NUM_GAMES,
            min: runningTotals.min,
            max: runningTotals.max,
            median: totalTurns[Math.floor((totalTurns.length / 2)) - 1],
            average: runningTotals.sumTurns / runningTotals.count,
            averageRounds: runningTotals.sumRounds / runningTotals.count
        })

        const agg = totalTurns.reduce((acc: Record<number, number>, val) => {
            if (!acc[val]) {
                acc[val] = 1
            } else {
                acc[val] += 1
            }

            return acc
        }, {})
        const data = Object.entries(agg).map(([k, v]) => `${k},${v}`)
        fs.writeFileSync(`output-${numPlayers}.csv`, 'turns,count\n' + data.join('\n'))
    })
    console.log(stats)
}

main()
