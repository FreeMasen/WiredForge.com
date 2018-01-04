import { CellWall } from "../enums";


export default class Cell {
    
    constructor(
        private context: CanvasRenderingContext2D,
        public top: number,
        public left: number,
        public width: number = 35,
        public height: number = 35,
        public walls: CellWall = 0,
    ) {

    }

    get right(): number {
        return this.left + this.width;
    }

    get bottom(): number {
        return this.top + this.height;
    }

    render() {
        this.context.lineJoin = "round";
        this.context.lineWidth = 3;
        this.context.beginPath();
        this.context.moveTo(this.left, this.top);
        this.drawWall(this.right, this.top, (this.walls & CellWall.Top) > 0)
        this.drawWall(this.right, this.bottom, (this.walls & CellWall.Left) > 0)
        this.drawWall(this.left, this.bottom, (this.walls & CellWall.Bottom) > 0)
        this.drawWall(this.left, this.top, (this.walls & CellWall.Right) > 0);
        this.context.stroke();
    }
    
    drawWall(endX: number, endY: number, filled: boolean) {
        if (filled) {
            this.context.strokeStyle = "purple";
        } else {
            this.context.strokeStyle = "transparent";
        }
        this.context.lineTo(endX, endY);
    }
}