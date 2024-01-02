
export class Puzzle {
    id;
    acrossCount = 0;
    downClues = [];
    acrossClues = [];
    constructor(
        checksum = NaN, 
        magicString = 'INVALID PUZZLE', 
        cibChecksum = NaN, 
        lows = [NaN, NaN], 
        highs = [NaN, NaN], 
        version = 'INVALID PUZZLE', 
        res1C = [], 
        scrambledCheck = NaN, 
        res20 = [],
        width = NaN,
        height = NaN,
        clueCt = NaN,
        isScrambled = false,
        cells = [],
        title = 'INVALID PUZZLE',
        author = 'INVALID PUZZLE',
        copy = 'INVALID PUZZLE',
        rawClues = [],
        notes = 'INVALID PUZZLE',
        id,
    ) {
        this.checksum = checksum;
        this.magicString = magicString;
        this.cibChecksum = cibChecksum;
        this.lows = lows;
        this.highs = highs;
        this.version = version;
        this.res1C = res1C;
        this.scrambledCheck = scrambledCheck;
        this.res20 = res20;
        this.width = width;
        this.height = height;
        this.clueCt = clueCt;
        this.isScrambled = isScrambled;
        this.cells = cells;
        this.title = title;
        this.author = author;
        this.copy = copy;
        this.rawClues = rawClues;
        this.notes = notes;
        if (id) {
            this.id = id;
        } 
        this.linkCells();
        this.setupBoardNumbers()
    }

    linkCells() {
        for (let i = 0; i < this.cells.length; i++) {
            const row = this.cells[i];
            for (let j = 0; j < row.length; j++) {
                const cell = row[j];
                cell.north = (this.cells[i-1] || [])[j];
                cell.east = row[j+1];
                cell.south = (this.cells[i+1] || [])[j];
                cell.west = row[j-1];
            }
        }
    }

    setupBoardNumbers() {
        let clueNumber = 1;
        let downCount = 0;
        let allClues = this.rawClues.map(c => c);
        for (let row of this.cells) {
            for (let c of row) {
                if (c.isSep) {
                    continue;
                }
                let inc = false;
                if (!c.west || c.west.isSep) {
                    c.boardNumber = clueNumber;
                    c._acrossClue = this.acrossCount;
                    this.acrossClues.push(new Clue(ClueDirection.Across, clueNumber, allClues.shift()));
                    this.acrossCount++;
                    inc = true;
                } 
                if (!c.north || c.north.isSep) {
                    c.boardNumber = clueNumber;
                    c._downClue = downCount;
                    this.downClues.push(new Clue(ClueDirection.Down, clueNumber, allClues.shift()));
                    downCount++;
                    inc = true;
                } 
                if (inc) {
                    clueNumber++;
                }
            }
        }

    }
    toJSON() {
        let ret = {
            checksum: this.checksum,
            magicString: this.magicString, 
            cibChecksum: this.cibChecksum, 
            lows: this.lows, 
            highs: this.highs, 
            version: this.version, 
            res1C: this.res1C, 
            scrambledCheck: this.scrambledCheck, 
            res20: this.res20, 
            width: this.width, 
            height: this.height, 
            clueCt: this.clueCt, 
            isScrambled: this.isScrambled, 
            cells: this.cells.map(row => row.map(c => c.toJSON())), 
            title: this.title, 
            author: this.author, 
            copy: this.copy, 
            rawClues: this.rawClues, 
            notes: this.notes, 
        }
        if (this.id) {
            ret.id = this.id;
        }
        return ret;
    }
    static fromJson(json) {
        if (!json) return new Puzzle();
        let ret = new Puzzle(
            json.checksum,
            json.magicString, 
            json.cibChecksum, 
            json.lows, 
            json.highs, 
            json.version, 
            json.res1C, 
            json.scrambledCheck, 
            json.res20, 
            json.width, 
            json.height, 
            json.clueCt, 
            json.isScrambled, 
            json.cells.map(r => r.map(Cell.fromJson)), 
            json.title, 
            json.author, 
            json.copy, 
            json.rawClues, 
            json.notes, 
        );
        if (json.id) {
            ret.id = json.id;
        }
        return ret;
    }
}

export class Cell {
    userValue;
    isSep = false;
    boardNumber;
    _acrossClue;
    _downClue;
    north;
    south;
    east;
    west;
    constructor(userValue, expectedValue) {
        this.expectedValue = expectedValue;
        if ((!userValue && !expectedValue)
        || expectedValue === '.') {
            this.isSep = true;
            this.expectedValue = '';
            this.userValue = '';
        } else {
            this.userValue = userValue == '-' ? '' : userValue;
        }
    }
    get isValid() {
        return this.isSep 
            || this.userValue == this.expectedValue;
    }
    get acrossClue() {
        if (this._acrossClue != null) {
            return this._acrossClue;
        }
        return this.west ? this.west.acrossClue : -1;
    }
    get downClue() {
        if (this._downClue != null) {
            return this._downClue;
        }
        return this.north ? this.north.downClue : -1
    }
    get firstEmptyAcross() {
        let start = this.firstAcross;
        let nextEmpty = this.nextEmptyAcross;
        if (!nextEmpty) {
            return start;
        }
        return nextEmpty;
    }
    get nextEmptyAcross() {
        if (!this.userValue || this.userValue == '') {
            return this;
        }
        if (this.east) {
            return this.east.nextEmptyAcross
        }
    }
    get firstAcross() {
        if (this.west) {
            return this.west.firstAcross;
        }
        return this
    }
    toJSON() {
        return {
            userValue: this.userValue,
            expectedValue: this.expectedValue,
        }
    }
    static fromJson(json) {
        if (!json) return new Cell();
        return new Cell(
            json.userValue,
            json.expectedValue,
        )
    }
}

export class Clue {
    constructor(
        direction,
        id,
        value,
    ) {
        this.direction = direction;
        this.id = id;
        this.value = value;
    }

    toString() {
        return `${this.id} ${this.value}`;
    }

    toJSON() {
        return {
            direction: this.direction,
            id: this.id,
            value: this.value,
        }
    }
    static fromJson(json) {
        if (!json) return new Clue(-1, -1, '');
        return new Clue (
            json.direction,
            json.id,
            json.value,
        )
    }
}

const ClueDirection = Object.freeze({
    Across: 1,
    Down: 2,
})
