import DrawingService from "./services/drawingService";
import { MoveDir } from "./enums";
import Sprite from './Sprite';

export default class Ghost extends Sprite {
    private squiggleState = 4;
    private squiggleIncreasing = false;
    private eyesX: number;
    private eyesY: number;
    constructor(
        context: CanvasRenderingContext2D,
        startX: number = 0,
        startY: number = 0,
        speed: number = 1,
        eyesY: number = 0,
        eyesX: number = 0,
        color: string = 'blue',
        startDir: MoveDir = MoveDir.Up,
    ) 
    {
        super(context, startX, startY, 40, 30, speed, startDir, color);
        this.eyesX = eyesX;
        this.eyesY = eyesY;
        this.color = color;
        this.direction = startDir;
    }

    render() {
        // this.context.save();
        this.context.fillStyle = this.color;
        this.context.beginPath();
        this.context.moveTo(this.left, this.bottom);
        let arcStart = this.bottom - (this.height / 2);
        this.context.lineTo(this.left, arcStart);
        this.context.bezierCurveTo(this.left - 2, this.top - 2, this.right + 2, this.top - 2, this.right, arcStart);
        this.context.lineTo(this.right, this.bottom);
        this.renderSquiggle();
        this.context.fill();
        // this.context.restore();
        this.context.moveTo(this.currentX, this.currentY);
        this.renderEyes();
    }

    next(pacmanX: number, pacmanY: number) {
        this.updateDirection();
        this.updatePosition();
        this.updateEyes(pacmanX, pacmanY);
        this.updateSqiggleState();
    }

    private updateDirection() {
        let rnd = Math.floor(Math.random() * 1000);
        if (rnd > 990) {
            if (this.direction >= 3) {
                this.direction = 0;
            } else {
                this.direction ++;
            }
        }
    }
 
    updateEyes(pacmanX: number, pacmanY: number) {
        if (pacmanY > this.currentY) {
            this.eyesY = 2;
        } else if (pacmanY < this.currentY) {
            this.eyesY = -2;
        } else {
            this.eyesY = 0;
        }
        if (pacmanX > this.currentX) {
            this.eyesX = 1.5;
        } else if (pacmanX < this.currentX) {
            this.eyesX = -1.5;
        } else {
            this.eyesX = 0
        }
    }

    private renderEyes() {
        let pd = 7;
        let leftCenterX = this.currentX - pd;
        let centerY = this.currentY;
        let rightCenterX = this.currentX + pd;
        this.renderEye(leftCenterX, this.currentY);
        this.renderEye(rightCenterX, this.currentY);
    }

    private renderEye(centerX: number, centerY: number) {
        // this.context.save();
        this.context.fillStyle = 'white';
        this.context.beginPath();
        let width = 4;
        let height = 8;
        this.context.moveTo(centerX - width, centerY);
        this.context.ellipse(centerX, centerY, 5, 8, 0, 0, 360);
        
        this.context.fill();
        this.context.beginPath();
        this.context.fillStyle = 'black';
        let pupilY = centerY + this.eyesY;
        let pupilX = centerX + this.eyesX;
        this.context.ellipse(pupilX, pupilY, 2,2,0,0,360);
        this.context.fill();
        // this.context.restore();
    }

    private renderSquiggle() {
        let initialDiff = this.right - this.squiggleState;
        let startUp = true;
        if (initialDiff > 4) {
            startUp = false;
            initialDiff = initialDiff + 4;
        }
        let currentX = initialDiff
        let lineCounter = 0;
        while (currentX > this.left - 4) {
            let bottomSwitch = lineCounter % 2
            let bottom: number;
            if (startUp)
                bottom = bottomSwitch == 0 ? this.bottom : this.bottom - 8;
            else     
                bottom = bottomSwitch == 0 ? this.bottom - 8 : this.bottom;
            if (currentX < this.left) {
                bottom = this.left - currentX + bottom;
                currentX = this.left;
            }
            this.context.lineTo(currentX, bottom);
            currentX -= 4;
            lineCounter++;
        }
    }

    private updateSqiggleState() {
        if (this.squiggleState >= 8) {
            this.squiggleState = 0;
        } else {
            this.squiggleState += this.speed || 1;
        }
    }
}