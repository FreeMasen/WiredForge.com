/**
 * A representation of a sudoku puzzle
 * @param {Array<number>} cells a seed of cells (optional) 
 */
function Sudoku(cells) {

    if (!cells) {
        this.cells = []
        for (var i = 0; i < 81; i++) this.cells.push(1);
    } else {
        this.cells = cells;
    }
    /**
     * Get the next sequential puzzle
     * @returns {Sudoku} A new puzzle with the base number increased by 1
     */
    this.next = function() {
        let ret = new Sudoku(this.cells.map(c => c));
        if (this.isComplete) {
            ret.isComplete = true;
            ret.decrement();
        } else {
            ret.increment();
        }
        return ret;
    }
    /**
     * If this is the last puzzle in the possible puzzles
     * @returns {boolean} If the puzzle has gone from all 1s to all 9s and back to all 1s again
     */
    this.isEnd = function() {
        return this.isComplete && this.cells[this.cells.length - 1] <= 1
    }
    /**
     * Decrease the total number by one
     */
    this.decrement = function() {
        for (var i = 0; i < this.length; i++) {
            let entry = this.cells[i];
            if (entry > 1) {
                this.cells[i]--
                break;
            }
        }
    }
    /**
     * Increase the total number by one and realign any values greater than 9
     */
    this.increment = function() {
        this.cells[this.cells.length - 1]++
        this.realign();
    }
    /**
     * validate that all numbers greater than 9 are carried over the the left
     */
    this.realign = function() {
        let carryOver = 0;
        for (let i = this.cells.length - 1;i >= 0;i--) {
            let current = this.cells[i];
            let update = 0;
            if (carryOver > 0) {
                update += carryOver;
                carryOver = 0;
            }
            update += current;
            while (update > 9) {
                update -= 10;
                carryOver++
            }
            this.cells[i] = update;
        }
        if (this.cells[this.cells.length - 1] >= 9) {
            this.isComplete = true;
        }
    }
    /**
     * Check the rows, columns and boxes for any duplicated values
     * @returns {boolean} Weather or not validation passes
     */
    this.isValid = function() {
        if (!this.validateGroup(this.rows())) return false;
        if (!this.validateGroup(this.columns())) return false;
        if (!this.validateGroup(this.boxes())) return false;
        return true;
    }
    /**
     * Validate the puzzle for one of the 3 constraints
     * @param {<Array<Array<number>>} group An entire puzzed in a group like rows, columns or boxes 
     * @returns {boolean} Weather or not validation passes
     */
    this.validateGroup = function(group) {
        for (let single of group) {
            if (!this.validateSingle(single)) return false;
        }
        return true;
    }
    /**
     * Validate a single part of one of the three constraints
     * @param {Array<number>} single A row, column or box 
     * @returns {boolean} Weather or not validation passes
     */
    this.validateSingle = function(single) {
        let seen = [];
        for (var i = 0; i < single.length; i++) {
            let val = single[i];
            if (seen.indexOf(val) > -1) return false;
            seen.push(val);
        }
        return true;
    }
    /**
     * Get the puzzle as an array of rows
     * @returns {Array<Array<number>>} The array of rows
     */
    this.rows = function() {
        let ret = [];
        for (var i = 0; i < 9; i++) {
            let row = [];
            for (var j = 0; j < 9; j++) {
                let index = (i * 9) + j;
                row.push(this.cells[index]);
            }
            ret.push(row);
        }
        return ret;
    }
    /**
     * Get the puzzle as an array of columns
     * @returns {Array<Array<number>>} The array of columns
     */
    this.columns = function() {
        let ret = [];
        for (var i = 0; i < 9; i++) {
            let col = [];
            for (var j = 0; j < 9; j++) {
                let index = (j * 9) + i;
                col.push(this.cells[index]);
            }
            ret.push(col);
        }
        return ret;
    }

    /**
     * Get the puzzle as an array of boxes
     * @returns {Array<Array<number>>} The array of boxes
     */
    this.boxes = function() {
        //FIXME: This could be done in a loop some how, i bet...
        return [
            [
                this.cells[0],
                this.cells[1],
                this.cells[2],
                this.cells[9],
                this.cells[10],
                this.cells[11],
                this.cells[18],
                this.cells[19],
                this.cells[20]
            ],
            [
                this.cells[3],
                this.cells[4],
                this.cells[5],
                this.cells[12],
                this.cells[13],
                this.cells[14],
                this.cells[21],
                this.cells[22],
                this.cells[23]
            ],
            [
                this.cells[6],
                this.cells[7],
                this.cells[8],
                this.cells[15],
                this.cells[16],
                this.cells[17],
                this.cells[24],
                this.cells[25],
                this.cells[26],
            ],
            [
                this.cells[27],
                this.cells[28],
                this.cells[29],
                this.cells[36],
                this.cells[37],
                this.cells[38],
                this.cells[45],
                this.cells[46],
                this.cells[47]
            ],
            [
                this.cells[30],
                this.cells[31],
                this.cells[32],
                this.cells[39],
                this.cells[40],
                this.cells[41],
                this.cells[48],
                this.cells[49],
                this.cells[50]
            ],
            [
                this.cells[33],
                this.cells[34],
                this.cells[35],
                this.cells[42],
                this.cells[43],
                this.cells[44],
                this.cells[51],
                this.cells[52],
                this.cells[53]
            ],
            [
                this.cells[54],
                this.cells[55],
                this.cells[56],
                this.cells[63],
                this.cells[64],
                this.cells[65],
                this.cells[72],
                this.cells[73],
                this.cells[74]
            ],
            [
                this.cells[57],
                this.cells[58],
                this.cells[59],
                this.cells[66],
                this.cells[67],
                this.cells[68],
                this.cells[75],
                this.cells[76],
                this.cells[77]
            ],
            [
                this.cells[60],
                this.cells[61],
                this.cells[62],
                this.cells[69],
                this.cells[70],
                this.cells[71],
                this.cells[78],
                this.cells[79],
                this.cells[80]
            ]
        ];
    }
}

/**A single valid sudoku layout */
let validSet = [
    9,7,4,6,2,3,5,8,1,
    2,1,8,7,5,4,6,3,9,
    5,3,6,1,8,9,7,4,2,
    1,4,3,2,9,6,8,5,7,
    7,2,5,8,3,1,4,9,6,
    6,8,9,4,7,5,1,2,3,
    3,9,1,5,6,8,2,7,4,
    4,5,7,9,1,2,3,6,8,
    8,6,2,3,4,7,9,1,5
];


let s = new Sudoku();
let start = new Date();
let counter = 0;
let valid = [];
while (!s.isEnd()) {
    if (s.isValid()) {
        valid.push(s);
    }
    s = s.next();
    if (counter % 1000000 == 0) {
        printStatus();
    }
    counter++
}
printStatus();
function printStatus() {
    let time = '';
        let ms = new Date() - start;
        let secs = ms / 1000;
        if (secs > 60) {
            let mins = secs / 60;
            secs = secs % 60;
            if (mins > 60) {
                let hours = mins / 60;
                mins = mins % 60
                time += `${hours.toFixed(0)} hr. `;
            }
            time += `${mins.toFixed(0)} min. `
        }
        time += `${secs.toFixed(0)} sec.`
        console.log('Checked', counter, 'puzzles, found', valid.length, 'that are valid in', time);
}