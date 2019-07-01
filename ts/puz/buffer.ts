import { Puzzle, Cell } from "./puzzle";


export class PuzzleBuffer {
    private cursor = 0;
    private decoder = new TextDecoder('iso-8859-1');
    constructor(
        private blob: ArrayBuffer
    ) { }
    public drainShort(): number {
        let view = new DataView(this.blob, this.cursor, 2);
        let l = view.getInt8(0);
        let r = view.getInt8(1)
        this.cursor += 2;
        return (r << 8) + l;
    }
    public drainFixedLengthString(len: number): string {
        let view = new DataView(this.blob, this.cursor, len);
        this.cursor += len;
        return this.decoder.decode(view);
    }

    public drainNullTermedString(): string {
        let view = new Uint8Array(this.blob.slice(this.cursor));
        let nextNull = view.indexOf(0);
        let slice = view.slice(0, nextNull);
        this.cursor += slice.length + 1;
        return this.decoder.decode(slice);
    }

    public drainFixedLengthArray(len: number): number[] {
        let view = new Uint8Array(this.blob.slice(this.cursor, this.cursor + len));
        this.cursor += len;
        let ret = new Array(len);
        for (let i = 0; i < len; i++) {
            ret[i] = view[i];
        }
        return ret;
    }
    public drainByte(): number {
        console.log('drainByte', this.cursor);
        let view = new Uint8Array(this.blob.slice(this.cursor, this.cursor + 1));
        console.log('view', view);
        this.cursor += 1;
        return view[0];
    }

    public toPuzzle(): Puzzle {
        let checksum = this.drainShort();
        let magicString = this.drainNullTermedString();
        if (magicString !== 'ACROSS&DOWN') {
            throw new Error('failed to decode magic string');
        }
        let cibChecksum = this.drainShort();
        let lows = this.drainFixedLengthArray(4);
        let highs = this.drainFixedLengthArray(4);
        let version = this.drainNullTermedString();
        let c1 = this.drainFixedLengthArray(2);
        let scrambledCheck = this.drainShort();
        let c2 = this.drainFixedLengthArray(0xc);
        let width = this.drainByte();
        let height = this.drainByte();
        let clueCt = this.drainShort();
        let isScrambled = this.drainShort();
        let unknown = this.drainShort();
        let rows = [];
        for (let i = 0; i < height; i++) {
            let line = this.drainFixedLengthString(width);
            rows.push(line);
        }
        let cells = [];
        for (let i = 0; i < height; i++) {
            let line = this.drainFixedLengthString(width);
            let cell = this.deserializeRow(line, rows[i]);
            cells.push(cell);
        }
        let title = this.drainNullTermedString();
        let author = this.drainNullTermedString();
        let copy = this.drainNullTermedString();
        let clues = [];
        for (let i = 0; i < clueCt; i++) {
            clues.push(this.drainNullTermedString());
        }
        let notes = this.drainNullTermedString();
        return new Puzzle(
            checksum,
            magicString,
            cibChecksum,
            lows,
            highs,
            version,
            c1,
            scrambledCheck,
            c2,
            width,
            height,
            clueCt,
            isScrambled > 0,
            cells,
            title,
            author,
            copy,
            clues,
            notes
        )
    }
    deserializeRow(user: string, solution: string): Cell[] {
        if (user.length !== solution.length) {
            throw new Error(`invalid row user: ${user}, solution: ${solution}`);
        }
        let ret = [];
        for (let i = 0; i < user.length; i++) {
            let uC = user[i];
            let sC = solution[i];
            ret.push(new Cell(uC, sC));
        }
        return ret;
    }
}


/*
let buf = await fs.promises.readFile('example.puz');
    let version = buf.slice(0x18, 0x1b).toString();
    let res1C = buf.slice(0x1c, 0x1d+1);
    let scrambledCheck = buf.readInt16LE(0x1E);
    let res20 = buf.slice(0x20, 0x2b+1);
    let width = buf[0x2c];
    let height = buf[0x2d];
    let clueCt = buf.readInt16LE(0x2e);
    let unknown = buf.readInt16LE(0x30);
    let isScrambled = buf.readInt16LE(0x32);
    let solution = [];
    for (let i = 0; i < height;i++) {
        let lineStart = 0x34 + i*width;
        solution.push(buf.slice(lineStart, lineStart + width).toString());
    }
    let userState = [];

    for (let i = 0; i < height;i++) {
        let lineStart = 0x34 + (width * height) + (i * width);
        userState.push(buf.slice(lineStart, lineStart + width).toString());
    }
    let strings = buf.slice(0x34 + (width * height) * 2).toString().split('\u0000');
    let title = strings.shift();
    let author = strings.shift();
    let copy = strings.shift();
    let clues = strings.splice(0, strings.length - 2);
    return {
        checksum, 
        nextNul, 
        fMagic, 
        cibChecksum, 
        lows, 
        highs, 
        version, 
        res1C, 
        scrambled: scrambledCheck, 
        res20,
        width,
        height,
        clueCt,
        unknown,
        isScrambled,
        rows: solution,
        userState,
        title,
        author,
        copy,
        clues,
        notes: strings.shift(),
    };
*/