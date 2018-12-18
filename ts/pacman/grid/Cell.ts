import { CellWall, MoveDir, CellCorner } from "../enums";
import DrawingService from "../services/drawingService";

/**
 * A cell in the game board
 */
export default class Cell {
    public visited = false;
    constructor(
        private context: CanvasRenderingContext2D,
        public x: number,
        public y: number,
        public top: number,
        public left: number,
        public width: number = 35,
        public height: number = 35,
        public walls: CellWall = 0,
        public leftOfMe: Cell = null,
        public rightOfMe: Cell = null,
        public aboveMe: Cell = null,
        public belowMe: Cell = null
    ) {

    }
    /**
     * Add a cell as a neighbor to this cell
     * @param cell The Cell to add as a neighbor
     * @param pos The side it should be on
     */
    addNeighbor(cell: Cell, pos: MoveDir) {
        if (!cell) return;
        switch (pos) {
            case MoveDir.Up:
                cell.belowMe = this;
                this.aboveMe = cell;
            break;
            case MoveDir.Left:
                cell.rightOfMe = this;
                this.leftOfMe = cell;
            break;
            case MoveDir.Down:
                cell.aboveMe = this;
                this.belowMe = cell;
            break;
            case MoveDir.Right:
                cell.leftOfMe = this;
                this.rightOfMe = cell;
            break;
        }
    }
    /**
     * Add a wall to a cell
     * @param wall The wall to add to this cell
     */
    addWall(wall: CellWall) {
        if ((this.walls & wall) > 0) return;
        this.walls |= wall;
        switch (wall) {
            case CellWall.Top:
                this.aboveMe.walls |= CellWall.Bottom;
                break;
            case CellWall.Left:
                this.leftOfMe.walls |= CellWall.Right;
                break;
            case CellWall.Bottom:
                this.belowMe.walls |= CellWall.Top;
                break;
            case CellWall.Right:
                this.rightOfMe.walls |= CellWall.Left;
                break;
        }
    }
    /**
     * Remove a wall from a cell
     * @param wall The wall to remove from this cell, if not there does nothing
     */
    removeWall(wall: CellWall) {
        this.walls &= ~wall;
        switch (wall) {
            case CellWall.Top:
                this.aboveMe.walls &= ~CellWall.Bottom;
            break;
            case CellWall.Left:
                this.leftOfMe.walls &= ~CellWall.Right;
            break;
            case CellWall.Bottom:
                this.belowMe.walls &= ~CellWall.Top;
            break;
            case CellWall.Right:
                this.rightOfMe.walls &= ~CellWall.Left;
            break;
        }
    }
    /**
     * Check if a sprite can enter this cell
     * @param dir The direcition that the sprite is currently moving when entering this cell
     */
    canEnter(dir: MoveDir): boolean {
        switch (dir) {
            case MoveDir.Up:
                return (this.walls & CellWall.Top) < 1
            case MoveDir.Left:
                return (this.walls & CellWall.Left) < 1
            case MoveDir.Down:
                return (this.walls & CellWall.Bottom) < 1
            case MoveDir.Right:
                return (this.walls & CellWall.Right) < 1
        }
    }

    /**
     * Get the next cell for a sprite to move to
     * @param dir The direction the sprite is moving when exiting this cell
     */
    nextCell(dir: MoveDir): Cell {
        switch(dir) {
            case MoveDir.Up:
                return this.aboveMe;
            case MoveDir.Left:
                return this.leftOfMe;
            case MoveDir.Down:
                return this.belowMe;
            case MoveDir.Right:
                return this.rightOfMe;
        }
    }

    nextUnvisited(): Cell {
        let dir: MoveDir = Math.floor(Math.random() * 4);
        let cell = this.nextCell(dir);
        let tests = 0;
        while (cell.visited) {
            if (tests > 3) return;
            tests++;
            dir = this.getNextDir(dir);
            this.nextCell(dir);
        }
        return cell;
    }

    private getNextDir(dir: MoveDir): MoveDir {
        if (dir >= 3) {
            return 0;
        }
        return dir + 1;
    }

    /**
     * Get the center x or y for this cell if a sprite wants to turn
     * @param dir The direction the sprite is moving
     */
    turningPoint(dir: MoveDir): number {
        switch(dir) {
            case MoveDir.Up:
            case MoveDir.Down:
                return this.centerX;
            case MoveDir.Left:
            case MoveDir.Right:
                return this.centerY;
        }
    }

    /**
     * The right border of this cell
     */
    get right(): number {
        return this.left + this.width;
    }
    /**
     * The bottom border of this cell
     */
    get bottom(): number {
        return this.top + this.height;
    }
    /**
     * The center on the x axis of this cell
     */
    get centerX(): number {
        return this.left + (this.width / 2);
    }
    /**
     * The center on the y axis of this cell
     */
    get centerY(): number {
        return this.top + (this.height / 2);
    }
    /**
     * Get the corner's that should be filled in for this cell based on the walls
     */
    corners(): CellCorner {
        let ret: CellCorner = 0;
        if ((this.walls & CellWall.Top) > 0 &&
            (this.walls & CellWall.Left) > 0) {
            ret |= CellCorner.TopLeft;
        }
        if ((this.walls & CellWall.Left) > 0 &&
            (this.walls & CellWall.Bottom)) {
            ret |= CellCorner.BottomLeft;
        }
        if ((this.walls & CellWall.Bottom) > 0 &&
            (this.walls & CellWall.Right) > 0) {
            ret |= CellCorner.BottomRight;
        }
        if ((this.walls & CellWall.Right) > 0 &&
            (this.walls & CellWall.Top) > 0) {
            ret |= CellCorner.TopRight;
        }
        return ret;
    }
    /**
     * Render this cell to the canvas
     */
    render() {
        // this.context.font = '14pt sans-serif';
        // this.context.fillStyle = 'white';
        // this.context.textBaseline = 'center';
        // this.context.textAlign = 'center';
        // this.context.fillText(`${this.x}, ${this.y}`, this.centerX, this.centerY);
        this.renderWalls();
        this.renderCorners()
    }
    /**
     * Render each of the closed walls for this cell
     */
    renderWalls() {
        if ((this.walls & CellWall.Top) > 0) {
            this.renderWall(CellWall.Top);
        }
        if ((this.walls & CellWall.Right) > 0) {
            this.renderWall(CellWall.Right);
        }
        if ((this.walls & CellWall.Bottom) > 0) {
            this.renderWall(CellWall.Bottom);
        }
        if ((this.walls & CellWall.Left) > 0) {
            this.renderWall(CellWall.Left);
        }
    }
    /**
     * Render a single wall
     * @param wall The wall to draw
     */
    renderWall(wall: CellWall) {
        this.context.save()
        let adjustment = this.getadjustment(wall);
        this.context.beginPath();
        this.context.strokeStyle = 'purple';
        this.context.lineWidth = 2;
        switch(wall) {
            case CellWall.Top:
                this.context.moveTo(this.left + adjustment.start, this.top);
                this.context.lineTo(this.right - adjustment.end, this.top);
            break;
            case CellWall.Right:
                this.context.moveTo(this.right, this.top + adjustment.start);
                this.context.lineTo(this.right, this.bottom - adjustment.end);
            break;
            case CellWall.Bottom:
                this.context.moveTo(this.left + adjustment.start, this.bottom);
                this.context.lineTo(this.right - adjustment.end, this.bottom);
            break;
            case CellWall.Left:
                this.context.moveTo(this.left, this.top + adjustment.start);
                this.context.lineTo(this.left, this.bottom - adjustment.end);
            break;
        }
        this.context.stroke();
        this.context.restore();
    }
    /**
     * Get the adjustments for rendered corners
     * @param wall The wall to check
     */
    getadjustment(wall: CellWall) {
        let adjustment = {start: 0, end: 0};
        let corners = this.corners();
        switch(wall) {
            case CellWall.Top:
                if (corners & CellCorner.TopLeft) {
                    adjustment.start = 5;
                }
                if (corners & CellCorner.TopRight) {
                    adjustment.end = 5;
                }
            break;
            case CellWall.Left:
                if (corners & CellCorner.TopLeft) {
                    adjustment.start = 5;
                }
                if (corners & CellCorner.BottomLeft) {
                    adjustment.end = 5;
                }
            break;
            case CellWall.Bottom:
                if (corners & CellCorner.BottomLeft) {
                    adjustment.start = 5;
                }
                if (corners & CellCorner.BottomRight) {
                    adjustment.end = 5;
                }
            break;
            case CellWall.Right:
                if (corners & CellCorner.BottomRight) {
                    adjustment.end = 5;
                }
                if (corners & CellCorner.TopRight) {
                    adjustment.start = 5
                }
            break;
        }

        return adjustment;
    }
    /**
     * Render the required corners
     */
    renderCorners() {
        let corners = this.corners();
        if ((corners & CellCorner.TopLeft) > 0) {
            this.renderCorner(CellCorner.TopLeft);
        }
        if ((corners & CellCorner.TopRight) > 0) {
            this.renderCorner(CellCorner.TopRight);
        }
        if ((corners & CellCorner.BottomLeft) > 0) {
            this.renderCorner(CellCorner.BottomLeft);
        }
        if ((corners & CellCorner.BottomRight) > 0) {
            this.renderCorner(CellCorner.BottomRight);
        }
    }
    /**
     * Render the required corners
     * @param corner The corner to render
     */
    renderCorner(corner: CellCorner) {
        this.context.save();
        this.context.beginPath();
        this.context.strokeStyle = 'purple';
        this.context.lineWidth = 2.25;
        switch (corner) {
            case CellCorner.TopLeft:
                this.context.arc(
                    this.left + 5,
                    this.top + 5,
                    5,
                    DrawingService.degToRads(270),
                    DrawingService.degToRads(180),
                    true
                );
            break;
            case CellCorner.TopRight:
                this.context.arc(
                    this.right - 5,
                    this.top + 5,
                    5,
                    DrawingService.degToRads(0),
                    DrawingService.degToRads(270),
                    true
                );
            break;
            case CellCorner.BottomLeft:
                this.context.arc(
                    this.left + 5,
                    this.bottom - 5,
                    5,
                    DrawingService.degToRads(180),
                    DrawingService.degToRads(90),
                    true
                );
            break;
            case CellCorner.BottomRight:
                this.context.arc(
                    this.right - 5,
                    this.bottom - 5,
                    5,
                    DrawingService.degToRads(90),
                    DrawingService.degToRads(0),
                    true
                );
            break;
        }
        this.context.stroke();
        this.context.restore();
    }
}