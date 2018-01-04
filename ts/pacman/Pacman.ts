import { MoveDir } from './enums';
import DrawingService from './services/drawingService';
import Sprite from './Sprite';

export default class Pacman extends Sprite {
    private mouthState: number = 25;
    private opening: boolean = false;
    private counter: number = 0;

    constructor(
        context: CanvasRenderingContext2D,
        startX: number = 0,
        startY: number = 0,
        startDirection: MoveDir = MoveDir.Left,
        speed: number = 0.1,
        color: string = "yellow",
    )
    {
        super(context, startX, startY, 35, 35, speed, startDirection, color);
    }

    render() {
        // console.log('Pacman.render', this);
        this.context.moveTo(this.currentX, this.currentY);
        this.context.fillStyle = this.color;
        this.context.beginPath();
        
        this.context.arc(this.currentX, this.currentY, this.width / 2, this.startAngle, this.endAngle, true);
        this.context.lineTo(this.currentX, this.currentY);
        this.context.fill();
    }

    turn(newDir: MoveDir) {
        this.direction = newDir;
    }

    next() {
        this.updateMouth();
        this.updatePosition();
    }

    private updateMouth() {
        let mouthSpeed = Math.floor(this.speed * 1.5);
        this.updateMouthDirection();
        if (this.opening) {
            this.mouthState += mouthSpeed;
        } else {
            this.mouthState -= mouthSpeed;
        }
    }

    private updateMouthDirection() {
        if (this.mouthState >= 25) {
            this.opening = false;
        } 
        if (this.mouthState <= 1) {
            this.opening = true;
        } 
    }

    get startAngle(): number {
        var degrees
        switch (this.direction) {
            case MoveDir.Right:
                return DrawingService.degToRads(-this.mouthState);
            case MoveDir.Down:
                return DrawingService.degToRads(50 - this.mouthState);
            case MoveDir.Left:
                return DrawingService.degToRads(100 - this.mouthState);
            case MoveDir.Up:
                return DrawingService.degToRads(150 - this.mouthState);
        }
    }

    get endAngle(): number {
        switch (this.direction) {
            case MoveDir.Right:
                return DrawingService.degToRads(this.mouthState);
            case MoveDir.Down:
                return DrawingService.degToRads(50 + this.mouthState);
            case MoveDir.Left:
                return DrawingService.degToRads(100 + this.mouthState);
            case MoveDir.Up:
                return DrawingService.degToRads(150 + this.mouthState);
        }
    }
}