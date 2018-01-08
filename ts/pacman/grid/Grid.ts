import Pacman from '../Pacman';
import Ghost from '../Ghost';
import Cell from './Cell';
import { MoveDir, CellWall } from '../enums';

/**
 * The fame grid
 */
export default class Grid {
    cells: CellList;
    private height;
    private width;
    constructor(
        private context: CanvasRenderingContext2D,
        private level: number
    ) {
        this.height = context.canvas.height - 10;
        this.width = context.canvas.width - 10;
        this.setupEmptyCells();
        this.createWalls();
    }

    getCell(x: number, y: number) {
        let cellHeight = this.height / 10;
        let row = Math.floor(y / cellHeight);
        let cellWidth = this.width / 10;
        let col = Math.floor(x / cellWidth);
        let cell = this.cells.get(col, row);
        cell.addWall(15);
    }

    getCenterCell() {
        return this.cells.get(5, 5);
    }

    setupEmptyCells() {
        console.log('setupEmptyCells')
        let width = this.width / 11;
        let height = this.height / 11;
        let rowLength = this.width / width;
        let colLength = this.height / height;
        this.cells = new CellList(rowLength, colLength);
        for (var i = 0; i < rowLength; i ++) {
            for (var j = 0; j < colLength; j++) {
                let x = (j * width + 5);
                let y = (i * height) + 5;
                let cell = new Cell(this.context, j, i,y, x, width, height, 15);
                this.cells.append(cell);
            }
        }
    }

    createWalls() {
        console.log('creatWalls');
        let currentCell = this.cells.get(0, 0);
        for (var i = 0; i < 4; i++) {
            let dir = i == 0 ? MoveDir.Right
                    : i == 1 ? MoveDir.Down
                    : i == 2 ? MoveDir.Left
                    : MoveDir.Up
            for (var j = 0; j < 10; j++) {
                currentCell.removeWall(CellWall.Right >> i);
                currentCell = currentCell.nextCell(dir);
            }
        }
        let numCross = Math.floor(Math.random() * 8) + 1;
        for (var i = 0; i < numCross; i++) {
            let cross = Math.floor(Math.random() * 10);
            let leftCell = this.cells.get(cross, 0);
            let topCell = this.cells.get(0, cross);
            for (var j = 0; j < 9; j++) {
                leftCell = leftCell.nextCell(MoveDir.Right);
                leftCell.removeWall(15);
                topCell = topCell.nextCell(MoveDir.Down);
                topCell.removeWall(15);
            }
        }
        console.log('~createWalls')
    }

    private getRandomCell() {
        let x = Math.floor(Math.random() * 11);
        let y = Math.floor(Math.random() * 11);
        return this.cells.get(x, y);
    }

    addWall(wall: CellWall, index: number) {
        let isVertical = (wall & (CellWall.Left | CellWall.Right)) > 0
        let cells = isVertical ? this.cells.column(index) : this.cells.row(index);
        for (let cell of cells) {
            cell.addWall(wall);
        }
    }

    render() {
        console.log('render');
        let height = this.context.canvas.height;
        let width = this.context.canvas.width;
        let upperPortCell = this.cells.get(0, 2);
        upperPortCell.removeWall(CellWall.Left);
        let lowerPortCell = this.cells.get(0, 8);
        lowerPortCell.removeWall(CellWall.Left)
        this.context.fillStyle = 'purple';
        this.context.fillRect(0, 0, 6, upperPortCell.top);
        this.context.fillRect(0, upperPortCell.bottom, 6, upperPortCell.height * 5);
        this.context.fillRect(0, height, 6, -upperPortCell.top);
        this.context.fillRect(width, 0, -6, upperPortCell.top);
        this.context.fillRect(width, upperPortCell.bottom, -6, upperPortCell.height * 5);
        this.context.fillRect(width, height, -6, -upperPortCell.top);

        let leftPortCell = this.cells.get(2, 0);
        leftPortCell.removeWall(CellWall.Top);
        let rightPortCell = this.cells.get(8, 0);
        rightPortCell.removeWall(CellWall.Top);
        this.context.fillRect(0, 0, leftPortCell.left, 6);
        this.context.fillRect(leftPortCell.right, 0, leftPortCell.width * 5, 6);
        this.context.fillRect(width, 0, -leftPortCell.left, 6);
        this.context.fillRect(0, height, leftPortCell.left, -6);
        this.context.fillRect(leftPortCell.right, height, leftPortCell.width * 5, -6);
        this.context.fillRect(width, height, -leftPortCell.left, -6);
        for (let row of this.cells.rows) {
            for (let cell of row) {
                cell.render();
            }
        }
    }
}

class CellList {
    rows: Array<Array<Cell>> = [];
    private currentX = 0;
    private currentY = 0;

    constructor(public rowLength: number, public columnLength: number) {
        for (var i = 0; i < columnLength; i++) {
            let row = [];
            for (var j = 0; j < rowLength; j++) {
                row.push(null);
            }
            this.rows.push(row);
        }
    }

    row(index: number): Array<Cell> {
        return this.rows[index];
    }

    column(index: number): Array<Cell> {
        let ret = [];
        for (var i = 0; i < this.columnLength; i++) {
            ret.push(this.rows[i][index]);
        }
        return ret;
    }

    append(cell: Cell) {
        let myRow = this.rows[cell.y];
        myRow[cell.x] = cell;
        let left = myRow[cell.x - 1];
        if (left) {
            cell.addNeighbor(left, MoveDir.Left);
        }
        let aboveRow = this.rows[cell.y - 1];
        if (aboveRow) {
            let above = aboveRow[cell.x];
            if (above) {
                cell.addNeighbor(above, MoveDir.Up);
            }
        }
        if (cell.x == this.rowLength - 1) {
            let first = myRow[0];
            cell.addNeighbor(first, MoveDir.Right);
        }
        if (cell.y == this.columnLength - 1) {
            let firstRow = this.rows[0];
            let first = firstRow[cell.x];
            cell.addNeighbor(first, MoveDir.Down);
        }
    }

    public get(x: number, y: number): Cell {
        let row = this.rows[y];
        if (row) {
            return row[x];
        }
    }
}

class CellRow {
    public cells: Array<Cell> = [];
    constructor(
        private maxWidth: number
    ) {}
    get atMax(): boolean {
        return this.cells.length >= this.maxWidth;
    }
    append(cell: Cell) {
        this.cells.push(cell);
    }

    get length(): number {
        return this.cells.length;
    }

    get(index: number): Cell {
        return this.cells[index];
    }
}