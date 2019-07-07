import { PuzzleBuffer } from "./puz/buffer";
import { IPuzzle, Puzzle, Cell, Clue } from './puz/puzzle';
import Dexie from 'dexie';
let puz;
window.addEventListener('DOMContentLoaded', () => {
    puz = new Puz();
});
window.addEventListener('keydown', ev => {
    if (ev.key === 'Backspace' || ev.key === 'ArrowUp' || ev.key === 'ArrowDown') {
        ev.preventDefault();
    }
});

enum InputDirection {
    Horizontal,
    Vertical,
}
interface IRenderedCell {
    el: HTMLDivElement;
    cell: Cell;
    rowIdx: number;
    cellIdx: number;
    north?: IRenderedCell;
    east?: IRenderedCell;
    south?: IRenderedCell;
    west?: IRenderedCell; 
}

interface IRenderedClue {
    el: HTMLSpanElement;
    clue: Clue;
}

export class Puz {
    private rootRef: HTMLDivElement;
    private selectedCell: IRenderedCell;
    private direction: InputDirection = InputDirection.Horizontal;
    private rowIdx: number = 0;
    private cellIdx: number = 0;
    private cells: IRenderedCell[][] = [];
    private puzzle: Puzzle;
    private db: PuzDb;
    constructor() {
        let uploader = document.getElementById('upload-puzzle');
        if (uploader) {
            uploader.addEventListener('change', async ev => await this.puzzleUploaded(ev));
        }
        this.rootRef = document.getElementById('puz-root') as HTMLDivElement;
        if (!this.rootRef) {
            throw new Error('unable to find root');
        }
        window.addEventListener('keyup', this.handleKeyPress.bind(this));
        this.db = new PuzDb();
        this.db.on('ready', () => this.renderPuzzleList());
        this.db.open().then(() => {});
        (window as any).db = this.db;
    }

    async puzzleUploaded(ev: Event) {
        let file = (ev.srcElement as HTMLInputElement).files[0];
        let arr = await this.readFileToArrayBuffer(file);
        let buf = new PuzzleBuffer(arr);
        let newPuzzle = buf.toPuzzle();
        await this.db.addPuzzle(newPuzzle);
        this.puzzle = newPuzzle;
        this.renderPuzzle(newPuzzle);
    }

    async readFileToArrayBuffer(file: File): Promise<ArrayBuffer> {
        return new Promise<ArrayBuffer>((r, j) => {
            let reader = new FileReader();
            reader.onload = () => r(reader.result as ArrayBuffer);
            reader.onerror = j;
            reader.readAsArrayBuffer(file);
        });
    }

    private async renderPuzzleList() {
        this.clearRoot();
        let puzzles = await this.db.getPuzzleList();
        let node = document.createElement('div');
        node.classList.add('puzzle-list');
        for (let puzzle of puzzles) {
            let span = document.createElement('span');
            span.classList.add('puzzle-list-name');
            span.addEventListener('click', () => this.selectPuzzle(puzzle));
            span.appendChild(document.createTextNode(
                puzzle.title
            ));
            node.appendChild(
                span
            );
        }
        this.rootRef.appendChild(node);
    }

    private selectPuzzle(puzzle: Puzzle) {
        this.puzzle = puzzle;
        this.renderPuzzle(puzzle);
    }

    private renderPuzzle(puzzle: Puzzle) {
        this.clearRoot();
        this.rootRef.appendChild(
            this.renderHeading(puzzle.title, puzzle.author)
        );
        this.rootRef.appendChild(
            this.renderRows(puzzle.cells)
        );
        this.rootRef.appendChild(
            this.renderButtons()
        )
        this.rootRef.appendChild(
            this.renderClueLists(puzzle.acrossClues, puzzle.downClues)
        );
        this.linkCells();
    }
    private clearRoot() {
        while (this.rootRef.lastChild) {
            this.rootRef.removeChild(this.rootRef.lastChild);
        }
    }
    private renderHeading(title: string, author: string): HTMLDivElement {
        let ret = document.createElement('div');
        ret.setAttribute('class', 'puzzle-heading');
        ret.appendChild(
            this.renderTitle(title)
        );
        ret.appendChild(
            this.renderAuthor(author)
        );
        return ret;
    }
    private renderTitle(title: string): HTMLElement {
        let node = document.createElement('h3');
        node.setAttribute('class', 'puzzle-title');
        node.appendChild(
            document.createTextNode(title)
        );
        return node;
    }
    private renderAuthor(author: string) {
        let node = document.createElement('h4');
        node.setAttribute('class', 'puzzle-author');
        node.appendChild(
            document.createTextNode(author)
        );
        return node;
    }
    private renderRows(rows: Cell[][]): HTMLElement {
        this.cells = [];
        let node = document.createElement('div');
        node.setAttribute('class', 'puzzle-body');
        for (let i = 0; i < rows.length; i++) {
            let row = rows[i];
            node.appendChild(
                this.renderRow(row, i)
            );
        }
        return node;
    }
    private renderRow(cells: Cell[], idx: number): HTMLElement {
        let node = document.createElement('div');
        node.setAttribute('class', 'puzzle-row');
        this.cells.push([]);
        for (let i = 0; i < cells.length; i++) {
            let cell = cells[i];
            node.appendChild(
                this.renderCell(cell, i, idx)
            );
        }
        return node;
    }

    private renderCell(cell: Cell, cellIdx: number, rowIdx: number): HTMLElement {
        let node = document.createElement('div');
        node.setAttribute('class', 'cell');
        node.setAttribute('id', `cell-${rowIdx}-${cellIdx}`);
        let menu = document.createElement('menu');
        menu.setAttribute('type', 'context');
        let solve = document.createElement('menuitem');
        solve.setAttribute('label', 'Solve Cell');
        menu.appendChild(solve);
        let clear = document.createElement('menuitem');
        clear.setAttribute('label', 'Clear Cell');
        menu.appendChild(clear);
        let check = document.createElement('menuitem');
        check.setAttribute('label', 'Check Cell');
        menu.appendChild(check);
        let menuId = `cell-menu-${cellIdx}-${rowIdx}`;
        menu.setAttribute('id', menuId);
        node.appendChild(menu);
        node.setAttribute('contextmenu', menuId);
        if (cell.isSep) {
            node.classList.add('separator-cell')
        }
        if (cell.boardNumber != null) {
            let num = document.createElement('span');
            num.classList.add('board-number');
            num.appendChild(
                document.createTextNode(
                    cell.boardNumber
                )
            );
            node.appendChild(num);
        }
        let value = document.createElement('span');
        value.classList.add('cell-value');
        value.appendChild(
            document.createTextNode(
                cell.userValue
            )
        );
        node.appendChild(
            value
        );
        if (cell.userValue && cell.userValue != '') {
        }
        let rendered = {
            el: node,
            cell,
            rowIdx,
            cellIdx,
        }
        solve.addEventListener('click', () => this.solveCell(rendered));
        clear.addEventListener('click', async () => await this.clearCell(rendered, true));
        check.addEventListener('click', () => this.validateCell(rendered));
        this.cells[rowIdx].push(rendered);
        node.addEventListener('click', (ev) => this.handleSelectedCell(rendered))
        return node;
    }
    private renderAddPuzzle(): HTMLDivElement {
        let node = document.createElement('div');
        node.classList.add('add-puzzle');
        
        return node;
    }
    private renderButtons(): HTMLElement {
        let node = document.createElement('div');
        node.classList.add('button-group');
        let clear = this.renderButton('Clear');
        clear.classList.add('clear');
        clear.addEventListener('click', this.clearPuzzle.bind(this));
        let solve = this.renderButton('Solve');
        solve.classList.add('solve');
        solve.addEventListener('click', this.solvePuzzle.bind(this));
        let validate = this.renderButton('Validate');
        validate.classList.add('validate');
        validate.addEventListener('click', this.validatePuzzle.bind(this));
        node.appendChild(clear);
        node.appendChild(solve);
        node.appendChild(validate);
        return node;
    }
    private renderButton(text: string): HTMLButtonElement {
        let node = document.createElement('button');
        node.classList.add('puzzle-button');
        node.appendChild(
            document.createTextNode(text)
        );
        return node;
    }
    
    private acrossClues: IRenderedClue[] = [];
    private downClues: IRenderedClue[] = [];
    renderClueLists(across: Clue[], down: Clue[]): HTMLDivElement {
        let node = document.createElement('div');
        node.classList.add('clue-lists');
        node.appendChild(
            this.renderClueList('Across', across)
        );
        node.appendChild(
            this.renderClueList('Down', down)
        );
        return node;
    }
    renderClueList(name: string, list: Clue[]): HTMLDivElement {
        let node = document.createElement('div');
        node.classList.add('clue-list');
        let header = document.createElement('h5');
        header.appendChild(document.createTextNode(name));
        node.appendChild(
            header
        );
        let isAcross = name.toLowerCase() == 'across';
        for (let i = 0; i < list.length;i++) {
            let clue = list[i];
            let span = document.createElement('span');
            span.classList.add('clue');
            span.addEventListener('click', () => {
                this.selectCellForClue(i, isAcross);
            });
            if (isAcross) {
                this.acrossClues.push({
                    el: span,
                    clue,
                });
            } else {
                this.downClues.push({
                    el: span,
                    clue,
                });
            }
            span.appendChild(
                document.createTextNode(clue.toString())
            );
            node.appendChild(span);
        }
        return node;
    }
    private selectedClue?: IRenderedClue;
    handleSelectedCell(newCell: IRenderedCell) {
        if (this.selectedCell) {
            this.selectedCell.el.classList.remove('selected');
        }
        if (this.selectedClue) {
            this.selectedClue.el.classList.remove('selected-clue');
        }
        if (newCell == this.selectedCell) {
            this.direction = this.direction === InputDirection.Horizontal ?
                InputDirection.Vertical : InputDirection.Horizontal;
        }
        for (let cell of (document.querySelectorAll('.border-top') as unknown as Array<HTMLElement>)) {
            cell.classList.remove('border-top');
        }
        for (let cell of (document.querySelectorAll('.border-bottom') as unknown as Array<HTMLElement>)) {
            cell.classList.remove('border-bottom');
        }
        for (let cell of (document.querySelectorAll('.border-left') as unknown as Array<HTMLElement>)) {
            cell.classList.remove('border-left');
        }
        for (let cell of (document.querySelectorAll('.border-right') as unknown as Array<HTMLElement>)) {
            cell.classList.remove('border-right');
        }
        this.selectedCell = newCell;
        this.selectedCell.el.classList.add('selected');
        let clue;
        if (this.direction === InputDirection.Horizontal) {
            clue = this.acrossClues[newCell.cell.acrossClue];
        } else {
            clue = this.downClues[newCell.cell.downClue];
        }
        if (clue) {
            clue.el.classList.add('selected-clue');
            this.selectedClue = clue;
            scrollToElm(this.selectedClue.el.parentElement, this.selectedClue.el, .25);

        }
        if (this.direction === InputDirection.Horizontal) {
            let cell = newCell;
            while (cell.east && !cell.east.cell.isSep) {
                cell = cell.east;
            }
            cell.el.classList.add('border-right', 'border-top', 'border-bottom');
            while (cell.west && !cell.west.cell.isSep) {
                cell = cell.west;
                cell.el.classList.add('border-top', 'border-bottom');
            }
            cell.el.classList.add('border-left');
        } else {
            let cell = newCell;
            while (cell.north && !cell.north.cell.isSep) {
                cell = cell.north;
            }
            cell.el.classList.add('border-left', 'border-top', 'border-right');
            while (cell.south && !cell.south.cell.isSep) {
                cell = cell.south;
                cell.el.classList.add('border-left', 'border-right');
            }
            cell.el.classList.add('border-bottom');
        }
    }
    handlingKey = false;
    async handleKeyPress(ev: KeyboardEvent) {
        if (this.handlingKey) return false;
        switch (ev.key.toLowerCase()) {
            case 'arrowup': 
                if (this.direction === InputDirection.Horizontal) {
                    this.direction = InputDirection.Vertical;
                }
                this.findPrevCell();
            break;
            case 'arrowdown':
                if (this.direction === InputDirection.Horizontal) {
                    this.direction = InputDirection.Vertical;
                }
                this.findNextCell();
            break;
            case 'arrowleft':
                if (this.direction === InputDirection.Vertical) {
                    this.direction = InputDirection.Horizontal;
                }
                this.findPrevCell();
            break;
            case 'arrowright':
                if (this.direction === InputDirection.Vertical) {
                    this.direction = InputDirection.Horizontal;
                }
                this.findNextCell();
            break;
            case 'backspace':
                this.clearCell(this.selectedCell);
            break;
            default:
                if (ev.key.length === 1 && /[a-zA-Z]{1,1}/.test(ev.key)) {
                    this.handlingKey = true;
                    this.selectedCell.cell.userValue = ev.key.toUpperCase();
                    (this.selectedCell.el.lastChild as HTMLSpanElement).innerText = ev.key.toUpperCase();
                    await this.db.updatePuzzle(this.puzzle);
                    this.selectedCell.el.classList.remove('valid', 'invalid', 'solved');
                    this.findNextCell();
                    this.handlingKey = false;
                    console.log(this.puzzle.cells[this.rowIdx][this.cellIdx]);
                    
                }
            break;
        }
    }

    findNextCell() {
        if (!this.selectedCell) {
            return;
        }
        let cell;
        if (this.direction === InputDirection.Horizontal) {
            cell = this.findNextHorizontalCell();
        } else {
            cell = this.findNextVerticalCell();
        }
        if (!cell) {
            console.log('no cell to update');
            return;
        }
        this.handleSelectedCell(cell);
    }

    findPrevCell() {
        if (!this.selectedCell) {
            return;
        }
        let cell;
        if (this.direction === InputDirection.Horizontal) {
            cell = this.findPrevHorizontalCell();
        } else {
            cell = this.findPrevVerticalCell();
        }
        this.handleSelectedCell(cell);
    }

    findNextHorizontalCell() {
        let rowIdx = this.selectedCell.rowIdx
        let colIdx = this.selectedCell.cellIdx + 1;
        for (let i = 0; i < this.puzzle.width * this.puzzle.height; i++) {
            // if we have gone over the rows, start again at 0,0
            let currentRow = this.cells[rowIdx];
            if (!currentRow) {
                colIdx = 0;
                rowIdx = 0;
                continue;
            }
            let cell = currentRow[colIdx];
            // if the column is past the row's end
            // start on the next row
            if (!cell) {
                colIdx = 0;
                rowIdx++
                continue;
            } 
            // if the cell isn't a separator and doesn't have a value return that
            if (!cell.cell.isSep && !cell.cell.userValue || cell.cell.userValue !== '') {
                return cell;
            }
            // if the cell is a separator or is not empty move on to the next
            colIdx++;
        }
        console.log('searched all cells and could not find a valid cell');
    }
    findPrevHorizontalCell() {
        if (!this.selectedCell.west) {
            return this.findWrappedHorizontalCell(this.selectedCell);
        }
        let cell = this.selectedCell.west;
        while (cell.cell.isSep) {
            if (!cell.west) {
                return this.findWrappedHorizontalCell(cell)
            }
            cell = cell.west;
        }
        return cell;
    }
    findWrappedHorizontalCell(cell: IRenderedCell) {
        let clueIndex = this.selectedCell.cell.acrossClue - 1;
        if (clueIndex < 0) {
            clueIndex = this.acrossClues.length - 1;
        }
        let start = this.findCellForClue(clueIndex, true);
        while (start.east && !start.east.cell.isSep) {
            start = start.east;
        }
        return start;
    }
    findNextVerticalCell() {
        let currentCell = this.selectedCell;
        let startingClueNumber = this.selectedCell.cell.downClue;
        if (currentCell.south && !currentCell.south.cell.isSep) {
            return currentCell.south;
        }
        for (let row of this.cells) {
            for (let cell of row) {
                if (cell.cell.downClue == startingClueNumber+1) {
                    let ret = cell;
                    while(cell.north && !cell.north.cell.isSep) {
                        ret = cell.north;
                    }
                    return ret;
                }
            }
        }
        return this.cells[0][0];
    }
    findPrevVerticalCell() {
        if (!this.selectedCell.north) {
            return this.findWrappedVerticalCell(this.selectedCell);
        }
        let cell = this.selectedCell.north;
        if (cell.cell.isSep) {
            return this.findWrappedVerticalCell(cell)
        }
        return cell;
    }
    findWrappedVerticalCell(cell: IRenderedCell) {
        let clueIndex = cell.cell.downClue - 1;
        if (clueIndex < 0) {
            clueIndex = this.downClues.length - 1;
        }
        let start = this.findCellForClue(clueIndex, false);
        while (start.south && !start.south.cell.isSep) {
            start = start.south;
        }
        return start;
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

    selectCellForClue(i: number, isAcross: boolean) {
        if (isAcross) {
            this.direction = InputDirection.Horizontal;
        } else {
            this.direction = InputDirection.Vertical;
        }
        this.handleSelectedCell(this.findCellForClue(i, isAcross));
    }

    private findCellForClue(i: number, isAcross: boolean): IRenderedCell {
        for (let row of this.cells) {
            for (let cell of row) {
                if (cell.cell.isSep) {
                    continue;
                }
                if (isAcross) {
                    if (cell.cell.acrossClue === i) {
                        while(cell.west && !cell.west.cell.isSep) {
                            cell = cell.west;
                        }
                        return cell;
                    }
                } else {
                    if (cell.cell.downClue === i) {
                        return cell;
                    }
                }
            }
        }
        return this.cells[0][0];
    }

    async clearPuzzle() {
        for (let row of this.cells) {
            for (let cell of row) {
                await this.clearCell(cell);
            }
        }
        await this.db.updatePuzzle(this.puzzle);
    }
    async clearCell(cell: IRenderedCell, save: boolean = false) {
        cell.cell.userValue = '';
        (cell.el.lastChild as HTMLSpanElement).innerText = '';
        if (save) {
            await this.db.updatePuzzle(this.puzzle);
        }
    }
    checkPuzzle() {
        for (let row of this.cells) {
            for (let cell of row) {
                this.checkCell(cell)
            }
        }
    }
    checkCurrentCell() {
        this.checkCell(this.selectedCell);
    }
    checkCell(cell: IRenderedCell) {
        if (cell.cell.isSep) {
            return;
        }
        if (cell.cell.isValid) {
            cell.el.classList.add('valid');
            cell.el.classList.remove('invalid');
        } else {
            cell.el.classList.add('invalid');
            cell.el.classList.remove('valid');
        }
    }
    solvePuzzle() {
        for (let row of this.cells) {
            for (let cell of row) {
                this.solveCell(cell);
            }
        }
    }
    solveCell(cell: IRenderedCell) {
        if (cell.cell.isSep || cell.cell.isValid) {
            return;
        }
        cell.cell.userValue = cell.cell.expectedValue;
        cell.el.classList.add('solved');
        (cell.el.lastChild as HTMLDivElement).innerText = cell.cell.expectedValue;
    }
    validatePuzzle() {
        for (let row of this.cells) {
            for (let cell of row) {
                this.validateCell(cell);
            }
        }
    }
    validateCell(cell: IRenderedCell) {
        if (cell.cell.isSep) {
            return;
        }
        if (cell.cell.isValid) {
            cell.el.classList.add('valid');
            cell.el.classList.remove('invalid');
        } else {
            cell.el.classList.add('invalid');
            cell.el.classList.remove('valid');
        }
    }
}

class PuzDb extends Dexie {
    puzzles: Dexie.Table<IPuzzle, number>;
    constructor() {
        super('puzzle-db');
        this.version(1).stores({
            puzzles: '++id,title,author,width,height'
        });
        this.puzzles = this.table('puzzles');
    }

    async addPuzzle(puzzle: Puzzle) {
        let newId = await this.puzzles.add(puzzle.toJSON());
        puzzle.id = newId;
    }

    async getPuzzle(id: number): Promise<Puzzle> {
        let raw = await this.puzzles.get(id);
        if (raw) {
            return Puzzle.fromJson(raw);
        }
    }

    async updatePuzzle(puzzle: Puzzle): Promise<Puzzle> {
        try {
            await this.puzzles.put(puzzle.toJSON());
            return puzzle;
        } catch(e) {
            console.error('Error updating puzzle', e);
        }
    }

    async getPuzzleList(): Promise<Puzzle[]> {
        let list = await this.puzzles.toArray();
        return list.map(Puzzle.fromJson);
    }
}


function scrollToElm(container, elm, duration){
    var pos = getRelativePos(elm);
    scrollTo( container, pos.top , duration);  // duration in seconds
  }
  
  function getRelativePos(elm){
    var pPos = elm.parentNode.getBoundingClientRect(), // parent pos
        cPos = elm.getBoundingClientRect(), // target pos
        pos: any = {};
  
    pos.top    = cPos.top    - pPos.top + elm.parentNode.scrollTop,
    pos.right  = cPos.right  - pPos.right,
    pos.bottom = cPos.bottom - pPos.bottom,
    pos.left   = cPos.left   - pPos.left;
  
    return pos;
  }
      
  function scrollTo(element, to, duration) {
      var start = element.scrollTop,
          change = to - start,
          startTime = performance.now(),
          val, now, elapsed, t;
  
      function animateScroll(){
          now = performance.now();
          elapsed = (now - startTime)/1000;
          t = (elapsed/duration);
  
          element.scrollTop = start + change * easeInOutQuad(t);
  
          if( t < 1 ) {
              window.requestAnimationFrame(animateScroll);
          }
      };
  
      animateScroll();
  }
  
  function easeInOutQuad(t){ return t<.5 ? 2*t*t : -1+(4-2*t)*t };
