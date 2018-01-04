import Pacman from '../Pacman';
import Ghost from '../Ghost';
import Cell from './Cell';

export default class Grid {
    cells: Array<Cell>;
    constructor(
        private context: CanvasRenderingContext2D,
        private cellWidth: number,
        private cellHeight: number
    ) {
        this.setupCells();
    }

    setupCells() {
        this.cells = [];
        for (var i = 0; i < 500 / this.cellWidth; i++) {
            for (var j = 0; j < 500 / this.cellHeight; j++) {
                let walls = Math.floor(Math.random() * 15) + 1;
                let c = new Cell(this.context, i * this.cellHeight, j * this.cellWidth, this.cellHeight, this.cellWidth, walls);
                this.cells.push(c);
            }
        }
    }

    render() {
        for (var i = 0; i < this.cells.length; i ++) {
            let cell = this.cells[i];
            cell.render()
        }
    }
}