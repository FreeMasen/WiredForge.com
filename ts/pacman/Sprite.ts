import { MoveDir } from './enums';
export default class Sprite {
    constructor(
        public context: CanvasRenderingContext2D,
        public currentX: number,
        public currentY: number,
        public height: number,
        public width: number,
        public speed: number,
        public direction: MoveDir,
        public color: string,
    )
    {

    }

    get bottom() {
        return this.currentY + (this.height / 2);
    }

    get top() {
        return this.currentY - (this.height / 2);
    }

    get left() {
        return this.currentX - (this.width / 2);
    }

    get right() {
        return this.currentX + (this.width / 2);
    }

    updatePosition() {
        switch(this.direction) {
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