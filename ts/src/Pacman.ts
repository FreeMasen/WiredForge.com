import { MoveDir } from './enums';
import DrawingService from './services/drawingService';
export default class Pacman {
    currentX: number;
    currentY: number;
    private context: CanvasRenderingContext2D
    private mouthState: number = 25;
    private opening: boolean = false;
    private speed: number;
    private currentDir: MoveDir;
    private color: string;
    private width = 13;
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
        this.context = context;
        this.currentX = startX;
        this.currentY = startY;
        this.currentDir = startDirection;
        this.speed = speed;
        this.color = color;
    }

    render() {
        // console.log('Pacman.render', this);
        this.context.moveTo(this.currentX, this.currentY);
        this.context.fillStyle = this.color;
        this.context.beginPath();
        
        this.context.arc(this.currentX, this.currentY, this.width, this.startAngle, this.endAngle, true);
        this.context.lineTo(this.currentX, this.currentY);
        this.context.fill();
        this.next();
    }

    turn(newDir: MoveDir) {
        this.currentDir = newDir;
    }

    private next() {
        this.updateMouth();
        this.updatePosition();
    }

    private updateMouth() {
        let mouthSpeed = this.speed * 1.5;
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
        switch (this.currentDir) {
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
        switch (this.currentDir) {
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

    private updatePosition() {
        switch (this.currentDir) {
            case MoveDir.Up:
                this.currentY -= this.speed;
            break;
            case MoveDir.Right:
                this.currentX += this.speed;
            break;
            case MoveDir.Down:
                this.currentY += this.speed;
            break;
            case MoveDir.Left:
                this.currentX -= this.speed;
            break;
        }
        this.handleScreen();
    }

    handleScreen() {
        if (this.currentX > this.context.canvas.width + this.width) {
            this.currentX = -this.width;
        } 
        if (this.currentY > this.context.canvas.height + this.width) {
            this.currentY = -this.width;
        }
        if (this.currentY < -this.width) {
            this.currentY = this.context.canvas.height + this.width;
        }
        if (this.currentX < -this.width) {
            this.currentX = this.context.canvas.width + this.width;
        }
    }
}