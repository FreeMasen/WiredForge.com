export interface IPuzzle {
    id?: number;
    checksum: number;
    magicString: string;
    cibChecksum: number;
    lows: number[];
    highs: number[];
    version: string;
    res1C: number[];
    scrambledCheck: number;
    res20: number[];
    width: number;
    height: number;
    clueCt: number;
    isScrambled: boolean;
    cells: Cell[][];
    title: string;
    author: string;
    copy: string;
    rawClues: string[];
    notes: string;
}
export interface ICell {
    userValue?: string;
    expectedValue?: string;
    isSep: boolean;
}
export class Puzzle implements IPuzzle {
    id?: number;
    acrossCount = 0;
    downClues: Clue[] = [];
    acrossClues: Clue[] = [];
    constructor(
        public checksum: number = NaN, 
        public magicString: string = 'INVALID PUZZLE', 
        public cibChecksum: number = NaN, 
        public lows: number[] = [NaN, NaN], 
        public highs: number[] = [NaN, NaN], 
        public version: string = 'INVALID PUZZLE', 
        public res1C: number[] = [], 
        public scrambledCheck: number = NaN, 
        public res20: number[] = [],
        public width: number = NaN,
        public height: number = NaN,
        public clueCt: number = NaN,
        public isScrambled: boolean = false,
        public cells: Cell[][] = [],
        public title: string = 'INVALID PUZZLE',
        public author: string = 'INVALID PUZZLE',
        public copy: string = 'INVALID PUZZLE',
        public rawClues: string[] = [],
        public notes: string = 'INVALID PUZZLE',
        id?: number
    ) {
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
    public toJSON(): any {
        let ret: IPuzzle = {
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
    public static fromJson(json: any): Puzzle {
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

export class Cell implements ICell {
    public userValue;
    public isSep = false;
    public boardNumber;
    public _acrossClue?: number;
    public _downClue?: number;
    public north?: Cell;
    public south?: Cell;
    public east?: Cell;
    public west?: Cell;
    constructor(userValue?: string, public expectedValue?: string) {
        if ((!userValue && !expectedValue)
        || expectedValue === '.') {
            this.isSep = true;
            this.expectedValue = '';
            this.userValue = '';
        } else {
            this.userValue = userValue == '-' ? '' : userValue;
        }
    }
    get isValid(): boolean {
        return this.isSep 
            || this.userValue == this.expectedValue;
    }
    get acrossClue(): number {
        if (this._acrossClue != null) {
            return this._acrossClue;
        }
        return this.west ? this.west.acrossClue : -1;
    }
    get downClue(): number {
        if (this._downClue != null) {
            return this._downClue;
        }
        return this.north ? this.north.downClue : -1
    }
    get firstEmptyAcross(): Cell {
        let start = this.firstAcross;
        let nextEmpty = this.nextEmptyAcross;
        if (!nextEmpty) {
            return start;
        }
        return nextEmpty;
    }
    get nextEmptyAcross(): Cell {
        if (!this.userValue || this.userValue == '') {
            return this;
        }
        if (this.east) {
            return this.east.nextEmptyAcross
        }
    }
    get firstAcross(): Cell {
        if (this.west) {
            return this.west.firstAcross;
        }
        return this
    }
    public toJSON(): any {
        return {
            userValue: this.userValue,
            expectedValue: this.expectedValue,
        }
    }
    public static fromJson(json: any): Cell {
        if (!json) return new Cell();
        return new Cell(
            json.userValue,
            json.expectedValue,
        )
    }
}

export class Clue {
    constructor(
        public direction: ClueDirection,
        public id: number,
        public value: string,
    ) {}

    toString(): string {
        return `${this.id} ${this.value}`;
    }

    public toJSON(): any {
        return {
            direction: this.direction,
            id: this.id,
            value: this.value,
        }
    }
    public static fromJson(json: any) {
        if (!json) return new Clue(-1, -1, '');
        return new Clue (
            json.direction,
            json.id,
            json.value,
        )
    }
}

enum ClueDirection {
    Across,
    Down,
}