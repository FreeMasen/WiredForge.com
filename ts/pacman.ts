import Pacman from './src/Pacman';
import Ghost from './src/Ghost';
import { MoveDir } from './src/enums';

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
    constructor() {
        console.log('new App')
        const canvas = document.getElementById('canvas') as HTMLCanvasElement;
        if (!canvas) throw new Error('Unable to find canvas');
        this.context = canvas.getContext('2d');
        this.height = canvas.height;
        this.width = canvas.width;
        if (canvas.width != 500) {
            this.showError();
        } else {
            this.setupGame();
        }
        requestAnimationFrame(() => this.eventLoop());
    }

    showError() {
        this.context.fillText('Sorry the screen is too small to play', this.context.canvas.width / 2, this.context.canvas.height / 2, this.context.canvas.width);
    }

    setupGame() {
        this.pacman = new Pacman(this.context, 37, 37, MoveDir.Right, 1);
        this.ghosts = [
            new Ghost(this.context, 250, 250, 1, 0, 0, 'red'),
            new Ghost(this.context, 100, 100, 1, 0, 0, 'pink'),
            new Ghost(this.context, 400, 400, 1, 0, 0, 'cyan'),
            new Ghost(this.context, 400, 100, 1, 0, 0, 'orange')
        ]
        window.addEventListener('keydown', (ev) => this.respondToInput(ev));
        let startStop = document.getElementById('start-stop');
        if (!startStop) throw new Error('Unable to find start-stop button');
        startStop.addEventListener('click', () => this.toggleRunning(!this.stop))
    }
    
    eventLoop() {
        this.context.fillStyle = 'black';
        this.context.fillRect(0, 0, this.width, this.height);
        this.pacman.render();
        for (let g of this.ghosts) {
            g.render(this.pacman.currentX, this.pacman.currentY);
        }
        if (this.stop) return;
        requestAnimationFrame(() => this.eventLoop());
    }

    respondToInput(ev: KeyboardEvent) {
        console.log(ev.key);
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
        if (restarting) this.eventLoop();
    }
}