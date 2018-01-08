import { MoveDir } from './enums';
import Point from './grid/Point';
/**
 * A renderable character
 */
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

    /**
     * The current position of the center of our sprite
     */
    get position(): Point {
        return new Point(this.currentX, this.currentY);
    }
    /**
     * The bottom of this sprite
     */
    get bottom() {
        return this.currentY + (this.height / 2);
    }
    /**
     * The top of this sprite
     */
    get top() {
        return this.currentY - (this.height / 2);
    }
    /**
     * The left edge of this sprite
     */
    get left() {
        return this.currentX - (this.width / 2);
    }
    /**
     * The right edge of this sprite
     */
    get right() {
        return this.currentX + (this.width / 2);
    }
    /**
     * Update this sprites position based on the speed and direction
     */
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
    /**
     * handle wrapping around the screen
     */
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