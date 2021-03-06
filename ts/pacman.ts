import Pacman from './pacman/Pacman';
import Ghost from './pacman/Ghost';
import { MoveDir, CellWall } from './pacman/enums';
import Cell from './pacman/grid/Cell';
import Grid from './pacman/grid/Grid';
let app;

window.addEventListener('DOMContentLoaded', () => {
    app = new App();
});

class App {
    context: CanvasRenderingContext2D;
    pacman: Pacman;
    ghosts: Array<Ghost>;
    width: number;
    height: number;
    stop: boolean = true;

    //temp
    grid: Grid;

    constructor() {
        const canvas = document.getElementById('canvas') as HTMLCanvasElement;
        if (!canvas) throw new Error('Unable to find canvas');
        this.context = canvas.getContext('2d');
        this.height = canvas.height;
        this.width = canvas.width;
        this.setupGame();
        requestAnimationFrame(() => this.animationLoop());
        setTimeout(() => this.movementLoop(), 0);
    }

    showError() {
        this.context.fillText('Sorry the screen is too small to play',
                                this.context.canvas.width / 2,
                                this.context.canvas.height / 2,
                                this.context.canvas.width);
    }

    setupGame() {
        this.grid = new Grid(this.context, 1);
        let starting = this.grid.getCenterCell();
        this.pacman = new Pacman(this.context,
                                starting.centerX,
                                starting.centerY,
                                MoveDir.Right,
                                1.75);
        this.ghosts = [
            new Ghost(this.context, 100, 400, 1, 0, 0, 'red'),
            new Ghost(this.context, 100, 100, 1, 0, 0, 'pink'),
            new Ghost(this.context, 400, 400, 1, 0, 0, 'cyan'),
            new Ghost(this.context, 400, 100, 1, 0, 0, 'orange')
        ]

        window.addEventListener('keydown', (ev) => this.respondToInput(ev));
        let startStop = document.getElementById('start-stop');
        if (!startStop) throw new Error('Unable to find start-stop button');
        startStop.addEventListener('click', () => this.toggleRunning(!this.stop))
    }
    
    animationLoop() {
        this.context.save();
        this.context.fillStyle = 'black';
        this.context.fillRect(0, 0, this.width, this.height);
        this.pacman.render();
        this.context.restore();
        for (let g of this.ghosts) {
            this.context.save()
            g.render();
            this.context.restore();
        }
        this.context.save();
        this.grid.render();
        this.context.restore();
        if (this.stop) return;
        requestAnimationFrame(() => this.animationLoop());
    }

    movementLoop() {
        this.pacman.next();
        // let pacmanCell = this.grid.getCell(Pacman.)
        for (let ghost of this.ghosts) {
            ghost.next(this.pacman.currentX, this.pacman.currentY);
        }
        if (this.stop) return;
            setTimeout(() => this.movementLoop(), 15);
    }

    respondToInput(ev: KeyboardEvent) {
        switch (ev.key) {
            case 'ArrowUp':
                this.pacman.turn(MoveDir.Up);
            break;
            case 'ArrowRight': 
                this.pacman.turn(MoveDir.Right);
            break;
            case 'ArrowDown':
                this.pacman.turn(MoveDir.Down);
            break;
            case 'ArrowLeft':
                this.pacman.turn(MoveDir.Left);
            break;
            case 'Escape':
                this.toggleRunning(true);
            break;
            case 'p':
            case 'P':
                this.toggleRunning(false);
            break;
        }
    }

    toggleRunning(newState?: boolean) {
        let restarting = this.stop && !newState;
        this.stop = newState;
        if (restarting) {
            this.movementLoop()
            this.animationLoop();
        }
    }
}