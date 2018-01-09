import { MoveDir } from './enums';
import DrawingService from './services/drawingService';
import Sprite from './Sprite';
import Point from './grid/Point';

/**
 * The main character's sprite
 * @extends Sprite
 */
export default class Pacman extends Sprite {
    /** The current distance between the upper and lower mouth */
    private mouthState: number = 25;
    /** If the mouth is currently opening */
    private opening: boolean = false;
    /**
     * Create a new Pacman
     * @param context The canvas context
     * @param startX The starting x axis position
     * @param startY The starting y axis position
     * @param startDirection The direction to start in
     * @param speed The speed to move at
     * @param color The color of the pacman
     */
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
    /**
     * Render the sprite
     */
    render() {
        // this.context.save();
        this.context.moveTo(this.currentX, this.currentY);
        this.context.fillStyle = this.color;
        this.context.beginPath();
        this.context.arc(this.currentX, this.currentY, this.width / 2, this.startAngle, this.endAngle, true);
        this.context.lineTo(this.currentX, this.currentY);
        this.context.fill();
        // this.context.restore();
    }
    /**
     * Turn this sprite
     * @param newDir The direction to turn
     */
    turn(newDir: MoveDir) {
        this.direction = newDir;
    }
    /**
     * Update the mouth and the position
     */
    next() {
        this.updateMouth();
        this.updatePosition();
    }
    /**
     * Update the mouth's state
     */
    private updateMouth() {
        let mouthSpeed = Math.floor(this.speed * 1.5);
        this.updateMouthDirection();
        if (this.opening) {
            this.mouthState += mouthSpeed;
        } else {
            this.mouthState -= mouthSpeed;
        }
    }
    /**
     * Switch between opening and closing
     */
    private updateMouthDirection() {
        if (this.mouthState >= 35) {
            this.opening = false;
        } 
        if (this.mouthState <= 1) {
            this.opening = true;
        } 
    }
    /**
     * Get the starting mouth angle based on what direction Pacman is facing
     */
    get startAngle(): number {
        var degrees
        switch (this.direction) {
            case MoveDir.Right:
                return DrawingService.degToRads(-this.mouthState);
            case MoveDir.Down:
                return DrawingService.degToRads(90 - this.mouthState);
            case MoveDir.Left:
                return DrawingService.degToRads(180- this.mouthState);
            case MoveDir.Up:
                return DrawingService.degToRads(270 - this.mouthState);
        }
    }
    /**
     * Get the ending mouth angle based on what direction Pacman is facing
     */
    get endAngle(): number {
        switch (this.direction) {
            case MoveDir.Right:
                return DrawingService.degToRads(this.mouthState);
            case MoveDir.Down:
                return DrawingService.degToRads(90 + this.mouthState);
            case MoveDir.Left:
                return DrawingService.degToRads(180 + this.mouthState);
            case MoveDir.Up:
                return DrawingService.degToRads(270 + this.mouthState);
        }
    }
}