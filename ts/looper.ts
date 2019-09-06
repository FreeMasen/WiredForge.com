const CANVAS_ID = 'event-loop-canvas';
const ARC_MOVEMENT_TICK = 180 / 100;
const LINE_MOVEMENT_TICK = 2;
let looper;

window.addEventListener('DOMContentLoaded', () => {
    looper = new Looper();
});

class Looper {
    canvas: HTMLCanvasElement;
    paused = false;
    dotX: number;
    dotY: number;
    dotWidth: number;
    
    dotXMax: number;
    dotXMin: number;
    dotYMax: number;
    dotYMin: number;

    shortLoop = false;
    constructor() {
        this.canvas = Looper.getCanvas();
        this.dotX = this.canvas.width / 2;
        this.dotXMin = this.canvas.width * .16;
        this.dotXMax = this.canvas.width - this.dotXMin;
        this.dotY 
            = this.dotYMin
            = this.canvas.height * .16;
        this.dotYMax = this.canvas.height - this.dotYMin;
        this.dotWidth = this.canvas.height * .02;
        this.animationLoop();
        this.movementLoop(0, this.shortLoop);
        const b = document.getElementById('toggle');
        if (b) {
            b.addEventListener('click', () => this.shortLoop = !this.shortLoop);
        }
    }
    static getCanvas(): HTMLCanvasElement {
        let c = document.getElementById(CANVAS_ID) as HTMLCanvasElement;
        let content = document.getElementById('looper');
        if (!content) {
            return;
        }
        if (!c) {
            c = document.createElement('canvas');
            c.id = CANVAS_ID;
            
            content.appendChild(c);
        }
        const width = (content.clientWidth || 1025) - 25;
        c.width = width;
        c.height = width / 2;
        return c;
    }

    toggleAnimation() {
        if (this.paused) {
            this.paused = false;
            this.movementLoop();
        } else {
            this.paused = true;
        }
    }

    animationLoop() {
        this.renderBackground();
        this.renderMark();
        requestAnimationFrame(this.animationLoop.bind(this));
    }
    movementLoop(ct: number = 0, shortLoop: boolean = true) {
        if (this.paused) {
            return;
        }
        
        const cb = this.movementLoop.bind(this);
        const borderV = this.canvas.height * .1;
        const borderH = this.canvas.width * .21;
        const bottom1 = this.canvas.height - borderV;
        const borderV2 = borderV * 1.3;
        const bottom2 = bottom1 - borderV2;
        const bottom = bottom2 + ((bottom2 - bottom1) / 2);
        const top1 = borderV;
        const radius1 = (this.canvas.height - (borderV * 2)) / 2;
        const top2 = top1 + borderV2;
        const top = top1 + ((top2 - top1) / 2);
        const radius2 = (bottom2 - top2) / 2;
        const radius = radius2 + ((radius1 - radius2) / 2);
        const midY = this.canvas.height / 2;
        const midX = this.canvas.width / 2;
        const right1 = this.canvas.width - borderH;
        const left1 = borderH;
        const borderH2 = borderH * 0.1;
        const right2 = right1 - borderH2;
        const left2 = left1 + borderH2;
        const right = right2 + ((right1 - right2) / 2);
        const left = left1 + ((left2 - left1) / 2);
        
        if (shortLoop) {
            this.dotX = radius * Math.cos(degToRad(ct+270)) + midX;
            this.dotY = radius * Math.sin(degToRad(ct+270)) + midY;
            if (ct > 360) {
                ct = -ARC_MOVEMENT_TICK;
                shortLoop = this.shortLoop;
            } else if (Math.floor(ct) === 180) {
                shortLoop = this.shortLoop;
            }
            
            setTimeout(cb, 15, (ct||0)+ARC_MOVEMENT_TICK, shortLoop);
        } else {
            if (ct > 360) {
                ct = -ARC_MOVEMENT_TICK;
            }
            let newLoop = false;
            if (this.dotX >= right) {
                this.dotX = radius * Math.cos(degToRad(ct+270)) + right;
                this.dotY = radius * Math.sin(degToRad(ct+270)) + top + radius;
                setTimeout(cb, 15, (ct||0)+ARC_MOVEMENT_TICK, newLoop)
            } else if (this.dotX <= left) {
                this.dotX = radius * Math.cos(degToRad(ct+270)) + left;
                this.dotY = radius * Math.sin(degToRad(ct+270)) + top + radius;
                setTimeout(cb, 15, (ct||0)+ARC_MOVEMENT_TICK, newLoop);
            } else if (this.dotY >= bottom) {
                this.dotY = this.dotYMax;
                this.dotX -= (right - left) / 90;
                if (this.dotX <= midX) {
                    newLoop = this.shortLoop;
                }
                setTimeout(cb, 15, 181, newLoop);
            } else {
                this.dotY = this.dotYMin;
                this.dotX += (right - left) / 90;
                if (this.dotX >= midX) {
                    newLoop = this.shortLoop;
                }
                setTimeout(cb, 15, 0, newLoop);
            }
        }
        
    }

    renderBackground() {
        let ctx = this.canvas.getContext('2d');
        ctx.fillStyle = 'green';
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        ctx.fillStyle = ctx.strokeStyle = 'ghostwhite';
        const borderH = this.canvas.width * .21;
        const borderV = this.canvas.height * .1;
        const top = borderV;
        const left = borderH;
        const right = this.canvas.width - borderH;
        const bottom = this.canvas.height - borderV;
        const radius = (this.canvas.height - (borderV * 2)) / 2;
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(left, top);
        ctx.lineTo(right, top);
        ctx.arc(
            right, //cx
            radius + borderV, //cy
            radius, //r
            degToRad(-90), //startAng
            degToRad(90), //endAng
            false //counterClock
        );
        ctx.lineTo(left, bottom);
        ctx.arc(
            left, //cx
            radius + borderV, //cy
            radius, //r
            degToRad(90), //startAng
            degToRad(-90), //endAng
            false //counterClock
        );
        const borderV2 = borderV * 1.3;
        const borderH2 = borderH * 0.1;
        let top2 = top + borderV2;
        let right2 = right - borderH2;
        let left2 = left + borderH2;
        let bottom2 = bottom - borderV2;
        let radius2 = (bottom2 - top2) / 2;
        ctx.moveTo(left2, top2);
        ctx.lineTo(right2, top2);
        ctx.arc(
            right2, //cx
            radius2 + top2, //cy
            radius2, //r
            degToRad(-90), //startAng
            degToRad(90), //endAng
            false //counterClock
        );
        ctx.lineTo(left2, bottom2);
        ctx.arc(
            left2, //cx
            radius2 + top2, //cy
            radius2, //r
            degToRad(90), //startAng
            degToRad(-90), //endAng
            false //counterClock
        );
        ctx.fill('evenodd');
        ctx.moveTo(this.canvas.width/2, top)
        ctx.ellipse(
            this.canvas.width / 2, 
            this.canvas.height / 2, 
            radius,
            radius,
            0,
            degToRad(-90),
            degToRad(360),
            false,
        );
        
        ctx.moveTo(this.canvas.width/2, top2);
        ctx.ellipse(
            (this.canvas.width) / 2, 
            (this.canvas.height) / 2, 
            radius2,
            radius2,
            0,
            degToRad(-90),
            degToRad(360),
            false,
        );
        ctx.fill('evenodd');
        ctx.stroke();
    }
    renderMark() {
        const ctx = this.canvas.getContext('2d');
        ctx.beginPath();
        ctx.fillStyle = 'blue';
        ctx.moveTo(this.dotX, this.dotY - this.dotWidth);
        ctx.ellipse(
            this.dotX, 
            this.dotY, 
            this.dotWidth,
            this.dotWidth,
            0,
            degToRad(-90), 
            degToRad(360-90),
            false,
        );
        ctx.fill('evenodd');
    }

    resetMark() {
        this.dotX = this.canvas.width / 2;
        this.dotY = this.dotYMin;
    }
}

export function degToRad(deg) {
    return deg * (Math.PI / 180);
}