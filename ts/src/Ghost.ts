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
        super(context, startX, startY, 45, 26, speed, startDir, color);
        this.eyesX = eyesX;
        this.eyesY = eyesY;
        this.color = color;
        this.direction = startDir;
    }

    render(pacmanX: number, pacmanY: number) {
        this.updateDirection();
        this.updatePosition();
        this.updateEyes(pacmanX, pacmanY);
        this.context.fillStyle = this.color;
        this.context.beginPath();
        let halfHeight = 7.5;
        let halfWidth = 7.5;
        let top = this.currentY - 13;
        let bottom = this.currentY + 13;
        let left = this.currentX - 13;
        let right = this.currentX + 13;
        this.context.moveTo(left, bottom);
        let arcStart = bottom - 15
        this.context.lineTo(left, arcStart);
        this.context.bezierCurveTo(left - 2, top - 15, right + 2, top - 15, right, arcStart);
        this.context.lineTo(this.right, this.bottom);
        this.renderSquiggle();
        this.context.fill();
        this.context.moveTo(this.currentX, this.currentY);
        this.renderEyes();
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
            this.eyesY = 1;
        } else if (pacmanY < this.currentY) {
            this.eyesY = -1;
        } else {
            this.eyesY = 0;
        }
        if (pacmanX > this.currentX) {
            this.eyesX = 1;
        } else if (pacmanX < this.currentX) {
            this.eyesX = -1;
        } else {
            this.eyesX = 0
        }
    }

    private renderEyes() {
        let pd = 6;
        let leftCenterX = this.currentX - pd;
        let centerY = this.currentY - 5;
        let rightCenterX = this.currentX + pd;
        this.renderEye(leftCenterX, centerY);
        this.renderEye(rightCenterX, centerY);
    }

    private renderEye(centerX: number, centerY: number) {
        this.context.fillStyle = 'white';
        this.context.beginPath();
        let width = 4;
        let height = 8;
        this.context.moveTo(centerX - width, centerY);
        this.context.bezierCurveTo(centerX - width, centerY - height, centerX + width, centerY - height, centerX + width, centerY);
        this.context.bezierCurveTo(centerX + width, centerY + height, centerX - width, centerY + height, centerX - width, centerY);
        
        this.context.fill();
        this.context.beginPath();
        this.context.fillStyle = 'black';
        let pupilY = centerY + this.eyesY;
        this.context.moveTo(centerX + this.eyesX, pupilY);
        this.context.arc(centerX + this.eyesX, pupilY, 2, 0, DrawingService.degToRads(360), false);
        this.context.fill();
    }

    private renderSquiggle() {
        for (var sq of this.squiggleCoordinates) {
            this.context.lineTo(sq[0], sq[1]);
        }
        this.updateSqiggleState();
    }

    private get squiggleCoordinates() {
        let ret = [];
        let initialDiff = this.right - this.squiggleState;
        let startUp = true;
        if (initialDiff > 4) {
            startUp = false;
            initialDiff = initialDiff + 4;
        }
        let currentX = initialDiff
        while (currentX > this.left - 4) {
            let bottomSwitch = ret.length % 2
            let bottom: number;
            if (startUp)
                bottom = bottomSwitch == 0 ? this.bottom : this.bottom - 8;
            else     
                bottom = bottomSwitch == 0 ? this.bottom - 8 : this.bottom;
            if (currentX < this.left) {
                bottom = this.left - currentX + bottom;
                currentX = this.left;
            }
            let point = [];
            point.push(currentX);
            point.push(bottom);
            ret.push(point);
            currentX -= 4;
        }
        return ret;
    }

    private updateSqiggleState() {
        if (this.squiggleState >= 8) {
            this.squiggleState = 0;
        } else {
            this.squiggleState += this.speed || 1;
        }
    }
}